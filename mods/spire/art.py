"""倒悬塔模组的像素图：python3 mods/spire/art.py 生成 mods/spire/sprites.ts（加 --preview 另出预览图）。
画法和 tools/pixelgen.py 一样（几何图元 + 自动描边 + 自动明暗），字母见 src/data/art/palette.ts。
Sprites for the Inverted Spire mod: run python3 mods/spire/art.py to write mods/spire/sprites.ts (--preview also writes a preview image).
Drawn the same way as tools/pixelgen.py (primitives + auto outline + auto shading); letters are in src/data/art/palette.ts.
"""
import os, sys, json, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'tools'))
from pixelgen import Cv, person, mirror, HLP, preview  # noqa: E402

S = {}

# ---------------------------------------------------------------- 立绘 32×32
def chishi_extra(c):
    c.line(19, 9, 21, 15, 'R', 1, True)                     # 脸上的血誓烙印
    c.px(20, 12, 'Y', True)
    c.line(26, 31, 30, 18, 'g', 2); c.line(28, 21, 31, 23, 'y', 1, True)   # 背后的断剑
    c.rect(6, 26, 9, 29, 'R'); c.px(7, 27, 'o', True)       # 胸口的红绳结
S['p_chishi'] = person(hair='R', hl='o', style='short', cloth='e', cloth2='r', age=1, extra=chishi_extra)

def qingji_extra(c):
    c.rect(10, 16, 22, 19, 't'); c.line(10, 16, 22, 16, 'G', 1, True)   # 遮住口鼻的面巾
    c.px(12, 12, 'l', True); c.px(19, 12, 'l', True)        # 绿眼睛
    for i, x in enumerate((4, 7, 25, 28)): c.line(x, 23, x + (1 if i < 2 else -1), 29, 'w', 1, True)  # 腰上的飞刀
S['p_qingji'] = person(hair='t', hl='G', style='hood', cloth='t', cloth2='G', extra=qingji_extra)

def merchant_extra(c):
    c.ell(16, 14, 7, 8, 'k', True)                          # 兜帽里一片黑
    c.px(13, 13, 'Y', True); c.px(19, 13, 'Y', True)         # 只看得见两点眼睛
    c.rect(22, 25, 28, 30, 'N'); c.line(22, 25, 28, 25, 'y', 1, True); c.px(25, 27, 'Y', True)  # 钱箱
S['p_sp_merchant'] = person(hair='p', hl='P', style='hood', cloth='p', cloth2='d', extra=merchant_extra)

def revenant_extra(c):
    c.px(12, 12, 'C', True); c.px(19, 12, 'C', True)
    c.line(9, 26, 23, 26, 'r', 1, True)                     # 旧伤
    c.rect(24, 22, 26, 31, 'n')                             # 拄着的矛杆
S['p_sp_revenant'] = person(hair='s', hl='g', style='helm', cloth='d', cloth2='s', skin='g', shade='s', age=1, extra=revenant_extra)

# 石脸：塔脚下的一张石头脸，额头上长着青苔
c = Cv(32, 32)
c.ell(16, 16, 13, 14.5, 'g'); c.rect(4, 22, 28, 31, 's'); c.ell(16, 4, 10, 4, 'G'); c.ell(9, 6, 4, 3, 'l')
c.rect(8, 12, 13, 15, 'd'); c.rect(19, 12, 24, 15, 'd'); c.rect(10, 13, 11, 14, 'C', True); c.rect(21, 13, 22, 14, 'C', True)
c.line(15, 15, 14, 21, 's', 1, True); c.line(14, 21, 17, 21, 's', 1, True)
c.rect(10, 24, 22, 26, 'd'); c.line(11, 25, 21, 25, 'k', 1, True)
c.line(5, 18, 8, 26, 's', 1, True); c.line(27, 10, 24, 18, 's', 1, True)
S['p_sp_face'] = c.done()

# ---------------------------------------------------------------- 卡牌 16×16
def card(name, f):
    c = Cv(); f(c); S[name] = c.done()

# 赤誓 · 血
card('sp_brokenblade', lambda c: (c.line(3, 13, 9, 7, 'g', 2), c.poly([(9, 7), (12, 3), (13, 5), (10, 8)], 'w'), c.line(2, 12, 5, 15, 'n', 2), c.line(1, 11, 5, 11, 'y', 1), c.px(11, 9, 'g'), c.px(12, 10, 'g')))
card('sp_bleed', lambda c: (c.poly([(8, 1), (13, 9), (12, 13), (8, 15), (4, 13), (3, 9)], 'R'), c.ell(8, 11, 4, 3.5, 'r'), c.px(6, 7, 'w', True), c.px(6, 8, 'o', True), c.line(10, 3, 14, 7, 'g', 1, True)))
card('sp_ragewave', lambda c: (c.ell(8, 9, 7, 5.5, 'R'), c.ell(8, 10, 5, 3.5, 'o'), c.ell(8, 11, 3, 2, 'Y'), c.poly([(1, 7), (3, 2), (5, 6)], 'R'), c.poly([(11, 6), (13, 1), (15, 7)], 'R'), c.poly([(6, 4), (8, 0), (10, 4)], 'o')))
card('sp_bloodoath', lambda c: (c.rect(3, 2, 12, 14, 'w'), c.rect(3, 2, 12, 3, 'N'), c.line(5, 6, 10, 6, 's', 1, True), c.line(5, 8, 10, 8, 's', 1, True), c.ell(10, 11, 2.5, 2.5, 'R'), c.px(10, 11, 'r', True), c.line(4, 15, 6, 13, 'R', 1)))
card('sp_allin', lambda c: (c.line(2, 14, 11, 5, 'n', 2), c.poly([(8, 1), (15, 2), (14, 9), (11, 7), (9, 4)], 'g'), c.line(10, 3, 13, 6, 'w', 1, True), c.px(4, 12, 'R', True), c.px(5, 13, 'R', True), c.px(2, 15, 'R')))
card('sp_buckler', lambda c: (c.ell(8, 8, 6.5, 6.5, 's'), c.ell(8, 8, 4.5, 4.5, 'g'), c.ell(8, 8, 1.6, 1.6, 'y'), c.px(5, 5, 'w', True)))
card('sp_shieldbash', lambda c: (c.poly([(2, 2), (11, 2), (11, 9), (6.5, 14), (2, 9)], 'g'), c.rect(5, 4, 8, 10, 'R'), c.rect(3, 6, 10, 7, 'R'), c.line(12, 4, 15, 4, 'w', 1), c.line(12, 7, 15, 7, 'w', 1), c.line(12, 10, 14, 10, 'w', 1)))
card('sp_bulwark', lambda c: (c.rect(1, 3, 14, 14, 's'), c.rect(1, 3, 14, 5, 'g'), [c.rect(x, 1, x + 1, 3, 's') for x in (1, 5, 9, 13)], c.line(7, 6, 7, 14, 'd', 1, True), c.line(1, 9, 14, 9, 'd', 1, True), c.rect(6, 8, 8, 10, 'y')))
card('sp_ironheart', lambda c: (c.ell(5.5, 6, 3.5, 3.5, 's'), c.ell(10.5, 6, 3.5, 3.5, 's'), c.poly([(2, 7), (14, 7), (8, 14)], 's'), c.ell(6, 7, 1.5, 1.5, 'R'), c.ell(10, 7, 1.5, 1.5, 'R'), c.line(8, 4, 8, 12, 'd', 1, True), c.px(4, 4, 'w', True)))
card('sp_demon', lambda c: (c.ell(8, 9, 5, 5, 'r'), c.poly([(3, 7), (1, 1), (6, 5)], 'w'), c.poly([(13, 7), (15, 1), (10, 5)], 'w'), c.rect(5, 8, 6, 9, 'Y', True), c.rect(10, 8, 11, 9, 'Y', True), c.line(6, 12, 10, 12, 'k', 1, True), c.px(7, 13, 'w', True), c.px(9, 13, 'w', True)))
# 青棘 · 毒
card('sp_dart', lambda c: (c.line(2, 14, 12, 4, 's', 1), c.poly([(11, 2), (15, 1), (14, 5)], 'g'), c.poly([(1, 12), (3, 15), (4, 12)], 'G'), c.px(13, 3, 'l', True), c.px(12, 2, 'w', True)))
card('sp_fumes', lambda c: (c.ell(5, 10, 4, 3.5, 'G'), c.ell(10, 8, 5, 4.5, 'l'), c.ell(8, 4, 3.5, 3, 'G'), c.px(9, 7, 'P', True), c.px(5, 10, 'P', True), c.px(11, 3, 'w', True)))
card('sp_catalyst', lambda c: (c.rect(6, 1, 9, 4, 'g'), c.poly([(5, 4), (10, 4), (14, 14), (1, 14)], 'w'), c.poly([(4, 9), (11, 9), (14, 14), (1, 14)], 'P'), c.px(6, 11, 'w', True), c.px(9, 12, 'p', True), c.rect(5, 0, 10, 0, 'n')))
card('sp_venomsac', lambda c: (c.ell(8, 9, 6, 5.5, 'l'), c.ell(8, 10, 4, 3.5, 'G'), c.line(8, 2, 8, 4, 't', 1), c.ell(8, 2, 1.5, 1, 't'), c.px(5, 7, 'w', True), c.px(10, 11, 't', True), c.px(6, 12, 't', True)))
card('sp_fogpot', lambda c: (c.ell(8, 10, 6, 5, 'n'), c.rect(5, 3, 10, 6, 'N'), c.rect(4, 3, 11, 3, 'y'), c.ell(8, 1.5, 3, 1.5, 'l'), c.ell(12, 1, 2, 1, 'l'), c.line(3, 10, 13, 10, 'm', 1, True), c.px(5, 8, 'N', True)))
card('sp_sleeve', lambda c: ([c.line(x, 13, x + 6, 2 + i, 'g', 1) for i, x in enumerate((1, 4, 7))], [c.px(x + 6, 2 + i, 'w', True) for i, x in enumerate((1, 4, 7))], c.rect(0, 12, 12, 15, 't'), c.line(0, 12, 12, 12, 'G', 1, True)))
card('sp_bladerain', lambda c: [(c.line(x, y, x + 3, y + 5, 'g', 1), c.px(x + 3, y + 5, 'w', True)) for x, y in ((1, 0), (6, 2), (11, 0), (3, 7), (9, 8), (13, 6))])
card('sp_whetstone', lambda c: (c.poly([(1, 10), (12, 6), (15, 9), (4, 14)], 's'), c.line(2, 10, 12, 7, 'g', 1, True), c.line(6, 1, 12, 5, 'w', 1), c.line(5, 0, 6, 1, 'n', 2), c.px(13, 4, 'Y', True)))
card('sp_tailknife', lambda c: (c.poly([(2, 2), (13, 9), (12, 11), (1, 4)], 'g'), c.line(2, 3, 12, 10, 'w', 1, True), c.rect(12, 11, 15, 14, 'n'), c.line(13, 12, 15, 14, 'G', 1, True), c.px(3, 2, 'w', True)))
card('sp_thousand', lambda c: ([(c.line(8, 8, 8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'g', 1), c.px(8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'w', True)) for a in [i * math.pi / 4 for i in range(8)]], c.ell(8, 8, 2, 2, 'G'), c.px(8, 8, 'l', True)))
# 通用
card('sp_spikes', lambda c: (c.rect(3, 4, 12, 14, 'n'), c.line(3, 9, 12, 9, 'm', 1, True), [c.poly([(x - 1.5, 4), (x, 0), (x + 1.5, 4)], 'g') for x in (4, 8, 12)], [c.poly([(1, y - 1.5), (-1, y), (1, y + 1.5)], 'g') for y in (7, 11)], [c.poly([(14, y - 1.5), (16, y), (14, y + 1.5)], 'g') for y in (7, 11)]))
card('sp_potion', lambda c: (c.ell(8, 10, 5.5, 5, 'w'), c.ell(8, 11, 4, 3.5, 'c'), c.rect(6, 2, 9, 6, 'w'), c.rect(6, 1, 9, 2, 'n'), c.px(6, 9, 'w', True), c.px(10, 12, 'Y', True), c.px(7, 12, 'R', True), c.px(9, 10, 'l', True)))
card('sp_bomb', lambda c: (c.ell(7, 10, 5.5, 5.5, 'd'), c.rect(9, 3, 11, 5, 's'), c.line(11, 3, 13, 1, 'N', 1), c.px(14, 0, 'Y', True), c.px(13, 0, 'o', True), c.px(5, 8, 'g', True), c.rect(4, 10, 9, 11, 'R', True), c.px(6, 10, 'w', True)))
# 诅咒：灰紫色，看着就不想要
card('sp_doubt', lambda c: (c.ell(8, 8, 6, 6.5, 'p'), c.rect(6, 3, 10, 4, 'P'), c.rect(10, 4, 11, 7, 'P'), c.rect(7, 7, 10, 8, 'P'), c.rect(7, 9, 8, 10, 'P'), c.rect(7, 12, 8, 13, 'P')))
card('sp_wound', lambda c: (c.ell(8, 8, 6.5, 6, 'f'), c.line(3, 4, 13, 12, 'r', 2), c.line(4, 4, 13, 11, 'e', 1, True), [c.line(x, 6 + (x - 5) * .8, x + 1, 4 + (x - 5) * .8, 'w', 1, True) for x in (5, 8, 11)]))
card('sp_greed', lambda c: (c.ell(8, 9, 6, 5.5, 'p'), c.rect(5, 2, 10, 4, 'P'), c.ell(8, 9, 3, 3, 'y'), c.ell(8, 9, 1.5, 1.5, 'N'), c.line(3, 13, 1, 15, 'P', 1), c.line(13, 13, 15, 15, 'P', 1)))
card('sp_rot', lambda c: (c.rect(2, 6, 13, 14, 's'), [c.line(2, y, 13, y, 'd', 1, True) for y in (8, 11)], c.line(7, 6, 7, 14, 'd', 1, True), c.ell(9, 5, 4, 3, 'p'), c.ell(4, 13, 2, 1.5, 'P'), c.px(9, 4, 'P', True)))

# ---------------------------------------------------------------- 事件图标
c = Cv(); c.ell(8, 8, 6.5, 7, 'g'); c.rect(4, 6, 6, 8, 'd'); c.rect(10, 6, 12, 8, 'd'); c.px(5, 7, 'C', True); c.px(11, 7, 'C', True); c.line(5, 12, 11, 12, 'd', 1, True); c.ell(8, 2, 4, 1.5, 'G'); S['sp_ev_face'] = c.done()
c = Cv(); c.line(2, 14, 13, 11, 'n', 2); c.line(3, 11, 14, 14, 'n', 2); c.poly([(4, 11), (6, 4), (8, 7), (9, 1), (12, 11)], 'o'); c.poly([(6, 11), (8, 6), (10, 11)], 'Y'); S['sp_ev_fire'] = c.done()

# ---------------------------------------------------------------- 敌人
# 鸦面教徒：鸟嘴面具、长袍，念完咒就冲
c = Cv(); c.poly([(3, 15), (4, 6), (12, 6), (13, 15)], 'b'); c.ell(8, 5, 3.5, 3.5, 'd'); c.poly([(9, 4), (15, 6), (9, 7)], 'y')
c.px(8, 4, 'R', True); c.rect(5, 9, 11, 10, 'c'); c.line(2, 8, 1, 12, 'b', 1); c.line(14, 8, 15, 12, 'b', 1); c.px(1, 13, 'f'); c.px(15, 13, 'f')
S['sp_cultist'] = c.done()
# 大酸泥：一大坨，身上冒泡，挨打会裂开
c = Cv(20, 20); c.ell(10, 13, 9, 6.5, 'l'); c.ell(10, 9, 6, 5, 'l'); c.rect(1, 14, 18, 18, 'l')
c.rect(6, 10, 7, 12, 'k', True); c.rect(12, 10, 13, 12, 'k', True); c.px(6, 10, 'w', True); c.px(12, 10, 'w', True)
c.line(8, 15, 11, 15, 'G', 1, True); c.ell(15, 7, 1.5, 1.5, 'Y'); c.ell(4, 9, 1, 1, 'Y'); c.px(7, 5, 'w', True)
S['sp_splitooze'] = c.done()
# 爆菇：走到跟前炸一团孢子
c = Cv(); c.ell(8, 6, 7, 5, 'r'); c.rect(1, 6, 14, 7, 'r'); c.rect(5, 8, 10, 14, 'w'); c.ell(4, 4, 1.5, 1.2, 'w', True); c.ell(10, 3, 1.8, 1.4, 'w', True)
c.ell(12, 6, 1, 1, 'w', True); c.px(6, 10, 'k', True); c.px(9, 10, 'k', True); c.line(6, 12, 9, 12, 'k', 1, True); c.rect(4, 14, 11, 15, 'G')
S['sp_fungus'] = c.done()
# 驮甲虫：背上驮着一窝小东西
c = Cv(24, 24); c.ell(12, 14, 10, 7.5, 'p'); c.ell(12, 13, 8, 6, 'P'); c.line(12, 7, 12, 20, 'p', 1, True); c.ell(12, 5, 5, 3, 'd')
c.px(10, 4, 'Y', True); c.px(14, 4, 'Y', True); c.line(9, 3, 6, 0, 'd', 1); c.line(15, 3, 18, 0, 'd', 1)
for y in (11, 15, 19): c.line(2, y, -1, y + 2, 'k', 1, True); c.line(22, y, 25, y + 2, 'k', 1, True)
c.ell(8, 11, 2, 1.5, 'l'); c.ell(16, 12, 2, 1.5, 'l'); c.ell(12, 16, 2, 1.5, 'l'); c.px(8, 11, 'k', True); c.px(16, 12, 'k', True); c.px(12, 16, 'k', True)
S['sp_beetle'] = c.done()

# ---------------------------------------------------------------- 首领 48×48
# 六焰魂：一圈六团鬼火围着一颗暗心
c = Cv(48, 48)
for i in range(6):
    a = -math.pi / 2 + i * math.pi / 3; x, y = 24 + 16 * math.cos(a), 25 + 15 * math.sin(a)
    c.ell(x, y + 1, 4.5, 4.5, 'G'); c.poly([(x - 4, y + 1), (x - 1, y - 8), (x + 1, y - 3), (x + 3, y - 9), (x + 4.5, y + 1)], 'G')
    c.ell(x, y + 2, 2.5, 2.5, 'l'); c.px(x - 1, y + 1, 'k', True); c.px(x + 1, y + 1, 'k', True)
c.ell(24, 25, 8, 8, 'p'); c.ell(24, 25, 5, 5, 'P'); c.ell(24, 25, 2.5, 2.5, 'l'); c.px(23, 24, 'w', True)
for i in range(6):
    a = -math.pi / 2 + i * math.pi / 3; c.line(24 + 8 * math.cos(a), 25 + 8 * math.sin(a), 24 + 12 * math.cos(a), 25 + 11 * math.sin(a), 't', 1, True)
S['sp_b_hex'] = c.done()

# 铜衣守护者：一台蹲着的铜壳机器，胸口一只红眼，两条大臂
c = Cv(48, 48)
c.poly([(10, 14), (38, 14), (42, 30), (36, 40), (12, 40), (6, 30)], 'N'); c.ell(24, 12, 9, 7, 'N')
c.rect(16, 9, 32, 13, 'n'); c.rect(18, 10, 21, 12, 'Y', True); c.rect(27, 10, 30, 12, 'Y', True)
c.ell(24, 26, 6, 6, 'm'); c.ell(24, 26, 4, 4, 'R'); c.ell(24, 26, 1.8, 1.8, 'Y'); c.px(22, 24, 'w', True)
c.ell(5, 26, 5, 9, 'n'); c.ell(43, 26, 5, 9, 'n'); c.rect(1, 33, 9, 41, 's'); c.rect(39, 33, 47, 41, 's')
for x in (2, 5, 8): c.line(x, 41, x, 45, 'g', 1)
for x in (40, 43, 46): c.line(x, 41, x, 45, 'g', 1)
c.rect(13, 40, 20, 46, 'n'); c.rect(28, 40, 35, 46, 'n'); c.line(10, 20, 38, 20, 'n', 1, True); c.line(9, 34, 39, 34, 'n', 1, True)
for x, y in ((12, 17), (36, 17), (11, 31), (37, 31)): c.px(x, y, 'y', True)
S['sp_b_guard'] = c.done()

# 泥王：一大坨，头顶歪戴一顶小王冠，肚子里能看见被吞进去的剑
def slime_king(sz, crown=True):
    c = Cv(sz, sz); k = sz / 48
    c.ell(24 * k, 31 * k, 22 * k, 16 * k, 'l'); c.ell(24 * k, 22 * k, 15 * k, 13 * k, 'l'); c.rect(int(2 * k), int(32 * k), int(45 * k), int(46 * k), 'l')
    c.ell(24 * k, 32 * k, 14 * k, 9 * k, 'G'); c.line(18 * k, 30 * k, 30 * k, 36 * k, 'g', 1, True)
    c.rect(int(15 * k), int(20 * k), int(18 * k), int(24 * k), 'k', True); c.rect(int(29 * k), int(20 * k), int(32 * k), int(24 * k), 'k', True)
    c.px(15 * k, 20 * k, 'w', True); c.px(29 * k, 20 * k, 'w', True); c.line(19 * k, 27 * k, 28 * k, 27 * k, 't', 1, True)
    for x, y in ((8, 14), (38, 18), (12, 40), (36, 42)): c.ell(x * k, y * k, 1.5, 1.5, 'w', True)
    if crown:
        c.poly([(17 * k, 11 * k), (18 * k, 3 * k), (21 * k, 7 * k), (24 * k, 1 * k), (27 * k, 7 * k), (30 * k, 3 * k), (31 * k, 11 * k)], 'Y')
        c.px(24 * k, 6 * k, 'R', True)
    return c.done()
S['sp_b_slime'] = slime_king(48)
S['sp_e_slimehalf'] = slime_king(30, crown=False)

# 时噬：一面裂开的大钟，指针是两只手
c = Cv(48, 48)
c.ell(24, 24, 21, 21, 'n'); c.ell(24, 24, 18, 18, 'w'); c.ell(24, 24, 16, 16, 'y')
for i in range(12):
    a = i * math.pi / 6; c.line(24 + 13 * math.cos(a), 24 + 13 * math.sin(a), 24 + 16 * math.cos(a), 24 + 16 * math.sin(a), 'm', 1, True)
c.line(24, 24, 24, 11, 'd', 2, True); c.line(24, 24, 34, 28, 'd', 2, True); c.ell(24, 11, 2, 2, 'f'); c.ell(34, 28, 2, 2, 'f')
c.ell(24, 24, 2.5, 2.5, 'R'); c.line(10, 8, 18, 20, 'k', 1, True); c.line(18, 20, 14, 26, 'k', 1, True)
c.rect(20, 0, 28, 4, 'N'); c.line(4, 44, 10, 38, 'N', 2); c.line(44, 44, 38, 38, 'N', 2)
c.px(16, 20, 'Y', True); c.px(31, 20, 'Y', True)
S['sp_b_clock'] = c.done()

# 腐心：塔心，一颗吊在血管上的巨大心脏
c = Cv(48, 48)
for x0 in (8, 16, 24, 32, 40): c.line(x0, 0, 24 + (x0 - 24) * .4, 12, 'e', 2)
c.ell(17, 22, 12, 11, 'r'); c.ell(31, 22, 12, 11, 'r'); c.poly([(5, 24), (43, 24), (24, 46)], 'r')
c.ell(16, 21, 8, 7, 'R'); c.ell(30, 21, 6, 6, 'R'); c.poly([(10, 26), (36, 26), (24, 40)], 'R')
c.line(24, 14, 24, 40, 'e', 1, True); c.line(14, 28, 22, 36, 'e', 1, True); c.line(34, 26, 27, 35, 'e', 1, True)
c.ell(24, 27, 3, 3, 'Y'); c.px(23, 26, 'w', True); c.px(12, 17, 'o', True); c.px(13, 16, 'w', True)
S['sp_b_heart'] = c.done()


def write(path):
    for k, rows in S.items(): assert all(len(r) == len(rows[0]) for r in rows), k
    body = json.dumps(S, indent=0, ensure_ascii=False)
    open(path, 'w', encoding='utf-8').write(
        '/* 倒悬塔模组的像素图（由 mods/spire/art.py 生成，勿手改） / Inverted Spire sprites (generated by mods/spire/art.py; do not edit by hand) */\n'
        'const sprites: Record<string, string[]> = ' + body + ';\nexport default sprites;\n')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    write(os.path.join(here, 'sprites.ts'))
    print('sprites', len(S))
    if '--preview' in sys.argv:
        preview({k: v for k, v in S.items() if len(v) <= 16}, {k: v for k, v in S.items() if len(v) > 16}, os.path.join(here, '..', '..', 'shots', 'spire_preview.png'))
