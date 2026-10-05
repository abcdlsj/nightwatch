/* 换色图：用现有像素图换几种颜色得到新图（[底图, {原色字母: 新色字母}]）。只用于临时占位，正式图画进 tools/pixelgen.py / Recolored sprites: recolor an existing sprite to get a new one ([base, {original letter: new letter}]). For temporary placeholders only; real art goes into tools/pixelgen.py */
export const ALIAS: Record<string, [string, Record<string, string>]> = {};
