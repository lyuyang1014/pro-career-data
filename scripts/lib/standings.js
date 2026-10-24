'use strict';
/**
 * 联赛积分榜：从逐场赛果算每季每队的名次和积分
 * 来源优先级（同一联赛同一赛季）：openfootball（公有领域）→ transfermarkt-datasets（CC0）→ engsoccerdata（GPL）；
 * 前一个来源这一季不完整（有队踢的场次不到最多那队的 75%、少于 10 场，或总场次不到单循环的八成）就换下一个。
 * 排名：积分 → 净胜球 → 进球 → 队名。按逐场赛果算，没扣分（个别季度官方扣分、相互战绩排名会和这里不同）。
 */
const fs = require('fs');
const path = require('path');
const csv = require('./csv');
const { key } = require('./clubs');
const { LEAGUES, FUTURE_FROM, FIRST_SEASON } = require('./leagues');

function seasonOfDir(dir) {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(dir);
  return m ? Number(m[1]) : null;
}

/** openfootball：{ 'en.1': { 2015: [matches] } } */
function loadOpenfootball(cache) {
  const root = path.join(cache, 'football.json');
  const out = {};
  fs.readdirSync(root).forEach((dir) => {
    const season = seasonOfDir(dir);
    if (season === null) return;
    fs.readdirSync(path.join(root, dir)).forEach((f) => {
      const m = /^([a-z]+(?:\.\d)?|mls)\.json$/.exec(f);
      if (!m) return;
      const data = JSON.parse(fs.readFileSync(path.join(root, dir, f), 'utf8'));
      const list = (data.matches || []).filter((x) => x.score && x.score.ft && x.score.ft.length === 2)
        .map((x) => ({ date: x.date, home: x.team1, away: x.team2, hg: x.score.ft[0], ag: x.score.ft[1] }));
      ((out[m[1]] = out[m[1]] || {})[season] = list);
    });
  });
  return out;
}

/** transfermarkt：{ GB1: { 2015: [matches] } }（只要联赛常规赛） */
function loadTransfermarkt(cache, ids) {
  const want = new Set(ids);
  const out = {};
  csv.readObjects(path.join(cache, 'tm_games.csv.gz')).forEach((r) => {
    if (!want.has(r.competition_id) || r.home_club_goals === '' || r.away_club_goals === '') return;
    const s = Number(r.season);
    ((out[r.competition_id] = out[r.competition_id] || {})[s] = out[r.competition_id][s] || []).push({
      date: r.date, home: r.home_club_name, away: r.away_club_name, hg: Number(r.home_club_goals), ag: Number(r.away_club_goals)
    });
  });
  return out;
}

/** engsoccerdata：{ 'england/1': { 2015: [matches] } } */
function loadEngsoccer(cache, pairs) {
  const out = {};
  const files = {};
  pairs.forEach(([file, tier]) => { (files[file] = files[file] || new Set()).add(tier); });
  Object.keys(files).forEach((file) => {
    csv.readObjects(path.join(cache, 'engsoccerdata', 'data-raw', file + '.csv')).forEach((r) => {
      const s = Number(r.Season);
      if (s < FIRST_SEASON) return;
      const tier = file === 'mls' ? '1' : String(r.tier);
      if (!files[file].has(tier)) return;
      if (file === 'spain' && r.round && r.round !== 'league') return;
      if (file === 'mls' && r.round !== 'regular') return;
      if (r.hgoal === 'NA' || r.vgoal === 'NA') return;
      const k = file + '/' + tier;
      ((out[k] = out[k] || {})[s] = out[k][s] || []).push({ date: r.Date, home: r.home, away: r.visitor, hg: Number(r.hgoal), ag: Number(r.vgoal) });
    });
  });
  return out;
}

/** 同一季里同一家俱乐部写法不同（改名、来源笔误）时按规范键合并，队名取出现最多的写法 */
function table(matches, win) {
  const t = {};
  const names = {};
  const row = (n) => {
    const k = key(n);
    (names[k] = names[k] || {})[n] = (names[k][n] || 0) + 1;
    return (t[k] = t[k] || { k, team: n, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  };
  matches.forEach((m) => {
    const h = row(m.home);
    const a = row(m.away);
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; a.l++; h.pts += win; } else if (m.hg < m.ag) { a.w++; h.l++; a.pts += win; } else { h.d++; a.d++; h.pts++; a.pts++; }
  });
  Object.values(t).forEach((r) => {
    const c = names[r.k];
    r.team = Object.keys(c).sort((a, b) => c[b] - c[a] || a.localeCompare(b))[0];
    delete r.k;
  });
  return Object.values(t).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || x.team.localeCompare(y.team))
    .map((r, i) => Object.assign({ pos: i + 1 }, r));
}

function complete(rows, strict) {
  if (rows.length < 6) return false;
  const max = Math.max.apply(null, rows.map((r) => r.p));
  const min = Math.min.apply(null, rows.map((r) => r.p));
  const games = rows.reduce((t, r) => t + r.p, 0) / 2;
  // 至少踢完单循环的八成（排除来源里只收了半个赛季的情况）
  return max >= 10 && min >= max * 0.75 && games >= (rows.length * (rows.length - 1)) / (strict ? 1 : 2) * 0.8;
}

/** RSSSF 甲 A：页面里第一张 「 1. 队名  T W D L Gf Ga Pts」表 */
function loadRsssfChina(cache) {
  const out = {};
  for (let y = 1994; y <= 2003; y++) {
    const file = path.join(cache, 'rsssf', 'china' + String(y).slice(2) + '.html');
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'latin1');
    const text = raw.replace(/\t/g, '  ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    const author = (/(?:Author|Authors?)\s*:\s*([^\n]+)/i.exec(text) || /Prepared and maintained by ([^\n]+)/i.exec(text) || [])[1] || '';
    const lines = text.split('\n');
    const rows = [];
    let started = false;
    for (const line of lines) {
      const m = /^\s*(\d{1,2})\.\s*(.+?)\s{2,}(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*-?\s*(\d+)\s+(-?\d+)/.exec(line);
      if (m) {
        started = true;
        rows.push({ pos: Number(m[1]), team: m[2].trim(), p: +m[3], w: +m[4], d: +m[5], l: +m[6], gf: +m[7], ga: +m[8], pts: +m[9] });
      } else if (started && rows.length >= 10 && /^\s*$/.test(line)) break;
    }
    // 并列名次的行 RSSSF 不写序号：按出现顺序补
    rows.forEach((r, i) => { r.pos = i + 1; });
    out[y] = { rows, author: author.trim(), url: 'https://www.rsssf.org/tablesc/china' + String(y).slice(2) + '.html' };
  }
  return out;
}

/**
 * @returns {{ rows: Array, coverage: Object }} rows 每条 { league, season, pos, team, team_key, p, w, d, l, gf, ga, pts, source, license }
 */
function build(cache) {
  const of = loadOpenfootball(cache);
  const tm = loadTransfermarkt(cache, LEAGUES.filter((l) => l.tm).map((l) => l.tm));
  const es = loadEngsoccer(cache, LEAGUES.filter((l) => l.es).map((l) => l.es));
  const rs = loadRsssfChina(cache);
  const rows = [];
  const coverage = {};
  const rsssfPages = [];
  LEAGUES.forEach((lg) => {
    coverage[lg.code] = {};
    for (let s = FIRST_SEASON; s < FUTURE_FROM; s++) {
      if ((lg.exclude || []).indexOf(s) >= 0) continue;
      const win = s >= (lg.threeFrom || 1995) ? 3 : 2;
      const cands = [];
      if (lg.of && of[lg.of] && of[lg.of][s]) cands.push({ source: 'openfootball', license: 'CC0', m: of[lg.of][s] });
      if (lg.tm && tm[lg.tm] && tm[lg.tm][s]) cands.push({ source: 'transfermarkt-datasets', license: 'CC0', m: tm[lg.tm][s] });
      if (lg.es) {
        const k = lg.es[0] + '/' + lg.es[1];
        if (es[k] && es[k][s]) cands.push({ source: 'engsoccerdata', license: 'GPL-2.0-or-later', m: es[k][s] });
      }
      let picked = null;
      for (const c of cands) {
        const t = table(c.m, win);
        // 数据冻结前最后一个自然年赛季可能还没踢完：要求踢完双循环的八成
        if (complete(t, lg.calendar && s === FUTURE_FROM - 1)) { picked = { source: c.source, license: c.license, rows: t }; break; }
      }
      if (!picked && lg.rsssf && rs[s] && rs[s].rows.length >= 10) {
        picked = { source: 'RSSSF', license: 'RSSSF', rows: rs[s].rows };
        rsssfPages.push({ season: s, url: rs[s].url, author: rs[s].author });
      }
      if (!picked) continue;
      coverage[lg.code][s] = picked.source;
      picked.rows.forEach((r) => rows.push({
        league: lg.code, season: s, pos: r.pos, team: r.team, team_key: lg.country + ':' + key(r.team),
        p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts, source: picked.source, license: picked.license
      }));
    }
  });
  return { rows, coverage, rsssfPages };
}

module.exports = { build, table, complete, loadRsssfChina };
