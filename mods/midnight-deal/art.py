"""子夜牌局模组的像素图：python3 mods/midnight-deal/art.py 生成 sprites.ts（加 --preview 另出预览图）。
Sprites for the Midnight Deal mod: run python3 mods/midnight-deal/art.py to write sprites.ts (--preview also writes a preview image).
"""
import os, sys, json, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from pixelgen import Cv, person, mirror, preview  # noqa: E402

S = {}

# ---------------------------------------------------------------- 立绘 32×32
def jester_extra(c):
    # 两角的小丑帽，帽尖挂铃铛
    c.poly([(7, 9), (3, 1), (13, 5)], 'R'); c.poly([(25, 9), (29, 1), (19, 5)], 'P'); c.poly([(9, 8), (16, 2), (23, 8)], 'Y')
    c.ell(3, 1.5, 1.6, 1.6, 'Y', True); c.ell(29, 1.5, 1.6, 1.6, 'Y', True)
    c.ell(16, 16, 1.4, 1.2, 'R', True)                       # 红鼻头
    c.line(10, 11, 13, 11, 'k', 1, True); c.line(18, 11, 21, 11, 'k', 1, True)
    c.px(12, 15, 'b', True); c.px(19, 15, 'b', True)          # 眼下的泪痣
    for x in range(4, 29, 4): c.poly([(x, 21), (x + 2, 24), (x + 4, 21)], 'w')   # 褶领
S['p_choujue'] = person(hair='R', hl='o', style='bald', cloth='P', cloth2='R', skin='w', shade='g', extra=jester_extra)

def clerk_extra(c):
    c.rect(22, 24, 30, 30, 'N'); [c.line(23, y, 29, y, 'n', 1, True) for y in (26, 28)]   # 算盘
    [c.px(x, 26, 'R', True) for x in (24, 27)]; [c.px(x, 28, 'R', True) for x in (25, 28)]
    c.line(5, 23, 9, 31, 'y', 1, True)                       # 胸前的金链
S['p_zhangfang'] = person(hair='x', hl='m', style='cap', cloth='t', cloth2='w', eyes='glasses', age=1, extra=clerk_extra)

def house_extra(c):
    c.rect(8, 0, 24, 7, 'k'); c.rect(5, 7, 27, 8, 'k'); c.line(8, 6, 24, 6, 'R', 1, True)   # 高礼帽
    c.ell(16, 14, 6.5, 6, 'd', True); c.px(13, 13, 'Y', True); c.px(19, 13, 'Y', True)       # 帽檐下一片黑
    c.line(13, 17, 19, 17, 'w', 1, True)                     # 只看得见牙
    c.rect(22, 25, 26, 30, 'w'); c.px(24, 27, 'R', True)     # 指间一张牌
S['p_dl_house'] = person(hair='k', hl='d', style='bald', cloth='k', cloth2='R', skin='d', shade='k', extra=house_extra)

def dealer_extra(c):
    c.rect(9, 7, 23, 8, 'G'); c.line(9, 8, 23, 8, 't', 1, True)   # 绿色遮光帽檐
    c.rect(13, 23, 19, 24, 'k'); c.px(16, 23, 'R', True)          # 领结
S['p_dl_dealer'] = person(hair='g', hl='w', style='short', cloth='w', cloth2='d', age=2, beard='g', extra=dealer_extra)

def tarot_extra(c):
    for x, y in ((6, 4), (25, 5), (4, 14), (27, 15)): c.px(x, y, 'Y', True)
    c.ell(16, 28, 4, 3, 'C'); c.px(15, 27, 'w', True)             # 水晶球
S['p_dl_tarot'] = person(hair='p', hl='P', style='scarf', cloth='p', cloth2='y', age=2, eyes='closed', extra=tarot_extra)

# ---------------------------------------------------------------- 卡牌 16×16
def card(name, f):
    c = Cv(); f(c); S[name] = c.done()

def playing(c, col, pip):
    c.rect(3, 1, 12, 14, 'w'); pip(c, col)

# 丑角 · 同花
card('dl_juggle', lambda c: (c.ell(4, 10, 2.5, 2.5, 'R'), c.ell(8, 4, 2.5, 2.5, 'Y'), c.ell(12, 10, 2.5, 2.5, 'c'), c.line(5, 13, 11, 13, 'f', 2), c.px(3, 9, 'w', True), c.px(7, 3, 'w', True), c.px(11, 9, 'w', True)))
card('dl_grin', lambda c: (c.ell(8, 8, 6.5, 6.5, 'w'), c.poly([(2, 6), (1, 0), (7, 3)], 'R'), c.poly([(14, 6), (15, 0), (9, 3)], 'P'), c.rect(5, 6, 6, 7, 'k', True), c.rect(10, 6, 11, 7, 'k', True), c.ell(8, 9, 1.3, 1, 'R', True), c.line(4, 11, 12, 11, 'R', 1, True), c.px(4, 10, 'R', True), c.px(12, 10, 'R', True)))
card('dl_flushjoker', lambda c: (c.rect(2, 2, 9, 13, 'w'), c.rect(6, 3, 13, 14, 'w'), c.ell(8.5, 7.5, 2, 2, 'R'), c.ell(11, 7.5, 2, 2, 'R'), c.poly([(6.5, 8), (13, 8), (9.8, 12)], 'R'), c.px(3, 3, 'R', True), c.px(3, 4, 'R', True)))
card('dl_whip', lambda c: (c.line(2, 14, 6, 9, 'n', 2), c.line(6, 9, 10, 3, 'o', 1), c.line(10, 3, 14, 5, 'o', 1), c.line(14, 5, 13, 9, 'Y', 1), c.px(12, 10, 'Y', True), c.px(13, 11, 'o', True)))
card('dl_finale', lambda c: (c.rect(0, 0, 3, 15, 'R'), c.rect(12, 0, 15, 15, 'R'), c.rect(0, 0, 15, 2, 'r'), c.line(2, 3, 2, 15, 'r', 1, True), c.line(13, 3, 13, 15, 'r', 1, True), c.ell(8, 9, 3, 3, 'Y'), c.poly([(5, 12), (8, 5), (11, 12)], 'y'), c.px(8, 8, 'w', True)))
# 丑角 · 杂耍
card('dl_pins', lambda c: ([c.poly([(x - 1, 14), (x - 2, 8), (x, 3), (x + 2, 8), (x + 1, 14)], col) for x, col in ((4, 'w'), (8, 'R'), (12, 'w'))], [c.line(x - 1, 7, x + 1, 7, 'R' if col == 'w' else 'w', 1, True) for x, col in ((4, 'w'), (8, 'R'), (12, 'w'))]))
card('dl_twitch', lambda c: (c.ell(8, 8, 6, 6, 'Y'), c.poly([(9, 1), (5, 8), (8, 8), (6, 15), (11, 6), (8, 6)], 'w'), c.px(4, 5, 'k', True), c.px(12, 5, 'k', True)))
card('dl_mirror', lambda c: (c.ell(8, 7, 5.5, 6.5, 'N'), c.ell(8, 7, 4, 5, 'C'), c.line(6, 4, 9, 9, 'w', 1, True), c.rect(7, 13, 9, 15, 'N'), c.px(5, 5, 'w', True)))
card('dl_double', lambda c: (c.rect(1, 3, 8, 14, 'w'), c.rect(7, 1, 14, 12, 'w'), c.line(9, 3, 12, 3, 'R', 1, True), c.line(12, 3, 9, 7, 'R', 1, True), c.line(9, 7, 12, 7, 'R', 1, True), c.line(3, 6, 6, 6, 'k', 1, True), c.line(6, 6, 3, 10, 'k', 1, True), c.line(3, 10, 6, 10, 'k', 1, True)))
card('dl_curtain', lambda c: (c.rect(0, 0, 15, 3, 'P'), c.poly([(0, 3), (6, 3), (3, 15), (0, 15)], 'p'), c.poly([(15, 3), (9, 3), (12, 15), (15, 15)], 'p'), c.poly([(7, 5), (5, 10), (8, 10), (6, 15), (11, 8), (8, 8)], 'Y'), [c.px(x, 2, 'Y', True) for x in (2, 6, 10, 14)]))
# 账房 · 金钱
card('dl_abacus', lambda c: (c.rect(1, 2, 14, 13, 'N'), c.rect(2, 3, 13, 12, 'm'), [c.line(2, y, 13, y, 'g', 1, True) for y in (5, 8, 11)], [c.ell(x, y, 1.2, 1, 'R', True) for x, y in ((4, 5), (6, 5), (10, 8), (5, 11), (11, 11), (12, 5))], c.line(2, 7, 13, 7, 'n', 1, True)))
card('dl_piggy', lambda c: (c.ell(8, 9, 6.5, 5, 'P'), c.ell(13, 9, 2, 2, 'P'), c.px(14, 9, 'p', True), c.px(10, 6, 'k', True), c.poly([(5, 4), (7, 2), (8, 5)], 'P'), c.rect(6, 3, 8, 3, 'k', True), c.rect(4, 13, 5, 15, 'p'), c.rect(10, 13, 11, 15, 'p'), c.ell(7, 1, 1.5, 1, 'Y')))
card('dl_goldabacus', lambda c: (c.rect(1, 2, 14, 13, 'Y'), c.rect(2, 3, 13, 12, 'y'), [c.line(2, y, 13, y, 'N', 1, True) for y in (5, 8, 11)], [c.ell(x, y, 1.2, 1, 'w', True) for x, y in ((4, 5), (9, 8), (12, 11), (6, 11))]))
card('dl_moneyhammer', lambda c: (c.line(2, 14, 9, 7, 'n', 2), c.ell(10, 6, 5, 4.5, 'N'), c.rect(8, 1, 12, 2, 'y'), c.line(9, 4, 11, 8, 'Y', 1, True), c.px(8, 6, 'y', True)))
card('dl_bigspender', lambda c: ([c.ell(x, y, 3, 1.5, 'Y') for x, y in ((8, 14), (8, 12), (8, 10), (5, 8), (11, 8), (8, 6))], [c.line(x - 2, y, x + 2, y, 'N', 1, True) for x, y in ((8, 14), (8, 12), (8, 10))], c.poly([(2, 4), (8, 0), (14, 4)], 'o'), c.px(8, 2, 'Y', True)))
# 账房 · 复利
card('dl_compound', lambda c: (c.rect(1, 12, 3, 15, 'G'), c.rect(5, 9, 7, 15, 'G'), c.rect(9, 5, 11, 15, 'G'), c.rect(13, 1, 15, 15, 'l'), c.line(1, 10, 14, 0, 'Y', 1, True)))
card('dl_iou', lambda c: (c.rect(2, 2, 13, 13, 'y'), c.line(4, 5, 11, 5, 'n', 1, True), c.line(4, 7, 10, 7, 'n', 1, True), c.line(4, 9, 8, 9, 'n', 1, True), c.ell(11, 11, 2.2, 2.2, 'R'), c.px(11, 11, 'r', True)))
card('dl_collector', lambda c: (c.ell(8, 5, 3.5, 3.5, 'f'), c.rect(5, 1, 11, 2, 'k'), c.rect(3, 2, 13, 3, 'k'), c.poly([(3, 15), (4, 9), (12, 9), (13, 15)], 'd'), c.rect(11, 9, 14, 13, 'G'), c.px(12, 10, 'l', True), c.px(6, 5, 'k', True), c.px(10, 5, 'k', True)))
card('dl_usury', lambda c: (c.rect(3, 1, 12, 14, 'w'), c.rect(3, 1, 12, 3, 'R'), c.line(5, 6, 10, 6, 's', 1, True), c.line(5, 8, 10, 8, 's', 1, True), c.ell(8, 11, 2.5, 2, 'Y'), c.line(7, 11, 9, 11, 'N', 1, True)))
card('dl_mint', lambda c: (c.rect(1, 5, 14, 14, 's'), c.rect(3, 7, 12, 9, 'd'), c.rect(4, 1, 11, 5, 'g'), c.ell(8, 12, 2, 1.5, 'Y'), c.ell(12, 12, 1.5, 1.2, 'Y'), c.rect(4, 7, 11, 8, 'l'), c.px(3, 2, 'w', True)))
# 通用
card('dl_wild', lambda c: (c.rect(3, 1, 12, 14, 'w'), c.ell(8, 8, 3.5, 3.5, 'P'), c.px(8, 8, 'Y', True), c.px(4, 2, 'R', True), c.px(11, 13, 'R', True), c.px(4, 3, 'k', True), c.px(11, 12, 'k', True)))
card('dl_luckydie', lambda c: (c.rect(2, 2, 13, 13, 'w'), [c.ell(x, y, 1, 1, 'R', True) for x, y in ((5, 5), (10, 5), (5, 10), (10, 10), (7.5, 7.5))], c.line(2, 13, 13, 13, 'g', 1, True), c.line(13, 2, 13, 13, 'g', 1, True)))

# ---------------------------------------------------------------- 事件图标
c = Cv(); c.ell(8, 8, 5, 5, 'P'); c.ell(8, 8, 7, 2, 'p'); c.ell(8, 8, 3, 3, 'Y'); c.px(7, 7, 'w', True); [c.px(x, y, 'Y', True) for x, y in ((1, 2), (14, 3), (13, 14))]; S['dl_ev_planet'] = c.done()
c = Cv(); c.rect(1, 3, 6, 13, 'p'); c.rect(9, 3, 14, 13, 'p'); c.rect(2, 4, 5, 12, 'P'); c.rect(10, 4, 13, 12, 'P'); c.ell(3.5, 8, 1.2, 2, 'Y'); c.ell(11.5, 8, 2, 2, 'Y'); c.px(11, 8, 'p', True); S['dl_ev_tarot'] = c.done()
c = Cv(); c.ell(8, 8, 7, 7, 'R'); [c.line(8, 8, 8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'w', 1, True) for a in [i * math.pi / 4 for i in range(8)]]; c.ell(8, 8, 1.5, 1.5, 'Y'); c.poly([(7, 0), (9, 0), (8, 3)], 'k'); S['dl_ev_wheel'] = c.done()
c = Cv(); c.rect(1, 4, 14, 11, 'G'); c.rect(2, 5, 13, 10, 'l'); c.ell(8, 7.5, 2, 2, 'Y'); [c.px(x, 6, 'w', True) for x in (3, 12)]; S['dl_ev_voucher'] = c.done()

# ---------------------------------------------------------------- 敌人
c = Cv(); c.ell(8, 9, 6.5, 6.5, 'R'); c.ell(8, 9, 4.5, 4.5, 'w'); c.ell(8, 9, 3.5, 3.5, 'R')
for a in [i * math.pi / 3 for i in range(6)]: c.px(8 + 5.5 * math.cos(a), 9 + 5.5 * math.sin(a), 'w', True)
c.px(7, 8, 'k', True); c.px(9, 8, 'k', True); c.line(7, 11, 9, 11, 'k', 1, True); S['dl_chip'] = c.done()
c = Cv(); c.poly([(6, 7), (0, 3), (0, 8), (2, 11), (6, 10)], 'g'); mirror(c); c.rect(5, 3, 10, 13, 'w'); c.ell(7.5, 7, 1.5, 1.5, 'R'); c.poly([(6, 7.5), (9, 7.5), (7.5, 10)], 'R'); c.px(6, 4, 'R', True); c.px(9, 12, 'R', True); S['dl_card'] = c.done()
c = Cv(); c.rect(2, 3, 13, 14, 'w'); c.poly([(2, 3), (5, 0), (15, 0), (13, 3)], 'g'); c.poly([(13, 3), (15, 0), (15, 11), (13, 14)], 's')
for x, y in ((5, 6), (10, 6), (5, 11), (10, 11)): c.ell(x, y, 1, 1, 'k', True)
c.px(7, 8, 'R', True); c.px(8, 8, 'R', True); S['dl_dice'] = c.done()
c = Cv(12, 12); c.rect(2, 2, 9, 9, 'w'); c.ell(5.5, 5.5, 1.2, 1.2, 'R', True); c.px(4, 4, 'k', True); c.px(7, 4, 'k', True); S['dl_pip'] = c.done()
c = Cv(20, 20); c.rect(2, 3, 17, 18, 'R'); c.rect(4, 6, 15, 11, 'w'); c.rect(4, 13, 15, 16, 'r'); [c.line(x, 6, x, 11, 'g', 1, True) for x in (7, 11)]
c.px(5, 8, 'Y', True); c.px(9, 8, 'Y', True); c.px(13, 8, 'Y', True); c.line(18, 5, 19, 12, 'g', 1); c.ell(19, 4, 1.5, 1.5, 'R'); c.rect(3, 0, 16, 2, 'y'); c.px(9, 14, 'Y', True); S['dl_slot'] = c.done()

# ---------------------------------------------------------------- 首领 48×48
# 琥珀骰：一颗嵌在琥珀里的大骰子
c = Cv(48, 48); c.poly([(6, 14), (24, 4), (42, 14), (42, 34), (24, 44), (6, 34)], 'y'); c.poly([(6, 14), (24, 24), (24, 44), (6, 34)], 'N'); c.poly([(42, 14), (24, 24), (24, 44), (42, 34)], 'n')
c.poly([(6, 14), (24, 4), (42, 14), (24, 24)], 'Y')
for x, y in ((24, 14), (15, 25), (15, 33), (19, 29), (33, 25), (29, 33), (37, 29)): c.ell(x, y, 2, 2, 'm', True)
c.ell(22, 11, 2, 1, 'w', True); S['dl_b_amber'] = c.done()
# 绯红之心：一张红心 A，牌面上的心在跳
c = Cv(48, 48); c.rect(8, 2, 39, 45, 'w'); c.rect(9, 3, 38, 44, 'w'); c.line(8, 45, 39, 45, 'g', 1, True); c.line(39, 2, 39, 45, 'g', 1, True)
c.ell(19, 21, 7, 7, 'R'); c.ell(29, 21, 7, 7, 'R'); c.poly([(12, 23), (36, 23), (24, 37)], 'R'); c.ell(18, 19, 3, 3, 'o'); c.px(17, 18, 'w', True)
c.line(11, 6, 11, 10, 'R', 2); c.ell(12, 13, 1.5, 1.5, 'R'); c.line(36, 37, 36, 41, 'R', 2); c.ell(35, 34, 1.5, 1.5, 'R')
c.rect(20, 25, 22, 27, 'k', True); c.rect(26, 25, 28, 27, 'k', True); S['dl_b_crimson'] = c.done()
# 紫釉瓶：一只大瓷瓶，瓶口冒紫烟
c = Cv(48, 48); c.ell(24, 30, 15, 15, 'P'); c.rect(18, 8, 30, 18, 'P'); c.ell(24, 8, 8, 2.5, 'p'); c.ell(24, 30, 11, 11, 'p')
c.poly([(14, 26), (34, 26), (30, 34), (18, 34)], 'Y'); c.line(14, 30, 34, 30, 'y', 1, True)
c.ell(20, 3, 3, 2.5, 'P'); c.ell(27, 1, 3.5, 2, 'P'); c.ell(16, 22, 2, 3, 'w', True)
c.rect(19, 27, 21, 29, 'k', True); c.rect(27, 27, 29, 29, 'k', True); S['dl_b_violet'] = c.done()
# 庄：高礼帽底下一片黑，一只戴戒指的手捏着一把牌
c = Cv(48, 48); c.rect(14, 0, 34, 12, 'k'); c.rect(8, 12, 40, 14, 'k'); c.line(14, 10, 34, 10, 'R', 2, True)
c.ell(24, 22, 11, 9, 'd'); c.px(19, 21, 'Y', True); c.px(29, 21, 'Y', True); c.line(18, 26, 30, 26, 'w', 1, True)
c.poly([(6, 48), (10, 32), (38, 32), (42, 48)], 'k'); c.poly([(20, 32), (28, 32), (24, 44)], 'R')
for i, a in enumerate((-30, -10, 10, 30)):
    r = math.radians(a); x0, y0 = 36 + 10 * math.sin(r), 36 - 10 * math.cos(r)
    c.poly([(36, 40), (x0 - 3, y0), (x0 + 3, y0)], 'w'); c.px(x0, y0 + 2, 'R' if i % 2 else 'k', True)
c.ell(36, 41, 3, 2.5, 'f'); c.px(35, 41, 'Y', True); S['dl_b_house'] = c.done()


def write(path):
    for k, rows in S.items(): assert all(len(r) == len(rows[0]) for r in rows), k
    open(path, 'w', encoding='utf-8').write(
        '/* 子夜牌局模组的像素图（由 mods/midnight-deal/art.py 生成，勿手改） / Midnight Deal sprites (generated by mods/midnight-deal/art.py; do not edit by hand) */\n'
        'const sprites: Record<string, string[]> = ' + json.dumps(S, indent=0, ensure_ascii=False) + ';\nexport default sprites;\n')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    write(os.path.join(here, 'sprites.ts'))
    print('sprites', len(S))
    if '--preview' in sys.argv:
        preview({k: v for k, v in S.items() if len(v) <= 16}, {k: v for k, v in S.items() if len(v) > 16}, os.path.join(here, '..', '..', 'shots', 'deal_preview.png'))
