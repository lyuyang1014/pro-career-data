#!/usr/bin/env node
'use strict';
/**
 * 从 .cache/ 的原始数据整理出 data/ 下按许可分目录的表（先跑 scripts/fetch.js）
 *   node scripts/build.js                     用缓存的 Wikidata 查询结果
 *   node scripts/build.js --refresh-wikidata  重新查 Wikidata
 *
 * 输出（三类许可分目录放，一眼看出每个文件是什么许可，见 LICENSE.md）：
 *   data/cc0/standings.csv                 openfootball（公有领域）+ transfermarkt-datasets（CC0）算出的联赛积分榜
 *   data/cc0/champions-league.json         欧冠 2011/12 起（同上两个来源）
 *   data/cc0/national-tournaments.json     国家队大赛 1990 起（martj42，CC0）
 *   data/cc0/stars.json                    同年球星池和效力记录（Wikidata，CC0）
 *   data/gpl/standings.csv                 engsoccerdata（GPL-2.0-or-later）算出的联赛积分榜
 *   data/gpl/champions-league.json         欧冠 1990/91–2010/11（engsoccerdata）
 *   data/rsssf/china-jia-a-1994-2003.csv   中国甲 A 积分榜（RSSSF，逐页署名）
 *   data/cc-by-3.0-igo/births.csv          各国逐年出生人数（UN WPP 2024，CC BY 3.0 IGO）
 *   data/manifest.json                     版本、生成时间、各联赛各赛季用的是哪个来源
 */
const fs = require('fs');
const path = require('path');
const csv = require('./lib/csv');
const standings = require('./lib/standings');
const tournaments = require('./lib/tournaments');
const nations = require('./lib/nations');
const wikidata = require('./lib/wikidata');
const { LEAGUES, FUTURE_FROM, FIRST_SEASON } = require('./lib/leagues');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, '.cache');
const DATA = path.join(ROOT, 'data');
const REPO = 'https://github.com/lyuyang1014/pro-career-data';
const VERSION = require('../package.json').version;
// 球星池：1958 年生的人 1990 年 32 岁还在踢；2010 年生是最小的队员
const STAR_FROM = 1958;
const STAR_TO = 2010;
const STAR_PER_YEAR = 60;

const HEAD = {
  cc0: ['许可：CC0 1.0（openfootball 为公有领域，transfermarkt-datasets / martj42 / Wikidata 为 CC0）', '来源和版本见 SOURCES.md；公开仓库 ' + REPO],
  gpl: ['许可：GPL-2.0-or-later（由 engsoccerdata 衍生，James P. Curley，https://github.com/jalapic/engsoccerdata）', '本文件按 GPL-2.0 或更高版本发布，全文见仓库根目录 COPYING；公开仓库 ' + REPO],
  rsssf: ['来源：RSSSF（The Rec.Sport.Soccer Statistics Foundation，https://www.rsssf.org/），按 RSSSF 要求注明出处', '只整理积分榜数字，不搬页面文字；每个赛季的页面地址和作者见 url / author 列；公开仓库 ' + REPO],
  wpp: ['来源：United Nations, Department of Economic and Social Affairs, Population Division (2024). World Population Prospects 2024', '许可：CC BY 3.0 IGO；单位千人；英格兰 / 苏格兰 / 威尔士 / 北爱尔兰按估计比例从英国拆出（见 scripts/lib/nations.js UK_SPLIT）']
};

function ensure(dir) { fs.mkdirSync(path.join(DATA, dir), { recursive: true }); }
function writeJson(rel, header, body) {
  fs.writeFileSync(path.join(DATA, rel), JSON.stringify(Object.assign({ _license: header[0], _source: header[1] }, body)) + '\n');
}

function main() {
  if (!fs.existsSync(CACHE)) throw new Error('先跑 node scripts/fetch.js');
  ['cc0', 'gpl', 'rsssf', 'cc-by-3.0-igo'].forEach(ensure);

  console.log('积分榜…');
  const st = standings.build(CACHE);
  const COLS = ['league', 'season', 'pos', 'team', 'team_key', 'p', 'w', 'd', 'l', 'gf', 'ga', 'pts', 'source'];
  csv.write(path.join(DATA, 'cc0', 'standings.csv'), COLS, st.rows.filter((r) => r.license === 'CC0'), HEAD.cc0);
  csv.write(path.join(DATA, 'gpl', 'standings.csv'), COLS, st.rows.filter((r) => r.license === 'GPL-2.0-or-later'), HEAD.gpl);
  const pages = {};
  st.rsssfPages.forEach((p) => { pages[p.season] = p; });
  csv.write(path.join(DATA, 'rsssf', 'china-jia-a-1994-2003.csv'), COLS.concat(['url', 'author']),
    st.rows.filter((r) => r.license === 'RSSSF').map((r) => Object.assign({}, r, { url: pages[r.season].url, author: pages[r.season].author })), HEAD.rsssf);

  console.log('出生人数…');
  const { countries, births } = nations.loadBirths(CACHE, 1960, 2015);
  const years = [];
  for (let y = 1960; y <= 2015; y++) years.push(y);
  csv.write(path.join(DATA, 'cc-by-3.0-igo', 'births.csv'), ['code', 'iso2', 'name_zh', 'name_en'].concat(years.map(String)),
    countries.map((c) => [c.code, c.iso2, c.name, c.en].concat(years.map((y) => (births[c.code] && births[c.code][y] != null ? births[c.code][y] : '')))), HEAD.wpp);

  console.log('大赛…');
  const nt = tournaments.nationalTournaments(CACHE, countries);
  if (nt.problems.length) throw new Error('大赛冠军核对没过：\n' + nt.problems.join('\n'));
  writeJson('cc0/national-tournaments.json', HEAD.cc0, { editions: nt.editions });
  const cl = tournaments.championsLeague(CACHE);
  writeJson('cc0/champions-league.json', HEAD.cc0, { seasons: cl.filter((s) => s.license === 'CC0') });
  writeJson('gpl/champions-league.json', HEAD.gpl, { seasons: cl.filter((s) => s.license !== 'CC0') });

  console.log('Wikidata 球星…');
  const stars = wikidata.stars(CACHE, { from: STAR_FROM, to: STAR_TO, perYear: STAR_PER_YEAR, refresh: process.argv.includes('--refresh-wikidata') });
  writeJson('cc0/stars.json', ['许可：CC0 1.0（Wikidata）', '查询：' + STAR_FROM + '–' + STAR_TO + ' 每个出生年按维基百科语言版本数取前 ' + STAR_PER_YEAR + ' 名男子球员，效力记录取 P54（去掉国家队、青年队、预备队）；公开仓库 ' + REPO], { stars });

  const coverage = {};
  LEAGUES.forEach((l) => { coverage[l.code] = st.coverage[l.code]; });
  const fetchedAt = fs.existsSync(path.join(CACHE, 'fetched_at.txt')) ? fs.readFileSync(path.join(CACHE, 'fetched_at.txt'), 'utf8').trim() : '';
  fs.writeFileSync(path.join(DATA, 'manifest.json'), JSON.stringify({
    version: VERSION, generated_at: new Date().toISOString(), fetched_at: fetchedAt, first_season: FIRST_SEASON, future_from: FUTURE_FROM,
    leagues: LEAGUES.map((l) => ({ code: l.code, name: l.name, en: l.en, country: l.country, level: l.level, calendar: !!l.calendar, playoffTitle: !!l.playoffTitle })),
    coverage,
    counts: { standings: st.rows.length, editions: nt.editions.length, cl_seasons: cl.length, stars: stars.length, countries: countries.length }
  }, null, 1) + '\n');
  console.log('完成：', JSON.stringify({ standings: st.rows.length, editions: nt.editions.length, cl: cl.length, stars: stars.length }));
}

main();
