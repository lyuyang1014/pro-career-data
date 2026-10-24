# pro-career-data

[中文](#中文) · [English](#english)

## 中文

京蔚联小程序「职业一生」用到的历史足球数据：各国联赛每季积分榜、国家队大赛逐场比分、欧冠、真实球星的效力履历、各国逐年出生人数，
以及生成它们的脚本。仓库地址：<https://github.com/lyuyang1014/pro-career-data>

这里只有公开历史数据和脚本，**没有任何队员资料、对局记录、名人堂数据，也没有球星照片和队徽图片**（只放它们的来源清单）。

### 目录

```
data/
  cc0/                       CC0：openfootball、transfermarkt-datasets、martj42、Wikidata 衍生
    standings.csv            联赛积分榜（league, season, pos, team, team_key, p, w, d, l, gf, ga, pts, source）
    champions-league.json    欧冠 2011/12 起
    national-tournaments.json  国家队大赛 1990 起
    stars.json               球星池（1958–2010 每个出生年前 60 名）和效力履历
  gpl/                       GPL-2.0-or-later：engsoccerdata 衍生
    standings.csv
    champions-league.json    欧冠 1990/91–2010/11
  rsssf/                     RSSSF：中国甲 A 1994–2003 积分榜（逐行带页面地址和作者）
  cc-by-3.0-igo/births.csv   联合国 WPP 2024 各国逐年出生人数
  manifest.json              版本、各联赛各赛季用的来源
manifests/
  star-photos.json           球星照片来源清单（Wikimedia Commons / TheSportsDB 的作者、许可、来源地址；不含图片）
  crests.json                队徽来源清单（含许可类型 free: true / false；不含图片）
scripts/
  fetch.js                   下载原始数据到 .cache/（需要 curl、unzip）
  build.js                   整理出 data/
  publish.sh                 推到 GitHub（维护者用）
```

许可见 [LICENSE.md](LICENSE.md)，来源和版本见 [SOURCES.md](SOURCES.md)，每次重新生成记在 [CHANGELOG.md](CHANGELOG.md)。

### 重新生成

```bash
node scripts/fetch.js          # 下载（--force 全部重新下载）
node scripts/build.js          # 整理（--refresh-wikidata 重新查 Wikidata）
```

`manifests/` 由小程序主仓库的 `node scripts/pro-career/export-manifests.js` 从本地取图结果导出。

### 覆盖范围

见 `data/manifest.json` 的 `coverage`（每个联赛每个赛季用的是哪个来源）。没有逐季数据的国家和年份，小程序里用模拟并标出来。

## English

Historical football data used by the "Pro Career" (职业一生) game in the NIO United FC WeChat mini program: season-by-season league
tables, national-team tournament results, UEFA Champions League runs, career histories of notable players, and annual births by
country — plus the scripts that build them.

This repository contains **only public historical data and scripts** — no club-member data, no game records, and no player photos or
club crests (only manifests listing their sources and licences).

### Layout and licences

Files are split into directories **by licence**; each file belongs to exactly one licence:

| Directory | Licence | Sources |
| --- | --- | --- |
| `data/cc0/` | CC0 1.0 | openfootball/football.json (public domain), transfermarkt-datasets (CC0), martj42/international_results (CC0), Wikidata (CC0) |
| `data/gpl/` | GPL-2.0-or-later | derived from engsoccerdata by James P. Curley |
| `data/rsssf/` | attribution required | RSSSF Chinese Jia-A tables 1994–2003, each row credits the page and author |
| `data/cc-by-3.0-igo/` | CC BY 3.0 IGO | UN World Population Prospects 2024 |
| `manifests/`, `scripts/` | CC0 1.0 | our own work |

League tables are computed from match results (points → goal difference → goals scored); point deductions and head-to-head
tie-breakers are not applied, so a few positions may differ from official tables. Details and source versions are in
[SOURCES.md](SOURCES.md); licence notes in [LICENSE.md](LICENSE.md); full GPL text in [COPYING](COPYING).

### Rebuild

```bash
node scripts/fetch.js
node scripts/build.js
```

We do not use FBref / Sports Reference, worldfootball.net or football-data.co.uk, whose terms do not allow this use.
