# 字体

都是 SIL Open Font License 1.1，可以随游戏分发。Pixelify Sans 来自 [google/fonts](https://github.com/google/fonts)，缝合像素来自 [TakWolf/fusion-pixel-font](https://github.com/TakWolf/fusion-pixel-font)（经 npm 包 @fontsource/fusion-pixel-12px-proportional-sc 获取）。

| 文件 | 字体 | 说明 |
| --- | --- | --- |
| `pixelify.woff2` | Pixelify Sans（可变字重 400–700） | 只收 ASCII；只给标题、大字里的拉丁字母用 |
| `fusion.woff2` | 缝合像素 12px（Fusion Pixel） | 全部汉字、数字和正文，标题也用它（Pixelify 里 2、3、8 长得太像）。只收游戏里出现的字 |

文案里加了新汉字后，跑 `python3 tools/fontsub.py` 重新生成；`build.sh` 发现缺字会提醒。

## 字号

游戏只用上面两款字。缝合像素是 12px 的像素字，每个字格要正好占整数个物理像素才清楚，所以样式里不写死字号，只用 `--t-s` `--t-b` `--t-m` `--t-l` `--t-xl` `--t-h1`~`--t-h4` 这几档。`src/ui/type.ts` 启动时按设备像素比把每档取整到 `12 × n / DPR`：DPR 3 的手机上是 12、16、20、24……，DPR 2 上是 12、18、24……。设置里的「大字」调大正文那几档。
