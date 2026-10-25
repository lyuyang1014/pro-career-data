# 来源

下载日期：2026-10-24（`scripts/fetch.js`，下载时间记在 `.cache/fetched_at.txt`）。版本号是下载时各仓库默认分支的最新提交。

| 来源 | 版本 | 许可 | 用在哪 |
| --- | --- | --- | --- |
| [openfootball / football.json](https://github.com/openfootball/football.json) | `e6744429ee39`（2026-09-22） | 公有领域 | 各国联赛逐场比分 → `data/cc0/standings.csv`（2010 年起多数联赛）；欧冠 2011/12 |
| [transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets)（dcaribou） | 仓库 `e44f186d6f06`（2026-09-05）；数据从项目公开的 R2 镜像下载 `games.csv.gz`、`clubs.csv.gz`、`competitions.csv.gz` | CC0 1.0 | 联赛逐场比分（2012/13 起）、欧冠 2012/13–2024/25、俱乐部所属联赛 |
| [engsoccerdata](https://github.com/jalapic/engsoccerdata)（James P. Curley） | `872c5c354161`（2026-02-08） | GPL-2.0-or-later | `data/gpl/`：英格兰前四级、西甲、意甲、德甲、德乙、法甲、荷甲 1990 起，苏超 / 苏冠、葡超、比甲、土超、希超 1994/95 起，美职联 1996–2016 的积分榜（同一季有 CC0 来源时用 CC0）；欧冠 1990/91–2010/11 |
| [martj42 / international_results](https://github.com/martj42/international_results) | `d5bd6de012c8`（2026-10-10） | CC0 1.0 | `data/cc0/national-tournaments.json`：世界杯、欧洲杯、美洲杯、非洲杯、亚洲杯、金杯赛 1990 起每届逐场比分、点球大战 |
| [Wikidata](https://www.wikidata.org/) SPARQL | 2026-10-24 查询（`scripts/lib/wikidata.js`，结果缓存在 `.cache/wikidata/`） | CC0 1.0 | `data/cc0/stars.json`：1970–2010 每个出生年按维基百科语言版本数取前 14 名男子球员，效力记录（P54，去掉国家队、青年队、预备队） |
| [RSSSF](https://www.rsssf.org/) | 2026-10-24 访问 | 注明出处 | `data/rsssf/standings.csv`：中国甲 A / 中超 1994–2024（2020、2021 分组赛制不收）、俄超 1993–2010（1992 分组赛制不收），见下表 |
| [UN World Population Prospects 2024](https://population.un.org/wpp/) | `WPP2024_Demographic_Indicators_Medium.csv.gz` | CC BY 3.0 IGO | `data/cc-by-3.0-igo/births.csv`：各国 1960–2015 逐年出生人数（千人）；英国按估计比例拆成英格兰 0.84、苏格兰 0.08、威尔士 0.045、北爱尔兰 0.035 |

## RSSSF 页面

| 赛季 | 页面 | 作者（页面署名） |
| --- | --- | --- |
| 中国 1994 | https://www.rsssf.org/tablesc/china94.html | Ye Chen |
| 中国 1995 | https://www.rsssf.org/tablesc/china95.html | Ye Chen |
| 中国 1996 | https://www.rsssf.org/tablesc/china96.html | Ye Chen |
| 中国 1997 | https://www.rsssf.org/tablesc/china97.html | Ye Chen |
| 中国 1998 | https://www.rsssf.org/tablesc/china98.html | Ye Chen |
| 中国 1999 | https://www.rsssf.org/tablesc/china99.html | Ye Chen |
| 中国 2000 | https://www.rsssf.org/tablesc/china00.html | Ye Chen |
| 中国 2001 | https://www.rsssf.org/tablesc/china01.html | Tom Lewis |
| 中国 2002 | https://www.rsssf.org/tablesc/china02.html | Tom Lewis |
| 中国 2003 | https://www.rsssf.org/tablesc/china03.html | Tom Lewis |
| 中国 2004 | https://www.rsssf.org/tablesc/china04.html | Tom Lewis |
| 中国 2005 | https://www.rsssf.org/tablesc/china05.html | Tom Lewis |
| 中国 2006 | https://www.rsssf.org/tablesc/china06.html | Tom Lewis |
| 中国 2007 | https://www.rsssf.org/tablesc/china07.html | Tom Lewis |
| 中国 2008 | https://www.rsssf.org/tablesc/china08.html | Tom Lewis |
| 中国 2009 | https://www.rsssf.org/tablesc/china09.html | Tom Lewis |
| 中国 2010 | https://www.rsssf.org/tablesc/china2010.html | Tom Lewis |
| 中国 2011 | https://www.rsssf.org/tablesc/china2011.html | Ian King and Andre Zlotkowski |
| 中国 2012 | https://www.rsssf.org/tablesc/china2012.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2013 | https://www.rsssf.org/tablesc/china2013.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2014 | https://www.rsssf.org/tablesc/china2014.html | Andre Zlotkowski |
| 中国 2015 | https://www.rsssf.org/tablesc/china2015.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2016 | https://www.rsssf.org/tablesc/china2016.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2017 | https://www.rsssf.org/tablesc/china2017.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2018 | https://www.rsssf.org/tablesc/china2018.html | Karel Stokkermans and Andre Zlotkowski |
| 中国 2022 | https://www.rsssf.org/tablesc/china2022.html | Hans Schggl and Karel Stokkermans |
| 中国 2023 | https://www.rsssf.org/tablesc/china2023.html | Hans Schggl and Karel Stokkermans |
| 中国 2024 | https://www.rsssf.org/tablesc/china2024.html | Hans Schggl and Karel Stokkermans |
| 俄罗斯 1993 | https://www.rsssf.org/tablesr/rus93.html | Andrei Balitskiy |
| 俄罗斯 1994 | https://www.rsssf.org/tablesr/rus94.html | Andrei Balitskiy |
| 俄罗斯 1995 | https://www.rsssf.org/tablesr/rus95.html | Andrei Balitskiy |
| 俄罗斯 1996 | https://www.rsssf.org/tablesr/rus96.html | Andrei Balitskiy |
| 俄罗斯 1997 | https://www.rsssf.org/tablesr/rus97.html | Andrei Balitskiy |
| 俄罗斯 1998 | https://www.rsssf.org/tablesr/rus98.html | Andrei Balitskiy and Theodore Dreiman |
| 俄罗斯 1999 | https://www.rsssf.org/tablesr/rus99.html | Theodore Dreiman |
| 俄罗斯 2000 | https://www.rsssf.org/tablesr/rus00.html | Theodore Dreiman |
| 俄罗斯 2001 | https://www.rsssf.org/tablesr/rus01.html | Andrei Balitskiy and Theodore Dreiman |
| 俄罗斯 2002 | https://www.rsssf.org/tablesr/rus02.html | Theodore Dreiman and Sergei Makarov |
| 俄罗斯 2003 | https://www.rsssf.org/tablesr/rus03.html | Theodore Dreiman and Sergei Makarov |
| 俄罗斯 2004 | https://www.rsssf.org/tablesr/rus04.html | Theodore Dreiman and Sergei Makarov |
| 俄罗斯 2005 | https://www.rsssf.org/tablesr/rus05.html | Theodore Dreiman |
| 俄罗斯 2006 | https://www.rsssf.org/tablesr/rus06.html | Theodore Dreiman |
| 俄罗斯 2007 | https://www.rsssf.org/tablesr/rus07.html | Theodore Dreiman |
| 俄罗斯 2008 | https://www.rsssf.org/tablesr/rus08.html | Theodore Dreiman |
| 俄罗斯 2009 | https://www.rsssf.org/tablesr/rus09.html | Theodore Dreiman |
| 俄罗斯 2010 | https://www.rsssf.org/tablesr/rus2010.html | Theodore Dreiman |

## 怎么算的、和官方可能不同的地方

- 积分榜按逐场比分计算：积分 → 净胜球 → 进球排序，没有扣分、没有相互战绩排名；1995 年前多数联赛按胜一场 2 分（每个联赛从哪年改 3 分见 `scripts/lib/leagues.js`）。个别赛季的名次会和官方不同。
- 比甲、美职联、墨超、阿甲、澳超的冠军由季后赛 / 附加赛决定，`playoffTitle: true`，积分第一不等于冠军；中超 2020（分组 + 附加赛）不收。
- 来源里某一季不完整（有队踢的场次不到最多那队的 75%、少于 10 场，或总场次不到单循环的八成；数据冻结前最后一个自然年赛季要踢完双循环的八成）就不收。
- 国家队大赛的轮次是从决赛往前倒推出来的（原始数据没有轮次），1990–2024 各届冠军和公开历史逐届核对过（`scripts/lib/tournaments.js` 的 `KNOWN`），1991 美洲杯决赛阶段是单循环，单独处理。
- 欧冠 2025/26 来源里没有决赛，不收。
- 俱乐部名在不同来源写法不同，按 `scripts/lib/clubs.js` 归一（同一季同一家合并）。
