# 许可

这个仓库里的数据来自几个许可不同的公开来源，**按许可分目录存放**，一个文件只属于一种许可：

| 目录 | 许可 | 来源 |
| --- | --- | --- |
| `data/cc0/` | CC0 1.0（公有领域贡献） | openfootball / football.json（公有领域）、transfermarkt-datasets（CC0 1.0）、martj42 international_results（CC0 1.0）、Wikidata（CC0 1.0） |
| `data/gpl/` | **GPL-2.0-or-later** | 由 engsoccerdata（James P. Curley，GPL-2 或更高版本）衍生 |
| `data/rsssf/` | 注明出处（RSSSF 的使用条件） | RSSSF 中国甲 A / 中超 1994–2024、俄超 1993–2010 各季积分榜，逐页署名 |
| `data/cc-by-3.0-igo/` | CC BY 3.0 IGO | 联合国《世界人口展望 2024》 |
| `scripts/` | CC0 1.0 | 生成上面这些数据的脚本（自己写的，没有引入 engsoccerdata 的代码） |

## GPL 部分

`data/gpl/` 下的文件是对 engsoccerdata 逐场赛果的衍生（按逐场比分算出的每季积分榜、欧冠每季各队走到哪一轮），
按 **GNU General Public License 第 2 版或（由你选择）任何更高版本** 发布，许可全文见 [`COPYING`](COPYING)。
每个文件头部（CSV 的 `#` 注释行、JSON 的 `_license` / `_source` 字段）写明了许可和来源。

engsoccerdata：<https://github.com/jalapic/engsoccerdata>，作者 James P. Curley。

## RSSSF

RSSSF（The Rec.Sport.Soccer Statistics Foundation）首页写明可以整体或部分复制，但须注明 RSSSF 和作者。
这里只整理了积分榜数字（名次、场次、胜平负、进失球、积分），没有搬运页面文字；每一行都带原页面地址和作者（`url` / `author` 列）。

## 不收录的来源

football-data.co.uk（条款限个人使用）、FBref / Sports Reference（条款禁止建立竞争性数据库）、worldfootball.net（没有开放许可）一概不用。

本说明不是法律意见。
