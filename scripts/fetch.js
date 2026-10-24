#!/usr/bin/env node
'use strict';
/**
 * 下载原始数据到 .cache/（不进仓库）。需要 curl、unzip。
 *   node scripts/fetch.js            下载缺的
 *   node scripts/fetch.js --force    全部重新下载
 * 各来源的许可、版本见 SOURCES.md；Wikidata 查询在 build 时按需跑（scripts/lib/wikidata.js，结果也缓存在 .cache/）
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(ROOT, '.cache');
const FORCE = process.argv.includes('--force');

const ZIPS = {
  'football.json': 'https://codeload.github.com/openfootball/football.json/zip/refs/heads/master',
  engsoccerdata: 'https://codeload.github.com/jalapic/engsoccerdata/zip/refs/heads/master'
};
const FILES = {
  'results.csv': 'https://raw.githubusercontent.com/martj42/international_results/master/results.csv',
  'shootouts.csv': 'https://raw.githubusercontent.com/martj42/international_results/master/shootouts.csv',
  'tm_competitions.csv.gz': 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/competitions.csv.gz',
  'tm_games.csv.gz': 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/games.csv.gz',
  'tm_clubs.csv.gz': 'https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/clubs.csv.gz',
  'wpp2024.csv.gz': 'https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz'
};
// RSSSF 中国甲 A 1994–2003 各季页面（只整理积分榜数字，逐页署名）
const RSSSF = {};
for (let y = 1994; y <= 2003; y++) RSSSF['rsssf/china' + String(y).slice(2) + '.html'] = 'https://www.rsssf.org/tablesc/china' + String(y).slice(2) + '.html';

function curl(url, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  for (let i = 0; i < 4; i++) {
    try {
      execFileSync('curl', ['-sSL', '--fail', '--max-time', '300', '-A', 'pro-career-data/1.0', '-o', out, url], { stdio: 'inherit' });
      return;
    } catch (e) {
      console.warn('  重试', url);
    }
  }
  throw new Error('下载失败：' + url);
}

fs.mkdirSync(CACHE, { recursive: true });
Object.entries(ZIPS).forEach(([name, url]) => {
  const dir = path.join(CACHE, name);
  if (fs.existsSync(dir) && !FORCE) return;
  const zip = path.join(CACHE, name + '.zip');
  console.log('下载', name);
  curl(url, zip);
  fs.rmSync(dir, { recursive: true, force: true });
  const tmp = path.join(CACHE, '_unzip');
  fs.rmSync(tmp, { recursive: true, force: true });
  execFileSync('unzip', ['-q', zip, '-d', tmp]);
  fs.renameSync(path.join(tmp, fs.readdirSync(tmp)[0]), dir);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(zip);
});
Object.entries(Object.assign({}, FILES, RSSSF)).forEach(([name, url]) => {
  const out = path.join(CACHE, name);
  if (fs.existsSync(out) && !FORCE) return;
  console.log('下载', name);
  curl(url, out);
});
fs.writeFileSync(path.join(CACHE, 'fetched_at.txt'), new Date().toISOString() + '\n');
console.log('完成：', CACHE);
