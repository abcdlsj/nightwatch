"""像素美术生成器：用几何图元 + 自动描边 + 自动明暗绘制 16×16 卡牌图标与 32×32 人物立绘，
输出 src/02e-art.js（覆盖 02-data.js 里的旧 12×12 图）。

用法：python3 tools/pixelgen.py            生成 JS
      python3 tools/pixelgen.py --preview  额外输出 shots/art_preview.png 预览图
调色板字母与 02-data.js 的 PAL 一致；新增字母在 EXTRA_PAL 里声明，会一并写进 JS。
"""
import math, os, sys, json

EXTRA_PAL = {
    'a': '#2b2440',  # 深发色
    'A': '#4a3d6b',  # 深发高光
    'i': '#ffe3c8',  # 皮肤高光
    'u': '#7a2230',  # 暗红
    'v': '#ffd9a0',  # 暖光
    'x': '#3d2a1e',  # 深木
}
PAL = {'f': '#f0c49c', 'F': '#c98f6a', 'k': '#1a1c2c', 'w': '#f4f4f4', 'g': '#94b0c2', 's': '#566c86', 'd': '#333c57',
       'r': '#b13e53', 'R': '#e43b44', 'e': '#6e1b2a', 'o': '#ef7d57', 'y': '#ffcd75', 'Y': '#fee761', 'l': '#a7f070',
       'G': '#38b764', 't': '#257179', 'b': '#3b5dc9', 'c': '#41a6f6', 'C': '#73eff7', 'p': '#5d275d', 'P': '#a64ca6',
       'n': '#7a4a2a', 'N': '#c28a4d', 'm': '#4a3326', **EXTRA_PAL}

# 自动明暗：左上受光 → 高光色；右下背光 → 阴影色
HL = {'g': 'w', 's': 'g', 'd': 's', 'n': 'N', 'N': 'y', 'm': 'n', 'o': 'y', 'R': 'o', 'r': 'R', 'c': 'C', 'C': 'w',
      'b': 'c', 'P': 'w', 'p': 'P', 'y': 'Y', 'Y': 'w', 'G': 'l', 'l': 'w', 't': 'G', 'f': 'i', 'a': 'A', 'x': 'm', 'e': 'r', 'u': 'r'}
HLP = {**HL, 'P': 'P', 'p': 'P', 'w': 'w', 'f': 'f', 'n': 'N', 'N': 'N'}
SH = {'g': 's', 's': 'd', 'w': 'g', 'n': 'm', 'N': 'n', 'o': 'R', 'R': 'r', 'r': 'e', 'c': 'b', 'C': 'c', 'b': 'd',
      'P': 'p', 'y': 'N', 'Y': 'y', 'G': 't', 'l': 'G', 'f': 'F', 'A': 'a', 'm': 'x', 'u': 'e', 'i': 'f', 'v': 'y'}


class Cv:
    def __init__(s, w=16, h=16):
        s.w, s.h = w, h
        s.g = [['.'] * w for _ in range(h)]
        s.lock = set()  # 不参与自动明暗的像素（眼睛、高光点等）

    def px(s, x, y, c, lock=False):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < s.w and 0 <= y < s.h:
            s.g[y][x] = c
            if lock: s.lock.add((x, y))
            else: s.lock.discard((x, y))

    def get(s, x, y):
        return s.g[y][x] if 0 <= x < s.w and 0 <= y < s.h else '.'

    def rect(s, x0, y0, x1, y1, c, lock=False):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): s.px(x, y, c, lock)

    def ell(s, cx, cy, rx, ry, c, lock=False):
        for y in range(s.h):
            for x in range(s.w):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0: s.px(x, y, c, lock)

    def line(s, x0, y0, x1, y1, c, t=1, lock=False):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for i in range(n + 1):
            k = i / n
            x, y = x0 + (x1 - x0) * k, y0 + (y1 - y0) * k
            if t == 1: s.px(x, y, c, lock)
            else:
                r = (t - 1) / 2
                for dy in range(-int(math.ceil(r)), int(math.ceil(r)) + 1):
                    for dx in range(-int(math.ceil(r)), int(math.ceil(r)) + 1):
                        if dx * dx + dy * dy <= r * r + .6: s.px(x + dx, y + dy, c, lock)

    def poly(s, pts, c, lock=False):
        for y in range(s.h):
            for x in range(s.w):
                px, py = x + .5, y + .5
                inside = False
                j = len(pts) - 1
                for i in range(len(pts)):
                    xi, yi = pts[i]; xj, yj = pts[j]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi: inside = not inside
                    j = i
                if inside: s.px(x, y, c, lock)

    def shade(s, hl=None):
        hl = hl or HL
        src = [r[:] for r in s.g]
        for y in range(s.h):
            for x in range(s.w):
                c = src[y][x]
                if c == '.' or c == 'k' or (x, y) in s.lock: continue
                e = lambda xx, yy: not (0 <= xx < s.w and 0 <= yy < s.h) or src[yy][xx] == '.'
                if (e(x - 1, y) or e(x, y - 1)) and c in hl: s.g[y][x] = hl[c]
                elif (e(x + 1, y) or e(x, y + 1)) and c in SH: s.g[y][x] = SH[c]

    def outline(s):
        src = [r[:] for r in s.g]
        for y in range(s.h):
            for x in range(s.w):
                if src[y][x] != '.': continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < s.w and 0 <= yy < s.h and src[yy][xx] not in '.k':
                        s.g[y][x] = 'k'; break

    def done(s, shade=True, hl=None):
        if shade: s.shade(hl)
        s.outline()
        return [''.join(r) for r in s.g]


# ---------------------------------------------------------------- 卡牌图标 16×16
def card_art():
    A = {}

    c = Cv(); c.poly([(4.5, 9.5), (13, 1), (15, 0), (14, 3), (6.5, 11.5)], 'g'); c.line(6, 9, 13, 2, 'w', 1, True)
    c.line(2.5, 8, 7.5, 13, 'y', 2); c.line(4, 12, 1, 15, 'n', 2); c.px(1, 15, 'y'); A['dagger'] = c.done()

    c = Cv(); c.poly([(8, 0), (11, 4), (13, 8), (13, 12), (10, 15), (6, 15), (3, 12), (3, 8), (5, 5), (7, 6)], 'R')
    c.poly([(8, 5), (10, 9), (11, 12), (9, 15), (7, 15), (5, 12), (6, 9)], 'o'); c.ell(8, 12.5, 1.6, 2.2, 'Y', True)
    c.px(12, 3, 'o'); c.px(3, 5, 'o'); A['spark'] = c.done()

    c = Cv(); c.rect(1, 1, 14, 3, 'C'); c.poly([(5, 3), (11, 3), (8.5, 15)], 'c'); c.poly([(1, 3), (5, 3), (3, 10)], 'c')
    c.poly([(11, 3), (15, 3), (13, 8)], 'c'); c.line(7, 4, 8, 11, 'w', 1, True); A['icicle'] = c.done()

    c = Cv(); c.poly([(10, 0), (3, 8.5), (7.5, 8.5), (4, 16), (13, 6), (8.5, 6), (12, 0)], 'Y')
    c.line(9, 2, 5, 8, 'w', 1, True); A['bolt'] = c.done()

    c = Cv(); c.line(4, 12, 1, 1, 'N', 1); c.line(12, 12, 15, 1, 'N', 1); c.poly([(3, 10), (13, 10), (11, 15), (5, 15)], 'n')
    c.ell(8, 9, 3.4, 3.4, 'g'); c.px(7, 7, 'w', True); c.ell(1, 1, 1.2, 1.2, 'n'); c.ell(15, 1, 1.2, 1.2, 'n'); A['sling'] = c.done()

    c = Cv(); c.ell(8, 8.5, 5.2, 5.2, 's')
    for k in range(8):
        a = k * math.pi / 4; c.rect(int(8 + math.cos(a) * 6.3) - 1, int(8.5 + math.sin(a) * 6.3) - 1, int(8 + math.cos(a) * 6.3), int(8.5 + math.sin(a) * 6.3), 's')
    c.ell(8, 8.5, 2.8, 2.8, 'y'); c.ell(8, 8.5, 1.1, 1.1, '.'); A['clock'] = c.done()

    c = Cv(); c.line(2, 8, 13, 8, 'g', 1); c.poly([(0, 9), (3, 5), (8, 3), (13, 5), (16, 9), (13, 7), (8, 5), (3, 7)], 'N')
    c.rect(7, 4, 8, 15, 'n'); c.rect(5, 10, 10, 12, 'x'); c.rect(7, 0, 8, 7, 'g'); c.px(7, 0, 'w', True); c.px(8, 0, 'w', True)
    A['xbow'] = c.done()

    c = Cv(); c.line(3, 14, 10, 5, 'n', 2); c.poly([(7, 2), (12, 0), (16, 4), (15, 9), (11, 8), (9, 5)], 'g')
    c.line(13, 1, 15, 7, 'w', 1, True); A['axe'] = c.done()

    c = Cv(); c.line(3, 11, 12, 4, 's', 4); c.ell(12.5, 3.5, 2.3, 2.3, 'd'); c.ell(12.8, 3.2, .9, .9, 'k', True)
    c.ell(5.5, 12, 3.2, 3.2, 'n'); c.ell(5.5, 12, 1.1, 1.1, 'y'); c.rect(8, 13, 14, 14, 'x'); A['cannon'] = c.done()

    c = Cv(); c.poly([(8, 0), (14, 6), (8, 16), (2, 6)], 'c'); c.poly([(8, 0), (8, 16), (2, 6)], 'C')
    c.line(2, 6, 14, 6, 'b', 1, True); c.line(5, 4, 7, 2, 'w', 1, True); c.poly([(13, 10), (16, 12), (14, 16), (12, 13)], 'C')
    A['frost'] = c.done()

    c = Cv(); c.rect(4, 13, 11, 15, 'd'); c.rect(7, 6, 8, 12, 's')
    for y in (7, 9, 11): c.rect(5, y, 10, y, 'o')
    c.ell(7.5, 3, 3, 2.6, 'c'); c.px(6, 2, 'w', True); c.px(1, 2, 'Y', True); c.px(2, 1, 'Y', True); c.px(13, 3, 'Y', True); c.px(14, 2, 'Y', True)
    A['tesla'] = c.done()

    c = Cv(); c.poly([(2, 4), (15, 4), (15, 6.5), (11.5, 7.5), (10.5, 10.5), (13, 12.5), (13, 15), (3, 15), (3, 12.5), (5.5, 10.5), (4.5, 7.5), (2, 6.5)], 's')
    c.poly([(0, 4), (2, 4), (2, 6.5)], 's'); c.rect(3, 4, 14, 4, 'g'); c.px(8, 12, 'd', True); A['anvil'] = c.done()

    c = Cv(); c.rect(0, 11, 15, 15, 's'); c.ell(8, 7, 6, 6.5, 'g'); c.rect(5, 6, 6, 7, 'Y', True); c.rect(10, 6, 11, 7, 'Y', True)
    c.line(6, 11, 10, 11, 'd', 1, True); c.line(4, 2, 6, 5, 'd', 1, True); c.px(11, 3, 'G', True); c.px(12, 4, 'G', True); c.px(2, 13, 'G', True)
    A['colossus'] = c.done()

    c = Cv(); c.poly([(1, 5), (6, 1), (12, 2), (15, 5), (15, 8), (10, 9), (9, 12), (4, 12), (1, 9)], 'r')
    c.line(5, 2, 2, 0, 'y', 1); c.line(8, 1, 7, 0, 'y', 1); c.px(11, 4, 'Y', True); c.px(14, 6, 'k', True)
    c.poly([(11, 9), (15, 9), (16, 14), (12, 16), (10, 12)], 'o'); c.ell(13, 12, 1.2, 1.6, 'Y', True); A['dragon'] = c.done()

    c = Cv(); c.poly([(6, 1.5), (10, 1.5), (11, 3.5), (12, 9), (14.5, 12), (1.5, 12), (4, 9), (5, 3.5)], 'y')
    c.rect(1, 12, 14, 13, 'N'); c.ell(8, 14.5, 1.3, 1.3, 'n'); c.rect(7, 0, 8, 1, 'N'); c.line(6, 4, 5, 9, 'w', 1, True)
    A['bell'] = c.done()

    c = Cv()
    for k in range(6):
        a = k * math.pi / 3 - math.pi / 2; ex, ey = 8 + math.cos(a) * 7, 8 + math.sin(a) * 7
        c.line(8, 8, ex, ey, 'C', 1)
        for d in (3.5, 5.5):
            bx, by = 8 + math.cos(a) * d, 8 + math.sin(a) * d
            for s2 in (-1, 1): c.line(bx, by, bx + math.cos(a + s2 * .9) * 1.8, by + math.sin(a + s2 * .9) * 1.8, 'C', 1)
    c.ell(8, 8, 1.6, 1.6, 'w', True); A['blizzard'] = c.done(shade=False)

    c = Cv(); c.ell(5, 5, 4, 3, 'g'); c.ell(10.5, 4, 4.5, 3.5, 'g'); c.ell(8, 7, 7, 2.6, 's')
    c.poly([(9, 8), (5.5, 12.5), (8, 12.5), (6, 16), (12, 10.5), (9.5, 10.5), (11.5, 8)], 'Y'); A['thunder'] = c.done()

    c = Cv(); c.poly([(7, 0.5), (9, 0.5), (9, 10), (7, 10)], 'g'); c.rect(3, 10, 12, 11, 'y'); c.rect(7, 12, 8, 14, 'n'); c.rect(6, 15, 9, 15, 'y')
    for y in (3, 5, 7): c.px(8 if y != 5 else 7, y, 'c', True)
    c.line(7, 1, 7, 9, 'w', 1, True); A['oathsword'] = c.done()

    c = Cv()
    for i in range(14):
        k = i / 13; x = 2 + k * 11; y = 13 - math.sin(k * 1.6) * 10; c.ell(x, y, .8 + k * 2.4, .8 + k * 2.4, 'y')
    c.ell(13, 4, 2.8, 2.8, 'N'); c.ell(13.3, 3.8, 1.2, 1.2, 'x', True)
    for k in (.35, .65): c.px(2 + k * 11, 13 - math.sin(k * 1.6) * 10, 'n', True)
    A['warhorn'] = c.done()

    c = Cv(); c.poly([(0, 7), (4, 3), (8, 2), (12, 3), (16, 7), (12, 5), (8, 4), (4, 5)], 'n'); c.line(1, 7, 14, 7, 'w', 1)
    c.line(8, 0, 8, 11, 'g', 2); c.px(8, 0, 'w', True); c.line(8, 11, 3, 15, 'x', 2); c.line(8, 11, 13, 15, 'x', 2); c.rect(6, 9, 10, 10, 'N')
    A['ballista'] = c.done()

    c = Cv(); c.rect(6, 0, 9, 1, 'N'); c.rect(7, 2, 8, 5, 'C'); c.ell(7.5, 10.5, 5.2, 5, 'C'); c.ell(7.5, 12, 4.6, 3.2, 'R')
    c.px(6, 11, 'y', True); c.px(9, 13, 'o', True); c.px(5, 7, 'w', True); c.px(4, 8, 'w', True); A['vial'] = c.done()

    c = Cv(); c.poly([(8, 1), (15, 14), (1, 14)], 'C'); c.poly([(8, 5), (12, 12), (4, 12)], 'c')
    c.line(0, 9, 5, 9, 'w', 1, True); c.line(11, 8, 15, 6, 'R', 1, True); c.line(11, 9, 15, 9, 'Y', 1, True); c.line(11, 10, 15, 12, 'l', 1, True)
    A['prism'] = c.done(shade=False)

    c = Cv(); c.poly([(0, 0), (4, 1), (12, 7), (7, 12), (1, 4)], 'R'); c.poly([(3, 2), (6, 3), (12, 8), (8, 12), (3, 6)], 'o')
    c.poly([(6, 5), (12, 9), (9, 12), (5, 7)], 'y'); c.ell(10.5, 10.5, 4.3, 4.3, 'o'); c.ell(10.5, 10.5, 2.8, 2.8, 'Y')
    c.ell(10.2, 10.2, 1.3, 1.3, 'w', True); c.px(15, 5, 'y', True); c.px(5, 15, 'y', True); A['starfall'] = c.done()

    # 萤（第三名人物）专属
    c = Cv(); c.line(5, 3, 8, 0, 'd', 1); c.line(11, 3, 8, 0, 'd', 1); c.rect(4, 3, 12, 4, 'd'); c.rect(4, 13, 12, 14, 'd')
    c.rect(5, 5, 11, 12, 'Y'); c.ell(8, 8.5, 2, 2.5, 'w', True); c.rect(4, 5, 4, 12, 'd'); c.rect(12, 5, 12, 12, 'd')
    c.px(1, 7, 'l', True); c.px(14, 5, 'l', True); c.px(15, 11, 'l', True); c.px(1, 13, 'l', True); A['firefly'] = c.done()

    c = Cv(); c.poly([(1, 9), (13, 9), (11, 4), (3, 4)], 'P'); c.rect(1, 9, 13, 15, 'n'); c.rect(1, 9, 13, 9, 'y'); c.rect(1, 12, 13, 12, 'y')
    c.line(13, 12, 15, 12, 'g', 1); c.rect(15, 10, 15, 14, 'g'); c.rect(6, 6, 8, 8, 'y'); c.ell(7, 5, 1, 1.2, 'y')
    c.line(3, 3, 3, 0, 'w', 1, True); c.px(2, 3, 'w', True); c.line(10, 2, 10, 0, 'w', 1, True); c.px(9, 2, 'w', True); A['musicbox'] = c.done()

    c = Cv(); c.rect(3, 0, 12, 1, 'n'); c.line(8, 1, 8, 10, 'y', 1); c.ell(8, 12, 3.6, 3.1, 'y'); c.ell(7.3, 11.3, 1, 1, 'w', True)
    for x, y in ((2, 8), (1, 11), (14, 8), (15, 11)): c.px(x, y, 'g', True)
    A['pendulum'] = c.done()
    return A


# ---------------------------------------------------------------- 人物立绘 32×32
def portraits():
    P = {}

    # 艾拉：老兵，橙色短发、眉骨伤疤、钢铁护肩与红色围巾
    c = Cv(32, 32)
    c.ell(16, 12, 10, 10, 'o')                                   # 后发
    c.poly([(2, 32), (4, 25), (10, 21), (22, 21), (28, 25), (30, 32)], 's')
    c.ell(5.5, 25, 4.5, 3.2, 'g'); c.ell(26.5, 25, 4.5, 3.2, 'g')
    c.rect(13, 18, 18, 22, 'F')
    c.poly([(9, 21), (23, 21), (21, 26), (11, 26)], 'R'); c.poly([(20, 24), (24, 24), (23, 31), (20, 30)], 'R')
    c.ell(16, 13, 7, 8.2, 'f')
    for y in range(6, 22):
        for x in range(19, 25):
            if c.get(x, y) == 'f' and (x - 16) > 3: c.px(x, y, 'F')
    c.poly([(8, 11), (8.5, 5), (13, 2.5), (19, 2.5), (24, 5), (24.5, 12), (22, 7), (18, 6.5), (14, 8), (10, 7.5)], 'o')
    c.poly([(23, 7), (26, 9), (26, 17), (24, 15)], 'o')
    for x in (11, 12, 13): c.px(x, 10, 'n', True)
    for x in (18, 19, 20): c.px(x, 10, 'n', True)
    c.rect(11, 12, 13, 13, 'k', True); c.px(12, 12, 'w', True); c.rect(18, 12, 20, 13, 'k', True); c.px(19, 12, 'w', True)
    c.line(21, 8, 22, 15, 'r', 1, True)
    c.px(16, 15, 'F', True); c.px(16, 16, 'F', True); c.line(14, 18, 18, 18, 'r', 1, True)
    c.px(9, 14, 'y', True)
    P['p_ayla'] = c.done(hl=HLP)

    # 墨：流亡炼金师，紫色兜帽、额上护目镜、青色眼睛、胸前药瓶吊坠
    c = Cv(32, 32)
    c.ell(16, 15, 12, 13, 'p')
    c.poly([(1, 32), (4, 24), (11, 21), (21, 21), (28, 24), (31, 32)], 'P')
    c.rect(13, 19, 18, 22, 'F')
    c.ell(16, 14.5, 6.6, 7.8, 'f')
    for y in range(8, 23):
        for x in range(18, 24):
            if c.get(x, y) == 'f' and (x - 16) > 3: c.px(x, y, 'F')
    c.poly([(9, 12), (10, 6), (16, 4.5), (22, 6), (23, 12), (20, 9), (16, 10), (12, 9)], 'a')
    c.poly([(4, 16), (7, 5), (16, 1), (25, 5), (28, 16), (24, 8), (16, 4), (8, 8)], 'P')
    c.ell(12.5, 8.5, 2.3, 2, 'y'); c.ell(19.5, 8.5, 2.3, 2, 'y'); c.ell(12.5, 8.5, 1.2, 1, 'c', True); c.ell(19.5, 8.5, 1.2, 1, 'c', True)
    c.line(14.5, 8.5, 17.5, 8.5, 'y', 1)
    c.rect(11, 13, 13, 14, 'k', True); c.px(12, 13, 'C', True); c.rect(18, 13, 20, 14, 'k', True); c.px(19, 13, 'C', True)
    c.px(16, 16, 'F', True); c.line(15, 18, 17, 18, 'r', 1, True)
    c.line(16, 22, 16, 25, 'y', 1, True); c.rect(15, 25, 17, 28, 'l', True); c.px(15, 25, 'w', True)
    P['p_mo'] = c.done(hl=HLP)

    # 萤：灯匠学徒，黑色波波头、齿轮发簪、雀斑、黄围巾，手提一盏小灯
    c = Cv(32, 32)
    c.ell(16, 12, 10, 10.5, 'a')
    c.poly([(3, 32), (5, 25), (11, 21), (21, 21), (27, 25), (29, 32)], 'n')
    c.poly([(11, 21), (21, 21), (19, 30), (13, 30)], 'w')
    c.rect(13, 18, 18, 22, 'F'); c.poly([(9, 20), (23, 20), (22, 24), (10, 24)], 'Y')
    c.ell(16, 13.5, 6.8, 7.8, 'f')
    for y in range(6, 22):
        for x in range(19, 24):
            if c.get(x, y) == 'f' and (x - 16) > 3: c.px(x, y, 'F')
    c.rect(8, 4, 24, 9, 'a'); c.poly([(6, 18), (7, 6), (10, 9)], 'a'); c.poly([(26, 18), (25, 6), (22, 9)], 'a')
    c.ell(24.5, 5, 2.4, 2.4, 'y'); c.ell(24.5, 5, .9, .9, 'k', True)
    c.rect(11, 12, 13, 13, 'k', True); c.px(12, 12, 'v', True); c.rect(18, 12, 20, 13, 'k', True); c.px(19, 12, 'v', True)
    for x, y in ((11, 15), (20, 15)): c.px(x, y, 'o', True)
    c.line(15, 18, 17, 18, 'r', 1, True)
    c.rect(3, 25, 8, 30, 'd'); c.rect(4, 26, 7, 29, 'Y', True); c.px(5, 27, 'w', True); c.line(4, 24, 5.5, 22, 'd', 1); c.line(7, 24, 5.5, 22, 'd', 1)
    P['p_ying'] = c.done(hl=HLP)
    return P


# ---------------------------------------------------------------- 敌人 16×16（大型 20/24，首领 32）
def mirror(c, cx=None):
    """把左半边镜像到右半边（对称生物用）。"""
    cx = cx if cx is not None else c.w // 2
    for y in range(c.h):
        for x in range(cx):
            v = c.g[y][x]; xx = c.w - 1 - x
            if v != '.': c.g[y][xx] = v
            if (x, y) in c.lock: c.lock.add((xx, y))


def enemies():
    E = {}

    c = Cv(); c.ell(8, 10, 6.5, 5.2, 'l'); c.rect(2, 11, 13, 14, 'l'); c.ell(8, 7, 4, 2.5, 'l')
    c.rect(5, 8, 6, 10, 'k', True); c.rect(10, 8, 11, 10, 'k', True); c.px(5, 8, 'w', True); c.px(10, 8, 'w', True)
    c.line(7, 12, 9, 12, 'G', 1, True); c.px(4, 6, 'w', True); c.px(5, 5, 'w', True); c.px(3, 15, 'G'); c.px(12, 15, 'G')
    E['slime'] = c.done()

    c = Cv(); c.poly([(6, 7), (0, 2), (0, 7), (1, 12), (4, 10), (6, 11)], 'p'); c.line(1, 3, 1, 11, 'P', 1); c.line(3, 5, 3, 10, 'P', 1)
    mirror(c); c.ell(8, 8.5, 3, 3.8, 'P'); c.poly([(5, 5), (6, 2), (7, 5)], 'P'); c.poly([(9, 5), (10, 2), (11, 5)], 'P')
    c.px(7, 8, 'Y', True); c.px(9, 8, 'Y', True); c.px(7, 11, 'w', True); c.px(9, 11, 'w', True); E['bat'] = c.done()

    c = Cv(); c.ell(8, 4.5, 3.8, 3.4, 'w'); c.rect(6, 7, 10, 8, 'w'); c.poly([(4, 3), (8, 0), (12, 3), (12, 4), (4, 4)], 'n')
    c.rect(6, 5, 7, 6, 'k', True); c.rect(9, 5, 10, 6, 'k', True); c.px(7, 8, 'k', True); c.px(9, 8, 'k', True)
    c.rect(5, 9, 11, 12, 'g'); c.line(6, 10, 10, 10, 'd', 1, True); c.line(6, 12, 10, 12, 'd', 1, True); c.line(8, 9, 8, 13, 'w', 1)
    c.line(4, 9, 2, 13, 'w', 1); c.line(12, 9, 14, 12, 'w', 1); c.line(14, 12, 15, 5, 'g', 1); c.px(15, 4, 'w', True)
    c.line(6, 13, 5, 15, 'w', 1); c.line(10, 13, 11, 15, 'w', 1); E['skel'] = c.done()

    c = Cv()
    for x0, y0, x1, y1 in ((4, 5, 1, 3), (4, 8, 1, 9), (4, 11, 1, 14)): c.line(x0, y0, x1, y1, 'k', 1, True)
    mirror(c); c.ell(8, 4.5, 3.4, 3, 'G'); c.ell(8, 8.5, 4.3, 2.6, 'G'); c.ell(8, 12.5, 3.6, 2.4, 'G')
    c.line(8, 6, 8, 14, 'l', 1); c.px(6, 4, 'R', True); c.px(10, 4, 'R', True); c.line(6, 1, 5, 0, 'G', 1); c.line(10, 1, 11, 0, 'G', 1)
    E['bug'] = c.done()

    c = Cv(12, 12); c.ell(6, 4.5, 3, 2.6, 'l'); c.ell(6, 8.5, 3.4, 2.4, 'G'); c.px(5, 4, 'R', True); c.px(7, 4, 'R', True)
    c.line(2, 7, 0, 6, 'k', 1, True); c.line(10, 7, 11, 6, 'k', 1, True); c.line(3, 10, 1, 11, 'k', 1, True); c.line(9, 10, 10, 11, 'k', 1, True)
    E['mini'] = c.done()

    c = Cv(20, 20); c.poly([(3, 7), (7, 5), (13, 5), (17, 7), (18, 14), (15, 18), (5, 18), (2, 14)], 'g'); c.ell(10, 5, 4.5, 3.8, 'g')
    c.ell(2.5, 12, 2.5, 3.2, 's'); c.ell(17.5, 12, 2.5, 3.2, 's'); c.rect(5, 17, 8, 19, 's'); c.rect(12, 17, 15, 19, 's')
    c.rect(7, 4, 8, 5, 'Y', True); c.rect(12, 4, 13, 5, 'Y', True); c.line(8, 8, 12, 8, 'd', 1, True)
    c.line(6, 10, 9, 14, 'd', 1, True); c.line(13, 11, 15, 15, 'd', 1, True); c.px(10, 12, 'Y', True)
    for x, y in ((4, 7), (5, 7), (14, 6), (11, 2), (16, 16)): c.px(x, y, 'G', True)
    E['golem'] = c.done()

    c = Cv(24, 24); c.poly([(5, 10), (19, 10), (22, 23), (2, 23)], 'p')
    c.poly([(7, 9), (17, 9), (18, 20), (6, 20)], 'd'); c.ell(4.5, 10.5, 3.5, 2.8, 's'); c.ell(19.5, 10.5, 3.5, 2.8, 's')
    c.ell(12, 5, 4.5, 4.5, 's'); c.rect(8, 5, 16, 6, 'k', True); c.rect(9, 5, 10, 5, 'R', True); c.rect(14, 5, 15, 5, 'R', True)
    c.poly([(11, 0), (13, 0), (12, 2)], 'P'); c.rect(11, 12, 13, 17, 'P'); c.rect(9, 13, 15, 14, 'P')
    c.line(21, 4, 21, 19, 'g', 2); c.rect(19, 18, 23, 18, 'y'); c.rect(21, 19, 21, 21, 'n'); c.px(21, 3, 'w', True)
    c.rect(8, 20, 10, 23, 'd'); c.rect(14, 20, 16, 23, 'd'); E['knight'] = c.done()

    c = Cv(32, 32)
    for i, (x0, dx) in enumerate(((7, -3), (11, -1), (16, 0), (21, 1), (25, 3))):
        for j in range(9):
            t = j / 8; x = x0 + dx * t * 2 + math.sin(t * 3 + i) * 1.5; c.ell(x, 20 + j * 1.3, 1.6 - t * .7, 1.2, 'e' if j % 2 else 'r')
    c.ell(16, 13, 13.5, 11, 'r'); c.ell(16, 13, 11, 8.2, 'w')
    for (x0, y0, x1, y1) in ((6, 10, 10, 12), (5, 15, 9, 14), (26, 9, 22, 12), (27, 15, 23, 14)): c.line(x0, y0, x1, y1, 'R', 1, True)
    c.ell(16, 13, 5.5, 5.5, 'R'); c.ell(16, 13, 4, 4, 'o'); c.rect(15, 9, 17, 17, 'k', True); c.px(13, 10, 'w', True); c.px(14, 10, 'w', True)
    for x in range(4, 29, 4): c.poly([(x - 1.5, 4 + abs(x - 16) * .25), (x, 0 + abs(x - 16) * .3), (x + 1.5, 4 + abs(x - 16) * .25)], 'e')
    E['eye'] = c.done()

    c = Cv(); c.poly([(4, 15), (5, 5), (8, 1), (11, 5), (12, 15)], 't'); c.ell(8, 6, 2.5, 2.2, 'k', True)
    c.px(7, 6, 'l', True); c.px(9, 6, 'l', True); c.rect(6, 10, 10, 11, 'G'); c.line(13, 2, 13, 15, 'n', 1)
    c.ell(13, 2, 1.8, 1.8, 'l'); c.px(13, 2, 'w', True); c.line(3, 7, 1, 5, 'o', 1); c.px(1, 4, 'R'); E['shaman'] = c.done()

    c = Cv(); c.ell(8, 3.5, 3, 2.8, 'g'); c.rect(5, 3, 11, 4, 'g'); c.line(6, 3, 10, 3, 'k', 1, True)
    c.line(14, 0, 14, 15, 'n', 1); c.px(14, 0, 'w', True); c.poly([(2, 6), (12, 6), (12, 12), (7, 16), (2, 12)], 'c')
    c.rect(6, 8, 8, 12, 'Y'); c.rect(4, 9, 10, 10, 'Y'); c.rect(4, 15, 5, 15, 's'); c.rect(9, 15, 10, 15, 's'); E['shieldb'] = c.done()

    c = Cv(); c.ell(8, 4, 3.5, 3, 'G'); c.poly([(3, 2), (4, 5), (1, 4)], 'G'); c.poly([(13, 2), (12, 5), (15, 4)], 'G')
    c.px(7, 4, 'R', True); c.px(9, 4, 'R', True); c.line(7, 6, 9, 6, 'k', 1, True); c.rect(6, 7, 10, 9, 'G')
    c.ell(8, 12, 5.5, 3.5, 'R'); c.rect(3, 10, 13, 10, 'N'); c.rect(3, 14, 13, 14, 'N'); c.line(4, 11, 12, 13, 'y', 1, True)
    c.line(2, 5, 5, 9, 'N', 1); c.line(14, 5, 11, 9, 'N', 1); c.px(2, 5, 'w', True); c.px(14, 5, 'w', True); E['drummer'] = c.done()

    c = Cv(); c.ell(7, 11, 5, 3.5, 'g'); c.ell(3.5, 9, 2.8, 2.4, 'g'); c.poly([(1, 7), (2, 5), (3, 7)], 'g'); c.px(2, 9, 'R', True)
    c.px(0, 10, 'r'); c.line(11, 12, 15, 9, 'r', 1); c.ell(9, 6.5, 3.5, 3, 'n'); c.line(6, 6, 12, 6, 'x', 1, True)
    c.line(10, 3, 12, 1, 'N', 1); c.px(13, 0, 'Y', True); c.px(12, 0, 'o', True); c.px(3, 14, 'g'); c.px(9, 14, 'g'); E['bomber'] = c.done()

    c = Cv(); c.ell(8, 6, 5, 5, 'C'); c.poly([(3, 6), (13, 6), (13, 12), (11, 15), (9, 12), (7, 15), (5, 12), (3, 14)], 'C')
    c.rect(5, 5, 6, 7, 'b', True); c.rect(10, 5, 11, 7, 'b', True); c.rect(7, 10, 8, 11, 'b', True); c.px(6, 3, 'w', True); c.px(5, 4, 'w', True)
    E['ghost'] = c.done()

    c = Cv(); c.poly([(3, 15), (5, 5), (8, 1), (11, 5), (13, 15)], 'p'); c.ell(8, 6, 2.4, 2.4, 'w'); c.px(7, 6, 'l', True); c.px(9, 6, 'l', True)
    c.px(8, 8, 'k', True); c.rect(5, 10, 11, 10, 'P'); c.line(14, 3, 14, 15, 'x', 1); c.ell(14, 2.5, 1.5, 2, 'w'); c.px(14, 0, 'l', True)
    c.px(13, 0, 'l', True); c.px(15, 1, 'l', True); E['necro'] = c.done()

    c = Cv(24, 24); c.rect(4, 5, 19, 20, 'n'); c.poly([(3, 5), (12, 0), (21, 5)], 'N'); c.line(12, 0, 12, -2, 'x', 1)
    for y in (8, 12, 16): c.line(4, y, 19, y, 'x', 1, True)
    c.rect(9, 9, 14, 12, 'k', True); c.px(10, 10, 'Y', True); c.px(13, 10, 'Y', True); c.line(12, 0, 16, 1, 'R', 1)
    c.ell(6, 21, 2.5, 2.5, 's'); c.ell(17, 21, 2.5, 2.5, 's'); c.rect(2, 12, 3, 20, 'x'); c.rect(20, 12, 21, 20, 'x'); E['siege'] = c.done()

    c = Cv(); c.rect(1, 6, 14, 14, 'n'); c.poly([(1, 6), (14, 6), (13, 2), (2, 2)], 'N'); c.rect(1, 6, 14, 6, 'y')
    c.rect(7, 7, 8, 9, 'y'); c.rect(1, 11, 14, 11, 'x'); E['chest_m'] = c.done()

    c = Cv(); c.poly([(1, 1), (14, 1), (15, 5), (0, 5)], 'N'); c.rect(1, 9, 14, 14, 'n'); c.rect(1, 6, 14, 8, 'R')
    for x in range(2, 14, 2): c.px(x, 5, 'w', True); c.px(x + 1, 9, 'w', True)
    c.px(5, 3, 'Y', True); c.px(10, 3, 'Y', True); c.poly([(6, 7), (11, 7), (10, 12), (7, 12)], 'r'); c.rect(1, 13, 14, 13, 'x')
    E['mimic'] = c.done()

    c = Cv(); c.ell(8, 4.5, 3.4, 3, 'R'); c.poly([(4, 3), (1, 0), (3, 4)], 'g'); c.poly([(12, 3), (15, 0), (13, 4)], 'g')
    c.rect(6, 4, 7, 4, 'Y', True); c.rect(9, 4, 10, 4, 'Y', True); c.line(7, 6, 9, 6, 'k', 1, True)
    c.poly([(3, 8), (13, 8), (12, 12), (4, 12)], 'R'); c.rect(5, 12, 11, 13, 'n'); c.line(5, 14, 4, 15, 'r', 1); c.line(11, 14, 12, 15, 'r', 1)
    c.line(2, 8, 1, 12, 'R', 1); c.line(14, 8, 15, 6, 'R', 1); c.line(15, 6, 15, 0, 'n', 1); c.poly([(13, 0), (16, 0), (16, 4), (14, 3)], 'g')
    E['berserker'] = c.done()

    c = Cv(); c.rect(2, 11, 13, 13, 'n'); c.line(3, 11, 7, 6, 'x', 1); c.line(12, 11, 8, 6, 'x', 1); c.line(7, 7, 14, 1, 'N', 1)
    c.ell(14, 1.5, 1.8, 1.4, 'n'); c.ell(14, 0.5, 1.2, 1, 's'); c.ell(4, 13.5, 2, 2, 's'); c.ell(11, 13.5, 2, 2, 's'); c.px(7, 7, 'y', True)
    E['catapult'] = c.done()

    c = Cv(); c.poly([(3, 6), (4, 2), (8, 0), (12, 2), (13, 6)], 'g'); c.rect(2, 6, 14, 6, 's'); c.ell(8, 9, 4, 3.5, 'f')
    c.px(6, 8, 'k', True); c.px(10, 8, 'k', True); c.line(6, 11, 10, 11, 'n', 1, True); c.poly([(1, 16), (3, 13), (13, 13), (15, 16)], 'b')
    c.rect(7, 13, 9, 16, 'y'); E['p_soldier'] = c.done(hl=HLP)
    E.update(frost_enemies())
    return E


# ---------------------------------------------------------------- 第二套敌人：霜潮（冰原来的东西）
def frost_enemies():
    E = {}
    # 冰螨：一团带冰刺的小虫
    c = Cv(); c.ell(8, 10.5, 6, 4.5, 'c'); c.ell(8, 9, 4.5, 3, 'C')
    for x, y in ((4, 5), (8, 3), (12, 5)): c.poly([(x - 1.5, y + 4), (x, y), (x + 1.5, y + 4)], 'w')
    c.rect(5, 9, 6, 10, 'k', True); c.rect(10, 9, 11, 10, 'k', True); c.px(5, 9, 'w', True); c.px(10, 9, 'w', True)
    for x in (3, 6, 10, 13): c.line(x, 14, x - (1 if x < 8 else -1), 15, 'b', 1)
    E['f_mite'] = c.done()
    # 雪鸮：白色大眼猫头鹰，张开翅膀
    c = Cv(); c.poly([(7, 7), (0, 4), (0, 9), (2, 12), (7, 12)], 'g'); c.line(1, 6, 1, 10, 'w', 1); mirror(c)
    c.ell(8, 8.5, 4, 5, 'w'); c.poly([(4.5, 4), (5, 1), (7, 4)], 'w'); c.poly([(9, 4), (11, 1), (11.5, 4)], 'w')
    c.ell(6, 6.5, 1.6, 1.6, 'Y', True); c.ell(10, 6.5, 1.6, 1.6, 'Y', True); c.px(6, 6, 'k', True); c.px(10, 6, 'k', True)
    c.poly([(7, 8), (9, 8), (8, 10)], 'o'); c.px(6, 11, 'g'); c.px(10, 11, 'g'); c.px(8, 12, 'g')
    E['f_owl'] = c.done()
    # 冻尸：结了冰的死人，蓝皮肤、肩上冰棱
    c = Cv(); c.ell(8, 4.5, 3.6, 3.4, 'c'); c.rect(6, 5, 7, 6, 'k', True); c.rect(9, 5, 10, 6, 'k', True); c.px(6, 5, 'C', True); c.px(9, 5, 'C', True)
    c.line(7, 8, 9, 8, 'd', 1, True); c.rect(4, 9, 12, 13, 'b'); c.line(6, 10, 10, 10, 's', 1, True)
    c.poly([(3, 9), (2, 5), (5, 9)], 'C'); c.poly([(13, 9), (14, 4), (11, 9)], 'C'); c.line(3, 10, 2, 13, 'c', 1); c.line(13, 10, 14, 13, 'c', 1)
    c.line(6, 14, 5, 15, 'c', 1); c.line(10, 14, 11, 15, 'c', 1)
    E['f_husk'] = c.done()
    # 冰卵：透明冰壳里有东西在看你
    c = Cv(); c.ell(8, 8.5, 5.5, 6.5, 'C'); c.ell(8, 9.5, 3.5, 3.8, 'b')
    c.px(7, 9, 'R', True); c.px(9, 9, 'R', True); c.line(4, 5, 6, 7, 'w', 1, True); c.line(11, 11, 13, 9, 'c', 1, True); c.line(6, 13, 8, 12, 'c', 1, True)
    c.px(5, 4, 'w', True); c.rect(4, 15, 12, 15, 'g')
    E['f_egg'] = c.done()
    # 冰碴：卵里孵出来的小东西
    c = Cv(12, 12); c.poly([(2, 10), (4, 4), (6, 1), (8, 4), (10, 10)], 'C'); c.px(5, 6, 'k', True); c.px(7, 6, 'k', True)
    c.line(4, 8, 7, 8, 'b', 1, True); c.line(3, 10, 2, 11, 'c', 1); c.line(9, 10, 10, 11, 'c', 1)
    E['f_chip'] = c.done()
    # 雪人：大块头，白毛、冰角，撞墙会冻住你的卡
    c = Cv(20, 20); c.poly([(3, 8), (6, 5), (14, 5), (17, 8), (18, 15), (15, 19), (5, 19), (2, 15)], 'w'); c.ell(10, 6, 5, 4.2, 'w')
    c.poly([(5, 4), (3, 0), (7, 3)], 'C'); c.poly([(15, 4), (17, 0), (13, 3)], 'C')
    c.ell(10, 7.5, 3.6, 2.6, 'g'); c.rect(8, 6, 8, 7, 'k', True); c.rect(12, 6, 12, 7, 'k', True); c.px(8, 6, 'c', True); c.px(12, 6, 'c', True)
    c.line(8, 9, 12, 9, 'b', 1, True); c.px(9, 10, 'w', True); c.px(11, 10, 'w', True)
    c.ell(2.5, 12, 2.4, 3.4, 'g'); c.ell(17.5, 12, 2.4, 3.4, 'g'); c.rect(5, 18, 8, 19, 'g'); c.rect(12, 18, 15, 19, 'g')
    for x, y in ((6, 12), (13, 14), (9, 16), (11, 11)): c.px(x, y, 'g', True)
    E['f_yeti'] = c.done()
    # 冰墙卫：举着一面冰盾
    c = Cv(); c.ell(8, 3.5, 3, 2.8, 's'); c.rect(5, 3, 11, 4, 's'); c.line(6, 3, 10, 3, 'C', 1, True)
    c.line(14, 0, 14, 15, 'g', 1); c.poly([(13, 0), (15, 0), (14, 2)], 'C')
    c.poly([(2, 6), (12, 6), (12, 12), (7, 16), (2, 12)], 'C'); c.poly([(4, 8), (10, 8), (10, 11), (7, 14), (4, 11)], 'c')
    c.line(5, 9, 7, 11, 'w', 1, True); c.rect(4, 15, 5, 15, 'd'); c.rect(9, 15, 10, 15, 'd')
    E['f_warden'] = c.done()
    # 霜巫：深蓝兜帽，法杖顶着一颗冰珠，会给附近的怪回血
    c = Cv(); c.poly([(4, 15), (5, 5), (8, 1), (11, 5), (12, 15)], 'b'); c.ell(8, 6, 2.5, 2.2, 'k', True)
    c.px(7, 6, 'C', True); c.px(9, 6, 'C', True); c.rect(6, 10, 10, 11, 'c'); c.line(13, 3, 13, 15, 'g', 1)
    c.ell(13, 2, 1.8, 1.8, 'C'); c.px(13, 2, 'w', True); c.line(3, 7, 1, 5, 'w', 1); c.px(1, 4, 'C')
    E['f_witch'] = c.done()
    # 号角手：吹着骨号，催队伍快走
    c = Cv(); c.ell(8, 4, 3.5, 3, 'g'); c.poly([(4, 2), (5, 0), (6, 2)], 'w'); c.poly([(10, 2), (11, 0), (12, 2)], 'w')
    c.px(7, 4, 'b', True); c.px(9, 4, 'b', True); c.rect(5, 7, 11, 12, 'd'); c.line(6, 9, 10, 9, 's', 1, True)
    c.poly([(9, 6), (15, 3), (16, 6), (10, 8)], 'N'); c.px(15, 4, 'w', True); c.rect(5, 13, 6, 15, 'd'); c.rect(10, 13, 11, 15, 'd')
    E['f_horn'] = c.done()
    # 冰雷甲虫：背着一颗冰雷，死了会炸
    c = Cv(); c.ell(8, 11, 6, 3.5, 'b'); c.ell(8, 10, 5, 2.5, 'c'); c.line(8, 8, 8, 13, 'd', 1, True)
    c.ell(3, 11, 2, 1.6, 'd'); c.px(2, 11, 'C', True)
    c.ell(9, 5.5, 3, 3, 'C'); c.px(8, 4, 'w', True); c.line(10, 3, 12, 1, 'N', 1); c.px(13, 0, 'Y', True); c.px(12, 0, 'o', True)
    for x in (4, 8, 12): c.px(x, 14, 'd'); c.px(x, 15, 'd')
    E['f_beetle'] = c.done()
    # 雪雾：一团会散开的风雪，时有时无
    c = Cv(); c.ell(8, 7, 5.5, 5, 'w'); c.poly([(3, 7), (13, 7), (14, 11), (12, 15), (10, 12), (8, 15), (6, 12), (3, 14)], 'w')
    c.line(4, 5, 7, 4, 'g', 1, True); c.line(9, 9, 12, 8, 'g', 1, True); c.line(5, 11, 8, 11, 'g', 1, True)
    c.rect(6, 6, 6, 7, 'b', True); c.rect(10, 6, 10, 7, 'b', True)
    E['f_wisp'] = c.done()
    # 冰棺祭司：戴冰冠的祭司，让冻尸站起来
    c = Cv(); c.poly([(3, 15), (5, 5), (8, 2), (11, 5), (13, 15)], 'd'); c.ell(8, 6, 2.4, 2.4, 'c'); c.px(7, 6, 'w', True); c.px(9, 6, 'w', True)
    for x in (6, 8, 10): c.poly([(x - 1, 3), (x, 0), (x + 1, 3)], 'C')
    c.rect(5, 10, 11, 10, 'C'); c.line(14, 3, 14, 15, 'x', 1); c.rect(13, 1, 15, 4, 'C'); c.px(14, 2, 'b', True)
    E['f_priest'] = c.done()
    # 冰山雪橇：一整块冰拖着走，里面冻着一队冻尸
    c = Cv(24, 24); c.poly([(3, 18), (4, 7), (9, 2), (16, 3), (21, 8), (21, 18)], 'C'); c.poly([(6, 16), (7, 9), (11, 6), (16, 7), (18, 11), (18, 16)], 'c')
    for x in (9, 13, 16): c.rect(x, 11, x + 1, 13, 'b', True); c.px(x, 11, 'R', True)
    c.line(5, 5, 8, 3, 'w', 1, True); c.rect(1, 20, 22, 20, 'n'); c.line(1, 20, 0, 17, 'n', 1); c.rect(4, 18, 5, 19, 'x'); c.rect(18, 18, 19, 19, 'x')
    c.line(22, 20, 23, 17, 'n', 1)
    E['f_sled'] = c.done()
    # 霜狼：越伤越疯
    c = Cv(); c.poly([(2, 8), (5, 6), (11, 6), (13, 8), (13, 11), (2, 11)], 'g'); c.poly([(11, 7), (13, 3), (16, 5), (15, 8), (13, 9)], 'g')
    c.poly([(12, 4), (12, 1), (14, 3)], 'g'); c.px(14, 5, 'R', True); c.line(15, 7, 16, 7, 'w', 1, True)
    c.line(2, 8, 0, 5, 'g', 1); c.rect(3, 11, 4, 15, 'g'); c.rect(10, 11, 11, 15, 'g'); c.line(4, 7, 10, 7, 'w', 1)
    E['f_wolf'] = c.done()
    # 冰弩车：停在远处往墙上射冰锥
    c = Cv(); c.rect(2, 10, 13, 12, 'n'); c.line(1, 7, 14, 7, 'x', 1); c.line(1, 7, 3, 4, 'x', 1); c.line(14, 7, 12, 4, 'x', 1)
    c.line(3, 5, 12, 5, 'w', 1, True); c.line(4, 7, 14, 1, 'C', 1); c.px(15, 0, 'w', True); c.rect(6, 8, 9, 9, 'n')
    c.ell(4, 13.5, 2, 2, 's'); c.ell(11, 13.5, 2, 2, 's')
    E['f_ballista'] = c.done()
    return E

def write_js(path):
    A = card_art(); P = {**portraits(), **enemies()}
    for k, rows in {**A, **P}.items():
        assert all(len(r) == len(rows[0]) for r in rows), k
    out = ['', '/* ================= 像素美术（由 tools/pixelgen.py 生成，勿手改） =================',
           ' * 卡牌图标 16×16、人物立绘 32×32；覆盖 02-data.js 中的旧图。 */']
    out.append('Object.assign(PAL,' + json.dumps(EXTRA_PAL) + ');')
    # 保留文件里已有、但这里没有生成的图（有些图是别处加进来的），只覆盖同名的
    old = {}
    if os.path.exists(path):
        txt = open(path, encoding='utf-8').read()
        i = txt.find('addSprites(')
        if i >= 0: old = json.loads(txt[i + len('addSprites('):txt.rindex(');')])
    merged = {**old, **A, **P}
    out.append('addSprites(' + json.dumps(merged, indent=0, ensure_ascii=False) + ');')
    open(path, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return A, P


def preview(A, P, path):
    from PIL import Image
    items = list(A.items()) + list(P.items())
    W = 8 if A else 3; cell = 72 if A else 200
    rows = math.ceil(len(items) / W)
    img = Image.new('RGB', (W * cell, rows * cell), (30, 34, 44))
    for i, (k, rws) in enumerate(items):
        h, w = len(rws), len(rws[0]); s = (cell - 8) // max(w, h)
        ox, oy = (i % W) * cell + 4, (i // W) * cell + 4
        for y, r in enumerate(rws):
            for x, ch in enumerate(r):
                if ch == '.': continue
                col = PAL[ch]; rgb = tuple(int(col[j:j + 2], 16) for j in (1, 3, 5))
                for dy in range(s):
                    for dx in range(s): img.putpixel((ox + x * s + dx, oy + y * s + dy), rgb)
    os.makedirs(os.path.dirname(path), exist_ok=True); img.save(path)


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..')
    A, P = write_js(os.path.join(root, 'src', '02e-art.js'))
    E = enemies()
    print('cards', len(A), 'portraits', len(P))
    if '--preview' in sys.argv:
        preview(A, P, os.path.join(root, 'shots', 'art_preview.png'))
        preview({}, {k: v for k, v in P.items() if k.startswith('p_')}, os.path.join(root, 'shots', 'portrait_preview.png'))
        preview(E, {}, os.path.join(root, 'shots', 'enemy_preview.png'))
