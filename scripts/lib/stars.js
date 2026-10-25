'use strict';
/**
 * 球星效力记录清理（Wikidata P54 会混进青年队、退役后的业余 / 名誉注册、教练任期）：
 *   - 只从 16 岁起算：开始得更早的效力记录从 16 岁那年算起，整段都在 16 岁前的去掉
 *   - 38 岁以后才开始的记录去掉（业余队、名誉注册、执教误标成球员）
 *   - 没写结束年份、到最新赛季已经 38 岁以上的人：按 36 岁那年结束（数据里看不出真实的最后一季时宁可早不可晚）
 * 年份口径和原始数据一样：from 是第一季的开始年，to 是离队那年（赛季 from … to−1；同一年进出算一季）
 */
const START_AGE = 16;
const LATE_START = 38;
const OPEN_END_AGE = 36;

function cleanSpells(spells, born, lastReal) {
  const out = [];
  (spells || []).forEach((sp) => {
    if (!sp.from) return;
    const s = Object.assign({}, sp);
    if (s.from - born >= LATE_START) return;
    const minFrom = born + START_AGE;
    if (s.from < minFrom) {
      const lastSeason = s.to ? Math.max(s.from, s.to - 1) : Infinity;
      if (lastSeason < minFrom) return;
      s.from = minFrom;
    }
    if (!s.to && lastReal - born >= LATE_START) s.to = Math.max(s.from + 1, born + OPEN_END_AGE + 1);
    out.push(s);
  });
  return out;
}

/** 效力的第一季和最后一季（不往 1990 以后挪：齐达内 1989 年就在踢） */
function spanOf(spells, lastReal) {
  const yrs = (spells || []).filter((sp) => sp.from).map((sp) => [sp.from, Math.max(sp.from, (sp.to || lastReal + 1) - 1)]);
  if (!yrs.length) return null;
  return [Math.min.apply(null, yrs.map((x) => x[0])), Math.min(lastReal, Math.max.apply(null, yrs.map((x) => x[1])))];
}

module.exports = { cleanSpells, spanOf, START_AGE, LATE_START, OPEN_END_AGE };
