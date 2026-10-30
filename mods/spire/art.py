"""尖塔模组的像素图（照原作形象画的同人像素）：python3 mods/spire/art.py 生成 mods/spire/sprites.ts（加 --preview 另出预览图）。
画法和 tools/pixelgen.py 一样（几何图元 + 自动描边 + 自动明暗），字母见 src/data/art/palette.ts。
Sprites for the Spire mod (fan pixel art after the original designs): run python3 mods/spire/art.py to write mods/spire/sprites.ts (--preview also writes a preview image).
"""
import os, sys, json, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from pixelgen import Cv, person, mirror, HLP, preview  # noqa: E402

S = {}

# ================================================================ 立绘 32×32
def shade_face(c, skin, sh, x0=18, x1=25, y0=6, y1=23, cx=16, d=3):
    for y in range(y0, y1):
        for x in range(x0, x1):
            if c.get(x, y) == skin and (x - cx) > d: c.px(x, y, sh)

# 铁甲战士：魁梧，乱蓬蓬的红褐短发，眉骨压着一双发红的眼，下巴一圈胡茬；钢铁肩甲，脖子上缠着破红围巾，肩上扛着大剑
c = Cv(32, 32)
c.line(26, 31, 29, 2, 'g', 3); c.line(27, 30, 29.5, 3, 'w', 1, True); c.rect(23, 23, 31, 24, 'y'); c.rect(26, 25, 28, 31, 'n')   # 扛在肩后的大剑
c.poly([(0, 32), (1, 24), (9, 19), (23, 19), (31, 24), (32, 32)], 'd')                 # 宽厚的身板，黑铁胸甲
c.ell(4.5, 23.5, 5, 4, 's'); c.ell(27.5, 23.5, 5, 4, 's')                              # 肩甲
for x, y in ((2, 22), (5, 21), (27, 21), (30, 22)): c.px(x, y, 'g', True)
c.line(11, 24, 21, 24, 's', 1, True); c.line(12, 27, 20, 27, 's', 1, True)
c.rect(12, 16, 20, 21, 'F')                                                            # 粗脖子
c.poly([(8, 19), (24, 19), (22, 24), (10, 24)], 'R'); c.poly([(19, 22), (24, 22), (25, 31), (21, 30)], 'R')   # 红围巾，一角垂下来
for x, y in ((23, 29), (24, 31), (21, 30)): c.px(x, y, 'r', True)
c.poly([(9, 9), (23, 9), (23.5, 15), (21, 19), (11, 19), (8.5, 15)], 'f')                # 方下巴的脸
shade_face(c, 'f', 'F', y0=8, y1=20, d=4)
c.poly([(7, 11), (6, 5), (9, 6), (9, 2), (13, 4), (15, 0), (18, 3), (21, 1), (23, 5), (26, 4), (25, 11), (22, 8), (17, 7.5), (12, 8), (9, 9)], 'r')   # 乱发
for x, y in ((10, 4), (14, 2), (18, 4)): c.px(x, y, 'R', True)
for x, y in ((10, 10), (11, 10), (12, 10), (13, 11), (14, 11)): c.px(x, y, 'k', True)  # 压得很低的眉
for x, y in ((18, 11), (19, 11), (20, 10), (21, 10), (22, 10)): c.px(x, y, 'k', True)
c.rect(11, 12, 13, 12, 'R', True); c.rect(19, 12, 21, 12, 'R', True); c.px(12, 12, 'Y', True); c.px(20, 12, 'Y', True)   # 发红的眼
c.line(11, 13, 13, 13, 'F', 1, True); c.line(19, 13, 21, 13, 'F', 1, True)
c.line(14, 8, 15, 14, 'e', 1, True)                                                    # 一道旧疤
c.px(16, 14, 'F', True); c.px(16, 15, 'F', True)
for x in range(9, 24):
    for y in range(15, 20):
        if c.get(x, y) in 'fF' and (y >= 16 or x <= 9 or x >= 23): c.px(x, y, 'x', True)  # 胡茬
c.line(14, 17, 18, 17, 'e', 1, True)
S['p_ironclad'] = c.done(hl=HLP)

# 静默猎手：尖顶的灰绿兜帽，兜帽里一张苍白的脸，眼窝很深，口鼻蒙着破布；肩上斗篷褴褛，腰间一排小刀
c = Cv(32, 32)
c.poly([(1, 32), (3, 24), (8, 20), (24, 20), (29, 24), (31, 32)], 't')
for x in (3, 7, 12, 19, 24, 28): c.poly([(x - 1.5, 30), (x, 32.5), (x + 1.5, 30)], '.')   # 斗篷下摆破了口
c.poly([(4, 22), (8, 6), (16, -1), (24, 6), (28, 22), (22, 20), (16, 22), (10, 20)], 'G')   # 尖顶兜帽
c.poly([(16, -1), (19, 1), (17, 3)], 'G')
c.ell(16, 13, 6.5, 7.5, 'k')                                                           # 兜帽里一片暗
c.ell(16, 13.5, 5, 6.2, 'g')                                                           # 苍白的脸
for y in range(8, 21):
    for x in range(17, 22):
        if c.get(x, y) == 'g' and x > 18: c.px(x, y, 's')
c.ell(13.5, 12, 1.8, 1.4, 'd', True); c.ell(18.5, 12, 1.8, 1.4, 'd', True)               # 深眼窝
c.px(13, 12, 'C', True); c.px(18, 12, 'C', True)                                       # 眼里一点冷光
c.poly([(10, 15), (22, 15), (21, 21), (11, 21)], 'n')                                  # 蒙脸的破布
c.line(11, 16, 21, 16, 'm', 1, True); c.line(13, 18, 19, 19, 'm', 1, True)
for x in (6, 9, 23, 26):
    c.line(x, 26, x + (1 if x < 16 else -1), 31, 'w', 1, True); c.px(x, 25, 'n', True)  # 腰间的小刀
c.line(4, 25, 28, 25, 'm', 1, True)
S['p_silent'] = c.done(hl=HLP)

# 尼奥：塔底下那头蓝色的巨兽，像一头鲸，闭着眼睛，头顶两只小角，脸上几道深色的花纹
c = Cv(32, 32)
c.ell(16, 18, 15.5, 13, 'b'); c.ell(16, 21, 13, 9, 'c')
c.poly([(8, 8), (6, 1), (11, 6)], 'C'); c.poly([(24, 8), (26, 1), (21, 6)], 'C')
for x0 in (8, 12, 20, 24): c.line(x0, 7, x0 + (1 if x0 < 16 else -1), 12, 'd', 1, True)    # 花纹
c.line(8, 15, 13, 14, 'd', 1, True); c.line(19, 14, 24, 15, 'd', 1, True)               # 闭着的眼（弯弯的）
c.px(9, 16, 'd', True); c.px(23, 16, 'd', True)
c.line(11, 24, 21, 24, 'd', 1, True); c.px(10, 23, 'd', True); c.px(22, 23, 'd', True)  # 慢慢笑开的嘴
for x, y in ((5, 22), (27, 21), (7, 27), (25, 27)): c.px(x, y, 'C', True)
c.ell(16, 11, 2, 1.5, 'Y', True); c.px(16, 10, 'w', True)                              # 额心一点光
S['p_neow'] = c.done()

# 商人：紫色斗篷，大兜帽底下只有一张面具一样的脸和一对眼，背后一卷地毯
def merchant_extra(c):
    c.ell(16, 14, 6.5, 7.5, 'k', True)
    c.ell(16, 14, 4.5, 5, 'w', True); c.rect(13, 13, 14, 14, 'k', True); c.rect(18, 13, 19, 14, 'k', True)   # 面具
    c.line(14, 17, 18, 17, 'k', 1, True); c.px(16, 15, 's', True)
    c.rect(22, 24, 30, 30, 'R'); c.line(22, 26, 30, 26, 'y', 1, True); c.line(22, 28, 30, 28, 'y', 1, True)   # 地毯卷
S['p_sts_merchant'] = person(hair='p', hl='P', style='hood', cloth='p', cloth2='P', extra=merchant_extra)

# ================================================================ 卡牌 16×16
def card(name, f):
    c = Cv(); f(c); S[name] = c.done()

def sword(c, x0, y0, x1, y1, blade='g', hilt='n'):
    c.line(x0, y0, x1, y1, blade, 2); c.line(x0 + (x1 - x0) * .15, y0 + (y1 - y0) * .15, x1, y1, 'w', 1, True)

# 铁甲战士
card('sts_strike_r', lambda c: (sword(c, 3, 13, 13, 3), c.line(1, 11, 5, 15, 'y', 1), c.line(2, 14, 0, 16, 'n', 2), c.line(9, 2, 15, 1, 'R', 1), c.line(14, 7, 15, 3, 'R', 1)))
card('sts_defend_r', lambda c: (c.poly([(2, 2), (14, 2), (14, 9), (8, 15), (2, 9)], 's'), c.poly([(4, 4), (12, 4), (12, 8.5), (8, 13), (4, 8.5)], 'g'), c.line(8, 4, 8, 12, 'R', 1, True), c.line(5, 7, 11, 7, 'R', 1, True)))
card('sts_bash', lambda c: (c.line(2, 14, 9, 7, 'n', 2), c.rect(8, 1, 14, 7, 's'), c.rect(9, 2, 13, 6, 'g'), c.line(10, 9, 14, 13, 'Y', 1), c.line(12, 8, 15, 10, 'Y', 1), c.px(13, 12, 'w', True)))
card('sts_twin', lambda c: (sword(c, 1, 14, 9, 2), sword(c, 7, 15, 15, 3)))
card('sts_heavy', lambda c: (c.poly([(4, 15), (2, 13), (10, 2), (14, 1), (13, 5)], 'g'), c.line(4, 13, 12, 3, 'w', 1, True), c.rect(1, 12, 5, 15, 'n'), c.line(0, 11, 6, 15, 'y', 1)))
card('sts_perfect', lambda c: (sword(c, 2, 14, 12, 4), [c.px(x, y, 'Y', True) for x, y in ((13, 2), (14, 4), (11, 1), (15, 1), (12, 6))], c.ell(13, 3, 1.5, 1.5, 'Y')))
card('sts_inflame', lambda c: (c.ell(8, 11, 5, 4, 'R'), c.poly([(3, 11), (5, 4), (7, 7), (8, 1), (10, 6), (12, 3), (13, 11)], 'o'), c.poly([(6, 12), (8, 6), (10, 12)], 'Y')))
card('sts_limit', lambda c: (c.line(2, 14, 8, 2, 'R', 2), c.line(8, 2, 14, 14, 'R', 2), c.line(4, 10, 12, 10, 'R', 1), c.ell(8, 8, 2, 2, 'Y'), [c.px(x, y, 'o', True) for x, y in ((1, 3), (14, 2), (3, 6), (13, 6))]))
card('sts_demon', lambda c: (c.ell(8, 9, 5.5, 5.5, 'e'), c.poly([(3, 7), (0, 0), (6, 4)], 'r'), c.poly([(13, 7), (16, 0), (10, 4)], 'r'), c.rect(5, 8, 6, 9, 'Y', True), c.rect(10, 8, 11, 9, 'Y', True), c.line(5, 12, 11, 12, 'k', 1, True), c.px(6, 13, 'w', True), c.px(10, 13, 'w', True)))
card('sts_bloodlet', lambda c: (c.poly([(8, 1), (13, 9), (12, 13), (8, 15), (4, 13), (3, 9)], 'R'), c.ell(8, 11, 4, 3.5, 'r'), c.px(6, 7, 'w', True), c.line(11, 2, 15, 6, 'g', 1, True)))
card('sts_whirl', lambda c: ([c.line(8, 8, 8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'g', 1) for a in [i * math.pi / 3 for i in range(6)]], c.ell(8, 8, 3, 3, 'R'), c.ell(8, 8, 6.5, 6.5, '.'), c.ell(8, 8, 2, 2, 'R'), [c.px(8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'w', True) for a in [i * math.pi / 3 for i in range(6)]]))
card('sts_reaper', lambda c: (c.line(3, 15, 11, 3, 'n', 1), c.poly([(10, 2), (15, 4), (14, 9), (12, 5)], 'g'), c.ell(5, 10, 2, 2, 'R'), c.px(4, 12, 'R'), c.px(6, 13, 'r')))
card('sts_shrug', lambda c: (c.ell(8, 9, 6, 6, 's'), c.ell(8, 9, 4, 4, 'g'), c.line(2, 2, 5, 4, 'w', 1), c.line(14, 2, 11, 4, 'w', 1), c.px(8, 9, 'Y', True)))
card('sts_ironwave', lambda c: (c.poly([(0, 12), (4, 8), (8, 11), (12, 7), (16, 10), (16, 16), (0, 16)], 's'), c.line(0, 12, 16, 9, 'g', 1, True), sword(c, 3, 9, 13, 1)))
card('sts_bodyslam', lambda c: (c.ell(8, 9, 6.5, 5.5, 'f'), c.ell(8, 8, 4, 3, 'F'), c.line(2, 15, 14, 15, 's', 2), [c.line(x, 1, x, 4, 'Y', 1) for x in (3, 8, 13)]))
card('sts_entrench', lambda c: (c.rect(1, 5, 14, 14, 's'), [c.line(1, y, 14, y, 'd', 1, True) for y in (8, 11)], [c.line(x, 5 + (i % 2) * 3, x, 8 + (i % 2) * 3, 'd', 1, True) for i, x in enumerate((5, 10, 7, 12))], c.rect(3, 1, 12, 4, 'g')))
card('sts_barricade', lambda c: ([c.poly([(x, 15), (x, 4), (x + 1.5, 1), (x + 3, 4), (x + 3, 15)], 'n') for x in (1, 5, 9, 13)], c.line(0, 7, 16, 7, 'm', 1), c.line(0, 12, 16, 12, 'm', 1)))
card('sts_feed', lambda c: (c.ell(8, 9, 6, 5, 'r'), c.poly([(3, 7), (13, 7), (8, 13)], 'k'), [c.poly([(x, 7), (x + 1, 10), (x + 2, 7)], 'w') for x in (4, 7, 10)], c.ell(8, 3, 2, 1.5, 'R')))
# 静默猎手
card('sts_strike_g', lambda c: (c.line(3, 13, 12, 4, 'g', 1), c.line(4, 12, 12, 4, 'w', 1, True), c.line(1, 15, 4, 12, 'G', 2), c.line(10, 2, 15, 2, 'l', 1)))
card('sts_defend_g', lambda c: (c.poly([(3, 2), (13, 2), (13, 9), (8, 15), (3, 9)], 't'), c.poly([(5, 4), (11, 4), (11, 8.5), (8, 12), (5, 8.5)], 'G'), c.line(8, 5, 8, 11, 'l', 1, True)))
card('sts_neutral', lambda c: (c.line(2, 14, 13, 3, 'g', 1), c.poly([(11, 1), (15, 1), (14, 5)], 'w'), c.ell(5, 6, 2.5, 2.5, 'P'), c.px(5, 6, 'w', True), c.line(1, 2, 3, 4, 'P', 1)))
card('sts_pstab', lambda c: (c.line(2, 14, 12, 4, 'g', 1), c.poly([(11, 2), (15, 1), (14, 5)], 'l'), c.ell(13, 8, 1, 1.5, 'l'), c.ell(12, 11, 1, 1.5, 'G'), c.line(1, 15, 4, 12, 'n', 2)))
card('sts_deadly', lambda c: (c.ell(8, 10, 5.5, 5, 'G'), c.rect(6, 2, 9, 5, 'g'), c.rect(5, 1, 10, 1, 'n'), c.ell(6, 8, 1, 1, 'w', True), c.ell(9, 12, 1.5, 1, 'l', True), c.line(6, 10, 10, 10, 'k', 1, True), c.px(7, 9, 'k', True), c.px(9, 9, 'k', True)))
card('sts_catalyst', lambda c: (c.rect(6, 1, 9, 4, 'g'), c.poly([(5, 4), (10, 4), (14, 14), (1, 14)], 'w'), c.poly([(4, 9), (11, 9), (14, 14), (1, 14)], 'l'), c.px(6, 11, 'w', True), c.px(9, 12, 'G', True), c.rect(5, 0, 10, 0, 'n')))
card('sts_fumes', lambda c: (c.ell(5, 10, 4, 3.5, 'G'), c.ell(10, 8, 5, 4.5, 'l'), c.ell(8, 4, 3.5, 3, 'G'), c.px(9, 7, 'P', True), c.px(5, 10, 'P', True)))
card('sts_corpse', lambda c: (c.ell(8, 9, 5, 4.5, 'g'), c.rect(5, 8, 6, 9, 'k', True), c.rect(10, 8, 11, 9, 'k', True), c.line(6, 12, 10, 12, 'k', 1, True), [c.line(8, 8, 8 + 8 * math.cos(a), 8 + 8 * math.sin(a), 'l', 1, True) for a in (-2.4, -1.57, -0.7, 0.3, 2.8)]))
card('sts_flask', lambda c: (c.ell(6, 10, 4.5, 4.5, 'w'), c.ell(6, 11, 3.2, 3, 'l'), c.rect(5, 3, 7, 6, 'w'), c.line(10, 7, 15, 3, 'G', 1, True), c.px(12, 9, 'l', True), c.px(14, 7, 'l', True)))
card('sts_bladedance', lambda c: ([(c.line(x, 14, x + 3, 3, 'g', 1), c.px(x + 3, 3, 'w', True)) for x in (1, 5, 9)], c.ell(13, 12, 2, 2, 'l'), c.line(0, 15, 15, 15, 'G', 1)))
card('sts_infinite', lambda c: (c.ell(8, 8, 6.5, 6.5, 't'), c.ell(8, 8, 4.5, 4.5, '.'), [(c.line(8 + 5 * math.cos(a), 8 + 5 * math.sin(a), 8 + 3 * math.cos(a + 1), 8 + 3 * math.sin(a + 1), 'w', 1, True)) for a in [i * math.pi / 2 for i in range(4)]]))
card('sts_thousand', lambda c: ([(c.line(8, 8, 8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'g', 1), c.px(8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'w', True)) for a in [i * math.pi / 4 for i in range(8)]], c.ell(8, 8, 2, 2, 'G'), c.px(8, 8, 'l', True)))
card('sts_accuracy', lambda c: (c.ell(8, 8, 6.5, 6.5, 'R'), c.ell(8, 8, 4.5, 4.5, 'w'), c.ell(8, 8, 2.5, 2.5, 'R'), c.line(0, 15, 9, 7, 'g', 1), c.px(8, 8, 'w', True)))
card('sts_afterimage', lambda c: (c.ell(5, 8, 3.5, 6, 'l'), c.ell(8, 8, 3.5, 6, 'G'), c.ell(11, 8, 3.5, 6, 't'), c.px(10, 6, 'C', True), c.px(12, 6, 'C', True)))
card('sts_daggerspray', lambda c: [(c.line(1, 8, 12, y, 'g', 1), c.px(12, y, 'w', True)) for y in (2, 5, 8, 11, 14)])
card('sts_backstab', lambda c: (c.ell(5, 6, 3.5, 4, 't'), c.poly([(1, 15), (2, 9), (8, 9), (9, 15)], 't'), c.line(15, 2, 7, 10, 'g', 1), c.line(14, 2, 7, 9, 'w', 1, True), c.px(7, 11, 'R', True)))
# 无色
card('sts_swift', lambda c: (c.line(1, 14, 13, 2, 'w', 1), c.line(2, 15, 14, 3, 'g', 1), [c.line(0, y, 5, y - 2, 'C', 1) for y in (5, 9)]))
card('sts_flash', lambda c: (c.line(2, 13, 13, 2, 'g', 1), c.line(3, 13, 13, 3, 'w', 1, True), c.ell(13, 3, 2.5, 2.5, 'Y'), c.px(13, 3, 'w', True)))
card('sts_bandage', lambda c: (c.rect(2, 5, 13, 10, 'w'), c.rect(6, 3, 9, 12, 'w'), c.rect(7, 5, 8, 10, 'R'), c.rect(5, 7, 10, 8, 'R')))
card('sts_apotheosis', lambda c: (c.ell(8, 8, 6.5, 6.5, 'Y'), c.ell(8, 8, 4, 4, 'w'), [c.line(8, 8, 8 + 7.5 * math.cos(a), 8 + 7.5 * math.sin(a), 'y', 1, True) for a in [i * math.pi / 4 + 0.4 for i in range(8)]]))
card('sts_bite', lambda c: (c.ell(8, 8, 6, 5, 'e'), c.poly([(3, 6), (13, 6), (8, 12)], 'k'), c.poly([(5, 6), (6, 9), (7, 6)], 'w'), c.poly([(9, 6), (10, 9), (11, 6)], 'w'), c.ell(8, 13, 1.5, 1.5, 'R')))
card('sts_apparition', lambda c: (c.ell(8, 6, 5, 5, 'C'), c.poly([(3, 6), (13, 6), (13, 13), (10, 11), (8, 14), (6, 11), (3, 13)], 'C'), c.rect(5, 5, 6, 7, 'b', True), c.rect(10, 5, 11, 7, 'b', True)))
# 诅咒
card('sts_doubt', lambda c: (c.ell(8, 8, 6, 6.5, 'p'), c.rect(6, 3, 10, 4, 'P'), c.rect(10, 4, 11, 7, 'P'), c.rect(7, 7, 10, 8, 'P'), c.rect(7, 9, 8, 10, 'P'), c.rect(7, 12, 8, 13, 'P')))
card('sts_injury', lambda c: (c.ell(8, 8, 6.5, 6, 'f'), c.line(3, 4, 13, 12, 'r', 2), c.line(4, 4, 13, 11, 'e', 1, True), [c.line(x, 6 + (x - 5) * .8, x + 1, 4 + (x - 5) * .8, 'w', 1, True) for x in (5, 8, 11)]))
card('sts_regret', lambda c: (c.ell(8, 7, 5, 5.5, 'p'), c.rect(5, 6, 6, 6, 'k', True), c.rect(10, 6, 11, 6, 'k', True), c.ell(5.5, 9, 0.8, 1.5, 'c', True), c.line(6, 11, 10, 10, 'k', 1, True), c.poly([(4, 12), (12, 12), (13, 15), (3, 15)], 'P')))
card('sts_decay', lambda c: (c.rect(2, 6, 13, 14, 's'), [c.line(2, y, 13, y, 'd', 1, True) for y in (8, 11)], c.line(7, 6, 7, 14, 'd', 1, True), c.ell(9, 5, 4, 3, 'p'), c.ell(4, 13, 2, 1.5, 'P'), c.px(9, 4, 'P', True)))
card('sts_parasite', lambda c: (c.ell(8, 9, 5.5, 4, 'P'), c.ell(4, 7, 2.5, 2.5, 'p'), c.px(3, 6, 'R', True), [c.line(x, 12, x - 1, 15, 'k', 1, True) for x in (6, 9, 12)], c.line(13, 9, 15, 6, 'P', 1)))

# ================================================================ 事件图标
c = Cv(); c.ell(8, 9, 7, 6, 'b'); c.ell(8, 10, 5.5, 4, 'c'); c.line(4, 8, 6, 7, 'd', 1, True); c.line(10, 7, 12, 8, 'd', 1, True); c.line(6, 11, 10, 11, 'd', 1, True); c.poly([(4, 4), (3, 0), (6, 3)], 'C'); c.poly([(12, 4), (13, 0), (10, 3)], 'C'); S['sts_ev_neow'] = c.done()
c = Cv(); c.line(2, 14, 13, 11, 'n', 2); c.line(3, 11, 14, 14, 'n', 2); c.poly([(4, 11), (6, 4), (8, 7), (9, 1), (12, 11)], 'o'); c.poly([(6, 11), (8, 6), (10, 11)], 'Y'); S['sts_ev_fire'] = c.done()
c = Cv(); c.ell(8, 8, 7, 4.5, 'c'); c.poly([(0, 4), (3, 8), (0, 12)], 'c'); c.ell(12, 7, 1, 1, 'k', True); c.line(13, 10, 15, 10, 'd', 1, True); c.line(6, 5, 6, 11, 'b', 1, True); S['sts_ev_fish'] = c.done()
c = Cv(); c.ell(8, 6, 5, 5, 'C'); c.poly([(3, 6), (13, 6), (13, 13), (10, 11), (8, 14), (6, 11), (3, 13)], 'C'); c.rect(5, 5, 6, 7, 'b', True); c.rect(10, 5, 11, 7, 'b', True); S['sts_ev_ghost'] = c.done()
c = Cv(); c.ell(8, 6, 4.5, 4.5, 'c'); c.poly([(2, 15), (4, 9), (12, 9), (14, 15)], 'b'); c.px(6, 6, 'k', True); c.px(10, 6, 'k', True); c.rect(7, 10, 9, 14, 'Y'); c.rect(5, 11, 11, 12, 'Y'); S['sts_ev_cleric'] = c.done()
c = Cv(); c.ell(8, 7, 5, 5.5, 'w'); c.poly([(2, 15), (4, 10), (12, 10), (14, 15)], 'k'); c.px(6, 7, 'R', True); c.px(10, 7, 'R', True); c.px(7, 10, 'w', True); c.px(9, 10, 'w', True); c.poly([(3, 10), (8, 13), (13, 10)], 'R'); S['sts_ev_vamp'] = c.done()

# ================================================================ 敌人
def slime(name, body, dark, w=16, spikes=False, eye='k'):
    k = w / 16; c = Cv(w, w)
    c.ell(8 * k, 10 * k, 6.5 * k, 5.2 * k, body); c.rect(int(2 * k), int(11 * k), int(13 * k), int(14 * k), body); c.ell(8 * k, 7 * k, 4 * k, 2.5 * k, body)
    if spikes:
        for x in (3, 6, 10, 13): c.poly([((x - 1.2) * k, 8 * k), (x * k, 3.5 * k), ((x + 1.2) * k, 8 * k)], dark)
    c.rect(int(5 * k), int(8 * k), int(6 * k), int(10 * k), eye, True); c.rect(int(10 * k), int(8 * k), int(11 * k), int(10 * k), eye, True)
    c.px(5 * k, 8 * k, 'w', True); c.px(10 * k, 8 * k, 'w', True); c.line(7 * k, 12 * k, 9 * k, 12 * k, dark, 1, True); c.px(4 * k, 6 * k, 'w', True)
    S[name] = c.done()
slime('sts_acid_s', 'l', 'G')
slime('sts_spike_s', 'P', 'p', spikes=True)
slime('sts_acid_m', 'l', 'G', w=20)
slime('sts_spike_m', 'P', 'p', w=20, spikes=True)
slime('sts_acid_l', 'l', 'G', w=30)
slime('sts_spike_l', 'P', 'p', w=30, spikes=True)

# 拜鸟：紫白相间的小鸟，扑着翅膀
c = Cv(); c.poly([(6, 8), (0, 3), (1, 10), (6, 11)], 'P'); mirror(c); c.ell(8, 8.5, 3.5, 4, 'w'); c.ell(8, 10, 2.5, 2.5, 'P')
c.poly([(7, 9), (9, 9), (8, 12)], 'y'); c.px(7, 7, 'k', True); c.px(9, 7, 'k', True); c.poly([(7, 4), (8, 2), (9, 4)], 'P'); S['sts_byrd'] = c.done()
# 邪教徒：蓝袍，鸦嘴面具
c = Cv(); c.poly([(3, 15), (4, 6), (12, 6), (13, 15)], 'b'); c.ell(8, 5, 3.5, 3.5, 'd'); c.poly([(9, 4), (15, 6), (9, 7)], 'y')
c.px(8, 4, 'R', True); c.rect(5, 9, 11, 10, 'c'); c.line(2, 8, 1, 12, 'b', 1); c.line(14, 8, 15, 12, 'b', 1); c.px(1, 13, 'f'); c.px(15, 13, 'f'); S['sts_cultist'] = c.done()
# 颚虫：一条粗壮的虫，一张大嘴占了半个身子
c = Cv(20, 20); c.ell(12, 13, 7.5, 6, 'N'); c.ell(6, 9, 5.5, 5, 'N'); c.poly([(1, 6), (10, 8), (2, 13)], 'k')
for x, y in ((3, 7), (5, 8), (7, 9), (3, 12), (5, 11)): c.px(x, y, 'w', True)
c.px(7, 5, 'Y', True); c.line(12, 8, 12, 19, 'n', 1, True); c.line(16, 9, 16, 18, 'n', 1, True); c.rect(4, 18, 18, 19, 'n'); S['sts_jawworm'] = c.done()
# 球形守护者：一颗铜球，中间一只眼
c = Cv(); c.ell(8, 8, 7, 7, 'N'); c.ell(8, 8, 5, 5, 'y'); c.ell(8, 8, 2.5, 2.5, 'k', True); c.px(8, 8, 'C', True); c.line(1, 8, 15, 8, 'n', 1, True); c.px(4, 4, 'w', True); S['sts_spheric'] = c.done()
# 神秘者：白袍兜帽，提着一根发光的杖
c = Cv(); c.poly([(3, 15), (5, 5), (8, 1), (11, 5), (13, 15)], 'w'); c.ell(8, 6, 2.5, 2.2, 'k', True); c.px(7, 6, 'C', True); c.px(9, 6, 'C', True)
c.rect(6, 10, 10, 11, 'Y'); c.line(14, 2, 14, 15, 'n', 1); c.ell(14, 2, 1.8, 1.8, 'C'); c.px(14, 2, 'w', True); S['sts_mystic'] = c.done()
# 地精首领：戴着歪帽子、举着小旗的地精
c = Cv(); c.ell(8, 9, 4.5, 4, 'G'); c.poly([(3, 8), (0, 5), (4, 7)], 'G'); c.poly([(13, 8), (16, 5), (12, 7)], 'G'); c.poly([(5, 5), (8, 0), (11, 5)], 'R')
c.px(6, 8, 'Y', True); c.px(10, 8, 'Y', True); c.line(6, 11, 10, 11, 'k', 1, True); c.rect(5, 13, 11, 15, 'n'); c.line(14, 3, 14, 15, 'n', 1); c.poly([(14, 3), (16, 4), (14, 6)], 'Y'); S['sts_gleader'] = c.done()
# 爆破者：一团橙红的火球，中间一张怪脸
c = Cv(); c.ell(8, 9, 6, 6, 'o'); c.ell(8, 9, 4, 4, 'R'); c.poly([(3, 6), (5, 1), (7, 4), (8, 0), (10, 4), (12, 1), (13, 6)], 'o'); c.px(6, 8, 'Y', True); c.px(10, 8, 'Y', True); c.line(6, 11, 10, 11, 'k', 1, True); S['sts_exploder'] = c.done()
# 瞬逝者：半透明的人形，下半身是烟
c = Cv(); c.ell(8, 5, 3.5, 3.5, 'C'); c.poly([(3, 7), (13, 7), (12, 12), (10, 15), (8, 12), (6, 15), (4, 12)], 'C'); c.rect(6, 4, 7, 5, 'b', True); c.rect(9, 4, 10, 5, 'b', True); c.line(1, 9, 3, 7, 'C', 1); c.line(15, 9, 13, 7, 'C', 1); S['sts_transient'] = c.done()
# 爬行法师：蛇头的法师，身边飞着小匕首
c = Cv(); c.poly([(3, 15), (5, 6), (11, 6), (13, 15)], 'G'); c.ell(8, 4.5, 3.5, 3, 'l'); c.poly([(10, 4), (15, 3), (11, 6)], 'l'); c.px(9, 3, 'R', True)
c.line(1, 2, 3, 6, 'g', 1); c.px(1, 2, 'w', True); c.line(14, 9, 15, 13, 'g', 1); S['sts_reptomancer'] = c.done()
c = Cv(12, 12); c.line(2, 10, 9, 3, 'g', 2); c.line(3, 9, 9, 3, 'w', 1, True); c.line(1, 8, 4, 11, 'n', 1); c.px(4, 6, 'R', True); S['sts_dagger'] = c.done()
# 虱虫：红色的小甲虫，缩成一团
c = Cv(12, 12); c.ell(6, 6.5, 5, 4.5, 'R'); c.line(6, 2, 6, 11, 'r', 1, True); c.px(3, 4, 'k', True); c.px(9, 4, 'k', True); c.line(1, 10, 0, 11, 'k', 1, True); c.line(11, 10, 12, 11, 'k', 1, True); S['sts_louse'] = c.done()
# 壳寄生虫：一个硬壳，壳缝里伸出触须
c = Cv(24, 24); c.ell(12, 14, 10, 8, 's'); c.ell(12, 13, 8, 6, 'g'); for_ = [c.line(x, 8, x, 20, 'd', 1, True) for x in (7, 12, 17)]
c.ell(12, 6, 4, 3, 'P'); c.px(10, 5, 'R', True); c.px(14, 5, 'R', True); c.line(8, 4, 4, 0, 'P', 1); c.line(16, 4, 20, 0, 'P', 1); S['sts_parasite'] = c.done()
# 疯狂地精：橙红色的小地精，举着刀乱挥
c = Cv(); c.ell(8, 8, 4, 3.5, 'o'); c.poly([(3, 7), (0, 4), (4, 6)], 'o'); c.poly([(13, 7), (16, 4), (12, 6)], 'o'); c.px(6, 7, 'Y', True); c.px(10, 7, 'Y', True)
c.poly([(6, 10), (10, 10), (9, 12), (7, 12)], 'k'); c.rect(5, 12, 11, 15, 'n'); c.line(13, 12, 15, 1, 'g', 1); c.px(15, 1, 'w', True); S['sts_madgremlin'] = c.done()
# 排斥者：一颗带尖刺的球，飘在空中
c = Cv(); c.ell(8, 8, 5, 5, 'P'); [c.poly([(8 + 4 * math.cos(a) - 1.2 * math.sin(a), 8 + 4 * math.sin(a) + 1.2 * math.cos(a)), (8 + 7.5 * math.cos(a), 8 + 7.5 * math.sin(a)), (8 + 4 * math.cos(a) + 1.2 * math.sin(a), 8 + 4 * math.sin(a) - 1.2 * math.cos(a))], 'p') for a in [i * math.pi / 3 for i in range(6)]]
c.ell(8, 8, 2, 2, 'Y', True); c.px(8, 8, 'k', True); S['sts_repulsor'] = c.done()
# 抢劫者：蒙面的小偷，背着钱袋（被打了就抱着钱袋跑）
c = Cv(); c.ell(8, 5, 3.5, 3.5, 'f'); c.rect(4, 4, 12, 5, 'k'); c.px(6, 4, 'w', True); c.px(10, 4, 'w', True); c.poly([(4, 15), (5, 8), (11, 8), (12, 15)], 'd'); c.ell(13, 11, 2.5, 3, 'N'); S['sts_looter'] = c.done()
c = Cv(); c.ell(8, 5, 3.5, 3.5, 'f'); c.rect(4, 4, 12, 5, 'k'); c.px(6, 4, 'R', True); c.px(10, 4, 'R', True); c.poly([(4, 15), (5, 8), (11, 8), (12, 15)], 'd'); c.ell(8, 11, 4, 3.5, 'y'); c.px(7, 10, 'Y', True); S['sts_looter2'] = c.done()

# 精英：地精大块头（红皮、一根大棒槌）
c = Cv(30, 30); c.ell(15, 18, 11, 10, 'R'); c.ell(15, 8, 6, 5, 'R'); c.poly([(9, 6), (5, 1), (11, 4)], 'w'); c.poly([(21, 6), (25, 1), (19, 4)], 'w')
c.rect(12, 7, 13, 8, 'Y', True); c.rect(17, 7, 18, 8, 'Y', True); c.poly([(11, 11), (19, 11), (18, 13), (12, 13)], 'k'); c.px(13, 11, 'w', True); c.px(17, 11, 'w', True)
c.line(26, 28, 29, 8, 'n', 3); c.ell(28.5, 7, 3, 3.5, 'n'); c.rect(9, 26, 13, 29, 'r'); c.rect(17, 26, 21, 29, 'r'); c.line(8, 20, 22, 20, 'r', 1, True); S['sts_e_nob'] = c.done()
# 哨卫：一根石柱，上面一只黄眼
c = Cv(30, 30); c.rect(9, 3, 20, 28, 's'); c.rect(7, 26, 22, 29, 'd'); c.rect(7, 1, 22, 4, 'd'); c.ell(14.5, 12, 4, 4, 'Y'); c.ell(14.5, 12, 2, 2, 'k', True); c.px(14, 11, 'w', True)
for y in (8, 18, 23): c.line(9, y, 20, y, 'd', 1, True)
c.line(11, 19, 11, 22, 'Y', 1, True); c.line(18, 19, 18, 22, 'Y', 1, True); S['sts_e_sentry'] = c.done()
# 刺刀之书：一本张开的书，书页里插满刀
c = Cv(30, 30); c.poly([(2, 10), (15, 14), (28, 10), (28, 26), (15, 29), (2, 26)], 'w'); c.line(15, 14, 15, 29, 'g', 1, True); c.poly([(2, 10), (2, 8), (15, 12), (28, 8), (28, 10), (15, 14)], 'n')
for x0, ang in ((6, -0.9), (11, -1.2), (19, -1.9), (24, -2.2), (15, -1.57)):
    c.line(x0, 13, x0 + 10 * math.cos(ang), 13 + 10 * math.sin(ang), 'g', 1); c.px(x0 + 10 * math.cos(ang), 13 + 10 * math.sin(ang), 'w', True)
c.ell(9, 20, 1.5, 1.5, 'R', True); c.ell(21, 20, 1.5, 1.5, 'R', True); S['sts_e_book'] = c.done()
# 乐加维林：一堆黑铁甲壳，壳缝里两点幽光（醒了的时候眼睛变红）
c = Cv(32, 32); c.ell(16, 21, 14, 10, 'd'); c.ell(16, 18, 11, 8, 's'); c.ell(16, 11, 7, 6, 'd'); c.rect(10, 10, 22, 12, 'k', True)
c.px(13, 11, 'C', True); c.px(19, 11, 'C', True)
for x in (6, 11, 16, 21, 26): c.line(x, 14, x + (1 if x > 16 else -1 if x < 16 else 0), 28, 'k', 1, True)
c.poly([(9, 6), (16, 1), (23, 6)], 's'); S['sts_b_laga'] = c.done()

# ================================================================ 首领 48×48
# 六火亡魂
c = Cv(48, 48)
for i in range(6):
    a = -math.pi / 2 + i * math.pi / 3; x, y = 24 + 16 * math.cos(a), 25 + 15 * math.sin(a)
    c.ell(x, y + 1, 4.5, 4.5, 'G'); c.poly([(x - 4, y + 1), (x - 1, y - 8), (x + 1, y - 3), (x + 3, y - 9), (x + 4.5, y + 1)], 'G')
    c.ell(x, y + 2, 2.5, 2.5, 'l')
c.ell(24, 25, 8, 8, 'p'); c.ell(24, 25, 5, 5, 'P'); c.ell(24, 25, 2.5, 2.5, 'l'); c.px(23, 24, 'w', True)
S['sts_b_hex'] = c.done()
# 守护者：一台蹲着的铜绿色机器，胸口一只红眼，两条大臂
c = Cv(48, 48)
c.poly([(10, 14), (38, 14), (42, 30), (36, 40), (12, 40), (6, 30)], 't'); c.ell(24, 12, 9, 7, 't')
c.rect(16, 9, 32, 13, 'G'); c.rect(18, 10, 21, 12, 'Y', True); c.rect(27, 10, 30, 12, 'Y', True)
c.ell(24, 26, 6, 6, 'd'); c.ell(24, 26, 4, 4, 'R'); c.ell(24, 26, 1.8, 1.8, 'Y'); c.px(22, 24, 'w', True)
c.ell(5, 26, 5, 9, 'G'); c.ell(43, 26, 5, 9, 'G'); c.rect(1, 33, 9, 41, 'N'); c.rect(39, 33, 47, 41, 'N')
for x in (2, 5, 8): c.line(x, 41, x, 45, 'y', 1)
for x in (40, 43, 46): c.line(x, 41, x, 45, 'y', 1)
c.rect(13, 40, 20, 46, 'G'); c.rect(28, 40, 35, 46, 'G'); c.line(10, 20, 38, 20, 'G', 1, True); c.line(9, 34, 39, 34, 'G', 1, True)
for x, y in ((12, 17), (36, 17), (11, 31), (37, 31)): c.px(x, y, 'N', True)
S['sts_b_guard'] = c.done()
# 史莱姆老大：一大坨绿泥，脸上一张大嘴
c = Cv(48, 48)
c.ell(24, 31, 22, 16, 'l'); c.ell(24, 20, 15, 13, 'l'); c.rect(2, 32, 45, 46, 'l'); c.ell(24, 6, 3, 4, 'l')
c.ell(16, 21, 3.5, 4, 'k', True); c.ell(32, 21, 3.5, 4, 'k', True); c.px(15, 19, 'w', True); c.px(31, 19, 'w', True)
c.ell(24, 33, 9, 5, 'G'); c.ell(24, 32, 7, 3, 't')
for x, y in ((8, 14), (38, 18), (12, 40), (36, 42), (20, 9)): c.ell(x, y, 1.5, 1.5, 'w', True)
S['sts_b_slime'] = c.done()
# 勇者：戴角盔的角斗士，一手大盾一手剑
c = Cv(48, 48)
c.poly([(12, 18), (36, 18), (38, 40), (10, 40)], 's'); c.ell(24, 11, 7, 7, 'g'); c.rect(17, 10, 31, 12, 'k', True); c.px(21, 11, 'R', True); c.px(27, 11, 'R', True)
c.poly([(17, 7), (10, 0), (19, 5)], 'w'); c.poly([(31, 7), (38, 0), (29, 5)], 'w'); c.poly([(22, 4), (24, 0), (26, 4)], 'R')
c.ell(8, 28, 7, 11, 'N'); c.ell(8, 28, 5, 9, 'y'); c.ell(8, 28, 2, 2, 'R')
c.line(40, 40, 46, 8, 'g', 2); c.line(41, 38, 46, 9, 'w', 1, True); c.rect(37, 38, 45, 40, 'y')
c.rect(15, 40, 21, 47, 'd'); c.rect(27, 40, 33, 47, 'd'); c.poly([(19, 22), (29, 22), (27, 34), (21, 34)], 'R')
S['sts_b_champ'] = c.done()
# 觉醒者（一阶段）：盘坐的黑衣巨人，背后收着一对翅膀
c = Cv(48, 48)
c.poly([(4, 30), (14, 10), (20, 22)], 'p'); c.poly([(44, 30), (34, 10), (28, 22)], 'p')
c.poly([(12, 22), (36, 22), (40, 44), (8, 44)], 'k'); c.ell(24, 15, 7, 8, 'd'); c.px(21, 14, 'P', True); c.px(27, 14, 'P', True)
c.poly([(18, 9), (24, 2), (30, 9)], 'k'); c.ell(24, 34, 6, 3, 'P'); S['sts_b_awake'] = c.done()
# 觉醒者（二阶段）：张开巨大的鸦翼，眼睛亮成紫色
c = Cv(48, 48)
c.poly([(0, 36), (2, 8), (12, 4), (22, 24)], 'p'); c.poly([(48, 36), (46, 8), (36, 4), (26, 24)], 'p')
for x in (3, 7, 11): c.line(x, 10, x + 6, 28, 'P', 1, True)
for x in (45, 41, 37): c.line(x, 10, x - 6, 28, 'P', 1, True)
c.poly([(14, 22), (34, 22), (36, 46), (12, 46)], 'k'); c.ell(24, 15, 6, 7, 'k'); c.poly([(24, 16), (31, 19), (24, 21)], 'y')
c.ell(21, 13, 1.5, 1.5, 'P', True); c.ell(27, 13, 1.5, 1.5, 'P', True); c.px(21, 13, 'w', True); c.px(27, 13, 'w', True); S['sts_b_awake2'] = c.done()
# 时间吞噬者：背着钟面硬壳的大蜗牛样的东西，两根指针
c = Cv(48, 48)
c.ell(24, 40, 22, 7, 'p'); c.ell(26, 22, 18, 18, 'N'); c.ell(26, 22, 15, 15, 'y'); c.ell(26, 22, 13, 13, 'w')
for i in range(12):
    a = i * math.pi / 6; c.line(26 + 10 * math.cos(a), 22 + 10 * math.sin(a), 26 + 13 * math.cos(a), 22 + 13 * math.sin(a), 'm', 1, True)
c.line(26, 22, 26, 12, 'd', 2, True); c.line(26, 22, 34, 26, 'd', 2, True); c.ell(26, 22, 2, 2, 'R')
c.ell(6, 34, 5.5, 6, 'P'); c.px(4, 32, 'Y', True); c.px(8, 32, 'Y', True); c.line(3, 37, 9, 37, 'k', 1, True)
S['sts_b_clock'] = c.done()
# 腐化之心：吊在血管上的巨大心脏，身上长着尖刺
c = Cv(48, 48)
for x0 in (8, 16, 24, 32, 40): c.line(x0, 0, 24 + (x0 - 24) * .4, 12, 'e', 2)
c.ell(17, 22, 12, 11, 'r'); c.ell(31, 22, 12, 11, 'r'); c.poly([(5, 24), (43, 24), (24, 46)], 'r')
c.ell(16, 21, 8, 7, 'R'); c.ell(30, 21, 6, 6, 'R'); c.poly([(10, 26), (36, 26), (24, 40)], 'R')
for x, y, dx, dy in ((5, 16, -4, -2), (43, 16, 4, -2), (8, 32, -4, 2), (40, 32, 4, 2), (24, 44, 0, 4)): c.poly([(x - 1.5 * abs(dy) / 2, y - 1.5 * abs(dx) / 2), (x + dx, y + dy), (x + 1.5 * abs(dy) / 2, y + 1.5 * abs(dx) / 2)], 'p')
c.line(24, 14, 24, 40, 'e', 1, True); c.line(14, 28, 22, 36, 'e', 1, True); c.line(34, 26, 27, 35, 'e', 1, True)
c.ell(24, 27, 3, 3, 'Y'); c.px(23, 26, 'w', True); c.px(12, 17, 'o', True)
S['sts_b_heart'] = c.done()


def write(path):
    for k, rows in S.items(): assert all(len(r) == len(rows[0]) for r in rows), k
    open(path, 'w', encoding='utf-8').write(
        '/* 尖塔模组的像素图（由 mods/spire/art.py 生成，勿手改） / Spire sprites (generated by mods/spire/art.py; do not edit by hand) */\n'
        'const sprites: Record<string, string[]> = ' + json.dumps(S, indent=0, ensure_ascii=False) + ';\nexport default sprites;\n')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    write(os.path.join(here, 'sprites.ts'))
    print('sprites', len(S))
    if '--preview' in sys.argv:
        preview({k: v for k, v in S.items() if len(v) <= 16}, {k: v for k, v in S.items() if len(v) > 16}, os.path.join(here, '..', '..', 'shots', 'spire_preview.png'))
