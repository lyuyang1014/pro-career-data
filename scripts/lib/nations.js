'use strict';
/**
 * 国家：UN WPP 2024 各国逐年出生人数 + 国家队名（martj42 的英文写法）→ 国家码
 * 国家码用 ISO 3166 三字码（WPP 的 ISO3_code）；英国拆成英格兰 ENG、苏格兰 SCO、威尔士 WAL、北爱尔兰 NIR
 * （各自有国家队和联赛），出生数按 UK_SPLIT 拆，这个比例是估计（大致按英国统计部门公布的各地区出生数占比）
 */
const path = require('path');
const csv = require('./csv');

const UK_SPLIT = { ENG: 0.84, SCO: 0.08, WAL: 0.045, NIR: 0.035 };
const UK_NAMES = { ENG: ['GB-ENG', '英格兰'], SCO: ['GB-SCT', '苏格兰'], WAL: ['GB-WLS', '威尔士'], NIR: ['GB-NIR', '北爱尔兰'] };

// martj42 的国家队名 → 国家码（和 WPP 名字对不上的、历史国家）
const TEAM_ALIASES = {
  England: 'ENG', Scotland: 'SCO', Wales: 'WAL', 'Northern Ireland': 'NIR',
  'Ivory Coast': 'CIV', 'DR Congo': 'COD', Congo: 'COG', 'South Korea': 'KOR', 'North Korea': 'PRK', Iran: 'IRN',
  Russia: 'RUS', 'United States': 'USA', 'Czech Republic': 'CZE', Vietnam: 'VNM', 'Curaçao': 'CUW',
  'Republic of Ireland': 'IRL', Turkey: 'TUR', 'Cape Verde': 'CPV', Syria: 'SYR', Palestine: 'PSE', Tanzania: 'TZA',
  Bolivia: 'BOL', Venezuela: 'VEN', 'Hong Kong': 'HKG', China: 'CHN', Moldova: 'MDA', Laos: 'LAO', Taiwan: 'TWN',
  'North Macedonia': 'MKD', Kyrgyzstan: 'KGZ', 'Bosnia and Herzegovina': 'BIH', 'Saint Kitts and Nevis': 'KNA',
  'Saint Vincent and the Grenadines': 'VCT', 'French Guiana': 'GUF', Guadeloupe: 'GLP', Martinique: 'MTQ',
  // 历史国家：按国际足联认定的继承国记
  Yugoslavia: 'SRB', 'FR Yugoslavia': 'SRB', 'Serbia and Montenegro': 'SRB', Czechoslovakia: 'CZE', 'Soviet Union': 'RUS', CIS: 'RUS',
  'West Germany': 'DEU', Zaïre: 'COD', Zaire: 'COD'
};
// 只在中文名上覆盖（Intl 的写法和国内足球报道习惯不同的）
const ZH_OVERRIDE = { CIV: '科特迪瓦', COD: '刚果（金）', COG: '刚果（布）', KOR: '韩国', PRK: '朝鲜', USA: '美国', IRN: '伊朗', CUW: '库拉索', TWN: '中国台北', HKG: '中国香港', MAC: '中国澳门', PSE: '巴勒斯坦', MKD: '北马其顿' };

function zhName(iso2) {
  try {
    return new Intl.DisplayNames(['zh-Hans'], { type: 'region' }).of(iso2);
  } catch (e) {
    return '';
  }
}

/** @returns {{ countries: Array<{ code, iso2, name, en }>, births: { code: { year: 千人 } } }} */
function loadBirths(cache, fromYear, toYear) {
  const countries = [];
  const births = {};
  csv.readObjects(path.join(cache, 'wpp2024.csv.gz')).forEach((r) => {
    if (r.LocTypeName !== 'Country/Area' || !r.ISO3_code) return;
    const y = Number(r.Time);
    if (y < fromYear || y > toYear) return;
    const b = Number(r.Births);
    if (r.ISO3_code === 'GBR') {
      Object.keys(UK_SPLIT).forEach((c) => { (births[c] = births[c] || {})[y] = Math.round(b * UK_SPLIT[c] * 1000) / 1000; });
      return;
    }
    if (!births[r.ISO3_code]) countries.push({ code: r.ISO3_code, iso2: r.ISO2_code, en: r.Location, name: ZH_OVERRIDE[r.ISO3_code] || zhName(r.ISO2_code) || r.Location });
    (births[r.ISO3_code] = births[r.ISO3_code] || {})[y] = b;
  });
  Object.keys(UK_SPLIT).forEach((c) => countries.push({ code: c, iso2: UK_NAMES[c][0], en: c, name: UK_NAMES[c][1] }));
  return { countries, births };
}

function teamCode(name, countries) {
  if (TEAM_ALIASES[name]) return TEAM_ALIASES[name];
  const c = countries.find((x) => x.en === name);
  return c ? c.code : '';
}

module.exports = { loadBirths, teamCode, UK_SPLIT, TEAM_ALIASES };
