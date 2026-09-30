# 字体

都来自 [google/fonts](https://github.com/google/fonts)，SIL Open Font License 1.1，可以随游戏分发。

| 文件 | 字体 | 说明 |
| --- | --- | --- |
| `zcool.woff2` | 站酷庆科黄油体 ZCOOL QingKe HuangYou | 只收了游戏里出现的字（见 `chars.txt`） |
| `pixelify.woff2` | Pixelify Sans（可变字重 400–700） | 只收 ASCII |
| `silkscreen-bold.woff2` | Silkscreen Bold | 卡面数字，只收 ASCII |

文案里加了新汉字后，跑 `python3 tools/fontsub.py` 重新生成；`build.sh` 发现缺字会提醒。
