#!/usr/bin/env node
'use strict';
/**
 * 不重新查 Wikidata，按 scripts/lib/stars.js 的规则清理现有的 data/cc0/stars.json（可以重复跑，结果不变）
 *   node scripts/clean-stars.js
 */
const fs = require('fs');
const path = require('path');
const { cleanSpells } = require('./lib/stars');
const { FUTURE_FROM } = require('./lib/leagues');

const file = path.join(__dirname, '..', 'data', 'cc0', 'stars.json');
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
const before = doc.stars.length;
let changed = 0;
doc.stars = doc.stars.map((st) => {
  const spells = cleanSpells(st.spells, st.born, FUTURE_FROM - 1);
  if (JSON.stringify(spells) !== JSON.stringify(st.spells)) changed++;
  return Object.assign({}, st, { spells });
}).filter((st) => st.spells.length);
if (!/16 岁/.test(doc._source)) doc._source = String(doc._source).replace('；公开仓库', '；从 16 岁算起、38 岁后开始的记录去掉、没写结束年份的老将按 36 岁结束（scripts/lib/stars.js）；公开仓库');
fs.writeFileSync(file, JSON.stringify(doc) + '\n');
console.log('球星 ' + before + ' → ' + doc.stars.length + '，改了 ' + changed + ' 人的效力记录');
