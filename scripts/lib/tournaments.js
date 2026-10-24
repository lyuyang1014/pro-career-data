'use strict';
/**
 * 大赛：
 *   国家队（martj42 international_results，CC0）：世界杯、欧洲杯、美洲杯、非洲杯、亚洲杯、金杯赛 1990 起每届逐场比分 + 点球大战
 *     原始数据没写轮次：从决赛往前倒推淘汰赛（每队前一场、而且是这一队赢的），倒推深度按参赛队数（≥48 队 32 强起、
 *     ≥24 队 16 强起、≥10 队 8 强起，否则 4 强起），其余是小组赛；倒推出的冠军和 KNOWN 逐届核对，对不上就报错
 *   欧冠（俱乐部）：2012/13 起 transfermarkt-datasets（CC0），2011/12 openfootball（公有领域），1990/91–2010/11 engsoccerdata（GPL）
 *     只记每家俱乐部最远走到哪一轮和决赛；2025/26 来源里没有决赛，不收
 */
const fs = require('fs');
const path = require('path');
const csv = require('./csv');
const { key } = require('./clubs');
const { teamCode } = require('./nations');
const { LEAGUES } = require('./leagues');

const COMPS = {
  'FIFA World Cup': { code: 'WC', name: '世界杯' },
  'UEFA Euro': { code: 'EURO', name: '欧洲杯' },
  'Copa América': { code: 'COPA', name: '美洲杯' },
  'Copa América Centenario': { code: 'COPA', name: '美洲杯' },
  'African Cup of Nations': { code: 'AFCON', name: '非洲杯' },
  'AFC Asian Cup': { code: 'ASIAN', name: '亚洲杯' },
  'Gold Cup': { code: 'GOLD', name: '金杯赛' }
};
// 官方届名和比赛年份不同的（推迟 / 跨年举办）：比赛开始那年 → 届名年份
const EDITION_LABEL = { 'EURO-2021': 2020, 'AFCON-2022': 2021, 'AFCON-2024': 2023, 'ASIAN-2024': 2023 };
// 核对用：1990–2024 各届冠军（公开历史）。2025 年以后的届次以数据为准
const KNOWN = {
  WC: { 1990: 'DEU', 1994: 'BRA', 1998: 'FRA', 2002: 'BRA', 2006: 'ITA', 2010: 'ESP', 2014: 'DEU', 2018: 'FRA', 2022: 'ARG' },
  EURO: { 1992: 'DNK', 1996: 'DEU', 2000: 'FRA', 2004: 'GRC', 2008: 'ESP', 2012: 'ESP', 2016: 'PRT', 2020: 'ITA', 2024: 'ESP' },
  COPA: { 1991: 'ARG', 1993: 'ARG', 1995: 'URY', 1997: 'BRA', 1999: 'BRA', 2001: 'COL', 2004: 'BRA', 2007: 'BRA', 2011: 'URY', 2015: 'CHL', 2016: 'CHL', 2019: 'BRA', 2021: 'ARG', 2024: 'ARG' },
  AFCON: { 1990: 'DZA', 1992: 'CIV', 1994: 'NGA', 1996: 'ZAF', 1998: 'EGY', 2000: 'CMR', 2002: 'CMR', 2004: 'TUN', 2006: 'EGY', 2008: 'EGY', 2010: 'EGY', 2012: 'ZMB', 2013: 'NGA', 2015: 'CIV', 2017: 'CMR', 2019: 'DZA', 2021: 'SEN', 2023: 'CIV' },
  ASIAN: { 1992: 'JPN', 1996: 'SAU', 2000: 'JPN', 2004: 'JPN', 2007: 'IRQ', 2011: 'JPN', 2015: 'AUS', 2019: 'QAT', 2023: 'QAT' },
  GOLD: { 1991: 'USA', 1993: 'MEX', 1996: 'MEX', 1998: 'MEX', 2000: 'CAN', 2002: 'USA', 2003: 'MEX', 2005: 'USA', 2007: 'USA', 2009: 'MEX', 2011: 'MEX', 2013: 'USA', 2015: 'MEX', 2017: 'USA', 2019: 'MEX', 2021: 'USA', 2023: 'MEX' }
};
// 1991 美洲杯决赛阶段是四队单循环（没有决赛），按公开历史记冠亚军，四队都记「决赛阶段」
const ROUND_ROBIN_FINAL = { 'COPA-1991': { W: 'ARG', F: 'BRA', group: ['ARG', 'BRA', 'CHL', 'COL'] } };
const KO = ['F', 'SF', 'QF', 'R16', 'R32'];

/** 赛季号：7 月起算新赛季（6 月的世界杯 / 欧洲杯算上一个赛季的夏天） */
function seasonOf(date) {
  const y = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 7 ? y : y - 1;
}

function winnerOf(m) {
  if (m.hs > m.as) return m.home;
  if (m.hs < m.as) return m.away;
  return m.pen || '';
}

function depthOf(n) {
  if (n >= 48) return 5;
  if (n >= 24) return 4;
  if (n >= 10) return 3;
  return 2;
}

function reconstruct(ms, n) {
  ms.forEach((m) => { m.stage = 'G'; });
  // 决赛：最后一天的比赛；同一天还有三四名决赛时，取两队上一场都赢了的那场
  const lastDay = ms[ms.length - 1].date;
  const prevWon = (m, t) => {
    const p = ms.filter((x) => x.date < m.date && (x.home === t || x.away === t)).pop();
    return !!p && winnerOf(p) === t;
  };
  const sameDay = ms.filter((m) => m.date === lastDay);
  const finalM = sameDay.find((m) => prevWon(m, m.home) && prevWon(m, m.away)) || sameDay[sameDay.length - 1];
  finalM.stage = 'F';
  let frontier = [finalM];
  const depth = depthOf(n);
  for (let r = 1; r < depth; r++) {
    const next = [];
    frontier.forEach((m) => {
      [m.home, m.away].forEach((t) => {
        const prev = ms.filter((x) => x.date < m.date && (x.home === t || x.away === t)).pop();
        if (!prev || prev.stage !== 'G' || winnerOf(prev) !== t) return;
        prev.stage = KO[r];
        next.push(prev);
      });
    });
    frontier = next;
  }
  // 三四名决赛：两支半决赛输家之间、在决赛之前的最后一场
  const sfLosers = ms.filter((m) => m.stage === 'SF').map((m) => (winnerOf(m) === m.home ? m.away : m.home));
  if (sfLosers.length === 2) {
    const third = ms.filter((m) => m.stage === 'G' && [m.home, m.away].sort().join() === sfLosers.slice().sort().join()).pop();
    if (third && third.date >= ms.filter((m) => m.stage === 'SF').map((m) => m.date).sort().pop()) third.stage = '3P';
  }
}

/** 每队最远：W 冠军 / F / SF / QF / R16 / R32 / G */
function resultOf(ms) {
  const res = {};
  const rank = { G: 0, R32: 1, R16: 2, QF: 3, '3P': 4, SF: 4, F: 5 };
  ms.forEach((m) => [m.home, m.away].forEach((t) => {
    const s = m.stage === '3P' ? 'SF' : m.stage;
    if (!res[t] || rank[s] > rank[res[t]]) res[t] = s;
  }));
  const f = ms.find((m) => m.stage === 'F');
  if (f) res[winnerOf(f)] = 'W';
  return res;
}

function nationalTournaments(cache, countries) {
  const pens = {};
  csv.readObjects(path.join(cache, 'shootouts.csv')).forEach((r) => { pens[r.date + '|' + r.home_team + '|' + r.away_team] = r.winner; });
  const byComp = {};
  csv.readObjects(path.join(cache, 'results.csv')).forEach((r) => {
    const c = COMPS[r.tournament];
    if (!c || r.date < '1990-01-01' || r.home_score === 'NA' || r.home_score === '') return;
    const home = teamCode(r.home_team, countries);
    const away = teamCode(r.away_team, countries);
    const pw = pens[r.date + '|' + r.home_team + '|' + r.away_team];
    (byComp[c.code] = byComp[c.code] || []).push({
      date: r.date, home, away, hs: Number(r.home_score), as: Number(r.away_score),
      pen: pw ? teamCode(pw, countries) : '', city: r.city, hostCountry: r.country
    });
  });
  const editions = [];
  const problems = [];
  Object.keys(byComp).forEach((code) => {
    const list = byComp[code].sort((a, b) => a.date.localeCompare(b.date));
    // 相隔 60 天以上算下一届（跨年举办的非洲杯也能分开）
    let cur = [];
    const groups = [];
    list.forEach((m) => {
      if (cur.length && (Date.parse(m.date) - Date.parse(cur[cur.length - 1].date)) / 86400000 > 60) { groups.push(cur); cur = []; }
      cur.push(m);
    });
    if (cur.length) groups.push(cur);
    groups.forEach((ms) => {
      const startYear = Number(ms[0].date.slice(0, 4));
      const id = code + '-' + startYear;
      const label = EDITION_LABEL[id] || startYear;
      const teams = new Set();
      ms.forEach((m) => { teams.add(m.home); teams.add(m.away); });
      const rr = ROUND_ROBIN_FINAL[code + '-' + label];
      let result;
      if (rr) {
        ms.forEach((m) => { m.stage = 'G'; });
        result = {};
        teams.forEach((t) => { result[t] = 'G'; });
        rr.group.forEach((t) => { result[t] = 'SF'; });
        result[rr.F] = 'F';
        result[rr.W] = 'W';
      } else {
        reconstruct(ms, teams.size);
        result = resultOf(ms);
      }
      const champ = Object.keys(result).find((t) => result[t] === 'W') || '';
      const known = KNOWN[code] && KNOWN[code][label];
      if (known && known !== champ) problems.push(`${code} ${label}：推出来冠军 ${champ}，公开历史是 ${known}`);
      const last = ms[ms.length - 1];
      editions.push({
        comp: code, name: COMPS[Object.keys(COMPS).find((k) => COMPS[k].code === code)].name, label, season: seasonOf(ms[0].date),
        host: last.hostCountry, champion: champ, teams: teams.size,
        matches: ms.map((m) => ({ date: m.date, home: m.home, away: m.away, hs: m.hs, as: m.as, pen: m.pen, stage: m.stage, city: m.city })),
        result
      });
    });
  });
  return { editions: editions.sort((a, b) => a.matches[0].date.localeCompare(b.matches[0].date)), problems };
}

// ---------- 欧冠 ----------
const FIFA_TO_ISO = { GER: 'DEU', NED: 'NLD', POR: 'PRT', SUI: 'CHE', DEN: 'DNK', CRO: 'HRV', GRE: 'GRC', BUL: 'BGR', ROM: 'ROU', RUM: 'ROU', SLO: 'SVN', SVK: 'SVK', CZE: 'CZE', SRB: 'SRB', YUG: 'SRB', SCG: 'SRB', URS: 'RUS', CIS: 'RUS', LAT: 'LVA', LTU: 'LTU', BLR: 'BLR', MDA: 'MDA', BIH: 'BIH', MKD: 'MKD', CYP: 'CYP', ISR: 'ISR', NIR: 'NIR', WAL: 'WAL', IRL: 'IRL', ISL: 'ISL', FRO: 'FRO', MLT: 'MLT', LUX: 'LUX', AZE: 'AZE', KAZ: 'KAZ', ARM: 'ARM', GEO: 'GEO', ALB: 'ALB', MNE: 'MNE', KOS: 'XKX', AND: 'AND', SMR: 'SMR', GIB: 'GIB', EST: 'EST', FIN: 'FIN', HUN: 'HUN', AUT: 'AUT', BEL: 'BEL', ESP: 'ESP', ITA: 'ITA', FRA: 'FRA', ENG: 'ENG', SCO: 'SCO', TUR: 'TUR', RUS: 'RUS', UKR: 'UKR', POL: 'POL', SWE: 'SWE', NOR: 'NOR' };
const CL_RANK = { G: 0, R32: 1, R16: 2, QF: 3, SF: 4, F: 5, W: 6 };

function clStage(round, season) {
  const r = String(round || '').toLowerCase();
  if (/^q-|qualif|prelim|play-?off/.test(r)) return '';
  if (/^final$|finals, final|^final /.test(r) || r === 'final') return 'F';
  if (/semi|^sf$/.test(r)) return 'SF';
  if (/quarter|^qf$/.test(r)) return 'QF';
  if (/last 16|round of 16|^r16$|inter$/.test(r)) return 'R16';
  if (r === 'round2') return 'R16';
  if (r === 'round1') return 'R32';
  if (/^group[ab]$/.test(r) && (season === 1991 || season === 1992)) return 'SF';
  if (/^group[ab]$/.test(r) && season === 1993) return 'QF';
  if (/group|league|intermediate/.test(r)) return 'G';
  return '';
}

function championsLeague(cache) {
  const tmCountry = {};
  const tmLeague = {};
  LEAGUES.forEach((l) => { if (l.tm) tmLeague[l.tm] = l.country; });
  csv.readObjects(path.join(cache, 'tm_clubs.csv.gz')).forEach((r) => { tmCountry[r.name] = tmLeague[r.domestic_competition_id] || ''; });
  const seasons = {};
  const add = (s, src, lic, m) => {
    const S = (seasons[s] = seasons[s] || { source: src, license: lic, clubs: {}, final: null });
    if (S.source !== src) return;
    [[m.home, m.hc], [m.away, m.ac]].forEach(([name, c]) => {
      const k = (c || '') + ':' + key(name);
      const cur = S.clubs[k];
      if (!cur || CL_RANK[m.stage] > CL_RANK[cur.stage]) S.clubs[k] = { name, country: c || '', stage: m.stage };
    });
    if (m.stage === 'F') S.final = m;
  };
  // 2012/13 起：transfermarkt
  const tmRows = csv.readObjects(path.join(cache, 'tm_games.csv.gz')).filter((r) => r.competition_id === 'CL');
  tmRows.forEach((r) => {
    const s = Number(r.season);
    const st = clStage(r.round, s);
    if (!st || r.home_club_goals === '') return;
    add(s, 'transfermarkt-datasets', 'CC0', { home: r.home_club_name, away: r.away_club_name, hc: tmCountry[r.home_club_name], ac: tmCountry[r.away_club_name], hs: +r.home_club_goals, as: +r.away_club_goals, stage: st, date: r.date });
  });
  // 2011/12：openfootball
  const ofFile = path.join(cache, 'football.json', '2011-12', 'uefa.cl.json');
  if (fs.existsSync(ofFile)) {
    JSON.parse(fs.readFileSync(ofFile, 'utf8')).matches.forEach((x) => {
      const st = clStage(x.round, 2011);
      if (!st || !x.score || !x.score.ft) return;
      const c1 = (/\(([A-Z]{3})\)/.exec(x.team1) || [])[1];
      const c2 = (/\(([A-Z]{3})\)/.exec(x.team2) || [])[1];
      const p = x.score.p;
      const hs = (x.score.et || x.score.ft)[0] + (p ? (p[0] > p[1] ? 0.5 : 0) : 0);
      const as = (x.score.et || x.score.ft)[1] + (p ? (p[1] > p[0] ? 0.5 : 0) : 0);
      add(2011, 'openfootball', 'CC0', { home: x.team1.replace(/\s*\([A-Z]{3}\)/, ''), away: x.team2.replace(/\s*\([A-Z]{3}\)/, ''), hc: FIFA_TO_ISO[c1] || c1, ac: FIFA_TO_ISO[c2] || c2, hs, as, stage: st, date: x.date });
    });
  }
  // 1990/91–2010/11：engsoccerdata
  csv.readObjects(path.join(cache, 'engsoccerdata', 'data-raw', 'champs.csv')).forEach((r) => {
    const s = Number(r.Season);
    if (s < 1990 || s > 2010) return;
    const st = clStage(r.round, s);
    if (!st) return;
    let hs = Number(r.hgoal);
    let as = Number(r.vgoal);
    if (st === 'F' && r.tiewinner && r.tiewinner !== 'NA') { if (r.tiewinner === r.home) hs += 0.5; else as += 0.5; }
    add(s, 'engsoccerdata', 'GPL-2.0-or-later', { home: r.home, away: r.visitor, hc: FIFA_TO_ISO[r.hcountry] || r.hcountry, ac: FIFA_TO_ISO[r.vcountry] || r.vcountry, hs, as, stage: st, date: r.Date });
  });
  const out = [];
  Object.keys(seasons).map(Number).sort().forEach((s) => {
    const S = seasons[s];
    if (!S.final) return;
    const f = S.final;
    const winner = f.hs > f.as ? f.home : f.away;
    const wk = Object.keys(S.clubs).find((k) => S.clubs[k].name === winner);
    if (wk) S.clubs[wk].stage = 'W';
    out.push({ season: s, source: S.source, license: S.license, final: { date: f.date, home: f.home, away: f.away, hs: Math.floor(f.hs), as: Math.floor(f.as), winner }, clubs: S.clubs });
  });
  return out;
}

module.exports = { nationalTournaments, championsLeague, seasonOf, COMPS, KNOWN };
