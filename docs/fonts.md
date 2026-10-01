# 字体

都是 SIL Open Font License 1.1，可以随游戏分发。前三款来自 [google/fonts](https://github.com/google/fonts)，缝合像素来自 [TakWolf/fusion-pixel-font](https://github.com/TakWolf/fusion-pixel-font)（经 npm 包 @fontsource/fusion-pixel-12px-proportional-sc 获取）。

| 文件 | 字体 | 说明 |
| --- | --- | --- |
| `zcool.woff2` | 站酷庆科黄油体 ZCOOL QingKe HuangYou | 只收了游戏里出现的字（见 `chars.txt`） |
| `pixelify.woff2` | Pixelify Sans（可变字重 400–700） | 只收 ASCII |
| `silkscreen-bold.woff2` | Silkscreen Bold | 卡面数字的后备，只收 ASCII |
| `fusion.woff2` | 缝合像素 12px（Fusion Pixel） | 小字正文；所有数字也用它（另外两款像素字体里 2、3、8 长得太像）。只收游戏里出现的字 |

文案里加了新汉字后，跑 `python3 tools/fontsub.py` 重新生成；`build.sh` 发现缺字会提醒。
