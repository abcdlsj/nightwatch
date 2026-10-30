"""小丑牌模组的像素图：python3 mods/official/midnight-deal/art.py 生成 sprites.ts（加 --preview 另出预览图）。
照原作画：52 张扑克牌、小丑、牌组的牌背、吉姆博、盲注筹码和决胜首领盲。
Sprites for the Balatro mod: run python3 mods/official/midnight-deal/art.py to write sprites.ts (--preview also writes a preview image).
Drawn after the original: 52 playing cards, jokers, deck backs, Jimbo, blind chips and the finisher boss blinds.
"""
import os, sys, json, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'tools'))
from pixelgen import Cv, mirror, preview  # noqa: E402

S = {}

# ---------------------------------------------------------------- 3×5 字和花色
FONT = {
    '2': ['###', '..#', '###', '#..', '###'], '3': ['###', '..#', '###', '..#', '###'], '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'], '6': ['###', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'], '9': ['###', '#.#', '###', '..#', '###'], 'J': ['..#', '..#', '..#', '#.#', '###'],
    'Q': ['###', '#.#', '#.#', '###', '..#'], 'K': ['#.#', '##.', '#..', '##.', '#.#'], 'A': ['.#.', '#.#', '###', '#.#', '#.#'],
    'T': ['#.###', '#.#.#', '#.#.#', '#.#.#', '#.###'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'], '+': ['...', '.#.', '###', '.#.', '...'],
    '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#', '##', '.#', '.#', '.#'],
}
PIPS = {
    'h': ['.#.#.', '#####', '#####', '.###.', '..#..'],
    'd': ['..#..', '.###.', '#####', '.###.', '..#..'],
    's': ['..#..', '.###.', '#####', '#.#.#', '..#..'],
    'c': ['.###.', '.###.', '#####', '#####', '..#..'],
}
BIG = {
    'h': ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
    'd': ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    's': ['...#...', '..###..', '.#####.', '#######', '#######', '.#.#.#.', '...#...'],
    'c': ['..###..', '..###..', '##.#.##', '#######', '##.#.##', '...#...', '..###..'],
}
SUITC = {'h': 'R', 'd': 'o', 's': 'd', 'c': 't'}


def glyph(c, g, x, y, col, flip=False):
    rows = g[::-1] if flip else g
    for j, r in enumerate(rows):
        for i, ch in enumerate(r[::-1] if flip else r):
            if ch == '#': c.px(x + i, y + j, col, True)


def text(c, s, x, y, col):
    for ch in s:
        g = FONT[ch]; glyph(c, g, x, y, col); x += len(g[0]) + 1


# ---------------------------------------------------------------- 扑克牌 16×16
RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 't', 'j', 'q', 'k', 'a']


def playing(s, r):
    col = SUITC[s]
    c = Cv()
    c.rect(2, 0, 13, 15, 'w')
    c.line(13, 1, 13, 15, 'g', 1, True); c.line(3, 15, 13, 15, 'g', 1, True)
    lab = {'t': 'T', 'j': 'J', 'q': 'Q', 'k': 'K', 'a': 'A'}.get(r, r)
    glyph(c, FONT[lab], 3, 1, col)
    glyph(c, FONT[lab], 13 - len(FONT[lab][0]), 10, col, True)
    if r in 'jqk':
        # 人头牌：头冠 + 脸 + 衣服上的花色
        hat = {'j': 'R', 'q': 'Y', 'k': 'Y'}[r]
        c.ell(9, 6, 2.2, 2.2, 'f', True)
        if r == 'j': c.rect(7, 2, 11, 3, hat, True); c.px(11, 4, hat, True)
        else:
            c.rect(7, 3, 11, 3, hat, True)
            for x in (7, 9, 11): c.px(x, 2, hat, True)
            if r == 'k': c.px(9, 1, hat, True)
            else: c.px(9, 3, 'R', True)
        c.px(8, 6, 'k', True); c.px(10, 6, 'k', True)
        if r == 'k': c.line(8, 8, 10, 8, 'N', 1, True)
        c.rect(7, 9, 11, 12, col, True); c.px(9, 10, 'w', True)
    elif r == 'a':
        glyph(c, BIG[s], 5, 4, col)
    else:
        glyph(c, PIPS[s], 6, 5, col)
    return c.done(shade=False)


for s in 'shcd':
    for r in RANKS: S[f'pc_{s}{r}'] = playing(s, r)

# ---------------------------------------------------------------- 小丑 16×16
def jester(hat=('R', 'b'), face='w', eyes='dot', mouth='grin', bg=None, bells='Y', cheek='R', extra=None):
    """原作小丑的脸：两角帽、白脸、红脸蛋；mouth：grin 咧嘴 / smile / frown / o / teeth / flat；eyes：dot / closed / mad / wide / x"""
    c = Cv()
    if bg: c.rect(1, 1, 14, 14, bg)
    c.ell(8, 9.5, 5, 5, face)
    c.poly([(3, 7), (1, 1), (8, 5)], hat[0]); c.poly([(13, 7), (15, 1), (8, 5)], hat[1])
    c.rect(3, 5, 13, 6, hat[0]); c.rect(8, 5, 13, 6, hat[1])
    c.ell(1.5, 1.5, 1.3, 1.3, bells, True); c.ell(14.5, 1.5, 1.3, 1.3, bells, True)
    ex = {'dot': [(6, 9), (10, 9)], 'wide': [(6, 9), (10, 9)], 'closed': [], 'mad': [(6, 9), (10, 9)], 'x': []}[eyes]
    for x, y in ex: c.px(x, y, 'k', True)
    if eyes == 'wide': c.px(6, 8, 'k', True); c.px(10, 8, 'k', True)
    if eyes == 'closed': c.line(5, 9, 7, 9, 'k', 1, True); c.line(9, 9, 11, 9, 'k', 1, True)
    if eyes == 'mad': c.px(5, 8, 'k', True); c.px(11, 8, 'k', True)
    if eyes == 'x':
        for dx in (0, 4): c.px(5 + dx, 8, 'k', True); c.px(7 + dx, 8, 'k', True); c.px(6 + dx, 9, 'k', True); c.px(5 + dx, 10, 'k', True); c.px(7 + dx, 10, 'k', True)
    if cheek: c.px(4, 11, cheek, True); c.px(12, 11, cheek, True)
    if mouth == 'grin': c.line(5, 12, 11, 12, 'k', 1, True); c.px(4, 11, 'k', True); c.px(12, 11, 'k', True); c.line(6, 13, 10, 13, 'R', 1, True)
    elif mouth == 'smile': c.line(6, 13, 10, 13, 'k', 1, True); c.px(5, 12, 'k', True); c.px(11, 12, 'k', True)
    elif mouth == 'frown': c.line(6, 12, 10, 12, 'k', 1, True); c.px(5, 13, 'k', True); c.px(11, 13, 'k', True)
    elif mouth == 'o': c.ell(8, 12.5, 1.2, 1.2, 'k', True)
    elif mouth == 'teeth': c.rect(5, 12, 11, 13, 'k', True); c.line(6, 12, 10, 12, 'w', 1, True)
    elif mouth == 'flat': c.line(6, 12, 10, 12, 'k', 1, True)
    if extra: extra(c)
    return c.done()


def card(name, f, w=16, h=16, shade=True):
    c = Cv(w, h); f(c); S[name] = c.done(shade=shade)


S['jk_joker'] = jester()
S['jk_half'] = jester(extra=lambda c: (c.rect(8, 1, 15, 15, '.'), c.line(8, 4, 8, 14, 'k', 1, True)))
S['jk_misprint'] = jester(hat=('G', 'P'), extra=lambda c: [c.px(x, y, 'C', True) for x, y in ((3, 9), (13, 10), (4, 13), (11, 4), (12, 14))])
S['jk_abstract'] = jester(hat=('P', 'Y'), face='C', eyes='wide', mouth='o', cheek=None)
S['jk_even'] = jester(hat=('R', 'R'), mouth='smile')
S['jk_odd'] = jester(hat=('G', 'G'), mouth='smile', eyes='closed')
S['jk_scholar'] = jester(hat=('d', 'd'), eyes='dot', mouth='flat', extra=lambda c: (c.rect(4, 8, 12, 10, '.'), c.rect(4, 8, 7, 10, 'g'), c.rect(9, 8, 12, 10, 'g'), c.px(5, 9, 'k', True), c.px(10, 9, 'k', True), c.line(7, 9, 9, 9, 'g', 1, True)))
S['jk_smiley'] = jester(hat=('Y', 'Y'), face='Y', mouth='smile', cheek=None)
S['jk_scary'] = jester(hat=('d', 'p'), face='g', eyes='mad', mouth='teeth', cheek=None)
S['jk_greedy'] = jester(hat=('o', 'o'), mouth='teeth', extra=lambda c: glyph(c, PIPS['d'], 6, 1, 'o'))
S['jk_lusty'] = jester(hat=('R', 'R'), mouth='smile', eyes='closed', extra=lambda c: glyph(c, PIPS['h'], 6, 1, 'R'))
S['jk_wrath'] = jester(hat=('d', 'd'), mouth='frown', eyes='mad', extra=lambda c: glyph(c, PIPS['s'], 6, 1, 'b'))
S['jk_glutton'] = jester(hat=('t', 't'), mouth='o', extra=lambda c: glyph(c, PIPS['c'], 6, 1, 't'))
S['jk_jolly'] = jester(hat=('R', 'b'), mouth='grin', eyes='closed')
S['jk_zany'] = jester(hat=('P', 'G'), mouth='o', eyes='wide')
S['jk_mad'] = jester(hat=('R', 'R'), mouth='teeth', eyes='mad')
S['jk_crazy'] = jester(hat=('Y', 'P'), mouth='grin', eyes='x')
S['jk_droll'] = jester(hat=('c', 'c'), mouth='flat', eyes='closed')
S['jk_sly'] = jester(hat=('G', 'd'), mouth='smile', eyes='closed', cheek=None)
S['jk_wily'] = jester(hat=('P', 'd'), mouth='smile', eyes='mad', cheek=None)
S['jk_clever'] = jester(hat=('b', 'd'), mouth='flat', eyes='dot', cheek=None, extra=lambda c: c.px(9, 2, 'Y', True))
S['jk_triboulet'] = jester(hat=('Y', 'Y'), bells='w', mouth='grin', extra=lambda c: (c.rect(5, 2, 11, 4, 'Y', True), [c.px(x, 1, 'Y', True) for x in (5, 8, 11)], c.px(8, 3, 'R', True)))
S['jk_chicot'] = jester(hat=('w', 'w'), bells='Y', mouth='smile', face='f', eyes='dot', extra=lambda c: (c.line(4, 13, 12, 13, 'g', 1, True), c.rect(6, 14, 10, 15, 'g')))
S['jk_canio'] = jester(hat=('d', 'R'), face='g', mouth='frown', eyes='mad')
# 二重奏、三重奏、一家人、秩序、部落：几个小人
def folks(n, col, extra=None):
    def f(c):
        xs = {2: (5, 11), 3: (3, 8, 13), 4: (2, 6, 10, 14)}[n]
        for i, x in enumerate(xs):
            h = 9 if (n == 4 and i in (1, 2)) else 7
            c.ell(x, 15 - h, 1.6, 1.6, 'f'); c.rect(x - 1, 16 - h + 1, x + 1, 15, col[i % len(col)])
        if extra: extra(c)
    return f
card('jk_duo', folks(2, 'Rb'))
card('jk_trio', folks(3, 'RYb'))
card('jk_family', folks(4, 'bRPG'))
card('jk_order', lambda c: (c.rect(1, 2, 14, 13, 'b'), [c.rect(2 + 2 * i, 11 - 2 * i, 3 + 2 * i, 12, 'w') for i in range(5)]))
card('jk_tribe', lambda c: (c.ell(8, 8, 6, 6, 'N'), c.poly([(8, 1), (5, 6), (11, 6)], 'R'), c.poly([(4, 7), (1, 4), (3, 9)], 'G'), c.poly([(12, 7), (15, 4), (13, 9)], 'G'), c.rect(5, 8, 11, 10, 'n'), c.px(6, 9, 'k', True), c.px(10, 9, 'k', True), c.line(6, 12, 10, 12, 'k', 1, True)))
# 东西
card('jk_gros', lambda c: (c.poly([(3, 13), (2, 8), (5, 3), (8, 1), (6, 5), (6, 10), (10, 13), (14, 12), (12, 15), (6, 15)], 'Y'), c.line(8, 1, 9, 0, 'n', 1, True), c.line(4, 6, 4, 11, 'y', 1, True), c.px(14, 12, 'n', True)))
card('jk_cavendish', lambda c: (c.poly([(3, 13), (2, 8), (5, 3), (8, 1), (6, 5), (6, 10), (10, 13), (14, 12), (12, 15), (6, 15)], 'Y'), c.line(8, 1, 9, 0, 'n', 1, True), [c.px(x, y, 'n', True) for x, y in ((4, 7), (5, 11), (9, 13))], c.ell(12, 4, 2.5, 2.5, 'R'), c.px(11, 3, 'w', True)))
card('jk_icecream', lambda c: (c.poly([(4, 8), (12, 8), (8, 15)], 'N'), [c.line(5 + i, 9, 8, 15, 'n', 1, True) for i in (1, 4)], c.ell(8, 6, 4.5, 4, 'w'), c.ell(6, 4, 2, 2, 'P'), c.px(9, 2, 'R', True), c.px(10, 6, 'P', True)))
card('jk_egg', lambda c: (c.ell(8, 9, 5, 6.5, 'w'), c.px(6, 5, 'w', True), c.px(10, 10, 'g', True), c.px(7, 12, 'g', True), c.line(5, 9, 11, 9, 'y', 1, True)))
card('jk_golden', lambda c: (c.ell(8, 9.5, 5, 5, 'Y'), c.poly([(3, 7), (1, 1), (8, 5)], 'y'), c.poly([(13, 7), (15, 1), (8, 5)], 'y'), c.rect(3, 5, 13, 6, 'y'), c.px(6, 9, 'n', True), c.px(10, 9, 'n', True), c.line(5, 12, 11, 12, 'n', 1, True), c.px(5, 4, 'w', True)))
card('jk_rocket', lambda c: (c.poly([(8, 0), (11, 4), (11, 11), (5, 11), (5, 4)], 'w'), c.poly([(5, 8), (2, 12), (5, 12)], 'R'), c.poly([(11, 8), (14, 12), (11, 12)], 'R'), c.ell(8, 6, 1.5, 1.5, 'c', True), c.poly([(6, 12), (10, 12), (8, 15)], 'o'), c.px(8, 13, 'Y', True)))
card('jk_bull', lambda c: (c.ell(8, 9, 5, 4.5, 'n'), c.poly([(3, 6), (0, 1), (5, 5)], 'w'), c.poly([(13, 6), (16, 1), (11, 5)], 'w'), c.ell(8, 12, 3, 2, 'N'), c.px(7, 12, 'k', True), c.px(9, 12, 'k', True), c.px(6, 8, 'k', True), c.px(10, 8, 'k', True), c.ell(8, 14, 1.2, 1, 'Y', True)))
card('jk_bootstraps', lambda c: (c.poly([(4, 1), (10, 1), (10, 10), (14, 12), (14, 15), (4, 15)], 'n'), c.line(4, 4, 10, 4, 'N', 1, True), c.line(6, 1, 6, 0, 'y', 1, True), c.line(4, 14, 14, 14, 'm', 1, True), c.px(8, 7, 'Y', True)))
card('jk_moon', lambda c: (c.rect(0, 0, 15, 15, 'd'), c.ell(10, 5, 4, 4, 'y'), c.ell(12, 4, 3, 3, 'd'), c.poly([(2, 14), (5, 8), (8, 14)], 'w'), c.px(5, 11, 'c', True), c.px(1, 2, 'w', True), c.px(6, 4, 'w', True)))
card('jk_credit', lambda c: (c.rect(1, 3, 14, 12, 'b'), c.rect(1, 5, 14, 6, 'k'), c.rect(3, 8, 6, 10, 'Y'), c.line(8, 10, 12, 10, 'w', 1, True), c.px(12, 4, 'R', True), c.px(13, 4, 'o', True)))
card('jk_splash', lambda c: (c.ell(8, 10, 6, 3, 'c'), c.ell(8, 10, 4, 2, 'C'), [c.ell(x, y, 1, 1.5, 'c') for x, y in ((3, 5), (8, 3), (13, 5), (5, 1))]))
card('jk_blueprint', lambda c: (c.rect(1, 1, 14, 14, 'b'), [c.line(1, y, 14, y, 'c', 1, True) for y in (5, 10)], [c.line(x, 1, x, 14, 'c', 1, True) for x in (5, 10)], c.ell(8, 8, 3, 3, 'w'), c.ell(8, 8, 2, 2, 'b'), c.px(8, 8, 'w', True)))
card('jk_brainstorm', lambda c: (c.ell(8, 7, 6, 5, 'P'), [c.line(x, 4, x + 2, 10, 'p', 1, True) for x in (4, 8)], c.poly([(9, 9), (6, 14), (9, 13), (8, 16)], 'Y'), c.px(5, 4, 'w', True)))
S['jk_green'] = jester(hat=('G', 'l'), face='l', mouth='smile', cheek='G')
card('jk_bus', lambda c: (c.rect(1, 3, 14, 12, 'R'), c.rect(2, 5, 13, 8, 'C'), [c.line(x, 5, x, 8, 'R', 1, True) for x in (5, 9)], c.ell(4, 13, 1.6, 1.6, 'd'), c.ell(11, 13, 1.6, 1.6, 'd'), c.rect(1, 10, 14, 10, 'Y')))
card('jk_supernova', lambda c: (c.ell(8, 8, 3.5, 3.5, 'Y'), [c.line(8, 8, 8 + 7 * math.cos(a), 8 + 7 * math.sin(a), 'o', 1) for a in [i * math.pi / 4 for i in range(8)]], c.ell(8, 8, 2, 2, 'w')))
card('jk_hologram', lambda c: (c.rect(3, 13, 12, 15, 'g'), c.ell(8, 7, 4, 5, 'C'), c.ell(8, 7, 2.5, 3.5, 'c'), [c.px(x, y, 'w', True) for x, y in ((6, 5), (10, 5))], c.line(6, 9, 10, 9, 'w', 1, True)))
card('jk_constellation', lambda c: (c.rect(0, 0, 15, 15, 'd'), [c.line(a[0], a[1], b[0], b[1], 's', 1, True) for a, b in (((2, 12), (5, 7)), ((5, 7), (9, 9)), ((9, 9), (13, 3)), ((9, 9), (12, 13)))], [c.px(x, y, 'Y', True) for x, y in ((2, 12), (5, 7), (9, 9), (13, 3), (12, 13))]))
card('jk_stencil', lambda c: (c.rect(1, 1, 14, 14, 'N'), c.ell(8, 9, 4, 4, '.'), c.poly([(4, 7), (3, 2), (8, 5)], '.'), c.poly([(12, 7), (13, 2), (8, 5)], '.')))
card('jk_photo', lambda c: (c.rect(1, 2, 14, 13, 'w'), c.rect(3, 3, 12, 10, 'c'), c.ell(8, 7, 2.5, 2.5, 'f'), c.rect(5, 9, 11, 10, 'R'), c.line(3, 12, 12, 12, 'g', 1, True)))
card('jk_baron', lambda c: (c.rect(3, 9, 12, 13, 'Y'), [c.poly([(x - 2, 9), (x, 3), (x + 2, 9)], 'Y') for x in (4, 8, 12)], [c.px(x, 11, col, True) for x, col in ((5, 'R'), (8, 'c'), (11, 'R'))], c.line(3, 14, 12, 14, 'N', 1, True)))
card('jk_blackboard', lambda c: (c.rect(1, 2, 14, 12, 'n'), c.rect(2, 3, 13, 11, 't'), glyph(c, PIPS['s'], 3, 4, 'w'), glyph(c, PIPS['c'], 8, 5, 'w'), c.line(4, 14, 4, 15, 'n'), c.line(11, 14, 11, 15, 'n')))
card('jk_arrow', lambda c: (c.poly([(8, 1), (13, 7), (10, 7), (10, 14), (6, 14), (6, 7), (3, 7)], 's'), c.line(8, 3, 8, 12, 'g', 1, True)))
card('jk_onyx', lambda c: (c.poly([(8, 1), (14, 6), (11, 14), (5, 14), (2, 6)], 'd'), c.poly([(8, 1), (14, 6), (8, 7)], 's'), c.px(6, 5, 'g', True)))
card('jk_blood', lambda c: (c.ell(8, 9, 5, 5.5, 'R'), c.ell(8, 9, 3, 3.5, 'r'), c.px(6, 6, 'o', True), c.px(7, 5, 'w', True)))
card('jk_rough', lambda c: (c.poly([(8, 1), (14, 6), (8, 15), (2, 6)], 'o'), c.poly([(8, 1), (14, 6), (8, 6)], 'y'), c.poly([(2, 6), (8, 6), (8, 15)], 'R'), c.px(6, 4, 'w', True)))
card('jk_smeared', lambda c: (glyph(c, PIPS['h'], 1, 2, 'R'), glyph(c, PIPS['d'], 6, 6, 'o'), glyph(c, PIPS['s'], 10, 2, 'd'), glyph(c, PIPS['c'], 5, 10, 't'), c.line(2, 14, 14, 1, 'P', 1, True)), shade=False)
card('jk_fourfinger', lambda c: (c.rect(3, 8, 12, 15, 'f'), [c.rect(x, 2 + (1 if x in (3, 12) else 0), x + 1, 8, 'f') for x in (3, 6, 9, 12)], [c.line(x + 2, 4, x + 2, 8, 'F', 1, True) for x in (3, 6, 9)]))
card('jk_fib', lambda c: (c.rect(0, 0, 15, 15, 'w'), c.rect(0, 0, 7, 7, 'Y'), c.rect(8, 0, 15, 7, 'R'), c.rect(0, 8, 3, 15, 'c'), c.rect(4, 8, 15, 15, 'G'), c.line(7, 8, 7, 15, 'w', 1, True)), shade=False)
card('jk_hiker', lambda c: (c.ell(8, 3, 2.5, 2.5, 'f'), c.rect(5, 0, 11, 1, 'G'), c.rect(6, 6, 10, 11, 'N'), c.rect(10, 5, 13, 10, 'R'), c.line(6, 12, 4, 15, 'n', 2), c.line(10, 12, 12, 15, 'n', 2), c.line(3, 5, 1, 15, 'n', 1)))
card('jk_blue', lambda c: (c.ell(8, 9.5, 5, 5, 'c'), c.poly([(3, 7), (1, 1), (8, 5)], 'b'), c.poly([(13, 7), (15, 1), (8, 5)], 'b'), c.rect(3, 5, 13, 6, 'b'), c.px(6, 9, 'k', True), c.px(10, 9, 'k', True), c.line(6, 13, 10, 13, 'k', 1, True), c.px(5, 12, 'k', True), c.px(11, 12, 'k', True)))

# ---------------------------------------------------------------- 立绘 32×32
# 吉姆博：原作的小丑，红蓝两角帽、金铃铛、白脸、红脸蛋、咧嘴笑
c = Cv(32, 32)
c.poly([(2, 32), (5, 25), (11, 22), (21, 22), (27, 25), (30, 32)], 'b'); c.poly([(16, 22), (21, 22), (27, 25), (30, 32), (16, 32)], 'R')
for x in range(5, 28, 4): c.poly([(x, 22), (x + 2, 26), (x + 4, 22)], 'Y')
c.ell(16, 15, 8, 8.5, 'w')
c.poly([(8, 12), (1, 1), (14, 7)], 'R'); c.poly([(24, 12), (31, 1), (18, 7)], 'b'); c.rect(7, 7, 25, 9, 'R'); c.rect(16, 7, 25, 9, 'b')
c.ell(1.8, 1.8, 2, 2, 'Y', True); c.ell(30.2, 1.8, 2, 2, 'Y', True)
c.rect(11, 13, 13, 15, 'k', True); c.px(12, 13, 'w', True); c.rect(19, 13, 21, 15, 'k', True); c.px(20, 13, 'w', True)
c.ell(9.5, 18, 1.6, 1.2, 'R', True); c.ell(22.5, 18, 1.6, 1.2, 'R', True)
c.line(10, 19, 22, 19, 'k', 1, True); c.px(9, 18, 'k', True); c.px(23, 18, 'k', True); c.line(11, 20, 21, 20, 'R', 1, True); c.line(12, 21, 20, 21, 'k', 1, True)
S['p_jimbo'] = c.done()

# 红色牌组：原作的红色牌背，白边，白色菱形花纹
def deck_back(col, col2, pat):
    c = Cv(32, 32)
    c.rect(5, 1, 26, 30, 'w'); c.rect(7, 3, 24, 28, col)
    pat(c, col2)
    c.line(26, 2, 26, 30, 'g', 1, True); c.line(6, 30, 26, 30, 'g', 1, True)
    return c.done(shade=False)


def diamonds(c, col2):
    for y in range(4, 28, 4):
        for x in range(8, 24, 4):
            c.px(x + (2 if (y // 4) % 2 else 0), y, col2, True); c.px(x + (2 if (y // 4) % 2 else 0), y + 1, col2, True)
    c.ell(16, 15.5, 4, 5, col2, True); c.ell(16, 15.5, 2.5, 3.5, 'R', True)


S['p_deck_red'] = deck_back('R', 'w', diamonds)


def swirl(c, col2):
    for i in range(0, 60):
        a = i * 0.35; r = 1 + i * 0.16
        c.px(16 + r * math.cos(a), 15.5 + r * math.sin(a) * 1.2, col2, True)
    for i in range(0, 60):
        a = i * 0.35 + math.pi; r = 1 + i * 0.16
        c.px(16 + r * math.cos(a), 15.5 + r * math.sin(a) * 1.2, 'c', True)
    c.ell(16, 15.5, 1.5, 1.5, 'w', True)


S['p_deck_plasma'] = deck_back('p', 'P', swirl)

# ---------------------------------------------------------------- 事件图标
c = Cv(); c.ell(8, 8, 5, 5, 'P'); c.ell(8, 8, 7, 2, 'p'); c.ell(8, 8, 3, 3, 'Y'); c.px(7, 7, 'w', True); [c.px(x, y, 'Y', True) for x, y in ((1, 2), (14, 3), (13, 14))]; S['dl_ev_planet'] = c.done()
c = Cv(); c.rect(2, 1, 13, 14, 'P'); c.rect(3, 2, 12, 13, 'p'); c.ell(8, 7.5, 3, 3, 'Y'); c.px(8, 7, 'w', True); [c.px(x, y, 'Y', True) for x, y in ((4, 3), (11, 12))]; S['dl_ev_tarot'] = c.done()
c = Cv(); c.rect(2, 1, 13, 14, 'b'); c.rect(3, 2, 12, 13, 'd'); c.ell(8, 7.5, 3, 4, 'C'); c.ell(8, 7.5, 1.5, 2.5, 'w'); [c.px(x, y, 'C', True) for x, y in ((4, 3), (11, 12), (4, 12))]; S['dl_ev_spectral'] = c.done()
c = Cv(); c.rect(1, 3, 14, 14, 'R'); c.rect(1, 3, 14, 5, 'r'); c.rect(6, 1, 9, 5, 'Y'); c.ell(8, 10, 3.5, 3, 'w'); c.px(7, 10, 'k', True); c.px(9, 10, 'k', True); c.line(6, 12, 10, 12, 'R', 1, True); S['dl_ev_buffoon'] = c.done()
c = Cv(); c.rect(1, 3, 14, 14, 'g'); c.rect(1, 3, 14, 5, 's'); c.rect(4, 6, 8, 13, 'w'); c.rect(8, 7, 12, 14, 'w'); c.px(6, 8, 'R', True); c.px(10, 9, 'k', True); S['dl_ev_standard'] = c.done()
c = Cv(); c.rect(1, 4, 14, 11, 'G'); c.rect(2, 5, 13, 10, 'l'); c.ell(8, 7.5, 2, 2, 'Y'); [c.px(x, 6, 'w', True) for x in (3, 12)]; S['dl_ev_voucher'] = c.done()

# ---------------------------------------------------------------- 敌人：会走的牌和增强
def ecard(col, inner, f=None, w=16):
    def g(c):
        c.rect(3, 1, 12, 14, col); c.rect(4, 2, 11, 13, inner)
        c.px(6, 6, 'k', True); c.px(9, 6, 'k', True)
        c.line(2, 15, 4, 15, 'k', 1, True); c.line(11, 15, 13, 15, 'k', 1, True)
        if f: f(c)
    return g


c = Cv(); c.ell(8, 9, 6.5, 6.5, 'R'); c.ell(8, 9, 4.5, 4.5, 'w'); c.ell(8, 9, 3.5, 3.5, 'R')
for a in [i * math.pi / 3 for i in range(6)]: c.px(8 + 5.5 * math.cos(a), 9 + 5.5 * math.sin(a), 'w', True)
c.px(7, 8, 'k', True); c.px(9, 8, 'k', True); c.line(7, 11, 9, 11, 'k', 1, True); S['dl_chip'] = c.done()
c = Cv(); c.poly([(6, 7), (0, 3), (0, 8), (2, 11), (6, 10)], 'g'); mirror(c); c.rect(5, 3, 10, 13, 'w'); glyph(c, PIPS['h'], 5, 6, 'R'); S['dl_card'] = c.done()
c = Cv(); c.rect(2, 3, 13, 14, 'w'); c.poly([(2, 3), (5, 0), (15, 0), (13, 3)], 'g'); c.poly([(13, 3), (15, 0), (15, 11), (13, 14)], 's')
for x, y in ((5, 6), (10, 6), (5, 11), (10, 11)): c.ell(x, y, 1, 1, 'k', True)
c.px(7, 8, 'R', True); c.px(8, 8, 'R', True); S['dl_dice'] = c.done()
c = Cv(12, 12); c.rect(2, 2, 9, 9, 'w'); c.ell(5.5, 5.5, 1.2, 1.2, 'R', True); c.px(4, 4, 'k', True); c.px(7, 4, 'k', True); S['dl_pip'] = c.done()
card('dl_spade', ecard('w', 'w', lambda c: (glyph(c, PIPS['s'], 5, 7, 'd'), c.line(1, 4, 3, 13, 'g', 1))))
card('dl_steel', ecard('s', 'g', lambda c: (c.line(5, 3, 10, 12, 'w', 1, True), c.line(7, 3, 11, 10, 'w', 1, True))), w=16)
card('dl_stone', ecard('n', 'N', lambda c: [c.px(x, y, 'n', True) for x, y in ((5, 9), (9, 11), (8, 4), (5, 12))]))
card('dl_lucky', ecard('w', 'l', lambda c: (c.ell(6.5, 9.5, 1.5, 1.5, 'G'), c.ell(9.5, 9.5, 1.5, 1.5, 'G'), c.ell(8, 8, 1.5, 1.5, 'G'), c.ell(8, 11, 1.5, 1.5, 'G'), c.line(8, 11, 9, 13, 'G', 1, True))))
card('dl_multc', ecard('w', 'R', lambda c: glyph(c, FONT['+'], 6, 8, 'w')))
card('dl_bonusc', ecard('w', 'c', lambda c: glyph(c, FONT['+'], 6, 8, 'w')))
card('dl_glass', ecard('C', 'w', lambda c: (c.line(5, 9, 10, 12, 'c', 1, True), c.line(10, 3, 11, 5, 'c', 1, True))))
card('dl_wildc', ecard('w', 'Y', lambda c: (c.px(5, 9, 'R', True), c.px(10, 9, 'd', True), c.px(5, 12, 't', True), c.px(10, 12, 'o', True))))
card('dl_goldc', ecard('Y', 'y', lambda c: c.ell(7.5, 10, 2, 2, 'Y')))
card('dl_goldc2', ecard('Y', 'y', lambda c: (c.rect(5, 8, 10, 11, 'k', True), c.line(5, 8, 10, 8, 'w', 1, True), c.ell(7.5, 13, 1.5, 1, 'Y'))))
card('dl_misprintc', ecard('w', 'w', lambda c: [c.px(x, y, col, True) for x, y, col in ((5, 9, 'R'), (7, 10, 'c'), (9, 8, 'G'), (10, 12, 'P'), (6, 12, 'Y'))]))
card('dl_death', ecard('p', 'd', lambda c: (c.ell(7.5, 8, 2.2, 2.2, 'w'), c.px(7, 8, 'k', True), c.px(9, 8, 'k', True), c.line(7, 11, 9, 11, 'w', 1, True), c.line(11, 2, 11, 13, 'g', 1), c.poly([(11, 2), (14, 4), (11, 4)], 'g'))))
card('dl_pluto', lambda c: (c.ell(8, 8, 6, 6, 'N'), c.ell(6, 6, 2, 1.5, 'y'), c.px(10, 10, 'n', True), c.px(9, 5, 'n', True), c.px(6, 9, 'k', True), c.px(10, 7, 'k', True)))
card('dl_pack', lambda c: (c.rect(3, 6, 26, 27, 'R'), c.rect(3, 6, 26, 9, 'r'), c.rect(12, 2, 17, 9, 'Y'), c.ell(14.5, 17, 6, 5, 'w'), c.px(12, 16, 'k', True), c.px(17, 16, 'k', True), c.line(11, 19, 18, 19, 'R', 1, True), c.line(3, 28, 7, 28, 'k', 1, True), c.line(22, 28, 26, 28, 'k', 1, True)), w=30, h=30)

# ---------------------------------------------------------------- 首领盲：一枚圆筹码，中间是记号（原作的样子）
def chip(size, col, ring, emblem):
    c = Cv(size, size); m = size / 2 - .5; R = size / 2 - 1
    c.ell(m, m, R, R, ring); c.ell(m, m, R - 2.5, R - 2.5, col)
    for i in range(8):
        a = i * math.pi / 4
        c.rect(int(m + (R - 1.2) * math.cos(a)) - 1, int(m + (R - 1.2) * math.sin(a)) - 1, int(m + (R - 1.2) * math.cos(a)), int(m + (R - 1.2) * math.sin(a)), 'w')
    emblem(c, m, size)
    return c.done()


S['dl_b_hook'] = chip(30, 'R', 'r', lambda c, m, s: (c.line(16, 6, 16, 18, 'g', 2), c.ell(12.5, 19, 4.5, 4, 'g'), c.ell(12.5, 18.5, 2.5, 2.2, 'R'), c.rect(7, 12, 11, 18, 'R'), c.poly([(8, 18), (7, 13), (11, 16)], 'g')))
S['dl_b_wall'] = chip(30, 'P', 'p', lambda c, m, s: ([c.rect(7, y, 22, y + 2, 'N') for y in (9, 13, 17)], [c.line(x + (2 if (y // 4) % 2 else 0), y, x + (2 if (y // 4) % 2 else 0), y + 2, 'n', 1, True) for y in (9, 13, 17) for x in (10, 15, 20)]))
S['dl_b_fish'] = chip(30, 'c', 'b', lambda c, m, s: (c.ell(13, 15, 6, 3.5, 'w'), c.poly([(18, 15), (23, 11), (23, 19)], 'w'), c.px(10, 14, 'k', True), c.line(15, 13, 15, 17, 'g', 1, True)))
S['dl_b_tooth'] = chip(32, 'R', 'u', lambda c, m, s: (c.poly([(10, 9), (22, 9), (21, 18), (19, 24), (17, 18), (15, 18), (13, 24), (11, 18)], 'w'), c.line(16, 10, 16, 16, 'g', 1, True)))
S['dl_acorn'] = chip(48, 'o', 'n', lambda c, m, s: (c.ell(23.5, 27, 9, 11, 'N'), c.ell(21, 23, 3, 5, 'y'), c.poly([(12, 21), (14, 13), (23.5, 10), (33, 13), (35, 21)], 'n'), [c.line(x, 13, x - 3, 20, 'm', 1, True) for x in (17, 22, 27, 32)], c.line(23.5, 10, 25, 5, 'm', 2)))
S['dl_leaf'] = chip(48, 'G', 't', lambda c, m, s: (c.poly([(12, 34), (14, 20), (23.5, 9), (34, 18), (34, 30), (22, 36)], 'l'), c.line(12, 36, 31, 15, 'G', 1, True), [c.line(17 + 4 * i, 31 - 4 * i, 14 + 4 * i, 24 - 4 * i, 'G', 1, True) for i in range(4)], [c.line(17 + 4 * i, 31 - 4 * i, 25 + 4 * i, 31 - 4 * i, 'G', 1, True) for i in range(3)]))
S['dl_vessel'] = chip(48, 'P', 'p', lambda c, m, s: (c.ell(23.5, 28, 9, 9, 'p'), c.rect(19, 13, 28, 20, 'p'), c.ell(23.5, 13, 6, 2, 'P'), c.poly([(15, 25), (32, 25), (29, 31), (18, 31)], 'Y'), c.ell(19, 25, 1.5, 2.5, 'w', True)))
S['dl_crimson'] = chip(48, 'R', 'r', lambda c, m, s: (c.ell(18.5, 21, 6, 6, 'e'), c.ell(28.5, 21, 6, 6, 'e'), c.poly([(12.5, 23), (34.5, 23), (23.5, 36)], 'e'), c.ell(18, 19, 2.5, 2.5, 'R', True), c.px(17, 18, 'w', True)))
S['dl_bell'] = chip(48, 'c', 'b', lambda c, m, s: (c.poly([(14, 33), (16, 20), (19, 13), (23.5, 11), (28, 13), (31, 20), (33, 33)], 'w'), c.rect(12, 32, 35, 34, 'g'), c.ell(23.5, 36, 2.5, 2.5, 'Y'), c.ell(23.5, 9, 2, 2, 'g'), c.line(18, 18, 18, 30, 'C', 1, True)))
# 隐藏首领：底注 39 的 naneinf——原作分数爆掉时显示的那串字
S['dl_naneinf'] = chip(48, 'd', 'k', lambda c, m, s: (text(c, 'X', 10, 21, 'R'), text(c, 'X', 15, 21, 'Y'), text(c, 'X', 20, 21, 'c'), text(c, 'X', 25, 21, 'l'), text(c, 'X', 30, 21, 'P'), [c.px(x, y, col, True) for x, y, col in ((12, 14, 'w'), (33, 15, 'C'), (20, 32, 'R'), (28, 31, 'Y'), (16, 30, 'l'))]))


def write(path):
    for k, rows in S.items(): assert rows and all(len(r) == len(rows[0]) for r in rows), k
    open(path, 'w', encoding='utf-8').write(
        '/* 小丑牌模组的像素图（由 mods/official/midnight-deal/art.py 生成，勿手改） / Balatro mod sprites (generated by mods/official/midnight-deal/art.py; do not edit by hand) */\n'
        'const sprites: Record<string, string[]> = ' + json.dumps(S, indent=0, ensure_ascii=False) + ';\nexport default sprites;\n')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    write(os.path.join(here, 'sprites.ts'))
    print('sprites', len(S))
    if '--preview' in sys.argv:
        preview({k: v for k, v in S.items() if len(v) <= 16}, {k: v for k, v in S.items() if len(v) > 16}, os.path.join(here, '..', '..', 'shots', 'deal_preview.png'))
