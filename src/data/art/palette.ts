import { EXTRA_PAL } from "./generated";

/** 调色板：像素图里每个字母对应一种颜色，"." 是透明 / Palette: each letter in pixel art maps to a color; '.' is transparent */
export const PAL: Record<string, string> = { ...{
 "f": "#f0c49c",
 "F": "#c98f6a",
 "k": "#1a1c2c",
 "w": "#f4f4f4",
 "g": "#94b0c2",
 "s": "#566c86",
 "d": "#333c57",
 "r": "#b13e53",
 "R": "#e43b44",
 "e": "#6e1b2a",
 "o": "#ef7d57",
 "y": "#ffcd75",
 "Y": "#fee761",
 "l": "#a7f070",
 "G": "#38b764",
 "t": "#257179",
 "b": "#3b5dc9",
 "c": "#41a6f6",
 "C": "#73eff7",
 "p": "#5d275d",
 "P": "#a64ca6",
 "n": "#7a4a2a",
 "N": "#c28a4d",
 "m": "#4a3326"
}, ...EXTRA_PAL };

/** 遗物图标模板换色时的阴影色：X 主色，Z 取这里的对应暗色 / shadow colors when recoloring relic icon templates: X is the primary color, Z takes the matching dark shade here */
export const SHADE: Record<string, string> = {
 "R": "r",
 "o": "n",
 "y": "N",
 "Y": "y",
 "l": "G",
 "G": "t",
 "c": "b",
 "C": "c",
 "b": "d",
 "P": "p",
 "g": "s",
 "w": "g",
 "s": "d",
 "N": "n"
};
