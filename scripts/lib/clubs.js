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
  'borussia monchengladbach': 'monchengladbach', 'borussia m gladbach': 'monchengladbach', 'monchengladbach': 'monchengladbach',
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
  'inter miami': 'inter miami', 'la galaxy': 'la galaxy', 'los angeles galaxy': 'la galaxy'
};

function strip(s) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/ß/g, 'ss').replace(/[ıİ]/g, 'i');
}

/** 规范键 */
function key(name) {
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
