'use strict';
/**
 * 俱乐部名归一化：不同来源对同一家俱乐部写法不同（Arsenal / Arsenal FC / Arsenal Football Club），
 * 用 key() 得到同一个键；归一化后仍对不上的写进 ALIASES（键 → 规范键）
 */
const STOP = new Set([
  'fc', 'afc', 'acf', 'cf', 'ac', 'sc', 'ssc', 'as', 'ss', 'us', 'sv', 'vfb', 'vfl', 'tsg', 'fk', 'sk', 'cd', 'ud', 'rcd', 'sd',
  'ca', 'ec', 'se', 'cr', 'club', 'football', 'futbol', 'de', 'calcio', 'the', 'and', 'cp', 'sl', 'bk', 'if', 'ik', 'aik',
  'kv', 'krc', 'rsc', 'kaa', 'ksc', 'kvc', 'royal', 'rc', 'osc', 'ogc', 'losc', 'aj', 'stade', 'olympique', 'spor', 'kulubu',
  'jk', 'hnk', 'gnk', 'nk', 'pfc', 'fsv', 'bsc', 'tsv', 'spvgg', 'e', 'v', 'sad', 'futebol', 'clube', 'esporte', 'sport',
  'associacao'
]);
// 归一化后仍不同的同一家俱乐部；值是规范键。只收录在本仓库来源之间实际对不上的
const ALIASES = {
  'man utd': 'manchester united', 'man united': 'manchester united', 'man city': 'manchester city',
  'bayern munchen': 'bayern', 'fc bayern munchen': 'bayern', 'bayern munich': 'bayern',
  'internazionale milano': 'inter', 'internazionale': 'inter', 'inter milan': 'inter', 'milan': 'milan',
  'paris saint germain': 'psg', 'paris sg': 'psg', 'paris st germain': 'psg',
  'borussia monchengladbach': 'monchengladbach', 'borussia m gladbach': 'monchengladbach', 'monchengladbach': 'monchengladbach', 'bor monchengladbach': 'monchengladbach',
  'atletico madrid': 'atletico madrid', 'club atletico madrid': 'atletico madrid', 'atletico de madrid': 'atletico madrid',
  'sporting cp': 'sporting', 'sp lisbon': 'sporting', 'sporting lisbon': 'sporting', 'sporting portugal': 'sporting', 'lisboa': 'sporting',
  'benfica': 'benfica', 'sl benfica': 'benfica', 'porto': 'porto', 'fc porto': 'porto',
  'wolves': 'wolverhampton wanderers', 'spurs': 'tottenham hotspur', 'tottenham': 'tottenham hotspur',
  'brighton hove albion': 'brighton', 'brighton and hove albion': 'brighton',
  'leverkusen': 'bayer leverkusen', 'bayer 04 leverkusen': 'bayer leverkusen',
  'koln': 'koln', '1 koln': 'koln', 'cologne': 'koln',
  'hoffenheim': 'hoffenheim', '1899 hoffenheim': 'hoffenheim',
  'mainz': 'mainz', '1 mainz 05': 'mainz', 'mainz 05': 'mainz',
  'rb leipzig': 'leipzig', 'rasenballsport leipzig': 'leipzig',
  'eintracht frankfurt': 'eintracht frankfurt', 'frankfurt': 'eintracht frankfurt',
  'hertha': 'hertha', 'hertha bsc': 'hertha', 'hertha berlin': 'hertha',
  'roma': 'roma', 'as roma': 'roma', 'lazio': 'lazio', 'napoli': 'napoli', 'juventus': 'juventus',
  'ajax': 'ajax', 'ajax amsterdam': 'ajax', 'psv': 'psv', 'psv eindhoven': 'psv', 'feyenoord': 'feyenoord', 'feyenoord rotterdam': 'feyenoord',
  'marseille': 'marseille', 'lyon': 'lyon', 'lyonnais': 'lyon', 'monaco': 'monaco', 'lille': 'lille', 'nice': 'nice',
  'galatasaray': 'galatasaray', 'fenerbahce': 'fenerbahce', 'besiktas': 'besiktas', 'besiktas jk': 'besiktas',
  'celtic': 'celtic', 'rangers': 'rangers', 'celtic glasgow': 'celtic', 'glasgow rangers': 'rangers',
  'olympiacos': 'olympiacos', 'olympiakos': 'olympiacos', 'olympiakos piraeus': 'olympiacos', 'olympiacos piraeus': 'olympiacos',
  'panathinaikos': 'panathinaikos', 'aek': 'aek athens', 'aek athens': 'aek athens', 'paok': 'paok', 'paok thessaloniki': 'paok',
  'club brugge': 'club brugge', 'brugge': 'club brugge', 'anderlecht': 'anderlecht',
  'red star belgrade': 'crvena zvezda', 'crvena zvezda': 'crvena zvezda', 'red star': 'crvena zvezda',
  'dynamo kyiv': 'dynamo kyiv', 'dynamo kiev': 'dynamo kyiv', 'dinamo kiev': 'dynamo kyiv', 'dynamo kyiv ukr': 'dynamo kyiv',
  'shakhtar donetsk': 'shakhtar donetsk', 'shakhtar': 'shakhtar donetsk',
  'barcelona': 'barcelona', 'fc barcelona': 'barcelona', 'real madrid': 'real madrid', 'real madrid cf': 'real madrid',
  'athletic bilbao': 'athletic', 'athletic club': 'athletic', 'athletic': 'athletic',
  'valencia': 'valencia', 'sevilla': 'sevilla', 'villarreal': 'villarreal', 'real sociedad': 'real sociedad', 'real betis': 'betis', 'betis': 'betis',
  'deportivo la coruna': 'deportivo', 'deportivo': 'deportivo', 'espanyol': 'espanyol', 'rcd espanyol': 'espanyol',
  'zenit st petersburg': 'zenit', 'zenit': 'zenit', 'spartak moscow': 'spartak moscow', 'spartak moskva': 'spartak moscow', 'cska moscow': 'cska moscow', 'cska moskva': 'cska moscow',
  'salzburg': 'salzburg', 'red bull salzburg': 'salzburg', 'rb salzburg': 'salzburg',
  'basel': 'basel', 'basel 1893': 'basel', 'young boys': 'young boys', 'bsc young boys': 'young boys',
  'copenhagen': 'copenhagen', 'kobenhavn': 'copenhagen', 'kobenhavn copenhagen': 'copenhagen',
  'dortmund': 'dortmund', 'borussia dortmund': 'dortmund', 'schalke 04': 'schalke', 'schalke': 'schalke',
  'werder bremen': 'werder bremen', 'bremen': 'werder bremen', 'hamburger': 'hamburg', 'hamburg': 'hamburg', 'stuttgart': 'stuttgart',
  'wolfsburg': 'wolfsburg', 'kaiserslautern': 'kaiserslautern', '1 kaiserslautern': 'kaiserslautern',
  'nottingham forest': 'nottingham forest', "nott m forest": 'nottingham forest', 'nottm forest': 'nottingham forest',
  'sheffield weds': 'sheffield wednesday', 'sheffield utd': 'sheffield united', 'qpr': 'queens park rangers',
  'west brom': 'west bromwich albion', 'newcastle': 'newcastle united', 'west ham': 'west ham united',
  'leeds': 'leeds united', 'leicester': 'leicester city', 'norwich': 'norwich city', 'stoke': 'stoke city',
  'swansea': 'swansea city', 'cardiff': 'cardiff city', 'hull': 'hull city', 'bolton': 'bolton wanderers', 'blackburn': 'blackburn rovers',
  'brest armorique': 'brest',
  'espanyol barcelona': 'espanyol',
  'inter miami': 'inter miami', 'la galaxy': 'la galaxy', 'los angeles galaxy': 'la galaxy',
  // 中国：同一家俱乐部不同年代的冠名（RSSSF 按当年队名写），归到同一个键；当年的中文队名见 scripts/pro-career/club-names.js
  'august 1st': 'august 1st', 'army august 1st zhenbang': 'august 1st', 'army august 1st xiangtan': 'august 1st',
  'beijing hyundai': 'beijing guoan', 'beijing hyundai cars': 'beijing guoan',
  'shanghai zhongyuan huili': 'beijing renhe', 'shanghai international': 'beijing renhe', 'xian chanba': 'beijing renhe', 'shaanxi baorong': 'beijing renhe',
  'shaanxi zhongxin': 'beijing renhe', 'shaanxi chanba': 'beijing renhe', 'guizhou renhe': 'beijing renhe', 'beijing renhe': 'beijing renhe',
  'chongqing longxin': 'chongqing lifan', 'chongqing lifan xinganjue': 'chongqing lifan', 'chongqing qiche': 'chongqing lifan', 'chongqing dangdai lifan': 'chongqing lifan', 'chongqing liangjiang athletic': 'chongqing lifan',
  'sichuan quanxing shuijinfang 26': 'sichuan guancheng',
  'dalian wanda': 'dalian shide', 'dalian wanda shide': 'dalian shide', 'dalian haichang': 'dalian shide',
  'dalian aerbin': 'dalian pro', 'dalian yifang': 'dalian pro', 'dalian professional': 'dalian pro',
  'guangzhou apollo': 'guangzhou evergrande', 'guangzhou pharmaceutical': 'guangzhou evergrande', 'guangzhou evergrande taobao': 'guangzhou evergrande', 'guangzhou': 'guangzhou evergrande',
  'shenyang liuyao': 'guangzhou r f', 'shenyang haishi': 'guangzhou r f', 'shenyang ginde': 'guangzhou r f', 'changsha ginde': 'guangzhou r f', 'guangzhou city': 'guangzhou r f',
  'guizhou hengfeng zhicheng': 'guizhou hengfeng',
  'zhejiang lucheng': 'zhejiang', 'hangzhou lucheng': 'zhejiang', 'hangzhou greentown': 'zhejiang', 'zhejiang greentown': 'zhejiang',
  'hebei china fortune': 'hebei',
  'henan construction': 'henan', 'henan jianye': 'henan', 'henan siwu': 'henan', 'henan songshan longmen': 'henan',
  'jiangsu maint': 'jiangsu suning', 'jiangsu sainty': 'jiangsu suning',
  'jilin samsung': 'yanbian fude', 'yanbian hyundai': 'yanbian fude', 'yanbian aodong': 'yanbian fude', 'jilin aodong': 'yanbian fude',
  'jinan taishan': 'shandong taishan', 'jinan taishan jiangjun': 'shandong taishan', 'shangdong taishan': 'shandong taishan', 'shangdong luneng taishan': 'shandong taishan',
  'shandong luneng taishan': 'shandong taishan', 'shandong luneng': 'shandong taishan',
  'liaoning yuandong': 'liaoning', 'liaoning fushun': 'liaoning', 'liaoning fushun tegang': 'liaoning', 'liaoning bird': 'liaoning', 'liaoning zhongshun': 'liaoning',
  'liaoning zhongyu': 'liaoning', 'liaoning hunyong': 'liaoning', 'liaoning whowin': 'liaoning',
  'nanchang hengyuan': 'shanghai shenxin',
  'qingdao yizhong hainiu': 'qingdao hainiu', 'qingdao beer': 'qingdao hainiu', 'qingdao hademen': 'qingdao hainiu', 'qingdao beilaite': 'qingdao hainiu',
  'qingdao zhongneng': 'qingdao hainiu', 'qingdao jonoon': 'qingdao hainiu',
  'shanghai shenhua sva': 'shanghai shenhua', 'shanghai shenhua top': 'shanghai shenhua', 'shanghai greenland shenhua': 'shanghai shenhua',
  'shanghai zobon': 'shanghai united', 'shanghai sipg': 'shanghai port', 'shanghai east asia': 'shanghai port',
  'shenzhen feiyada': 'shenzhen', 'shenzhen pingan': 'shenzhen', 'shenzhen pingan insurance': 'shenzhen', 'shenzhen pingan kejian': 'shenzhen', 'shenzhen kejian pingan': 'shenzhen',
  'shenzhen jianlibao': 'shenzhen', 'shenzhen kingway': 'shenzhen', 'shenzhen shangqingyin': 'shenzhen', 'shenzhen xiangxue': 'shenzhen', 'shenzhen ruby': 'shenzhen',
  'sichuan quanxing': 'sichuan guancheng', 'sichuang quanxing': 'sichuan guancheng', 'sichuan quanxing langjiu': 'sichuan guancheng', 'sichuan quanxing shuijinfang': 'sichuan guancheng',
  'sichuan shangwutong': 'sichuan guancheng', 'sichuan dahe': 'sichuan guancheng',
  'tianjin samsung': 'tianjin teda', 'tianjin lifei': 'tianjin teda', 'tianjin teda dingxin': 'tianjin teda', 'tianjin teda cec': 'tianjin teda', 'tianjin kangshifu': 'tianjin teda', 'tianjin jinmen tiger': 'tianjin teda',
  'tianjin quanjian': 'tianjin tianhai',
  'wuhan hongjinlong': 'wuhan guanggu', 'wuhan hongtao k': 'wuhan guanggu', 'wuhan huanghelou': 'wuhan guanggu',
  'wuhan zall': 'wuhan yangtze river',
  'xiamen xiaxin': 'xiamen lanshi',
  // 俄罗斯：RSSSF、transfermarkt、openfootball 写法不同和不同年代的队名
  'pfk cska moskva': 'cska moscow', 'ao zenit sankt peterburg': 'zenit', 'zenit sankt peterburg': 'zenit', 'lokomotiv moscow': 'lokomotiv moskva',
  'rfk akhmat grozny': 'akhmat grozny', 'terek grozny': 'akhmat grozny', 'terek groznyi': 'akhmat grozny',
  'baltika kaliningrad': 'baltika', 'dinamo gazovik tyumen': 'tyumen', 'energy textilshchik kamyshin': 'textilshchik kamyshin',
  'kamaz chally naberezhnyye chelny': 'kamaz naberezhnyye chelny',
  'pfk krylya sovetov samara': 'krylia sovetov', 'krylya sovetov samara': 'krylia sovetov', 'krylya sovetov': 'krylia sovetov',
  'luch energiya vladivostok': 'luch vladivostok', 'rostselmash rostov na donu': 'rostov',
  'saturn ramenskoye': 'saturn moskovskaya oblast', 'saturn ren tv moskovsk obl': 'saturn moskovskaya oblast',
  'spartak alania vladikavkaz': 'alania vladikavkaz', 'spartak vladikavkaz': 'alania vladikavkaz',
  'torpedo moscow': 'torpedo moskva', 'torpedo luzhniki moskva': 'torpedo moskva', 'torpedo zil moskva': 'moskva', 'torpedo metallurg moskva': 'moskva',
  'ural yekaterinburg': 'ural', 'uralmash yekaterinburg': 'ural'
};
// 来源里用西里尔字母写的队名（归一化后是空串）
const CYRILLIC = [[/Локомотив/, 'lokomotiv moskva'], [/Спартак/, 'spartak moscow'], [/Динамо/, 'dinamo moskva']];

function strip(s) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/ß/g, 'ss').replace(/[ıİ]/g, 'i');
}

/** 规范键 */
function key(name) {
  if (/[\u0400-\u04FF]/.test(String(name))) { const c = CYRILLIC.filter((x) => x[0].test(name))[0]; if (c) return c[1]; }
  let s = strip(name).toLowerCase()
    .replace(/\((?:[a-z]{3})\)/g, ' ') // openfootball 欧冠里的 (ENG)
    .replace(/&/g, ' and ')
    .replace(/[.'’`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (ALIASES[s]) return ALIASES[s];
  const words = s.split(' ').filter((w) => w && !STOP.has(w) && !/^(18|19|20)\d\d$/.test(w));
  s = words.join(' ') || s;
  return ALIASES[s] || s;
}

module.exports = { key, ALIASES };
