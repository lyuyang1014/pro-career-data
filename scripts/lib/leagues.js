'use strict';
/**
 * 联赛清单：code → 中文名、国家（ISO 3166 三字码；英格兰 / 苏格兰 / 威尔士 / 北爱尔兰用 ENG / SCO / WAL / NIR）、级别、赛历、各来源里的标识
 *   of  openfootball/football.json 的文件名（如 en.1）
 *   tm  transfermarkt-datasets 的 competition_id
 *   es  engsoccerdata data-raw 的文件名和 tier（GPL）
 *   rsssf  RSSSF 整理的赛季（中国甲 A / 中超、俄超，范围见 standings.js RSSSF_PAGES）
 * calendar: true 的联赛按自然年（赛季号 = 年份），其余按 7 月到次年 6 月（赛季号 = 开始那年）
 * exclude：赛制特殊、逐场积分排不出真实名次的赛季（如中超 2020 分组 + 附加赛），不收
 * playoffTitle：冠军由季后赛 / 附加赛决定，积分榜第一不等于冠军（玩法里不按榜首发联赛冠军）
 * threeFrom：从哪个赛季起胜一场记 3 分（之前 2 分）；没写按 1995
 */
const LEAGUES = [
  { code: 'ENG1', name: '英超', en: 'Premier League', country: 'ENG', level: 1, of: 'en.1', tm: 'GB1', es: ['england', '1'], threeFrom: 1981 },
  { code: 'ENG2', name: '英冠', en: 'Championship', country: 'ENG', level: 2, of: 'en.2', es: ['england', '2'], threeFrom: 1981 },
  { code: 'ENG3', name: '英甲', en: 'League One', country: 'ENG', level: 3, of: 'en.3', es: ['england', '3'], threeFrom: 1981 },
  { code: 'ENG4', name: '英乙', en: 'League Two', country: 'ENG', level: 4, of: 'en.4', es: ['england', '4'], threeFrom: 1981 },
  { code: 'ESP1', name: '西甲', en: 'La Liga', country: 'ESP', level: 1, of: 'es.1', tm: 'ES1', es: ['spain', '1'] },
  { code: 'ESP2', name: '西乙', en: 'Segunda División', country: 'ESP', level: 2, of: 'es.2' },
  { code: 'ITA1', name: '意甲', en: 'Serie A', country: 'ITA', level: 1, of: 'it.1', tm: 'IT1', es: ['italy', '1'] },
  { code: 'ITA2', name: '意乙', en: 'Serie B', country: 'ITA', level: 2, of: 'it.2' },
  { code: 'GER1', name: '德甲', en: 'Bundesliga', country: 'DEU', level: 1, of: 'de.1', tm: 'L1', es: ['germany', '1'] },
  { code: 'GER2', name: '德乙', en: '2. Bundesliga', country: 'DEU', level: 2, of: 'de.2', es: ['germany', '2'] },
  { code: 'GER3', name: '德丙', en: '3. Liga', country: 'DEU', level: 3, of: 'de.3' },
  { code: 'FRA1', name: '法甲', en: 'Ligue 1', country: 'FRA', level: 1, of: 'fr.1', tm: 'FR1', es: ['france', '1'], threeFrom: 1994 },
  { code: 'FRA2', name: '法乙', en: 'Ligue 2', country: 'FRA', level: 2, of: 'fr.2', threeFrom: 1994 },
  { code: 'NED1', name: '荷甲', en: 'Eredivisie', country: 'NLD', level: 1, of: 'nl.1', tm: 'NL1', es: ['holland', '1'] },
  { code: 'POR1', name: '葡超', en: 'Primeira Liga', country: 'PRT', level: 1, of: 'pt.1', tm: 'PO1', es: ['portugal', '1'] },
  { code: 'BEL1', name: '比甲', en: 'Belgian Pro League', country: 'BEL', level: 1, of: 'be.1', tm: 'BE1', es: ['belgium', '1'], playoffTitle: true },
  { code: 'TUR1', name: '土超', en: 'Süper Lig', country: 'TUR', level: 1, of: 'tr.1', tm: 'TR1', es: ['turkey', '1'], threeFrom: 1987 },
  { code: 'GRE1', name: '希超', en: 'Super League Greece', country: 'GRC', level: 1, of: 'gr.1', tm: 'GR1', es: ['greece', '1'], threeFrom: 1992 },
  { code: 'SCO1', name: '苏超', en: 'Scottish Premiership', country: 'SCO', level: 1, of: 'sco.1', tm: 'SC1', es: ['scotland', '1'], threeFrom: 1994 },
  { code: 'SCO2', name: '苏冠', en: 'Scottish Championship', country: 'SCO', level: 2, es: ['scotland', '2'], threeFrom: 1994 },
  { code: 'AUT1', name: '奥地利超', en: 'Austrian Bundesliga', country: 'AUT', level: 1, of: 'at.1', tm: 'A1' },
  { code: 'AUT2', name: '奥地利乙', en: '2. Liga', country: 'AUT', level: 2, of: 'at.2' },
  { code: 'SUI1', name: '瑞士超', en: 'Swiss Super League', country: 'CHE', level: 1, of: 'ch.1', tm: 'C1' },
  { code: 'DEN1', name: '丹麦超', en: 'Danish Superliga', country: 'DNK', level: 1, tm: 'DK1' },
  { code: 'RUS1', name: '俄超', en: 'Russian Premier League', country: 'RUS', level: 1, of: 'ru.1', tm: 'RU1', rsssf: true },
  { code: 'UKR1', name: '乌超', en: 'Ukrainian Premier League', country: 'UKR', level: 1, tm: 'UKR1' },
  { code: 'CZE1', name: '捷克甲', en: 'Czech First League', country: 'CZE', level: 1, of: 'cz.1', tm: 'TS1' },
  { code: 'HUN1', name: '匈牙利甲', en: 'NB I', country: 'HUN', level: 1, of: 'hu.1' },
  { code: 'POL1', name: '波兰甲', en: 'Ekstraklasa', country: 'POL', level: 1, tm: 'PL1' },
  { code: 'ROU1', name: '罗马尼亚甲', en: 'Liga I', country: 'ROU', level: 1, tm: 'RO1' },
  { code: 'SRB1', name: '塞尔维亚超', en: 'Serbian SuperLiga', country: 'SRB', level: 1, tm: 'SER1' },
  { code: 'CRO1', name: '克罗地亚甲', en: 'HNL', country: 'HRV', level: 1, tm: 'KR1' },
  { code: 'NOR1', name: '挪超', en: 'Eliteserien', country: 'NOR', level: 1, tm: 'NO1', calendar: true },
  { code: 'SWE1', name: '瑞典超', en: 'Allsvenskan', country: 'SWE', level: 1, tm: 'SE1', calendar: true },
  { code: 'USA1', name: '美职联', en: 'Major League Soccer', country: 'USA', level: 1, of: 'mls', tm: 'MLS1', es: ['mls', '1'], calendar: true, threeFrom: 2000, playoffTitle: true },
  { code: 'MEX1', name: '墨超', en: 'Liga MX', country: 'MEX', level: 1, of: 'mx.1', tm: 'MEX1', playoffTitle: true },
  { code: 'BRA1', name: '巴甲', en: 'Brasileirão Série A', country: 'BRA', level: 1, of: 'br.1', tm: 'BRA1', calendar: true },
  { code: 'BRA2', name: '巴乙', en: 'Brasileirão Série B', country: 'BRA', level: 2, of: 'br.2', calendar: true },
  { code: 'ARG1', name: '阿甲', en: 'Liga Profesional', country: 'ARG', level: 1, of: 'ar.1', tm: 'ARG1', playoffTitle: true },
  { code: 'COL1', name: '哥伦比亚甲', en: 'Primera A', country: 'COL', level: 1, of: 'co.1', calendar: true },
  { code: 'JPN1', name: '日职联', en: 'J1 League', country: 'JPN', level: 1, of: 'jp.1', tm: 'JAP1', calendar: true },
  { code: 'KOR1', name: '韩职联', en: 'K League 1', country: 'KOR', level: 1, tm: 'RSK1', calendar: true },
  { code: 'CHN1', name: '中超', en: 'Chinese Super League', country: 'CHN', level: 1, of: 'cn.1', rsssf: true, calendar: true, threeFrom: 1995, exclude: [2020] },
  { code: 'KSA1', name: '沙特联', en: 'Saudi Pro League', country: 'SAU', level: 1, tm: 'SA1' },
  { code: 'AUS1', name: '澳超', en: 'A-League Men', country: 'AUS', level: 1, of: 'au.1', tm: 'AUS1', playoffTitle: true },
  { code: 'EGY1', name: '埃及超', en: 'Egyptian Premier League', country: 'EGY', level: 1, of: 'eg.1' },
  { code: 'MAR1', name: '摩洛哥甲', en: 'Botola Pro', country: 'MAR', level: 1, of: 'ma.1' },
  { code: 'ALG1', name: '阿尔及利亚甲', en: 'Ligue Professionnelle 1', country: 'DZA', level: 1, of: 'dz.1' }
];

// 数据冻结在 2026 年 7 月：赛季号 ≥ 这个值的一律算「未来」，即使来源里已经有赛程
const FUTURE_FROM = 2026;
const FIRST_SEASON = 1990;

module.exports = { LEAGUES, FUTURE_FROM, FIRST_SEASON };
