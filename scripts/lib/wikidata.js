'use strict';
/**
 * Wikidata（CC0）：同年球星池
 *   每个出生年按维基百科语言版本数（sitelinks）取前 N 名男子职业球员（build.js：1958–2010 每年 60 名），
 *   再取他们的效力记录（P54，带开始 / 结束时间），去掉国家队和青年队
 * 查询结果缓存在 .cache/wikidata/，--refresh-wikidata 重新查
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'pro-career-data/1.0 (https://github.com/lyuyang1014/pro-career-data)';

function sparql(query) {
  for (let i = 0; i < 4; i++) {
    try {
      const out = execFileSync('curl', ['-sS', '--fail', '--max-time', '120', '-G', '-H', 'User-Agent: ' + UA, '-H', 'Accept: application/sparql-results+json',
        '--data-urlencode', 'query=' + query, ENDPOINT], { maxBuffer: 64 * 1024 * 1024 });
      return JSON.parse(out.toString('utf8')).results.bindings;
    } catch (e) {
      console.warn('  Wikidata 查询失败，重试', i + 1);
      execFileSync('sleep', [String(5 * (i + 1))]);
    }
  }
  throw new Error('Wikidata 查询失败');
}

const qid = (uri) => String(uri || '').replace(/^.*\//, '');
const val = (b, k) => (b[k] ? b[k].value : '');

function topPlayers(year, n) {
  return sparql(`SELECT ?p ?zh ?en ?sl ?dob WHERE {
  ?p wdt:P106 wd:Q937857; wdt:P21 wd:Q6581097; wdt:P569 ?dob; wikibase:sitelinks ?sl.
  FILTER(YEAR(?dob) = ${year})
  FILTER EXISTS { ?p wdt:P54 ?t }
  OPTIONAL { ?p rdfs:label ?zh FILTER(LANG(?zh) = "zh-hans") }
  OPTIONAL { ?p rdfs:label ?en FILTER(LANG(?en) = "en") }
} ORDER BY DESC(?sl) LIMIT ${n}`).map((b) => ({ id: qid(val(b, 'p')), zh: val(b, 'zh'), en: val(b, 'en'), sitelinks: Number(val(b, 'sl')), dob: val(b, 'dob').slice(0, 10) }));
}

function details(ids) {
  const values = ids.map((i) => 'wd:' + i).join(' ');
  const facts = sparql(`SELECT ?p ?zhcn ?zh ?nat ?cit ?pos ?posLabel ?img WHERE {
  VALUES ?p { ${values} }
  OPTIONAL { ?p rdfs:label ?zhcn FILTER(LANG(?zhcn) = "zh-cn") }
  OPTIONAL { ?p rdfs:label ?zh FILTER(LANG(?zh) = "zh") }
  OPTIONAL { ?p wdt:P1532 ?c1. ?c1 wdt:P298 ?nat. }
  OPTIONAL { ?p wdt:P27 ?c2. ?c2 wdt:P298 ?cit. }
  OPTIONAL { ?p wdt:P18 ?img. }
  OPTIONAL { ?p wdt:P413 ?pos. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`);
  const spells = sparql(`SELECT ?p ?team ?teamEn ?teamZh ?start ?end ?country ?natTeam WHERE {
  VALUES ?p { ${values} }
  ?p p:P54 ?st. ?st ps:P54 ?team.
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?end }
  OPTIONAL { ?team rdfs:label ?teamEn FILTER(LANG(?teamEn) = "en") }
  OPTIONAL { ?team rdfs:label ?teamZh FILTER(LANG(?teamZh) = "zh-hans") }
  OPTIONAL { ?team wdt:P17 ?cc. ?cc wdt:P298 ?country. }
  BIND(EXISTS { ?team wdt:P31/wdt:P279* wd:Q6979593 } AS ?natTeam)
}`);
  return { facts, spells };
}

// 位置（P413）→ 玩法里的位置码
const POS = [
  [/goalkeeper/i, 'GK'], [/centre-back|center-back|central defender|sweeper|defender/i, 'CB'], [/full-back|fullback|wing-back|left-back|right-back/i, 'FB'],
  [/defensive midfielder/i, 'CDM'], [/attacking midfielder/i, 'CAM'], [/winger|wide midfielder/i, 'W'], [/midfielder/i, 'CM'],
  [/centre-forward|center forward|striker/i, 'ST'], [/forward/i, 'ST']
];
function posCode(labels) {
  for (const l of labels) for (const [re, c] of POS) if (re.test(l)) return c;
  return '';
}

function stars(cache, opts) {
  const dir = path.join(cache, 'wikidata');
  fs.mkdirSync(dir, { recursive: true });
  const out = [];
  for (let y = opts.from; y <= opts.to; y++) {
    const file = path.join(dir, 'stars_' + y + (opts.perYear === 14 ? '' : '_' + opts.perYear) + '.json');
    let data;
    if (fs.existsSync(file) && !opts.refresh) data = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
      console.log('  Wikidata', y);
      const top = topPlayers(y, opts.perYear);
      const d = top.length ? details(top.map((t) => t.id)) : { facts: [], spells: [] };
      data = { year: y, queried_at: new Date().toISOString(), top, facts: d.facts, spells: d.spells };
      fs.writeFileSync(file, JSON.stringify(data));
    }
    data.top.forEach((t) => {
      const facts = data.facts.filter((b) => qid(val(b, 'p')) === t.id);
      const zh = val(facts.find((b) => val(b, 'zhcn')) || {}, 'zhcn') || t.zh || val(facts.find((b) => val(b, 'zh')) || {}, 'zh') || '';
      const cit = facts.map((b) => val(b, 'cit')).find(Boolean) || '';
      const nat = facts.map((b) => val(b, 'nat')).find(Boolean) || (cit === 'GBR' ? 'ENG' : cit);
      const pos = posCode(Array.from(new Set(facts.map((b) => val(b, 'posLabel')).filter(Boolean))));
      const seen = new Set();
      const spells = data.spells.filter((b) => qid(val(b, 'p')) === t.id && val(b, 'natTeam') !== 'true')
        .map((b) => ({
          team: qid(val(b, 'team')), en: val(b, 'teamEn'), zh: val(b, 'teamZh'), country: val(b, 'country'),
          from: val(b, 'start') ? Number(val(b, 'start').slice(0, 4)) : null, to: val(b, 'end') ? Number(val(b, 'end').slice(0, 4)) : null
        }))
        .filter((s) => s.from && !/\b(U-?\d\d|under-\d\d|national|reserves|II|B|youth|academy|juvenil|primavera)\b|Atl[eè]tic$|\bC$/i.test(s.en))
        .filter((s) => { const k = s.team + s.from; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => a.from - b.from);
      if (!spells.length) return;
      const img = facts.map((b) => val(b, 'img')).find(Boolean) || '';
      out.push({ id: t.id, zh, en: t.en, born: y, dob: t.dob, nat, pos, sitelinks: t.sitelinks, image: img ? decodeURIComponent(img.replace(/^.*Special:FilePath\//, '')) : '', spells });
    });
  }
  return out;
}

module.exports = { stars, posCode };
