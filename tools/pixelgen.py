"""像素美术生成器：用几何图元 + 自动描边 + 自动明暗绘制 16×16 卡牌图标与 32×32 人物立绘，
输出 src/data/art/generated.ts。

用法：python3 tools/pixelgen.py            生成 TS
      python3 tools/pixelgen.py --preview  额外输出 shots/art_preview.png 预览图
调色板字母与 src/data/art/palette.ts 的 PAL 一致；新增字母在 EXTRA_PAL 里声明，会一并写进 TS。
"""
import math, os, sys, json

EXTRA_PAL = {
    'a': '#2b2440',  # 深发色
    'A': '#4a3d6b',  # 深发高光
    'i': '#ffe3c8',  # 皮肤高光
    'u': '#7a2230',  # 暗红
    'v': '#ffd9a0',  # 暖光
    'x': '#3d2a1e',  # 深木
    'S': '#9c634c',  # 皮肤深影/唇线
    'B': '#de8978',  # 腮红/自然唇/疤
    'O': '#c85335',  # 暗铜橙发影
    'q': '#351640',  # 兜帽深紫影
    'Q': '#7c3885',  # 中紫布料
    'h': '#c5d8e8',  # 银发/精钢高光
    'H': '#20263f',  # 深夜星蓝
    'j': '#685143',  # 暖褐粗布
    'J': '#dbb382',  # 浅麻/头巾亮色
    'M': '#221a2d',  # 柔暗墨线
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
# 每张卡一张手绘格子（逐像素），只画填色和内部线条；外轮廓由 outline_rows() 统一补 1px 的 k。
# 约定：光从左上来（左上亮、右下暗，暗部往冷色偏）；每个物件 3~5 色 + 描边；
# 元素色做点缀，让同元素的卡像一家：刃=银 w/g/s/d，火=橙红 Y/y/o/R/r，冰=青 w/C/c/b，
# 电=黄 Y/y + 闪电，机=木 N/n/m 或黄铜 Y/y/N，毒=绿 l/G/t（配一点紫 P/p）。
# 物件尽量占满 14×14，留 1px 给描边；同类卡轮廓要有区别（瓶子有圆瓶/锥瓶/方瓶/滴管/钟罩……）。
# 刀剑类刃身至少 3 格宽（亮边 + 刃 + 暗脊），每把一个记忆点（叶形、火星、豁口、烧红……），手机卡面上才认得出。
CARDS = {
    # ---------------- 刃（银）
    'dagger': (  # 飞刀（苦无，叶形刃、缠绳柄、圆环尾）
        '................',
        '..............w.',
        '............wws.',
        '..........wwgs..',
        '.........wwggs..',
        '........wwggs...',
        '.......wwgggs...',
        '.......wgggs....',
        '......wgggs.....',
        '......wgss......',
        '.....Nn.s.......',
        '....Nn..........',
        '...Nn...........',
        'yyyN............',
        'y.y.............',
        'yyy.............',
    ),
    'xbow': (  # 连弩
        '................',
        '............gs..',
        '...yYYYYYN...gs.',
        '...NyyyyyNn..gs.',
        '...NyNNNNNn..gs.',
        '...NNNNNNNn..gs.',
        '..dddddddddgwwgw',
        '.yNNNNNNNNNNNgsn',
        '.NnnnnnnnnnnmgsN',
        '...m.....mm.gs..',
        '..Nn........gs..',
        '..Nn.......gs...',
        '.Nn.......gs....',
        '.nm.............',
        '................',
        '................',
    ),
    'axe': (  # 飞斧
        '................',
        '.....Nn....ww...',
        '.....Nn...wgsw..',
        '....sNnd.wggsw..',
        '....gNnsggggsw..',
        '....gNndsgggsw..',
        '....sNnddssssg..',
        '.....Nn..dsssg..',
        '.....Nn...dssg..',
        '.....Nn....ds...',
        '.....Nn.........',
        '.....Nn.........',
        '.....Nn.........',
        '.....Nm.........',
        '....yYN.........',
        '................',
    ),
    'oathsword': (  # 誓约长剑
        '................',
        '.......w........',
        '......wgs.......',
        '......wgs.......',
        '......wcs.......',
        '......wgs.......',
        '......wcs.......',
        '......wgs.......',
        '......wgs.......',
        '......wgs.......',
        '..yYYYYcNNNNn...',
        '..n...nNm...m...',
        '.......Nm.......',
        '.......nm.......',
        '......yCN.......',
        '................',
    ),
    'ballista': (  # 城防弩车
        '................',
        '..............w.',
        '.............wg.',
        '.......gs...wgs.',
        '......g..s.wgs..',
        '.....g....wgs...',
        '....s....wgs....',
        '.........Ns.....',
        '.......NN.......',
        '......NnN.......',
        '....yNNNNNNNNn..',
        '....nnnnnnnnnm..',
        '...ss......ss...',
        '..sgds....sgds..',
        '..sdds....sdds..',
        '...ss......ss...',
    ),
    'cleaver': (  # 剁骨斧
        '................',
        '................',
        '................',
        '.dssssssssssd...',
        '.sgwwggggg.gsNNy',
        '.swggggggggsnnnN',
        '.sggggggggsssnm.',
        '.sggggggggggs...',
        '.sgggggggggss...',
        '.sggggggggsss...',
        '.sgggggggssss...',
        '.swwwwwwwwwws...',
        '..ssssssssss....',
        '................',
        '................',
        '................',
    ),
    'arrowrain': (  # 箭雨
        '........rw......',
        '.rw.....RN......',
        '.RN.......n.....',
        '...n.......N....',
        '....N.......n.g.',
        '.....n.g.....gw.',
        '......gw....ssw.',
        '.....ssw........',
        '.....rw.........',
        '.....RN.........',
        '.......n........',
        '........N.......',
        '.........n.g....',
        '..........gw....',
        '.........ssw....',
        '................',
    ),
    'whetstone': (  # 磨刀石
        '................',
        '......wgg.......',
        '....wgggssd.....',
        '...wggsssssd..Y.',
        '...gggsssssd.YwY',
        '..wggss.ssssd.Y.',
        '..ggss.m.sssd...',
        '..gsss...sdsd.Y.',
        '...sssssssddYwY.',
        '...dssssssdd.Y..',
        '....dsssdd......',
        '...Nn.dd..Nn....',
        '..Nn......nNn...',
        '.Nn........nN...',
        'yNNNNNNNNNNNNNn.',
        '................',
    ),
    'greatsword': (  # 断罪大剑
        '.......w........',
        '......wgs.......',
        '.....wggss......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.....wgdsd......',
        '.yYYYYYRNNNNn...',
        '..nNNNNrnnnm....',
        '......RrR.......',
        '......RrR.......',
        '......yYN.......',
        '.......n........',
    ),
    'executioner': (  # 刽子手之斧
        '................',
        '....wwg...Nn....',
        '..wwggg..sNnd...',
        '.wgggggsssNnd...',
        '.wgggggsssNnd...',
        'wggggsssssNnd...',
        'wgggssssssNnd...',
        'wggssssdddNnd...',
        '.wgsssdd..Nn....',
        '.wRsdd....Nn....',
        '..rd......Nn....',
        '..........Nn....',
        '..........Nn....',
        '..........Nm....',
        '.........yYN....',
        '................',
    ),
    'bloodrage': (  # 血怒
        '................',
        '.y.........R.R..',
        '..nN......RR.RR.',
        '...nN..y........',
        '....nNY...RR.RR.',
        '.....Y.....R.R..',
        '....Nsgw........',
        '...n..sgw.......',
        '.......sgw......',
        '........sgw.....',
        '.........erR....',
        '..........erR...',
        '...........eR...',
        '............r...',
        '............R...',
        '................',
    ),
    'headxbow': (  # 猎头弩
        '................',
        '..........s.....',
        '..........gs....',
        '..........g.s...',
        '..........g..s..',
        '.Rw.......g...s.',
        '.wR...wgggNsssgw',
        '..NNNNNNNNNNNNNs',
        '.nNnnnnnnnNmmm..',
        '.nnm.nmm..gs....',
        '.nm..Y....g..s..',
        '.nm.......g.s...',
        '.nm.......gs....',
        '..........s.....',
        '................',
        '................',
    ),
    'guillotine': (  # 断头台
        '................',
        '.yNNNNNNNNNNNNn.',
        '.NnmmmmmmmmmmNm.',
        '.Nn.wwwwg...Nm..',
        '.Nn.gggggsd.Nm..',
        '.Nn.ssssssd.Nm..',
        '.Nn.......N.Nm..',
        '.Nn.......n.Nm..',
        '.Nn.......n.Nm..',
        '.Nn.......n.Nm..',
        '.NnyNNNNNNNnNm..',
        '.Nnn..nmm..nNm..',
        '.NnyNNNNNNNNNm..',
        '.Nn.........Nm..',
        'yNNNNNNNNNNNNNNn',
        '................',
    ),
    'honeblade': (  # 磨砺之刃（宽直刃，刃尖迸火星）
        '...........Y.Yw.',
        '...............Y',
        '............www.',
        '...........wwgs.',
        '..........wwgss.',
        '.........wwgss..',
        '........wwgss...',
        '.......wwgss....',
        '....yNwwgss.....',
        '.....yNgss......',
        '......yNs.......',
        '.......yN.......',
        '....Nn..........',
        '...Nn...........',
        '..Nn............',
        '.y..............',
    ),
    'vetblade': (  # 老兵之刃（最宽的刃，豁口、金色大护手）
        '................',
        '............www.',
        '...........wggg.',
        '..........wgggs.',
        '.........wgggss.',
        '........wggggs..',
        '.......wwgggs...',
        '..Yy..wwgggs....',
        '...Yywwgggs.....',
        '....Yygggs......',
        '.....Yy.s.......',
        '......Yy........',
        '.......Yy.......',
        '...Nn...........',
        '..Nn............',
        '.Y..............',
    ),
    'javelin': (  # 标枪手
        '...........wg...',
        '.........wwgs...',
        '........wgsd....',
        '........dd......',
        '.......Nn....wg.',
        '......Nn...wwgs.',
        '.....yN...wgsd..',
        '....yN....dd....',
        '...Nn....Nn.....',
        '..Nn....Nn......',
        '.Nn....yN.......',
        'sd....yN........',
        '.....Nn.........',
        '....Nn..........',
        '...sd...........',
        '................',
    ),
    'nightsword': (  # 守夜人之剑
        '.......w........',
        '......wCs.......',
        '......wbs.......',
        '......wbs.......',
        '......wbs.......',
        '......wbs.......',
        '......wbs.......',
        '......wbs.......',
        '......wbs.......',
        '.Y...yYYYN...N..',
        '.yYYYYYCNNNNNNn.',
        '..n...mNm...m...',
        '.......Nm.......',
        '.......nm.......',
        '......yCN.......',
        '.......n........',
    ),
    # ---------------- 火（橙红）
    'spark': (  # 火花
        '................',
        '.......r........',
        '.......R........',
        '..o....o....o...',
        '...o...y...o....',
        '......oYo.......',
        '.....oYYYo......',
        '.rRoyYYwYYyoRr..',
        '.....oYYyR......',
        '......oyR.......',
        '...o...R...R....',
        '..o....R....o...',
        '.......r........',
        '.......e........',
        '................',
        '................',
    ),
    'cannon': (  # 火炮
        '................',
        '...........wgs..',
        '..........wggsd.',
        '........wwgggsd.',
        '......wwgggssd..',
        '....wwgggsssd...',
        '..wwgggsssdd....',
        '.Yggsssddd......',
        '..sddd.NNNNn....',
        '...NNn.NNNNnn...',
        '..Ny.ynNNnnnm...',
        '..NyYynNnnnm....',
        '..Ny.yn.........',
        '...nnm..........',
        '................',
        '................',
    ),
    'dragon': (  # 龙焰
        '................',
        '..y...y.........',
        '..Nn..Nn........',
        '...RRRRRn.......',
        '..RRRRRRRR......',
        '.RRYkRRRRRr.....',
        '.RRRRRRRRRRr....',
        '.rRRRrrrrrrrr...',
        '.rrew.w.w.Yyoo..',
        '.errrrrrYYYyoR..',
        '..eeeerYYwYyoRR.',
        '.......RoYYyooR.',
        '........RoyyoR..',
        '.........RRoR...',
        '..........rR....',
        '................',
    ),
    'oilbarrel': (  # 猛火油桶
        '.......R........',
        '......Ro...R....',
        '.....RoyR.Ro....',
        '....RoYyoRoR....',
        '.....ryYYor.....',
        '...nNNNNNNnn....',
        '..nNyyyyyyNnm...',
        '..sgsssssssds...',
        '..NyNNNNNNnnm...',
        '..NyNNNNNNnnm...',
        '..NyNNNNNNnnm...',
        '..sgsssssssds...',
        '..NyNNNNNNnnm...',
        '..nNNNNNNNnnm...',
        '...nnnnnnnmm....',
        '................',
    ),
    'wildfire': (  # 燎原野火
        '................',
        '....R...........',
        '....oR......R...',
        '...Roo.....Ro...',
        '...RoyR....RoR..',
        '..RoyyoR..RoyR..',
        '..RoyYyoRRoyyoR.',
        '.RoyYYyooyyYyoR.',
        '.RoyYwYyyyYYYyor',
        'RoyYwwYyyYwwYyor',
        'RoyYwwwYYwwwYyor',
        'RoyYYwwwwwwYYyor',
        '.RoyyYYYYYYyyor.',
        '..rRooooooooorr.',
        '................',
        '................',
    ),
    'vial': (  # 炼金瓶
        '................',
        '......NNn.......',
        '......NNn.......',
        '.......Cw.......',
        '.......Cc.......',
        '......wCcc......',
        '....wCCCCccb....',
        '...wCCCCCcccb...',
        '...CRoooooRRb...',
        '..wRoYyooooRrb..',
        '..CRoyooooRRrb..',
        '..cRooooRRRrrd..',
        '...RRooRRRrrd...',
        '...brRRRRrrdb...',
        '....bbrrrrdd....',
        '......dddd......',
    ),
    'starfall': (  # 星陨
        'w...............',
        '.y..............',
        '..o..y..........',
        '.y.o.o..........',
        '....RoRo........',
        '...o.RoyR.......',
        '......RoyoR.....',
        '.....R.RoyyoR...',
        '........RoYYyoR.',
        '.........RyYwwYo',
        '.........oYwwwYy',
        '.........RYwwYyo',
        '..........oYYyoR',
        '..........RoyoR.',
        '...........RRr..',
        '................',
    ),
    'oilflask': (  # 火油瓶
        '.......Y........',
        '......YoY.......',
        '.....oYwYo......',
        '......oyo.......',
        '.......R........',
        '......wgR.......',
        '......wrr.......',
        '......wgs.......',
        '.....wggss......',
        '....wgggsss.....',
        '....NNyyyNn.....',
        '....NyYyyyn.....',
        '....NyyyyNn.....',
        '....NNNNNNn.....',
        '.....nnnnn......',
        '................',
    ),
    'firebrand': (  # 烈焰斩
        '..............R.',
        '............RoR.',
        '...........RowoR',
        '..........RoYwoR',
        '.........RoYwgR.',
        '........RoYwgs..',
        '.......RoYwgs...',
        '......RoYwgs....',
        '.....Rywgs......',
        '..y..RYgs.......',
        '...Y.Ygs........',
        '....NYs.........',
        '...Nn.N.........',
        '..Nn...n........',
        '.Nn.............',
        'yN..............',
    ),
    'detonate': (  # 引爆索
        '................',
        '...yYYYYYYYN....',
        '...nNNNNNNNm..Y.',
        '.......gs....YwY',
        '.......gs.....Y.',
        '.......gs.....n.',
        '...yyyyyyyyyN.n.',
        '..yNNNNNNNNNnnn.',
        '..NRRRRRRRRRrn..',
        '..NRoRRRRRRRrn..',
        '..NRRRRRRRRRrn..',
        '..NRRRRRRRRrrn..',
        '..nnnnnnnnnnnm..',
        '................',
        '................',
        '................',
    ),
    'emberblade': (  # 烬刃（烧红的刃，刃口亮黄、脊暗红）
        '.........Y..o...',
        '..........o.....',
        '............YYY.',
        '.......o...YYoR.',
        '......Y...YYoRR.',
        '.........YYoRR..',
        '........YYoRR...',
        '.......YYoRR....',
        '....dsYYoRR.....',
        '.....dsoRR......',
        '......dsR.......',
        '.......ds.......',
        '....mx..........',
        '...mx...........',
        '..mx............',
        '.o..............',
    ),
    'brand': (  # 烙铁
        '................',
        '..oYYo..........',
        '.oYwwYo.........',
        '.Yw..yY.........',
        '.Yw..yo.........',
        '.oYyyoR.........',
        '..oRRRr.........',
        '......rd........',
        '.......ds.......',
        '........ds......',
        '.........ds.....',
        '..........NN....',
        '..........nNN...',
        '...........nNN..',
        '............nNy.',
        '.............nn.',
    ),
    'flamethrower': (  # 喷火铳
        '................',
        '................',
        '.........RR.....',
        '..........oR.RR.',
        '.....dgs..RoRoR.',
        '...wwgggsRoyYoR.',
        '..wggsssYyYwYyoR',
        '..gsdddsRoyYoR..',
        '..NNNNnn..RoR...',
        '...NNnnm..RR....',
        '...Nn...........',
        '...nn...........',
        '..syys..........',
        '..sgys..........',
        '..sdds..........',
        '...dd...........',
    ),
    'phoenix': (  # 凤凰羽
        '................',
        '..............Y.',
        '............YYw.',
        '..........yYYwy.',
        '.........oyYYyo.',
        '........oyyYyoR.',
        '........oyYooR..',
        '......RooyoRr...',
        '.....RooyRRr....',
        '....rRoyRr......',
        '....rRyrre.o....',
        '....ryre........',
        '...rye..........',
        '...N............',
        '..N.............',
        '.n..............',
    ),
    'cinder': (  # 余烬
        '................',
        '.........Y......',
        '.........o......',
        '....y...........',
        '....R...........',
        '.....ddsd.......',
        '...ddsgssdd.....',
        '..dsgsRosssd....',
        '..sgRoYyoRsd....',
        '.dsRoYwYyoRsd...',
        '.dsRoyYYoRrsd...',
        '.ddrRooooRrdd...',
        '..ddrRRRRrddd...',
        '...ddddddddd....',
        '................',
        '................',
    ),
    'oilpit': (  # 火油坑
        '................',
        '................',
        '.......R........',
        '......Ro...R....',
        '..R...RoR..oR...',
        '..oR.RoyoR.RoR..',
        '.RoR.RyYyoRoyR..',
        '.RyoRoyYYoRyoR..',
        '.RYyoyYwYyoYyoR.',
        '..RyYYYwYYYyoR..',
        '.NRoyYYYYYyoRrm.',
        'NnrRooooooooRrnm',
        'Nndppddddddpddnm',
        '.nmddddddddddmx.',
        '..mmmmmmmmmmmx..',
        '................',
    ),
    'sunflare': (  # 阳炎
        '.......YY.......',
        '.......yy.......',
        '..y....oo....o..',
        '...y........o...',
        '.....YYYYyy.....',
        '....YwwYYyyo....',
        '....YwYYyyyo....',
        'Yyo.YYYyyyoo.oRr',
        'yoR.YYyyyooR.Rre',
        '....yyyyooRR....',
        '....oyooRRRr....',
        '.....ooRRrr.....',
        '...o........r...',
        '..R....RR....r..',
        '.......rr.......',
        '.......ee.......',
    ),
    'oilspill': (  # 泼灯油
        'N...............',
        '.Nn.............',
        '..Nn............',
        '...Nn...........',
        '...nNNNNNNn.....',
        '...NyYYYYyNn....',
        '....NyyyyyNy....',
        '.....nNNNnn.y...',
        '......nnm...y...',
        '............N...',
        '...........oYo..',
        '..........oYwYo.',
        '..........RoYoR.',
        '........NyRooRy.',
        '.......NyyyyyyNn',
        '................',
    ),
    'fuse': (  # 引信
        '.........Y......',
        '........YwY.....',
        '.......o.Y......',
        '......oR........',
        '......Nn........',
        '.....Nn.........',
        '....Nn..........',
        '....Nm..........',
        '....yNn.........',
        '.....Nn.........',
        '......Nn........',
        '.......Nn.......',
        '.......yNn......',
        '........Nn......',
        '.......Nn.......',
        '......Nm........',
    ),
    'dragonlantern': (  # 火龙灯
        '................',
        '..Y........Y....',
        '...yY....yY.....',
        '....RRRRRRr.....',
        '...RRYkRRYkr....',
        '...RRRRRRRRr....',
        '..yRRwRRwRRry...',
        '..RoRRRRRRRRr...',
        '..RRyyyyyyyRr...',
        '..RoRRRRRRRRr...',
        '..RRyyyyyyyRr...',
        '...RRRRRRRRr....',
        '....yYYYYYN.....',
        '......R.r.......',
        '.....R..r.......',
        '....r....r......',
    ),
    'paperlamp': (  # 纸灯
        '................',
        '.......n........',
        '......yYN.......',
        '....RRRRRRr.....',
        '...RoRRRRRrr....',
        '..RoyRRRRRRrr...',
        '..RoyRRRRRRrr...',
        '..RyYyRRRRRRr...',
        '..RoyRRRRRRrr...',
        '..RoRRRRRRRrr...',
        '...RRRRRRRrr....',
        '....rrrrrrr.....',
        '......yYN.......',
        '.......R........',
        '......R.r.......',
        '.......r........',
    ),
    'firecracker': (  # 爆竹
        '.........Y......',
        '........YwY.....',
        '.........Y......',
        '........o.......',
        '.......n........',
        '......yYYN......',
        '.....RoRRRr.....',
        '.....RoRRRr.....',
        '.....yYyyyN.....',
        '.....RoRRRr.....',
        '.....RoRRRr.....',
        '.....yYyyyN.....',
        '.....RoRRRr.....',
        '.....RoRRRr.....',
        '......nnnn......',
        '................',
    ),
    'lamplight': (  # 灯阵
        '................',
        'nnnnnnnnnnnnnnnn',
        '..n....n....n...',
        '..n....n....n...',
        '.yYN..yYN..yYN..',
        'RYwYrRYwYrRYwYr.',
        'RYYyrRYYyrRYYyr.',
        'RyyorRyyorRyyor.',
        '.yYN..yYN..yYN..',
        '..R....R....R...',
        '..r....r....r...',
        '................',
        '................',
        '................',
        '................',
        '................',
    ),
    'oilpot': (  # 添油
        '................',
        '................',
        '.....nNNn.......',
        '....NyyyNn......',
        '...NyNNNNNn.....',
        '..sgsssssdsd....',
        '..NyNNNNNnnnnnm.',
        '..NyNNNNNnnm..y.',
        '..NyNNNNNnnm..N.',
        '..NNNNNNnnnm....',
        '...NNNNnnnm...y.',
        '....nnnnmm...yYN',
        '.............NNn',
        '................',
        '................',
        '................',
    ),
    'moth': (  # 飞蛾
        '................',
        '.....n....n.....',
        '......n..n......',
        '.RoY...nn...YoR.',
        'RoyYy.nNNn.yYyoR',
        'RoYwYynNNnyYwYoR',
        'RoyYyynNNnyyYyoR',
        '.RoyyynNNnyyyoR.',
        '..RoooyNNyooor..',
        '...RRoRnnRoRRr..',
        '..RoyoRnnRoyoR..',
        '.RoYyoR.nRoyYoR.',
        '.RoyoR.m.mRoyoR.',
        '..RRr......rRR..',
        '................',
        '................',
    ),
    'skylantern': (  # 孔明灯
        '................',
        '......yNNy......',
        '....yNNNNNNn....',
        '...yNyyNyyNNn...',
        '...yyyyNyyyNn...',
        '...yyYyNYyyNn...',
        '...yYYYyYYyyN...',
        '...yYwYyYYYyN...',
        '....YwYYyYYy....',
        '....YYwYyYYy....',
        '....nNNNNNNn....',
        '.....n.oY.n.....',
        '......oYwo......',
        '.......oR.......',
        '................',
        '................',
    ),
    'sparkwick': (  # 引火芯
        '................',
        '.......o........',
        '......oy........',
        '......yYo.......',
        '.....oYwYo......',
        '.....oYwYo......',
        '......oYo.......',
        '.......m........',
        '.....wvvvy......',
        '.....wvvvy......',
        '....wwvvyy......',
        '.....wvvyN......',
        '.....wvvyN......',
        '...yYyyyyNNn....',
        '....nnnnnnm.....',
        '................',
    ),
    'volley': (  # 连珠火铳
        '..............Y.',
        '...wgggggggs.YwY',
        '...ddddddddd..Y.',
        '...wgggggggsY...',
        '...ddddddddd.YwY',
        '...wgggggggs..Y.',
        '..yNNNNNNNNNn...',
        '..NyNNnnnnnnm...',
        '..Nyn...........',
        '.NNyn...........',
        '.NNnn...........',
        '.Nnn............',
        '................',
        '................',
        '................',
        '................',
    ),
    'oiltrap': (  # 火油陷阱
        '................',
        '................',
        '.g............s.',
        '.gw..........ws.',
        '.gww...R....wws.',
        '.gw...RoR....ws.',
        '.gww.RoyoR..wws.',
        '..gw.RyYyR...ws.',
        '..gww.RYR...wws.',
        '...gs.oYo..wsd..',
        '....gssssssssd..',
        '..dsssdddddddsd.',
        '...d.........d..',
        '................',
        '................',
        '................',
    ),
    'crucible': (  # 元素熔炉
        '..y.........l...',
        '.yYy..c....lGl..',
        '..y..cCc....l...',
        '.....RYc.lG.....',
        '....RoyYyYlG....',
        '...ggRoyYGGgg...',
        '..wgggggggggsd..',
        '..wgsssssssssd..',
        '..gsddddddddsd..',
        '..gsdoRRRRRdsd..',
        '..gsdRooooRdsd..',
        '..gsdRoYYoRdsd..',
        '...gsdRRRRdsd...',
        '....sdddddsd....',
        '.....s....d.....',
        '....ss....dd....',
    ),
    'crackers': (  # 连环爆竹
        '......nn........',
        '.......n........',
        '......yYN.......',
        '......RoR.......',
        '......RoR.......',
        '......yYN.......',
        '.....n...n......',
        '....yYN.RoR...Y.',
        '....RoR.RoR..YwY',
        '....RoR.yYN...Y.',
        '....yYN...n.....',
        '.....n...n......',
        '....yYN.yYN.....',
        '....RoR.RoR.....',
        '....RoR.RoR.....',
        '................',
    ),
    'lamps': (  # 百盏灯
        '................',
        '..o....o....o...',
        '.oYo..oYo..oYo..',
        '.oYo..oYo..oYo..',
        '..m....m....m...',
        '.wvy..wvy..wvy..',
        '.wvy..wvy..wvy..',
        '.wvy..wvy..wvy..',
        '.NNyNNNyNNNyNn..',
        '.......N........',
        '....o..N..o.....',
        '...oYo.N.oYo....',
        '....m..N..m.....',
        '...wvyNNNwvy....',
        '.......N........',
        '.....yNNNn......',
    ),
    # ---------------- 冰（青）
    'icicle': (  # 冰锥
        '................',
        '.wwwwwwwwwwwwww.',
        '.gwwwgwwwwgwwwg.',
        '..CCCcbCCCcbCCb.',
        '..CwcbbCwcbbCcb.',
        '..CwcbbCwcb.Ccb.',
        '...Cwb.Cwcb.Cb..',
        '...Cwb.CwcbCb...',
        '...Cb..CwcbCb...',
        '....b..CwcbCb...',
        '.......CwbCb....',
        '.......Cwb.b....',
        '........Cb......',
        '........Cb......',
        '.........b......',
        '................',
    ),
    'frost': (  # 冰晶
        '................',
        '.......w........',
        '......wCc.......',
        '......wCcb......',
        '..w...wCcb......',
        '.wCc..CCcb...w..',
        '.wCcb.CCcb..wCc.',
        '.CCcb.CcbC..Ccb.',
        '.CCcbCCcbCcbCcb.',
        '.CcbbCcbbCcbCbb.',
        '.CcbbCcbbCcbcbd.',
        '..cbbccbbccbbd..',
        '..bbbbbbbbbbdd..',
        '...ddddddddd....',
        '................',
        '................',
    ),
    'blizzard': (  # 暴风雪
        '................',
        '.......w........',
        '.....w.C.w......',
        '......wCw.......',
        '..w....C....w...',
        '...w..CCC..w....',
        '....wCCwCCw.....',
        '.wCCCCwwwCCCCw..',
        '....wCCwCCw.....',
        '...w..CCC..w....',
        '..w....C....w...',
        '......wCw.......',
        '.....w.C.w......',
        '.......w........',
        '................',
        '................',
    ),
    'frostvial': (  # 冰霜药剂
        '................',
        '......NNn.......',
        '......nnm.......',
        '......wgs.......',
        '......wgs.......',
        '....wwgggss.....',
        '...wCCCCCccb....',
        '...wCwCCCccb....',
        '...CwCCCCccb....',
        '...CCCCCcccb....',
        '...CCCCcccbb....',
        '...cCCcccbbb....',
        '...cccccbbbd....',
        '...bbbbbbbdd....',
        '....dddddd......',
        '................',
    ),
    'icebomb': (  # 冰爆瓶
        '................',
        '.......NNn......',
        '.......nnm......',
        '..w....wgs...w..',
        '...wC..wgs..wC..',
        '....CwCCCCcbCc..',
        '...wCCCCCCccb...',
        '..wCwwCCCCcccb..',
        'wwCCwCCCCCccccCw',
        '.CCCCCCCCCcccbb.',
        '..CCCCCCCcccbb..',
        '..cCCCCCcccbbd..',
        '...cCCcccbbbd...',
        '..bccbbbbbdd.cb.',
        '.b...dddd....b..',
        '................',
    ),
    'frostseal': (  # 冰封符
        '................',
        '....wwwwwwv.....',
        '...wvvvvvvvy....',
        '...wv.C.C.vy....',
        '...wvC.C.Cvy....',
        '...wv.CwC.vy....',
        '...wvCwwwCvy....',
        '...wv.CwC.vy....',
        '...wvC.C.Cvy....',
        '...wv.C.C.vy....',
        '...wvvvvvvvy....',
        '...wvvRRvvvy....',
        '...wvvRrvvvy....',
        '...wvvvvvvvy....',
        '....yyyyyyN.....',
        '................',
    ),
    'rime': (  # 霜裂
        '................',
        '................',
        '.....wwwwwwww...',
        '....wCCCCCCCwc..',
        '...wCCCCwCCCcb..',
        '..wwwwwwwwwwcb..',
        '..CCCCCwCCCcbb..',
        '..CCCCCwwCCcbd..',
        '..CCCCCCwCccbd..',
        '..CCCCCwCCccbd..',
        '..cCCCwCCcccbd..',
        '..cCCCwCcccbd...',
        '..ccccwcccbbd...',
        '..bbbbbbbbbd....',
        '................',
        '................',
    ),
    'avalanche': (  # 雪崩
        '................',
        '................',
        '.......w........',
        '......wwC.......',
        '......wCCc......',
        '.....wwCCc......',
        '.....gwCdd......',
        '....gsgwddd.w...',
        '....gssdd.wwC...',
        '...gsssddwwCCC..',
        '...gsssdwwCCCcc.',
        '..gsssddwCCCccb.',
        '.gssssddCCCccbb.',
        'gsssssddCCccbbd.',
        'sssssddd.cbbd...',
        '................',
    ),
    'condenser': (  # 冷凝瓶
        '................',
        '......nNn.......',
        '.....wgggs......',
        '....wCCCCCCb....',
        '....CwwbbbCb....',
        '....CccwwbCb....',
        '....CbbbwwCb....',
        '....CwwbbbCb....',
        '....CccwwbCb....',
        '....CbbbwwCb....',
        '....CwwbbbCb....',
        '....cCCCCCcb....',
        '.....bbccbb.....',
        '.......Cb.......',
        '.......c........',
        '................',
    ),
    # ---------------- 电（黄）
    'bolt': (  # 雷针
        '................',
        '.......w........',
        '.Y.....wg....Y..',
        '..Y...Ywgs..Y...',
        '.YwY...wg..YwY..',
        '...YY.yYYN.YY...',
        '....Y..wg..Y....',
        '.......wg.......',
        '.......wg.......',
        '.......wg.......',
        '.......wg.......',
        '......yYYN......',
        '.......wg.......',
        '.....sgggsd.....',
        '....dsssssdd....',
        '................',
    ),
    'tesla': (  # 线圈
        '................',
        '.Y...wggss...Y..',
        '..Y.wggsssd.Y...',
        '.YwYgsssdddYwY..',
        '...Y.sddddd.Y...',
        '......gsd.......',
        '.....yNNNn......',
        '.....sddds......',
        '.....yNNNn......',
        '.....sddds......',
        '.....yNNNn......',
        '.....sddds......',
        '.....yNNNn......',
        '....gssssdd.....',
        '...wgssssddd....',
        '................',
    ),
    'thunder': (  # 雷暴
        '................',
        '....ggg...ggg...',
        '...gwwgg.gwwgs..',
        '..gwggsgggggsss.',
        '.gwgssssssssssd.',
        '.gsssssssssssdd.',
        '..ssdddddsdddd..',
        '....ddYYwddd....',
        '......YwY.......',
        '.....YwY........',
        '....YwYYYY......',
        '......YwY.......',
        '.....YwY........',
        '.....YY.........',
        '....Y...........',
        '................',
    ),
    'prism': (  # 元素棱镜
        '................',
        '................',
        '........w.......',
        '.......wC.......',
        '.......wCc......',
        '......wCCcb.....',
        '......wCCcb.....',
        '.....wCCCccb..RR',
        'wwwwwwCCCccbRR..',
        '....wCCCCcccbYYY',
        '....wCCCCcccbb..',
        '...wCCCCccccbCCC',
        '...cccccbbbbbb..',
        '................',
        '................',
        '................',
    ),
    'arcbottle': (  # 电弧瓶
        '................',
        '.......yN.......',
        '.....wCCCCb.....',
        '....wCddYdcb....',
        '...wCddYwddcb...',
        '...CddYwYYdcb...',
        '...CddddwYdcb...',
        '...CdddYwddcb...',
        '...CdddYdddcb...',
        '...cdddddddcb...',
        '..yNNNNNNNNNNn..',
        '..NyNNNNNNNNnn..',
        '..nnnnnnnnnnnm..',
        '................',
        '................',
        '................',
    ),
    'stormflask': (  # 风暴烧瓶
        '................',
        '......nNNn......',
        '......wCCb......',
        '......wCcb......',
        '.....wCddcb.....',
        '.....Cdsgdb.....',
        '....wdsggsdb....',
        '....Cddssddb....',
        '...wCdYYwdccb...',
        '...CcddwYdccb...',
        '..wCccYwcccccb..',
        '..CccYccccccbb..',
        '.wCcccccccccbbb.',
        '.cccccccccbbbbb.',
        '..bbbbbbbbbbbb..',
        '................',
    ),
    'resonate': (  # 共振瓶
        '................',
        '......wgs.......',
        '.....wggsd......',
        '..Y...gsd...Y...',
        '.Y.....s.....Y..',
        'Y..nNNNNNNn...Y.',
        'Y..wCCCCCcb...Y.',
        'Y..wCCCCcbb...Y.',
        '.Y.wggggssd..Y..',
        '..YwgggsssdYY...',
        '...wgggsssd.....',
        '...wgggsssd.....',
        '...ggsssddd.....',
        '....ddddddd.....',
        '................',
        '................',
    ),
    'netcoil': (  # 导电网
        '................',
        '..n....n....n...',
        '.NyNNNNyNNNNyN..',
        '..n....n.Yw.n...',
        '..n....nYw..n...',
        '..n....Yw...n...',
        '..n...YwYYY.n...',
        '.NyNNNNyYwNNyN..',
        '..n....Yw...n...',
        '..n...Yw....n...',
        '..n..YYn....n...',
        '..n..Y.n....n...',
        '.NyNNNNyNNNNyN..',
        '..n....n....n...',
        '................',
        '................',
    ),
    'appwand': (  # 学徒雷杖
        '................',
        '............Y...',
        '.........Y.YwY..',
        '..........yYYy..',
        '..........CYwY..',
        '.........CccY...',
        '........nNcb....',
        '.......nN.......',
        '......nN........',
        '.....nN.........',
        '....nN..........',
        '...nN...........',
        '..nN............',
        '..N.............',
        '................',
        '................',
    ),
    'thunderking': (  # 雷王杖
        '..Y.....Y.....Y.',
        '..yY...YwY...Yy.',
        '..yYY.yYwYy.YYy.',
        '...yYYYwYYYYYy..',
        '...yNYYYwYYyNy..',
        '....yNYwYYYNy...',
        '.....yYwYyyN....',
        '......YYyN......',
        '......yPpN......',
        '......yYyN......',
        '......yPpN......',
        '......yYyN......',
        '......yPpN......',
        '......yYyN......',
        '.....yYYYNN.....',
        '......NNNn......',
    ),
    'shockvenom': (  # 感电毒
        '............w...',
        '.............g..',
        '.............gs.',
        '..........g.g..d',
        '..........wg....',
        '...Y.....wCcs...',
        '....Y...wCcb.s..',
        '...Y...wlGb.....',
        '......wlYt......',
        '.....slGt.......',
        '.....sst........',
        '....g...........',
        '...g............',
        '..l.............',
        '.G..............',
        '................',
    ),
    # ---------------- 机（木 / 黄铜）
    'sling': (  # 投石索
        '................',
        '.yN.............',
        '.NnN............',
        '..N.N...........',
        '..N..N..........',
        '...N..N.........',
        '...N...N........',
        '....N...N.......',
        '....N....N......',
        '.....N...Nwgg...',
        '.....N..Nwgggs..',
        '......N.Ngggss..',
        '......NNnssssd..',
        '.......nNnsdd...',
        '........nnm.....',
        '................',
    ),
    'clock': (  # 发条
        '....YYy.........',
        '.YY.YYy.Nn......',
        '.YYYYyyyNn......',
        '..YYyyyyy.......',
        'YYYyy.yyyNn.....',
        'YYyy...yyNn.....',
        'Yyyyy.yyNNn.....',
        '..yyyyyNN.......',
        '.yyyyNNNNn......',
        '.yN.yNn.nn..g...',
        '....Nnn...wgggs.',
        '..........gg.gs.',
        '.........gg...sd',
        '..........gs.sd.',
        '..........sssdd.',
        '............d...',
    ),
    'anvil': (  # 铁砧
        '................',
        '................',
        '................',
        '.wwwwwwwwwwwwgg.',
        '..wgggggggggggs.',
        '...ggggggggsssd.',
        '.....ssgggssd...',
        '......sgggsd....',
        '......sgssdd....',
        '.....ssssssdd...',
        '....sdddddddds..',
        '....NNNNNNNNnn..',
        '....NyNNNNNNnn..',
        '....NyNNNNNNnm..',
        '....nnnnnnnnmm..',
        '................',
    ),
    'colossus': (  # 巨像
        '................',
        '.....gggggg.....',
        '....gwwggggs....',
        '...gwgggggsss...',
        '...ggGggggsss...',
        '...gYYggsYYsd...',
        '...gsYgggsYsd...',
        '...ggggsssssd...',
        '.gg.gsdddssd.ss.',
        'gwggsgsssssssssd',
        'gggsGsggsssssdsd',
        'gggssgsssssssdsd',
        'ggss.gsssssdd.sd',
        '.ss..ggsssssd.d.',
        '.....gsd..ssd...',
        '................',
    ),
    'bell': (  # 钟楼
        '.......R........',
        '......RRr.......',
        '.....RRRrr......',
        '....RRRRRrr.....',
        '...rrrrrrrrr....',
        '....yNNNNNn.....',
        '....Nmmymmn.....',
        '....NmyYymn.....',
        '....NyYwYyn.....',
        '....NyYYyyn.....',
        '....NNNyNNn.....',
        '....NyNNNNn.....',
        '....NynmnNn.....',
        '...yNynmnNnn....',
        '...nnnnnnnnm....',
        '................',
    ),
    'warhorn': (  # 战号
        '................',
        '...........yYN..',
        '..........yxxmN.',
        '..........YyyNn.',
        '.yN.......wvvyN.',
        '.Nn.......wvvyN.',
        '..v.......YYYNN.',
        '..wv.....wvvyNn.',
        '..Yv.....wvyyNn.',
        '...wv...wvvyyN..',
        '...Nwv.wvvyyNn..',
        '....NvvvyyyNn...',
        '.....NyyyNNn....',
        '......nnnnn.....',
        '................',
        '................',
    ),
    'rally': (  # 集结令
        '......yYN.......',
        '.......N........',
        '....yYYYYyN.....',
        '...yNNNNNNNn....',
        '...yNRRRRRNn....',
        '...yNRRYRRNn....',
        '...yNRYwYRNn....',
        '...yNRRYyRNn....',
        '...yNRRyRRNn....',
        '...yNRRRRRNn....',
        '...yNNNNNNNn....',
        '....nnnnnnn.....',
        '......R.r.......',
        '.....RR.rr......',
        '.....Rr.rr......',
        '......r..r......',
    ),
    'firefly': (  # 萤灯
        '......nNNn......',
        '.....n....n.....',
        '.....n....n.....',
        '....yYYYYYYN....',
        '...yNNNNNNNNn...',
        '....dYYlllld....',
        '....dYwYllld..Y.',
        '.l..dYYlGlld....',
        '....dllwllGd....',
        '....dllllGGd....',
        '....dlGGGGGd....',
        '...yNNNNNNNNn...',
        '....nnnnnnnm....',
        '.............l..',
        '................',
        '................',
    ),
    'musicbox': (  # 八音盒
        '..wg............',
        '..w.g.......wg..',
        '..w.........w...',
        '.ww........ww...',
        '.ww........ww...',
        '..PPPPPPPPPPp...',
        '.PwPPPPPPPPPp...',
        '.PPPPPPPPPPPp...',
        '.yYYYYYYYYYYN...',
        '.NyNNNNNNNNnn.g.',
        '.NyNNNNNNNNnnsg.',
        '.NyNNNyNNNNnn...',
        '.NyNNNmNNNNnn...',
        '.nnnnnnnnnnnm...',
        '................',
        '................',
    ),
    'pendulum': (  # 大钟摆
        '................',
        '..yYYYYYYYYYN...',
        '..nNNNNNNNNNm...',
        '......sd........',
        '......g.........',
        '.......g........',
        '.......g........',
        '........g.......',
        '........g....g..',
        '.......yYN....g.',
        '......yYwYN...g.',
        '......YwYYyN..g.',
        '......yYYyyN.g..',
        '.......yyNN.....',
        '................',
        '................',
    ),
    'gear': (  # 飞齿轮
        '................',
        '......wwgg......',
        '..wg..wggg..gs..',
        '..wgwwggggsgss..',
        '...wwgggggggs...',
        '...wggggggggs...',
        '.wwgggg..gssssd.',
        '.wgggg....sssdd.',
        '.gggss....ssddd.',
        '.gsssss..sssddd.',
        '...gssssssssd...',
        '...ssssssssdd...',
        '..ssssssdddddd..',
        '..sd..sddd..dd..',
        '......sddd......',
        '................',
    ),
    'windup': (  # 上弦钥匙
        '................',
        '.yYYy.....yYYy..',
        'yYwYYy...yYYyyN.',
        'yYYyyyyNyyyyyyN.',
        'yYYyyyNNNyyyyyN.',
        '.yyyyNNNNNyyyN..',
        '..yNNN.yN.NNNN..',
        '.......yN.......',
        '.......yN.......',
        '.......yN.......',
        '......yYYN......',
        '.......yN.......',
        '.......yN.......',
        '......yYYN......',
        '.......NN.......',
        '................',
    ),
    'paperkite': (  # 纸鸢
        '.......w........',
        '......wvy.......',
        '.....wvRvy......',
        '....wvvRvvy.....',
        '...wvvvRvvvy....',
        '..wRRRRRRRRRy...',
        '...yvvvRvvvN....',
        '....yvvRvvN.....',
        '.....yvRvN......',
        '......yRN.......',
        '.......N........',
        '........n.......',
        '.......R.r......',
        '........n.......',
        '.........Rr.....',
        '..........n.....',
    ),
    'clockwork': (  # 发条兵
        '................',
        '......RRRr......',
        '.....RRRRRr.....',
        '.....wwgss......',
        '.....fikkf......',
        '.....iffFF..yY..',
        '......FFF...yN..',
        '....RRRRRRr.yN..',
        '...RRyRRRRrNNNN.',
        '...RRyRRRRrr....',
        '....RyRRRRr.....',
        '....ssddddd.....',
        '....ss...dd.....',
        '....NN...Nn.....',
        '...NNn...NNn....',
        '................',
    ),
    'beacon': (  # 灯塔
        '.Y............Y.',
        '..Yy...yY...yY..',
        '....y.wYYw.y....',
        '.......nn.......',
        '......NNNn......',
        '......wRRr......',
        '.....wRRRrr.....',
        '.....wwwwgg.....',
        '.....wwwwgg.....',
        '.....wRRRrr.....',
        '....wRRRRrrr....',
        '....wwwwwggg....',
        '....wwwwwggg....',
        '...wRRRRRrrrr...',
        '..sgsssssssdd...',
        '................',
    ),
    'mainspring': (  # 主发条
        '................',
        '....sgggggs.....',
        '...gwyyyyywgs...',
        '..gwyNNNNNyss...',
        '.gwyN.....Nys...',
        '.gyN.yyyy..Nyd..',
        '.gyN.yNNNy.Nyd..',
        '.gyN.yN.yN.Nyd..',
        '.gyN.yN.NN.Nyd..',
        '.gyN.yNN..Nyd...',
        '.gyN..yyyyNyd...',
        '.sgyN.......Nd..',
        '..sgyNNNNNNNYd..',
        '...ssyyyyyyysd..',
        '....sssssssd....',
        '................',
    ),
    'toolbox': (  # 工具箱
        '................',
        '..........wg....',
        '.....ww..wgs....',
        '.....wg.wgs.....',
        '.....wg.nm......',
        '....wggsNm......',
        '....sgssNmnNNn..',
        '..yNNNNNNNNNNNn.',
        '..NRRRRRRRRRRrn.',
        '..NRoRRRRRRRrrn.',
        '..NRRRRyyRRRrrn.',
        '..NRRRRNNRRRrrn.',
        '..NRRRRRRRRRrrn.',
        '..nrrrrrrrrrrrn.',
        '...nnnnnnnnnnn..',
        '................',
    ),
    'armorer': (  # 弹药匠
        '..w.....w....w..',
        '.wgs...wgs..wgs.',
        '..N.....N....N..',
        '..N.....N....N..',
        '..N.....N....N..',
        '.RNr...RNr..RNr.',
        '.RNr...RNr..RNr.',
        '.yYYYYYYYYYYYYN.',
        '.YNNNNNNNNNNNnn.',
        '.YNnnnnnnnnnnnm.',
        '.YNNNNNNNNNNNnm.',
        '.YNnnnnnnnnnnnm.',
        '.YNNNNNNNNNNNnm.',
        '.Nnnnnnnnnnnnmm.',
        '..mmmmmmmmmmmm..',
        '................',
    ),
    'alarmbell': (  # 警钟
        '...........yY...',
        '...nNNNNNNNNn...',
        '.........N......',
        '.R....yYYYN...R.',
        'R....yYwYyyN...R',
        'R...yYwYyyyN...R',
        '.R..yYYyyyyN..R.',
        '....yYYyyyyN....',
        '...yYYYyyyyyN...',
        '..yYYYyyyyyyyN..',
        '..NNNNNNNNNNNn..',
        '...nnnn..nnnm...',
        '.......yY.......',
        '.......NN.......',
        '................',
        '................',
    ),
    'wardrum': (  # 战鼓
        '.w.............w',
        '..w...........w.',
        '...n.........n..',
        '....n.......n...',
        '..wwwwwwwwwwwg..',
        '.wgggggggggggsg.',
        '.wRRRRRRRRRRRRr.',
        '.yRoyRRyRRyRRrN.',
        '.yRyRyRyRyRyRrN.',
        '.yRRyRRyRRyRRrN.',
        '.yRRRRRRRRRRrrN.',
        '.wgggggggggggsg.',
        '..ssssssssssss..',
        '................',
        '................',
        '................',
    ),
    'flagpole': (  # 号令旗
        '.yY.............',
        '.Ny.............',
        '.NRRRRR.........',
        '.NRooRRRRR......',
        '.NRoRRRRRRRRr...',
        '.NRRRRRRRRRRRr..',
        '.NrRRRRRRRRRr...',
        '.NrrrRRRRRrr....',
        '.NnrrrrRrr......',
        '.Nn..rrr........',
        '.Nn.............',
        '.Nn.............',
        '.Nn.............',
        '.Nn.............',
        'yNNn............',
        '................',
    ),
    'jars': (  # 瓶瓶罐罐
        '................',
        '................',
        '..........NNn...',
        '..NNn.....nnm...',
        '..nnm....wCCcb..',
        '..wgs...wClllcb.',
        '..wCb...wlGGGtb.',
        '.wCCcb..wlGGGtb.',
        'wCRRRcb.wlGGGtb.',
        'wRoRRrb.wlGGGtb.',
        'wRRRRrb.wlGGGtb.',
        'wRRRrrb.wlGGttb.',
        '.bRrrb..wGtttbb.',
        '..bbb....bbbbb..',
        '................',
        '................',
    ),
    'marquee': (  # 走马灯
        '.......Y........',
        '......yYN.......',
        '....RRRRRRr.....',
        '..yYYYYYYYYYN...',
        '..rRRRRRRRRRr...',
        '..RwYYYYYYmmr...',
        '..RmYmmmmmmyr...',
        '..RYmmmmmyyyr...',
        '..RYmYYYmyyyr...',
        '..RmYYYYYmyyr...',
        '..yNNNNNNNNNn...',
        '....rrrrrrr.....',
        '.......y........',
        '......RrR.......',
        '......RrR.......',
        '.......r........',
    ),
    'wickcut': (  # 灯芯剪
        '................',
        '.wg.........gs..',
        '.wgs.......gsd..',
        '..wgs.....gsd...',
        '...wgs...gsd....',
        '....wgs.gsd.....',
        '.....wgsd.......',
        '......wYd.......',
        '.....gsddw......',
        '....gsd..sd.....',
        '...Nnn....Nn....',
        '..N...N..N..n...',
        '..N...N..N..n...',
        '..N...N..N..n...',
        '...NNN....nn....',
        '................',
    ),
    'ffjar': (  # 萤火罐
        '................',
        '....yNNNNNn.....',
        '....nnnnnnm.....',
        '.....wggss......',
        '....wCCCCCcb....',
        '...wC.....cb....',
        '...wC.Yl...b....',
        '...C..lG..Y.b...',
        '...C.....lG.b...',
        '...C.Y......b...',
        '...C.l...Yl.b...',
        '...c.......bb...',
        '...cc......bd...',
        '....bbbbbbbd....',
        '................',
        '................',
    ),
    'pocketwatch': (  # 师父的怀表
        '.......nn.......',
        '.......yN.......',
        '......yYYN......',
        '....yYYYYYyN....',
        '...yYwwwwwwyN...',
        '..yYwwwwwwwwyN..',
        '..yYwww.wwwgyN..',
        '..YYwww.wwwgyN..',
        '..YYwww...wgyN..',
        '..yYwwwwwwwgyN..',
        '..yYwwwwwwwgyN..',
        '...yNwwgggggN...',
        '....yNNNNNNN....',
        '......NNNn......',
        '................',
        '................',
    ),
    # ---------------- 毒（绿）
    'venom': (  # 毒牙
        '................',
        '..RRRRRRRRRRRr..',
        '.rRrrrrrrrrrrre.',
        '..wgs.....wgs...',
        '..wgs.....wgs...',
        '...wgs...wgs....',
        '...wgs...wgs....',
        '....ws...ws.....',
        '....ws...ws.....',
        '.....s...s......',
        '.....l...l......',
        '.....G...G......',
        '................',
        '.....l..........',
        '.....G..........',
        '................',
    ),
    'gasbomb': (  # 毒气罐
        '.........lG.....',
        '.......lGGll....',
        '......l..GlGG...',
        '.....sgs..lGt...',
        '....wsgss.......',
        '...wwgggsss.....',
        '...wggggsssd....',
        '...GlGGGGGtt....',
        '...ttttttttt....',
        '...wggggsssd....',
        '...wggggsssd....',
        '...GlGGGGGtt....',
        '...ttttttttt....',
        '...wggggsssd....',
        '....sssssdd.....',
        '................',
    ),
    'acidvial': (  # 强酸瓶
        '.....l.....l....',
        '......G...G.....',
        '.......lGl......',
        '........G.......',
        '.....NNNNn......',
        '.....nnnnm......',
        '....wCCCCcb.....',
        '....wlGlGlb.....',
        '....llGGlGt.....',
        '....lGGGGtt.....',
        '....lGGGGtt.....',
        '....GGGGttt..l..',
        '....GGGtttt..G..',
        '.....tttttl..t..',
        '..........G.....',
        '..........t.....',
    ),
    'plague': (  # 瘟疫烧瓶
        '...l......P.....',
        '..lGl....PpP....',
        '...G..l...P.....',
        '.....lGl.P......',
        '......Gppp......',
        '......NNNn......',
        '......nnnm......',
        '......wCcb......',
        '.....wPPPpb.....',
        '...wPPPPPPppb...',
        '..wPPwwwPPpppb..',
        '..PPwkwkwPpppb..',
        '..PPPwwwPPpppb..',
        '..pPPPwwPPpppb..',
        '...ppPPPPppbb...',
        '....bpppppbb....',
    ),
    'putrefy': (  # 腐化池
        '................',
        '....l......l....',
        '...lGl....lGl...',
        '....l..l...l....',
        '.......G........',
        '................',
        '....gggggggs....',
        '..ggGGlGGGGGss..',
        '.gGGlwlGGGlGGts.',
        '.gGGGlGGwwggGts.',
        'gsGGGGGtGGGGttsd',
        'gstGGGGGGGGtttsd',
        '.sstttttttttttd.',
        '..sssssssssssdd.',
        '....dddddddd....',
        '................',
    ),
    'needle': (  # 毒针
        '................',
        '.............wg.',
        '............wgs.',
        '...........wgs..',
        '..........wgs...',
        '.........wgs....',
        '........wgs.....',
        '.......wgs......',
        '......wgs.......',
        '.....wgs........',
        '....wgs.........',
        '...wgs..........',
        '..wg............',
        '.lG.............',
        '.Gt.............',
        '..t.............',
    ),
    'snakekiss': (  # 蛇吻
        '................',
        '....lGGGGt......',
        '...lGYkGGGGt....',
        '...lGGGGGGGGGt..',
        '...lGRRRRRRw....',
        '...lGGrrrrRRR.R.',
        '...lGGGGGGG..R..',
        '...lGGGGGt......',
        '....lGGGt.......',
        '....lGGt........',
        '...lGGt.........',
        '..lGGt..lGGGt...',
        '..lGGGGGGGGGGt..',
        '...tGGGGGGGGtt..',
        '.....ttttttt....',
        '................',
    ),
    'acidrain': (  # 酸雨
        '................',
        '.....gggg.......',
        '...ggwwggsgg....',
        '..gwwgggsssgss..',
        '.gwgGGsssssssss.',
        '.gsGGGGssssssdd.',
        '..sGGttssdddddd.',
        '...ttdddddddd...',
        '................',
        '..l...l...l.....',
        '..G..lG...G..l..',
        '.lG...G..lG..G..',
        '.G...l....G.lG..',
        '.....G...l...G..',
        '....lG...G......',
        '.....G..........',
    ),
    'plagueburst': (  # 瘟疫爆裂
        '........l.......',
        '..l.....G.....l.',
        '...G...lGl...G..',
        '....G.lGGGl.G...',
        '.....lGGPGGl....',
        '..l.lGPPpPGGl...',
        '.lGGGGPplpPGGGl.',
        '..tGGPplwlpPGt..',
        '.lGGGGPplpPGGGl.',
        '..l.lGPPpPGGl...',
        '.....lGGPGGl....',
        '....G.lGGGl.G...',
        '...G...lGl...G..',
        '..l.....G.....l.',
        '........t.......',
        '................',
    ),
    'concentrate': (  # 浓缩毒液
        '................',
        '......PPp....l..',
        '.....PPPpp..lGt.',
        '.....PpPpp..GGt.',
        '......sgs....t..',
        '.....sgggs......',
        '....wCCCCcb.....',
        '...wtGGGGGtb....',
        '..wtGlGGGGGtb...',
        '..CtGGGGGGGtb...',
        '..CtGGGGGGttb...',
        '..ctGGGGGtttb...',
        '...ctttttttb....',
        '....bbbbbbb.....',
        '................',
        '................',
    ),
    'miasma': (  # 瘴气
        '................',
        '....lGGGl.......',
        '..lGGGGGGGl.....',
        '.lGGGlGGGGGGl...',
        '.GGGGGGGGGGGGGl.',
        'lGGwwwGGGwwwGGt.',
        'GGwkkkwGwkkkwGt.',
        'GGwkkkwGwkkkwtt.',
        'tGGwwwGlGwwwGtt.',
        '.tGGGGGwGGGGtt..',
        '..tGGGGGGGGtt...',
        '...tlGwwwwGt....',
        '..lGGtGwGwGtGl..',
        '.lGtt.ttttt.tGl.',
        '..t..........t..',
        '................',
    ),
    'quicklime': (  # 生石灰
        '....g...........',
        '...g.l....g.....',
        '....g....g......',
        '...G.l..g.G.....',
        '....lG...lG.....',
        '.....NNNNNn.....',
        '....wwwwwwgg....',
        '...wwwwwwwggs...',
        '..NwwggwwwgsNn..',
        '..NNwwwgggsNNn..',
        '..NyNNNNNNNnnn..',
        '..NyNNNNNNNnnn..',
        '..NyNNNNNNNnnm..',
        '..nNNNNNNNnnmm..',
        '...nnnnnnnnmm...',
        '................',
    ),
    'smokebomb': (  # 标记烟
        '...........ll...',
        '..........lwll..',
        '..........llGl..',
        '.........n..ll..',
        '........nY......',
        '.......Nn.......',
        '.....dsssd......',
        '....dgsssdd.....',
        '...dgwsssddd....',
        '...dsRddRddd....',
        '...dsdRRddd.....',
        '...dsdRRdddd....',
        '...ddRddRddd....',
        '....dddddd......',
        '.....dddd.......',
        '................',
    ),
    'midas': (  # 点金药
        '...Y............',
        '..YwY....tG.....',
        '...Y....lGG.....',
        '.........NNn....',
        '.........nnm....',
        '........wyyN....',
        '.......wyYyyN...',
        '......wyYYYyyN..',
        '.....wyYwYYYyyN.',
        '.....yYwYYYYyyN.',
        '.....yYYYYYyyNN.',
        '.....NyYYYyyyNn.',
        '......NyyyyyNn..',
        '.......nNNNnn...',
        '..Y.............',
        '.YwY............',
    ),
    'supersat': (  # 过饱和溶液
        '.....w....w.....',
        '....wlw..wlw....',
        '.....lw.wlG.....',
        '....wllwlG......',
        '..w.wllllG.w....',
        '..gwgllllGwgs...',
        '..wgggggggggs...',
        '..wlllllllGGt...',
        '..wltlllllGGt...',
        '..wlllllllGGt...',
        '..wltllllGGGt...',
        '..wllllllGGGt...',
        '..wltllllGGGt...',
        '..wGGGGGGGttt...',
        '...ttttttttt....',
        '................',
    ),
    'sagedrop': (  # 贤者之滴
        '................',
        '.......l........',
        '..Y....l........',
        '.YwY..lGt.......',
        '..Y...lGt.......',
        '.....lGGGt......',
        '....lwYGGGt.....',
        '....lYGGGGt.....',
        '...lwGGGGGGt....',
        '...lGGGGGGGt..Y.',
        '...lGGGGGGtt.YwY',
        '...tGGGGGGtt..Y.',
        '....tGGGGtt.....',
        '.....ttttt......',
        '................',
        '................',
    ),
    # ---------------- 艾拉 · 军令 / 萤 · 爆竹
    'banner': (  # 军旗手
        '..y.............',
        '.yYy............',
        '..NNNNNNNNNNy...',
        '..NCcccccccb....',
        '..NCcccYcccb....',
        '..NCcccYcccb....',
        '..NCcYYYYYcb....',
        '..NCccYyYccb....',
        '..NCccYcYccb....',
        '..NCcYcccYcb....',
        '..NCbbbbbbbb....',
        '..NCcccccccb....',
        '..NCccc.cccb....',
        '..NCC.....bb....',
        '..N.............',
        '..n.............',
    ),
    'shieldwall': (  # 盾阵
        '............w...',
        '............wg..',
        '.wwwwwwwwww.wg..',
        '.wggggggggs.wg..',
        '.wgggYygggs.wg..',
        '.wgggYygggs.wg..',
        '.wgYYYyYYgs.wg..',
        '.wgggYygggs.wg..',
        '.wgggYygggs.wg..',
        '.wgggYygggs.wg..',
        '.wgggYygggsYyyy.',
        '..sggggggss.nn..',
        '...sggggss..nn..',
        '....ssss....yy..',
        '................',
        '................',
    ),
    'pike': (  # 长枪阵（占满画面，和其他卡图一样重）
        '.......wg.......',
        '......wwgs......',
        '..wg..wggs..wg..',
        '.wwgs..gs..wwgs.',
        '.wggs.RRrr.wggs.',
        '..gs..rNnr..gs..',
        '.RRrr..Nn..RRrr.',
        '.rNnr..Nn..rNnr.',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..nm...nm...nm..',
    ),
    'tower': (  # 角楼弩
        '.........NN.....',
        '...nNNNNNNNNggwg',
        '...nnnnnnnNnss..',
        '.........NN.....',
        '.w.w.w.w.g......',
        '.ssssssssss.....',
        '..gsssssssd.....',
        '..gsssssssd.....',
        '..gdddddddd.....',
        '..gsskkkssd.....',
        '..gdskkkssd.....',
        '..gddkkkddd.....',
        '..gssdssssd.....',
        '..gdssssdsd.....',
        '..gdddddddd.....',
        '..gsssssssd.....',
    ),
    'rocket': (  # 窜天猴
        '............wY..',
        '...........oRy..',
        '..........oRr...',
        '.........Yyr....',
        '........oyN.....',
        '.......oRr......',
        '.......Rr.......',
        '.......Nn.......',
        '......Nn........',
        '.....Nn.........',
        '....Nn..........',
        '.o.yn...........',
        'oYon............',
        '.oRo.y..........',
        'y.o.............',
        '....o...........',
    ),
    'fireworks': (  # 烟花架
        '......Y.P.......',
        '.....P.YP.Y.....',
        '....Y.PwP.......',
        '......YPYP......',
        '.....P..Y.P.....',
        '..ww.ww.ww.wwww.',
        '..Rr.oR.Rr.yoPp.',
        '..Rr.oR.Rr.yoPp.',
        '..Rr.oR.Rr.yoPp.',
        '..Rr.oR.Rr.yoPp.',
        '..Rr.oR.Rr.yoPp.',
        '..Rr.oR.Rr.yoPp.',
        '.NNNNNNNNNNNNNn.',
        '.Nnnnnnnnnnnnnn.',
        '.N.....n......n.',
        '.N......n.....n.',
    ),
    'matchbox': (  # 火柴盒
        '.........Y......',
        '........YwY.....',
        '........oRo.....',
        '.........R.R....',
        '.........v.r.R..',
        '.........v.v.r..',
        '.........v.v.v..',
        '........nvnvnvn.',
        '........mvmvmvm.',
        '.yyyyyyymmmmmmm.',
        '.NoRRRRRmmmmmmm.',
        '.NRrrrrRNNNNn...',
        '.NRrrrrRNNNNn...',
        '.NRRRRRRNNNNn...',
        '.nnnnnnnnnnnn...',
        '................',
    ),
    'stall': (  # 鞭炮摊
        '................',
        '.RwwRRwwRRwwRRw.',
        '.RwwRRwwRRwwRRw.',
        '.RwwRRwwRRwwRRw.',
        '.RrgrRrgrRrgrRr.',
        '.n..y.....y...n.',
        '.n.RRr...RRr..n.',
        '.n.yyy...yyy..n.',
        '.n.RRr...RRr..n.',
        '.n.yyy...yyy..n.',
        '.n.RRrR.RRRrR.n.',
        '.n............n.',
        '.nyyyyyyyyyyyyn.',
        '.nNNNNNNNNNNNNn.',
        '.nnnnnnnnnnnnnn.',
        '.n............n.',
    ),
    # ---------------- 钧
    'turret': (  # 炮台
        '...........YYYN.',
        '..........Yymmn.',
        '.........YyyNmn.',
        '........YyyNNn..',
        '.......YyyNNn...',
        '......YyyNNn....',
        '.....YyyNNn.....',
        '....YyyNNn......',
        '...YnnNNn.......',
        '...Nynnn........',
        '...nnmn.........',
        '.gggnnggggggggd.',
        '.sssdsssdsssdsd.',
        '.dddddddddddddd.',
        '.sdsssdsssdsssd.',
        '.sdsssdsssdsssd.',
    ),
    'scaffold': (  # 脚手架
        '.yyyyyyyyyyyyyN.',
        '.NNNNNNNNNNNNNN.',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '..Nn...Nn...Nn..',
        '.NgsNNNgsNNNgsN.',
        '.nnnnnnnnnnnnnn.',
        '..Nn...Nn..mNn..',
        '..Nn...Nn.mxNn..',
        '..Nn...Nnmx.Nn..',
        '.NgsNNNgsxNNgsN.',
        '.nnnnnnmxnnnnnn.',
        '..Nn..mxn...Nn..',
        '..Nn.mxNn...Nn..',
        '..Nnmx.Nn...Nn..',
        '..Nnx..Nn...Nn..',
    ),
    'bigcannon': (  # 城头巨炮
        '...........wwwwg',
        '..........gskkks',
        '.........gsskkkd',
        '........gsssd...',
        '.......gsssdddk.',
        '......gsssdddk..',
        '.....gsssdddk...',
        '....gsssdddk....',
        '..NNNNsdddk.....',
        '..Ndmndddk......',
        '..nmmnddk.......',
        'ggnnnndk..gg..gg',
        'ggggddkggggggggg',
        'sssdskssdssssdss',
        'dddddddddddddddd',
        'sdssssdssssdssss',
    ),
    'mortar': (  # 臼炮
        '...........Y....',
        '..........YoY...',
        '...........s....',
        '..........gsd...',
        '........g.ddd...',
        '.......g...d....',
        '......g.........',
        '..wggggggggg....',
        '..sskkkkkkss....',
        '...gssssssd.....',
        '...gssssssd.....',
        '...yNNNNNNN.....',
        '...gssssssd.....',
        '.NNNNNNNNNNNm...',
        '.nnnnnnnnnnnm...',
        '.mmmmmmmmmmmm...',
    ),
    'shellman': (  # 填弹手
        '............nmmx',
        '......Y.....mmmm',
        '.....YoY.....Nn.',
        '......y......Nn.',
        '......N......Nn.',
        '......N......Nn.',
        '.....gss.....Nn.',
        '....gwgss....Nn.',
        '....ssssd....Nn.',
        '....sssdd....Nn.',
        '..g..sddg....Nn.',
        '..sss..ssss..Nn.',
        '.gwgsdgsgsd..Nn.',
        '.sssss.ssss..Nn.',
        '..sddd.sdsd..Nn.',
        '.............Nn.',
    ),
    'palisade': (  # 木栅
        '................',
        '.yn....yn....yn.',
        '.Nn....Nn....Nn.',
        '.Nn.yn.Nn.yn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.yyyyyyyyyyyyyy.',
        '.mmmmmmmmmmmmmm.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.yyyyyyyyyyyyyy.',
        '.mmmmmmmmmmmmmm.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
        '.Nn.Nn.Nn.Nn.Nn.',
    ),
    'caltrop': (  # 铁蒺藜（占满画面，和其他卡图一样重）
        '................',
        '......w.........',
        '......wg........',
        '.w....wg....g...',
        '..wg..wgs..gs...',
        '...wggwgsgss....',
        '....ggwwgss.....',
        '..wgggwgssdddd..',
        '....ggsgsdd.....',
        '...gss.sd.dd....',
        '..gs...sd..dd...',
        '.gs....sd...ds..',
        '.......sd.......',
        '.......sd.....w.',
        '..............sd',
        '................',
    ),
    'watchtower': (  # 望楼
        '.......NN.......',
        '.....NNyNnn.....',
        '...NNyyyynnnn...',
        '.NNnnnnnnnnnnmm.',
        '...yNNNNNNNNn...',
        '...yNNkkkkNNn...',
        '...yNNkYkkNNn...',
        '...yNNkkkkNNn...',
        '..NNNNNNNNNNNN..',
        '..nnnnnnnnnnnn..',
        '...m..n..n..m...',
        '...Nmmn..nmmn...',
        '...N..mmmm..n...',
        '...N..mmmm..n...',
        '...Nmmn..nmmn...',
        '...m..n..n..m...',
    ),
    'bastion': (  # 棱堡
        '.......NRRR.....',
        '.......NRr......',
        '.......N........',
        '.gg.gg.wd.ss.ss.',
        '.ggggsgwdsdssss.',
        '.ggggsgwdsdssss.',
        '.sssssswddddddd.',
        '.ggsgggwdssdsss.',
        '.ggsgggwdssdsss.',
        '.sssssswddddddd.',
        '.ggggsgwdssssds.',
        '.ggggsgwdssssds.',
        '.sssssswddddddd.',
        '....sggwdsss....',
        '......swds......',
        '.......gd.......',
    ),
    'powderkeg': (  # 火药桶
        '............Yo..',
        '............oR..',
        '...........g....',
        '..........g.....',
        '....dkkkkgkd....',
        '...nddsdddddn...',
        '..nNNNNNNNNNNn..',
        '..yNNNNNNNNNNn..',
        '..gssssssssssd..',
        '..yNNNNNNNNNNn..',
        '..yNNNoRRRNNNn..',
        '..yNNNRRRrNNNn..',
        '..yNNNNNNNNNNn..',
        '..gssssssssssd..',
        '..yNNNNNNNNNNn..',
        '...nnnnnnnnnn...',
    ),
    'crossbows': (  # 床弩
        '....Nn...Nn.....',
        '...g.Nn.g.Nn....',
        '...g..Nng..Nn...',
        '...g..Nng..Nn...',
        '...g..Nng..Nww..',
        'yNNNNNNNNNNNgwww',
        'nnnnnnnnnnnnss..',
        '...g..Nng..Nn...',
        '...g.Nn.g.Nn....',
        '....Nn...Nn.....',
        'yyyyyyyyyyyyyyyy',
        'nnnnnnnnnnnnnnnn',
        '..n..........n..',
        '..mmmmmmmmmmmm..',
        '..n..........n..',
        '..n..........n..',
    ),
    'cogline': (  # 齿轮组
        '................',
        '................',
        '..........y.y...',
        '.........yNNNn..',
        '........yNNnNNn.',
        '.........Nnmnn..',
        '...y.y..yNNnNnn.',
        '..yNNNn..nNNnn..',
        '.yNNNNNn..n.n...',
        'yNNNnNNnn.......',
        '.NNnmmnn..y.n...',
        'yNNnmmnnnyNNNn..',
        '.nNNnnnn..Nmn...',
        '..nnnnn..yNnnn..',
        '...n.n....n.n...',
        '................',
    ),
    # ---------------- 璃
    'astrolabe': (  # 星盘
        '.......yy.......',
        '......y..y......',
        '.......yN.......',
        '....NNNNNNNN....',
        '...NNdddwddNN...',
        '..NNddddddwYNN..',
        '..NdwdbbbYYddN..',
        '..NddbbbYbbddN..',
        '.NNddbbYbbbddNy.',
        '.yNwdbbbybbddNN.',
        '..NddbyybbbddN..',
        '..NddybbbbdwdN..',
        '..NNywddddddNN..',
        '...NNddddddNN...',
        '....NNNNNNNN....',
        '.......yN.......',
    ),
    'lens': (  # 聚光镜
        '................',
        '....NNNNN.......',
        '...NNCCCNN......',
        'vv.NwwCCCNy.....',
        '..NCwCCCcCNy....',
        '..NCCCCCcCN.y.Y.',
        'vvNCCCCCcCYYYYwY',
        '..NCCCCCcCN.y.Y.',
        '..NCCCCCcCNy....',
        'vv.NCCCccNy.....',
        '...NNCCCNnm.....',
        '....NNNNNNnm....',
        '...........nm...',
        '............nm..',
        '.............nm.',
        '..............nm',
    ),
    'comet': (  # 彗星
        '................',
        '......C....CC...',
        '.........bYwwCC.',
        '........bCwYwwC.',
        '........cCwwwwC.',
        '........c.CwwCc.',
        '......bcCCCCCcc.',
        '...C..c.C.c.b...',
        '.....bCCCcbb....',
        '....b.C.c.......',
        '...bcCcbbb......',
        '.C..C.b.........',
        '..dbcbb.........',
        '..b.............',
        'dbdd....C.......',
        '................',
    ),
    'starseed': (  # 星种
        '.........l......',
        '.......Gl.......',
        '......GG........',
        '.......Gc.......',
        '.....cwCCbc.....',
        '....cwCCCbcc....',
        '....cwCCCbyc....',
        '....CCCCCbYc....',
        '....CCCCCYwY....',
        '....cCCCCCYb....',
        '....cCCCCCyb....',
        '....ccCCCcbb....',
        '....ccccccbb....',
        '.....cccccb.....',
        '......bbbb......',
        '................',
    ),
    'orrery': (  # 浑天仪
        '................',
        '......NnnN......',
        '....NN....NN.Y..',
        '...N..n..n..N...',
        '...N..n..n..N...',
        '..N.yywccnyy.N..',
        '..y...cCcc...y..',
        '..y...cccc...y..',
        '..N.yynccnyy.N..',
        '...N..n..n..N...',
        '..YN..n..n..N...',
        '....NN....NN....',
        '......NNnN......',
        '......nNnn......',
        '....yyyyyyyy....',
        '....NNNNNNNN....',
    ),
    'frostar': (  # 寒星
        '................',
        '.......Cc.......',
        '..w....CC....w..',
        '.......Cc.......',
        '....C..CC..c....',
        '.....C.Cc.c.....',
        '......wCCC......',
        '.CCCCCCwwCccccc.',
        '.cccccCwwCbbbbb.',
        '......CCCC......',
        '.....c.cb.b.....',
        '....c..cb..b....',
        '.......cb.......',
        '..w....cb....w..',
        '.......cb.......',
        '................',
    ),
    'glacier': (  # 冰河
        '................',
        '......wwwC...w..',
        '....wwCCCCcc....',
        '...wCCcccccbc.w.',
        '..wCcc.....bb...',
        '..wCc...ww..w...',
        '.wCcc..wCCc.....',
        '.wCcb..Ccbb.....',
        '.wCcbb..bb......',
        '.wCCcbbbb.......',
        '..wCCccbbbbb.b..',
        '...wwCCCcccbbbb.',
        '.wwCCCCCCCcccbb.',
        '.CCcccccccccbbb.',
        '.cccbbbbbbbbbbd.',
        '................',
    ),
    'rimelance': (  # 霜枪
        '..............w.',
        '.............wC.',
        '...........wCCc.',
        '..........wCcb..',
        '.........CCcb...',
        '........CCcb....',
        '.......C.bCd....',
        '......wCcbcb....',
        '.......cbd......',
        '......cbd.......',
        '.....cbd........',
        '....Ybd.........',
        '...yyy..........',
        '..cbdN..........',
        '.cbd............',
        '.bd.............',
    ),
    'stardust': (  # 星屑（占满画面，和其他卡图一样重）
        '................',
        '.......Y........',
        '.......Y........',
        '......YwY.......',
        '..YYYYwwwYYYY...',
        '....yYwwwYy.....',
        '.....yYwYy...y..',
        '.....Yy.yY..YwY.',
        '....Yy...yY..y..',
        '....y.....y.....',
        '...........Y....',
        '..y.......YwY...',
        '.YwY.......Y....',
        '..y.....y.......',
        '................',
        '................',
    ),
    'starfire': (  # 流星雨
        '..........Rr....',
        '.RR........Rr...',
        '.rRR........o...',
        '..rRR........Yo.',
        '...rRRR......oR.',
        '....rRRR........',
        '....rrRoR.......',
        '.....rrRoR......',
        '......rrRooo....',
        '.......rrwyyo..y',
        '........oyYyoo..',
        '..Rr....oyyyoR..',
        '...o.....oooR...',
        '....Yo....oR....',
        '....oR..........',
        '.......y......y.',
    ),
    'pulsar': (  # 脉冲星
        '................',
        '.....bbYbbb.....',
        '....bb.Y..bb....',
        '...b...cc...b...',
        '..b..cc..cc..b..',
        '.bb.c......c.bb.',
        '.b..c.wYYY.c..b.',
        '.b.c..YwwY..cYY.',
        '.YYc..YwwY..c.b.',
        '.b..c.YYYY.c..b.',
        '.bb.c......c.bb.',
        '..b..cc..cc..b..',
        '...b...cc...b...',
        '....bb..Y.bb....',
        '.....bbbYbb.....',
        '................',
    ),
    'gunner': (  # 炮长
        '............Y..y',
        '............Yog.',
        '...........gg.g.',
        '...........s.s..',
        '...........Nn...',
        '..........Nn....',
        '.........Nn.....',
        '.....oRRRrn.....',
        '.....oRYRr......',
        '.....oyRr.......',
        '.....oRr........',
        '.....or.........',
        '....Nn..........',
        '....Nn..........',
        '...Nn...........',
        '..Nn............',
    ),
    'grapeshot': (  # 霰弹炮
        '................',
        '................',
        '............g...',
        '................',
        '.............g..',
        '................',
        '...........g....',
        '........sg....g.',
        '.......sgkYY....',
        '.ggggggskko.g..g',
        '.gYysssskko.Y...',
        '.gyyssssdk.g..g.',
        '.gdddddddd......',
        'NNNNNNN......g..',
        'nnmnnmn.........',
        '..m..m..........',
    ),
    'bombard': (  # 红衣大炮
        '................',
        '................',
        '...........YYY..',
        '...........ymm..',
        '.........YYNmm..',
        '.......YYyyNmm..',
        '.....oRryyyNNn..',
        '...YYoRryNN.....',
        '.YYyyoRrN.......',
        'yyyyyoRr........',
        'yyyNNoRr........',
        '.NNNNNNNNNNN....',
        '..nNnnnnnNnn....',
        '...nmn...nmn....',
        '...nnn...nnn....',
        '....n.....n.....',
    ),
    'moat': (  # 护城河
        '................',
        'gggggggggggggggg',
        'sssdssssdssssdss',
        'dddddddddddddddd',
        'sdssssdssssdssss',
        'dddddddddddddddd',
        'bCbbbbbCbbbbbCbb',
        'cccbbbcccbbbcwcb',
        'bbwwCbbbbbCbbbbb',
        'bbwCccbbbcccbbbc',
        'bbCbbbbbCbwbbbCb',
        'bcccbbbcccwCbccc',
        'bbbbbCbwbbbCbbbb',
        'bbbbcccbbbcccbbb',
        'NNNNNNNNNNNNNNNN',
        'nnnnnnnnnnnnnnnn',
    ),
    'spikewall': (  # 狼牙拍
        '.......Nn.......',
        '.......Nn.......',
        '......NNnn......',
        '.....N....n.....',
        '..yyyyyyyyyyyy..',
        '..yNgNNgNNgNNn..',
        '.syNsNNsNNsNNnd.',
        '.syNNNNNNNNNNnd.',
        '.sygNNgNNgNNgnd.',
        '.sysNNsNNsNNsnd.',
        '.syNNNNNNNNNNnd.',
        '.syNgNNgNNgNNnd.',
        '..yNsNNsNNsNNn..',
        '..ynnnnnnnnnnn..',
        '...g..g..g..g...',
        '...s..s..s..s...',
    ),
    'mason': (  # 泥瓦匠
        '.............Nn.',
        '.............gNn',
        '.......gg...gNn.',
        '......gwgg.gNn..',
        '.....wwggsgNn...',
        '....gwggggs.....',
        '...gwggggs......',
        '....gggss.......',
        '.....sss.w......',
        '....w..w........',
        '.ooooooooooor...',
        '.RRRRRrRRRRRr...',
        '.vvvvvvvvvvvv...',
        '.RRRRRrRRRRRr...',
        '.Rrrrrrrrrrrr...',
        '................',
    ),
    'stakes': (  # 拒马
        '................',
        '................',
        'w....wg...wg....',
        'N....Nn...Nn....',
        '.N...nN...nN...n',
        '.N...nN...nN...n',
        '..N.n..N.n..N.n.',
        'yyymyyyymyyyymyy',
        'nnnmnnnnmnnnnmnn',
        '...n....n....n..',
        '..n.N..n.N..n.N.',
        '..n.N..n.N..n.N.',
        '.n...Nn...Nn...N',
        '.n...Nn...Nn...N',
        '................',
        '................',
    ),
    'beehive': (  # 一窝蜂
        '................',
        '...w.w.w.w.w....',
        '...g.g.g.g.g....',
        '...srsrsrsrsr...',
        '...sRsRsRsRsR...',
        '...nnnnnnnnnn...',
        '..yyyyyyyyyyyn..',
        '..yNNNNNNNNNNn..',
        '..yNmNmNmNmNmn..',
        '..yNNNNNNNNNNn..',
        '..yNmNmNmNmNmn..',
        '..yNNNNNNNNNNn..',
        '..yNmNmNmNmNmn..',
        '..nnnnnnnnnnnn..',
        '...m........m...',
        '...m........m...',
    ),
    'beacontower': (  # 烽火台
        '.........sg.....',
        '.........g......',
        '........g.......',
        '.......o........',
        '......oYo.o.....',
        '.....oYwYoR.....',
        '.....RYYYYR.....',
        '....RRoYYoRr....',
        '..gggggggggggs..',
        '...gggggggggg...',
        '...gsssdssssd...',
        '...gddddddddd...',
        '...gsdssssdsd...',
        '...gssssdsssd...',
        '...gddddddddd...',
        '...gssdsssdsd...',
    ),
    'trebuchet': (  # 投石机
        '................',
        '................',
        '.............N..',
        '...........NNy..',
        '..........Nnny..',
        '.........Nn...y.',
        '.......YNn...ss.',
        '......Nnn...ggss',
        '.....Nn.n...ssds',
        '.gssNnN.n....ss.',
        '.sssnN...n......',
        '.sss.N...n......',
        '.ssdnnnnnnn.....',
        '....N.....n.....',
        '.nnnnnnnnnnnnn..',
        '.mmmmmmmmmmmmm..',
    ),
    'sextant': (  # 六分仪
        '.......YY.......',
        '.......Yy.......',
        '......ygN.......',
        '......yg.N......',
        '......y.g.N.....',
        '.....y..g.N.....',
        '..cgggggggs.....',
        '..bsssssssdN....',
        '....y....g..N...',
        '...y.....g..N...',
        '..y......g..N.y.',
        '.Ny......g..yNN.',
        '.nNNy.y.y.g.NNn.',
        '..nnNNNNNNwNnn..',
        '....nnnnnnnn....',
        '................',
    ),
    'spyglass': (  # 千里镜
        '................',
        '.............CC.',
        '............cw..',
        '..........YCc...',
        '.........Yyyy...',
        '........YyyyyN..',
        '.......YyyyyN...',
        '......YymyyN....',
        '.....YyyyyN.....',
        '....yNyyyN......',
        '...yNmNyN.......',
        '..yNmNNn........',
        '.yNNNNn.........',
        '..NNNn..........',
        '.n.Nn...........',
        '..m.............',
    ),
    'wishstar': (  # 许愿星
        '................',
        '..y....Y........',
        '......YYy....y..',
        '......YYy.......',
        '...YYYYwYyyN....',
        '....YYYYyyN.....',
        '.....YYyyN......',
        '....YYy.yyN.....',
        '...YYy...yyN..Y.',
        '...Y.......N....',
        '......RrR.......',
        '......RrrR......',
        '.....Rr..rR.....',
        '.....Rr..rR.....',
        '....Rr....rR....',
        '....Rr....r.....',
    ),
    'northstar': (  # 北辰
        '................',
        '.......cb.......',
        '.......Cb..C....',
        '.......Cb.......',
        '....w..Cb..w....',
        '.......Cb.......',
        '......wCCC......',
        '.cCCCCCwwCCCCCc.',
        '.bbbbbCwwCbbbbb.',
        '......CCCc......',
        '.......Cb.......',
        '..C.w..Cb..w....',
        '.......Cb....C..',
        '.......Cb.......',
        '.......cb.......',
        '................',
    ),
    'rimeglass': (  # 冰晶镜
        '................',
        '.....sssss......',
        '...gssCwCss.....',
        '..gswwCwCCCs....',
        '..gswCCwCCwss...',
        '..sCCwwwwwCCs...',
        '..sCCCCwCCCCs...',
        '..sCCwwwwwCCs...',
        '..sswCCwCCcss...',
        '...sCCCwCccs....',
        '....ssCwcss.....',
        '.....sssss......',
        '.......Nm.......',
        '.......nm.......',
        '.......nm.......',
        '.......nm.......',
    ),
    'aurora': (  # 极光
        '..w......w......',
        '......llll....w.',
        'l....lGGGGll....',
        'GllllG....GGllll',
        '.GGGG.......GGGG',
        '....CCCC......CC',
        '..CCccccC....Ccc',
        'CCcc....cCCCCc..',
        'cc.......cccc...',
        '.PPPP.......PPPP',
        'PppppP....PPpppp',
        'p....pPPPPpp....',
        '......pppp......',
        '....ww.....ww...',
        'wwwwwwwwwwwwwwww',
        'gggggggggggggggg',
    ),
    'icemoon': (  # 冷月
        '................',
        '................',
        '.....CC.........',
        '...CCC......Y...',
        '...wCC..........',
        '..CwC...........',
        '..wCC.........y.',
        '..wCC...........',
        '..CCCC..........',
        '..CCCC..........',
        '..CCCCC.........',
        '...CCCCcc...b...',
        '...CCCccccbbw...',
        '.....ccccbb..w..',
        '....w...w.......',
        '................',
    ),
    'fallstar': (  # 坠星
        '................',
        '.Rr.............',
        '.rRR............',
        '..roRY........y.',
        '...rYYy.........',
        '...YYwyN........',
        '....YyNRr.......',
        '....y.NrRR......',
        '........roRY....',
        '.........rYYy...',
        '.........YYwyN..',
        '..........YyN...',
        '..........y.N...',
        '..y.............',
        '................',
        '.............y..',
    ),
    'galaxy': (  # 银河
        '................',
        '................',
        '................',
        '......bbbbbwb...',
        '...wbb.ccbc.bbb.',
        '...bbccc..bbc.b.',
        '..bb.c.YYcC.bcbb',
        'bbbbccywwYcCbc.b',
        'bbbc.CYYYy.c.b.b',
        '.b.cccCYYCcc.b..',
        '.bb.ccc.ccc.wb..',
        '..bb.wccc.bbb...',
        '....bbbbbbb.....',
        '................',
        '................',
        '................',
    ),
    'nova': (  # 超新星
        '................',
        '......y.........',
        '................',
        '.....oR...o..y..',
        '.....R....Ro....',
        '.y.....YY.R.....',
        '...R..YYYY......',
        '.....YYwwYY.....',
        '..oR.YYwwYy.R...',
        '......YYYy..R...',
        '.....R.YY.....y.',
        '....oR....R.....',
        '..y..o...Ro.....',
        '................',
        '.........y......',
        '................',
    ),
    # ---------------- 卡池重做后新加的卡
    'chartpage': (  # 星图残页：撕下来的一页，几颗星连成线
        '................',
        '..vvvvvvvvvvv...',
        '..vyyyyyyyyyyv..',
        '..vyybyyyyyyyv..',
        '..vyyydyyyyyyv..',
        '..vyyyydyybyyv..',
        '..vybyyydydyyv..',
        '..vyydyyybyyyv..',
        '..vyyydbyyyyv...',
        '..vyyyyyydyyyv..',
        '..vyyyyyyybyv...',
        '..vyNyNyyyyyyv..',
        '..vyyyyyyyyNv...',
        '..vyyyyNyyyv....',
        '..vvvvvvv.vv....',
        '................',
    ),
    'sirius': (  # 天狼：一颗又大又亮的星
        '.......w........',
        '.......C........',
        '.......C........',
        '......cCc.......',
        '.....cCwCc......',
        'C...cCwwwCc...C.',
        '.CCCCwwwwwCCCC..',
        '....cCwwwCc.....',
        '.....cCwCc......',
        '......cCc.......',
        '.......C........',
        '.......C........',
        '.......c........',
        '................',
        '...b........b...',
        '................',
    ),
    'moondial': (  # 月晷：一块圆石盘，中间立着一弯月
        '................',
        '........Yy......',
        '.......Y..y.....',
        '.......Y........',
        '.......Yy.......',
        '........yy......',
        '....gggnggg.....',
        '..ggsgggsggsg...',
        '.gsggggdggggsg..',
        '.ggsgggdddgggsg.',
        '.gsgggggggggsgg.',
        '..ggsggggggsgg..',
        '...gggsgsggg....',
        '....sssssss.....',
        '................',
        '................',
    ),
    'tent': (  # 中军帐：红帐子，顶上一面小旗
        '.......Y........',
        '.......nYY......',
        '.......nYYY.....',
        '.......n........',
        '......rRr.......',
        '.....rRRRr......',
        '....rRRwRRr.....',
        '...rRRRwRRRr....',
        '..rRRRRwRRRRr...',
        '.rRRRRkkkRRRRr..',
        'rRRRRkkkkkRRRRr.',
        'rrRRRkkkkkRRRrr.',
        '..nn.......nn...',
        '................',
        '................',
        '................',
    ),
    'crenel': (  # 垛口：墙头的缺口里飞出一支箭
        '................',
        '.ggg.....ggg....',
        '.gsg.....gsg..w.',
        '.gsg.....gsg.wg.',
        '.gsg..nnnnnnwg..',
        '.gsggggggsgggg..',
        '.gsssssssssssg..',
        '.gsdsssdsssdsg..',
        '.gssssssssssss..',
        '.gsdsssdsssdsg..',
        '.gssssssssssss..',
        '.gsssssssssssg..',
        '.ddddddddddddd..',
        '................',
        '................',
        '................',
    ),
    'kiln': (  # 砖窑：砖砌的圆顶，窑口里是火
        '.........g......',
        '........g.g.....',
        '.........g......',
        '.......ddd......',
        '.....rrdddrr....',
        '....rRrRrRrRr...',
        '...rRrRrRrRrRr..',
        '..rRrRrRrRrRrRr.',
        '..RrRroooorRrRr.',
        '..rRroYYYYorRrR.',
        '..RrroYwwYorrRr.',
        '..rRroYYYYorRrR.',
        '..eeeeeeeeeeeee.',
        '................',
        '................',
        '................',
    ),
}


def outline_rows(rows):
    """透明格子只要上下左右挨着有色像素，就补成描边 k。"""
    h, w = len(rows), len(rows[0])
    g = [list(r) for r in rows]
    for y in range(h):
        for x in range(w):
            if rows[y][x] != '.': continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and 0 <= yy < h and rows[yy][xx] not in '.k':
                    g[y][x] = 'k'; break
    return [''.join(r) for r in g]


def card_art():
    A = {}
    for k, rows in CARDS.items():
        assert len(rows) == 16 and all(len(r) == 16 for r in rows), k
        assert all(ch == '.' or ch in PAL for r in rows for ch in r), k
        A[k] = outline_rows(list(rows))
    return A


# ---------------------------------------------------------------- 人物立绘 32×32
# 主角 5 人 + 守卫逐像素手绘（32×32），再由 outline_rows() 统一补 1px 外描边 k；
# 内部绝不留 '.'（避免自动外描边在脸/发/衣交界切出硬黑缝），统一左上主光源。
HERO_PORTRAITS = {
    # 艾拉：老兵守夜人——铜橙短发侧扎小马尾、剑眉伤疤、坚毅目光、厚红围巾、铆钉精钢护肩
    'p_ayla': (
        '................................',
        '...........OoyoOO...............',
        '.........oOyyyyooOO.............',
        '........oyyyooooOooo............',
        '.......oyyooOoooOOooO...........',
        '......ooyoOOoOooOoOOoO..........',
        '......ooOoOOoOooOoOOoO..........',
        '.....oooOOiifffffFOOoOO.........',
        '.....ooOOiifffFfFFOOoOOy........',
        '.....OoOOiuuufFFuBOuOoOyyo......',
        '.....OOOfifffFfffBFFOOoOooo.....',
        '.....OOOiMMkFfffMMkBOOooOooo....',
        '.....fOOifwkfffffwkBOOoOOoOo....',
        '.....fFOiiffFFffFFBFOO.oOOoO....',
        '.....yFOiiffFFffFFBFO..oOOoO....',
        '......FO.iiffFFffBFO....OOo.....',
        '.......F..iifSFFBFF......O......',
        '..........iiffBSSFF.............',
        '...........ffFFFFF..............',
        '..........rRRFFSSrr.............',
        '.........oRRRRRRRRrru...........',
        '........oRRrRRRRRRrruu..........',
        '....hhgoRRRrrRRRRRruuuggh.......',
        '..hhgggoRRrRRRRrrrRRrusgggh.....',
        '.hggggsRrRRrRRRrrrRRrusggggh....',
        '.hgsYgsHuRRRRRrrrrRRrHsgYgsg....',
        '.gsgggsHHuRRrruuuRRRrrsgggsd....',
        '.gssssdHHdHddHHHrRRRRHdssssd....',
        '.sddddHddHHssHHHrRRRruHddddH....',
        '.dHHHHHHssHHHssHrrRRruHHHHHH....',
        '..HHHHHHssHHHssHrrRRruHHHHH.....',
        '..HHHHHHssHHHssHuuRRruHHHHH.....',
    ),
    # 墨：流亡炼金师——深紫兜帽、额前黄铜青镜护目镜、凌乱暗发、青光锐眼与黑眼圈、歪嘴笑、胸前发光绿药瓶与气泡
    'p_mo': (
        '................................',
        '............PQQp................',
        '.........PPQQQppqq..............',
        '.......PPQQppppppqqq............',
        '......PQppqqMMMMqqpqq...........',
        '.....PQpqMMaaAAaaMMpqq..........',
        '....PQpqMaAAaaaaAaMMpqq.........',
        '....PpqaAyyyyaayyyyAmpq.........',
        '...PQpqaMywCyNMywCyMmpqq........',
        '...PpqMaMyCcyyMyCcyMmpqq........',
        '...PpqMaaMNNNaaMNNNaApqq........',
        '...PpqMAaaiiffffFFaAMpqq........',
        '...PpqMaaiMMkffMMkFaMpqq........',
        '...PpqaMaiwCfffwCFaMMpqq........',
        '...PpqMaaiFffFfFFfFaMpqq........',
        '...ppqMaaaiifffFFfFFMpqq........',
        '...ppqMaaaiffFFfFFFMMpqq........',
        '....pqMaaaifffSSBFFMMpqq........',
        '....qqMMaaafffffFFMMqqq.........',
        '.....qqqMMaFFFSSFFMMqqq.........',
        '.....qqqMMqqMyYyMqqMqqq.........',
        '....PPQppqqqqMyMqqqqppqq........',
        '...PPQQpppqqqHyHqqqpppqqq.......',
        '..PPQQpppqqqHHgHHqqqpppqqq......',
        '..PQQpppqqqHlHwHHqqqpppqqq......',
        '.PPQpppqqqHHHwllHHlHqqppqqq.....',
        '.PQpppqqqHHHwllGGHHHqqpppqq.....',
        '.PQppqqqHHlHwllGGtHHqqpppqq.....',
        '.QpqqqqHHHHHGllGtHlHHqqqqqq.....',
        '.QppqqHHHHHHHtttHHHHHHqqqqq.....',
        '.pqqqqHHHHHHHHHHHHHHHHqqqqq.....',
        '.qqqqqHHHHHHHHHHHHHHHHqqqqq.....',
    ),
    # 萤：灯匠学徒——墨蓝波波头、金色齿轮发簪（紧贴发侧）、大亮眼红颊甜笑、暖黄围巾、左下高提发光萤灯与暖光反照
    'p_ying': (
        '................................',
        '...........aAAaaaa..............',
        '.........aAAAssAAaaa............',
        '........aAAsAAAAaaaaay.Y........',
        '.......aAAaaAAAAaaaayYYYy.......',
        '......aAAaaaaaaaaaaYYaYYy.......',
        '......aAaaaAAaaaAAaayYYYy.......',
        '.....aAAaaAaaAAaaAaaay.Y........',
        '.....aAaaaiifffffFFaaa..........',
        '.....aAaaiifffFffffFaa..........',
        '.....aAaaiSSafffaSSaaa..........',
        '.....aAaiifMMkfffMMkFa..........',
        '.....aAaiifwNffffwNFFa..........',
        '.....aAaiifvNffffvNFFa..........',
        '.....AaaiBifffFFffBFFa..........',
        '.....vaaaifBffFFfBFFFa..........',
        '.....vaaaiiffBSSBFFFaM..........',
        '......vaaaaiifffffFaMM..........',
        '......aaMMaafffFFFFMMM..........',
        '.....sddMMvvYYYYyyNNMM..........',
        '....d..svYYYYYYyyyNNn...........',
        '...dsddsvYYyYYYYyyNNnn..........',
        '..sddddsvYyyYYYYyyNNnnn.........',
        '..dyYYydvNyyYYYYynNNnnnn........',
        '.sdYwwYdvwwvYYYYvwwnnnnnn.......',
        '.sdYwwYdvNwwvvvwwnnNnnnnn.......',
        '.sdyYYydmNnnwwwwnnnNnnnnnn......',
        '..sddddmmNnnwwwwnnnNnnnnnn......',
        '...NNNNmmNnnwwwwnnnnNnnnnn......',
        '...nnnnmmNnnwwwwnnnnnnmmmm......',
        '...nnnnmmNnnwwwwnnnnnnmmmm......',
        '...mmmmmmmnnwwwwnnnnmmmmmm......',
    ),
    # 石钧：城防匠——宽肩方脸、旧麻头巾飘带、浓眉稳目、短须、粗布工衣、铆钉皮围裙、肩扛重石锤
    'p_jun': (
        '................................',
        '................................',
        '..........xmmxxxx...............',
        '........xxmmmmmxxxx.............',
        '.......xmxxmmmmmxxxx............',
        '......xJJJJJJJJJJJNN............',
        '......JvJJJJJJJJJNNNNNNn........',
        '......JNNNNNNNNNNNNnNNNnn.......',
        '......xnnnnnnnnnnnnx.Nnnx.......',
        '......xxiiffffffFFxx............',
        '......xxiMxxxffxxxx.....whhhg...',
        '.....fxxifMMkffMMkx....hhggggs..',
        '.....fFxifwmfffwmFx....ggggssd..',
        '.....FFxiiffFFfFFFx....ggssssd..',
        '......FxiiffSffFFFx....ssssddd..',
        '......FximifSSfFFmx....sdddddH..',
        '.......xmmmxSSxmmm......nN......',
        '.......xmmSSBBSSmm.....nN.......',
        '.......xmmmxxxxmmm.....nN.......',
        '........xmmmmmmmx.....nN........',
        '........FFmmmmmFF.....nN........',
        '....hhg..FFFFFFF..gghnN.........',
        '...hgggsgmNNNNNmgsgggnN.........',
        '..hggggsgmnnnnNmgsggnNg.........',
        '..ggssgsgmNNNNnmgsgnNgg.........',
        '.hgsggssgmnYnnYmgssNNggs........',
        '.ggssssdgmnnnnmmgssNsssd........',
        '.gsssssdgmnxxmmngsdNsssd........',
        '.ssssdddgmnggmnngddNsddd........',
        '.ssssdddgmnxxmmngddNsddd........',
        '.dddddddgmnnnnnngddNdddd........',
        '.dddddddgmmmmmmmgddNdddd........',
    ),
    # 星遥：观星者——垂肩银白长发、左上四角金星簪、静谧蓝青星瞳、深夜蓝星辰斗篷与领口星光扣
    'p_li': (
        '................................',
        '.....Y..........................',
        '.....Y....whhhhgg...............',
        '....yYy.wwhhhhhgggg.............',
        '..YYwYYwhhhhghhggggs............',
        '....yYywhhhgghghgggs............',
        '.....Ywhhhgggggggggss...........',
        '.....ywhhggifffffFggss..........',
        '.....whhggiifffgfffggs..........',
        '.....whhggissfgFssFggss.........',
        '....whhggifMMkffMMkFggs.........',
        '....whhggifwCffffwCFggs.........',
        '....whhggifbcffffbcFggs.........',
        '....whhggiffFFffFFFFggs.........',
        '....whgggiBiffFFfBFFggs.........',
        '....wggggiffFFffFFFFggs.........',
        '....hgggggiifBBBFFgggss.........',
        '....hgsggggiifFFFggggss.........',
        '....hgsgggggFFSFFggggss.........',
        '....hgsgggdFFFFFdggggss.........',
        '....hgssgddHYYHddggggss.........',
        '...hhgssdHHHbYYbHHHdggss........',
        '..dhhgsHHHHbbwwbbHHHHggsd.......',
        '.ddHggsHHYbbbYYbbbHHHgssHd......',
        '.dHHHssHHHbbbYYbbbHHYssHHd......',
        '.dHCHssHHHbbbdbbbbHHHsCHHd......',
        'ddHHHssHHwbbbbbbbbHHHssHHdd.....',
        'dHYHHssdHHbbdbdbbbHHdssHHYd.....',
        'dHHHHssdHHbbbbbbbbHHdssHHHd.....',
        'dHHHHHddHHbbbbbbbbHHddHHHHd.....',
        'dHHwHHddHHbbbbbbbbHHddHHYHd.....',
        'HHHHHHddHHbbbbbbbbHHddHHHHH.....',
    ),
    # 城墙守卫：晨钟城夜哨——钢制锅盔、帽檐阴影下坚毅的双眼、短胡、深蓝守夜短甲、肩后铁枪尖
    'p_soldier': (
        '................................',
        '..........................w.....',
        '...........whhhg..........wg....',
        '.........wwhhhhggs.......wggs...',
        '........whhhgggsssd......wgsd...',
        '.......whhhgggssssdd.....gsdd...',
        '.......hggggggssssdd.....gsd....',
        '......hggggggggsssddd....sdd....',
        '.....hgggggggggssssdd.....N.....',
        '.....dddddddddddddddd.....n.....',
        '......smFFfffffFFFms......N.....',
        '......mmMxxffffxxFmm......n.....',
        '......mmfMMkfffMMkmm......N.....',
        '......mmfwfffffwfFmm......n.....',
        '......mmffffFFffFFmm......N.....',
        '......mmifffSFFfFFmm......n.....',
        '.......mmfmmmmmmFmm.......N.....',
        '.......mmffSSSSFmmm.......n.....',
        '........mmFFFFFmmm........N.....',
        '.........mFFSSFmm.........n.....',
        '......hgssggggggsshg......N.....',
        '.....hggssddddddssggh.....n.....',
        '....hgssddHbbbbHddssgh....N.....',
        '...hgsddHHHbbbbHHHddsgh...n.....',
        '..hgsddHHHHbYYbHHHHddsgh..N.....',
        '..gsddHHHHbbYYbbHHHHddsg..n.....',
        '..sddHHHHHbbbbbbHHHHHdds..N.....',
        '..ddHHHHHbbbbbbbbHHHHHdd..n.....',
        '..ddHHHHbbbbbbbbbbHHHHdd..N.....',
        '..dHHHHHbbbbbbbbbbHHHHHd..n.....',
        '..dHHHHHbbbbbbbbbbHHHHHd..N.....',
        '..HHHHHHbbbbbbbbbbHHHHHH..n.....',
    ),
}


def portraits():
    P = {}
    for k, rows in HERO_PORTRAITS.items():
        assert len(rows) == 32 and all(len(r) == 32 for r in rows), k
        assert all(ch == '.' or ch in PAL for r in rows for ch in r), k
        P[k] = outline_rows(list(rows))
    P.update(cast())
    return P


# ---------------------------------------------------------------- 配角立绘 32×32：剧情里和守夜人说话的人
def person(hair='a', hl='A', style='short', cloth='s', cloth2='g', skin='f', shade='F', eyes='open', age=0, beard=None, extra=None,
           face='oval', brow=None, mouth='flat', nose='dot', mark=None, iris='k'):
    """配角通用的 32×32 精绘半身像：手控受光与阴影，不使用会破坏轮廓的自动倒角。"""
    c = Cv(32, 32)
    # 辅助色阶：给布料和头发提供克制自然的明暗过渡（避免过亮导致半身异色）
    dark_cloth = SH.get(cloth, 'H' if cloth in 'dbs' else 'x' if cloth in 'mx' else 'm' if cloth in 'nNj' else 'q' if cloth in 'pPQ' else 'd')
    lite_cloth = {'g': 'h', 's': 'g', 'd': 's', 'H': 'd', 'b': 'c', 't': 'g', 'G': 't', 'n': 'N', 'N': 'J', 'm': 'n',
                  'p': 'Q', 'Q': 'P', 'R': 'o', 'r': 'R', 'y': 'Y'}.get(cloth, cloth)
    dark_hair = {'a': 'M', 'A': 'a', 'x': 'M', 'm': 'x', 'n': 'm', 'N': 'n', 'j': 'm', 'y': 'N', 'b': 'd',
                 'g': 's', 'h': 'g', 'w': 'g'}.get(hair, 'M')

    # 1. 后发 / 后兜帽
    if style == 'long':
        c.ell(16, 13, 10.2, 10.6, hair)
        c.poly([(5.5, 13), (26.5, 13), (27.5, 28), (4.5, 28)], hair)
        c.line(7, 15, 6, 26, hl, 1, True)
        c.line(25, 15, 26, 26, dark_hair, 1, True)
    elif style in ('short', 'bun', 'scarf'):
        c.ell(16, 11.8, 9.2, 9.6, hair)
        c.ell(17.5, 13, 7.6, 8.2, dark_hair)
        c.ell(15.2, 11.2, 8.2, 8.6, hair)
    elif style == 'hood':
        c.ell(16, 13.8, 11.4, 12.2, cloth2)
        c.ell(16, 14.5, 9.2, 9.8, 'M')

    # 2. 躯干与衣领（统一底色 + 左肩细高光边 + 右肩与褶皱阴影）
    c.poly([(2, 31), (4, 24.5), (10, 21), (22, 21), (28, 24.5), (30, 31)], cloth)
    c.line(4, 25, 10, 21, lite_cloth, 1, True)
    c.line(5, 25, 10, 22, lite_cloth, 1, True)
    c.poly([(21, 21.5), (27.5, 25), (29.5, 31), (22, 31)], dark_cloth)
    c.poly([(11, 21), (21, 21), (19, 31), (13, 31)], cloth2)
    c.line(11, 22, 13, 30, dark_cloth, 1, True)
    c.line(21, 22, 19, 30, dark_cloth, 1, True)
    c.line(7, 26, 6, 30, dark_cloth, 1, True)
    c.line(24, 26, 25, 30, dark_cloth, 1, True)

    # 3. 脖子与下巴投影
    c.rect(13, 18, 18, 22, shade)
    c.rect(13, 18, 15, 21, skin)
    c.line(13, 19, 18, 19, 'S', 1, True)
    c.line(14, 20, 18, 20, shade, 1, True)

    # 4. 脸型（下颌收窄 + 耳朵 + 立体受光）
    rx, ry = {'oval': (6.2, 7.2), 'round': (6.8, 6.7), 'long': (5.7, 7.8), 'square': (6.6, 7.0)}[face]
    cy = 13.4 if age < 2 else 13.8
    c.rect(9, 13, 9, 15, skin); c.px(9, 15, shade)
    c.rect(22, 13, 22, 15, shade); c.px(22, 15, 'S')
    c.ell(16, cy, rx, ry, skin)
    if face == 'square':
        c.rect(11, 16, 21, 19, skin)
    elif face == 'oval':
        c.px(10, 18, '.'); c.px(22, 18, '.')
    for y in range(7, 22):
        for x in range(9, 24):
            if c.get(x, y) != skin: continue
            if x <= 13 and y <= 16 and (x - 12) ** 2 + (y - 12) ** 2 <= 14:
                c.px(x, y, 'i')
            elif x >= 19 or (x >= 18 and y >= 15) or y >= 19:
                c.px(x, y, shade)
            if x >= 21 and y >= 14:
                c.px(x, y, 'S')

    # 5. 发型与头饰（发际投影 + 高光弧 + 层次）
    if style in ('short', 'long', 'bun'):
        c.line(11, 8, 21, 8, shade, 1, True)
        c.poly([(8.5, 12), (9, 5.5), (13, 2.5), (19, 2.5), (23.5, 5.5), (23.5, 12), (21, 8.2), (18, 7.2), (15, 8.6), (12, 7.6), (10, 9.5)], hair)
        c.line(11, 4, 15, 4, hl, 1, True); c.line(12, 5, 14, 5, hl, 1, True)
        c.line(21, 6, 23, 9, dark_hair, 1, True)
        if style == 'bun':
            c.ell(16, 2.6, 3.6, 2.5, hair)
            c.line(14, 1, 16, 1, hl, 1, True)
            c.line(14, 4, 18, 4, dark_hair, 1, True)
    elif style == 'bald':
        c.rect(13, 8, 15, 9, 'i', True); c.px(14, 7, 'i', True); c.px(15, 7, 'i', True)
        c.rect(9, 11, 9, 13, hair); c.rect(22, 11, 22, 13, dark_hair)
    elif style == 'cap':
        c.poly([(7.5, 10), (8, 5), (12, 2.5), (20, 2.5), (24, 5), (24.5, 10)], hair)
        c.line(10, 4, 16, 4, hl, 1, True)
        c.rect(7, 8, 25, 9, dark_hair); c.line(8, 8, 20, 8, hl, 1, True)
        c.line(10, 10, 22, 10, shade, 1, True)
    elif style == 'scarf':
        c.poly([(8, 10), (8.5, 5), (12, 3), (20, 3), (23.5, 5), (24, 10)], hair)
        c.line(10, 5, 18, 5, hl, 1, True)
        c.line(8, 8, 24, 8, dark_hair, 1, True)
        c.line(8, 9, 24, 9, hl, 1, True)
        c.poly([(23, 7), (27.5, 9), (26.5, 14), (24, 11)], hair)
        c.line(24, 9, 26, 12, dark_hair, 1, True)
        c.line(10, 10, 22, 10, shade, 1, True)
    elif style == 'hood':
        c.poly([(4.5, 18), (6.5, 5), (16, 1), (25.5, 5), (27.5, 18), (23, 8.5), (16, 5.5), (9, 8.5)], cloth2)
        c.line(8, 5, 14, 2, HL.get(cloth2, 'w'), 1, True)
        c.line(23, 6, 26, 14, SH.get(cloth2, 'x'), 1, True)
        c.line(10, 9, 22, 9, shade, 1, True)
    elif style == 'helm':
        c.ell(16, 7.6, 8.4, 6.2, 's')
        c.ell(13.5, 6.2, 4.2, 3.2, 'g')
        c.line(11, 4, 13, 3, 'h', 1, True)
        c.rect(7, 9, 25, 10, 'd'); c.line(8, 9, 21, 9, 'g', 1, True)
        c.line(16, 2, 16, 9, 'h', 1, True)
        c.line(10, 11, 22, 11, 'S', 1, True)

    # 6. 眼睛（上睫毛、高光、下睑微影）
    if eyes == 'closed':
        c.line(11, 13, 13, 13, 'M', 1, True); c.line(18, 13, 20, 13, 'M', 1, True)
        c.px(12, 14, shade, True); c.px(19, 14, shade, True)
    elif eyes == 'narrow':
        c.line(11, 12, 13, 12, 'M', 1, True); c.line(18, 12, 20, 12, 'M', 1, True)
        c.px(12, 13, iris, True); c.px(11, 13, 'w', True)
        c.px(19, 13, iris, True); c.px(18, 13, 'w', True)
    elif eyes == 'squint':
        for x0 in (11, 18):
            c.px(x0, 13, 'M', True); c.px(x0 + 1, 12, 'M', True); c.px(x0 + 2, 13, 'M', True)
            c.px(x0 + 1, 14, 'B', True)
    elif eyes == 'round':
        for x0 in (11, 18):
            c.line(x0, 11, x0 + 2, 11, 'M', 1, True)
            c.rect(x0, 12, x0 + 2, 13, 'k', True)
            c.px(x0, 12, 'w', True); c.px(x0 + 2, 13, 'S', True)
    else:
        for x0 in (11, 18):
            c.line(x0, 12, x0 + 2, 12, 'M', 1, True)
            c.px(x0, 13, 'w', True); c.px(x0 + 1, 13, iris, True); c.px(x0 + 2, 13, 'k', True)
        if eyes == 'glasses':
            c.rect(10, 11, 14, 14, 's'); c.rect(17, 11, 21, 14, 's')
            c.line(10, 11, 14, 11, 'h', 1, True); c.line(17, 11, 21, 11, 'h', 1, True)
            c.rect(11, 12, 13, 13, 'c', True); c.rect(18, 12, 20, 13, 'c', True)
            c.px(12, 13, 'k', True); c.px(19, 13, 'k', True)
            c.px(11, 12, 'w', True); c.px(18, 12, 'w', True)
            c.line(14, 12, 17, 12, 'g', 1, True)

    # 7. 年龄纹理 & 眉毛
    if age >= 1:
        c.px(11, 14, shade, True); c.px(20, 14, shade, True)
    if age >= 2:
        c.px(10, 15, 'S', True); c.px(21, 15, 'S', True)
        c.px(13, 17, shade, True); c.px(19, 17, shade, True)

    bcol = 'x' if hair in 'xmnN' else 's' if hair in 'wg' else 'M'
    if brow == 'flat':
        c.line(11, 10, 13, 10, bcol, 1, True); c.line(18, 10, 20, 10, bcol, 1, True)
    elif brow == 'thick':
        c.rect(10, 10, 13, 10, bcol, True); c.px(11, 9, bcol, True); c.px(12, 9, bcol, True)
        c.rect(18, 10, 21, 10, bcol, True); c.px(19, 9, bcol, True); c.px(20, 9, bcol, True)
    elif brow == 'angry':
        c.line(10, 9, 13, 10, bcol, 1, True); c.line(18, 10, 21, 9, bcol, 1, True)
    elif brow == 'worried':
        c.line(10, 10, 13, 9, bcol, 1, True); c.line(18, 9, 21, 10, bcol, 1, True)
    elif brow == 'arched':
        c.px(10, 10, bcol, True); c.line(11, 9, 12, 9, bcol, 1, True); c.px(13, 10, bcol, True)
        c.px(18, 10, bcol, True); c.line(19, 9, 20, 9, bcol, 1, True); c.px(21, 10, bcol, True)

    # 8. 鼻子
    if nose == 'long':
        c.line(16, 13, 16, 15, shade, 1, True); c.px(15, 15, 'S', True)
    elif nose == 'broad':
        c.px(16, 14, shade, True); c.line(15, 15, 17, 15, 'S', 1, True)
    elif nose == 'dot':
        c.px(16, 15, 'S', True)

    # 9. 嘴（自然唇影 S/B）
    if mouth == 'smile':
        c.line(15, 17, 17, 17, 'S', 1, True); c.px(14, 16, 'B', True); c.px(18, 16, 'B', True)
    elif mouth in ('grin', 'gap'):
        c.line(15, 17, 17, 17, 'w', 1, True); c.line(15, 18, 17, 18, 'S', 1, True)
        c.px(14, 17, 'S', True); c.px(18, 17, 'S', True)
    elif mouth == 'frown':
        c.line(15, 17, 17, 17, 'S', 1, True); c.px(14, 18, 'S', True); c.px(18, 18, 'S', True)
    elif mouth == 'small':
        c.line(15, 17, 16, 17, 'B', 1, True)
    elif mouth == 'open':
        c.rect(15, 17, 17, 18, 'e', True); c.line(15, 17, 17, 17, 'S', 1, True)
    else:
        c.line(15, 17, 17, 17, 'S', 1, True)
    if mouth == 'gap':
        c.px(16, 17, 'M', True)

    # 10. 脸部特征
    if mark == 'freckles':
        for x, y in ((11, 15), (12, 16), (19, 16), (20, 15)): c.px(x, y, shade, True)
    elif mark == 'mole':
        c.px(19, 16, 'M', True)
    elif mark == 'scar':
        c.line(19, 10, 21, 15, 'B', 1, True); c.px(20, 12, 'r', True)
    elif mark == 'dirt':
        c.px(11, 15, 's', True); c.px(12, 16, 'j', True); c.px(20, 15, 'j', True)

    # 11. 胡须
    if beard:
        bsh = SH.get(beard, 'm' if beard in 'nN' else 's' if beard in 'wg' else 'x')
        for x in range(10, 23):
            for y in range(16, 22):
                if c.get(x, y) in (skin, shade, 'S', 'i') and (y >= 18 or (y == 17 and (x <= 11 or x >= 21)) or x <= 10 or x >= 22):
                    c.px(x, y, bsh if (x >= 18 or y >= 20) else beard, True)
        c.line(13, 16, 19, 16, beard, 1, True)
        if mouth == 'flat':
            c.line(14, 17, 18, 17, 'S', 1, True)

    if extra:
        extra(c)
    return outline_rows([''.join(r) for r in c.g])


def cast():
    P = {}
    # 艾拉那边
    P['p_karl'] = person(hair='y', hl='Y', style='short', cloth='p', cloth2='Q', age=1, beard='N', face='square', brow='angry', eyes='narrow',
                         extra=lambda c: (
                             c.line(13, 8, 15, 10, 'r', 1, True), c.px(14, 9, 'B', True),
                             c.ell(5.5, 25.5, 4.2, 3.0, 's'), c.ell(5, 24.5, 3.2, 1.8, 'g'), c.line(3, 23, 6, 23, 'h', 1, True), c.px(5, 25, 'Y', True),
                             c.ell(26.5, 25.5, 4.2, 3.0, 'd'), c.ell(26, 24.5, 3.0, 1.8, 's'), c.line(25, 23, 28, 23, 'g', 1, True), c.px(26, 25, 'Y', True),
                         ))
    P['p_xiaoman'] = person(hair='n', hl='J', style='scarf', cloth='b', cloth2='c', face='round', eyes='round', mouth='smile', nose='none', mark='freckles',
                            extra=lambda c: (
                                c.px(11, 15, 'B', True), c.px(20, 15, 'B', True),
                                c.rect(24, 24, 28, 30, 'N'), c.line(24, 24, 24, 30, 'J', 1, True), c.line(28, 24, 28, 30, 'n', 1, True),
                                c.rect(25, 22, 27, 23, 'n'), c.line(21, 21, 25, 24, 'm', 1, True),
                            ))
    P['p_chu'] = person(hair='g', hl='w', style='bald', cloth='d', cloth2='H', eyes='closed', age=2, beard='w', face='long', nose='long',
                        extra=lambda c: (
                            c.rect(7, 25, 10, 26, 'y'), c.px(7, 25, 'Y', True),
                            c.line(11, 11, 13, 11, 'w', 1, True), c.line(18, 11, 20, 11, 'w', 1, True),
                            c.line(14, 22, 18, 22, 'y', 1, True),
                        ))
    # 墨那边
    P['p_suyan'] = person(hair='a', hl='A', style='bun', cloth='g', cloth2='h', eyes='glasses', face='long', mouth='small', brow='arched',
                          extra=lambda c: (
                              c.line(20, 3, 24, 0, 'y', 1, True), c.px(24, 0, 'Y', True),
                              c.line(12, 22, 14, 28, 'Q', 1, True), c.line(20, 22, 18, 28, 'Q', 1, True),
                              c.px(16, 24, 'P', True),
                          ))
    P['p_shen'] = person(hair='b', hl='c', style='scarf', cloth='t', cloth2='g', age=2, skin='f', shade='F', face='round', eyes='squint', mouth='smile',
                         extra=lambda c: (
                             c.rect(4, 28, 8, 31, 'b'), c.line(5, 28, 7, 28, 'c', 1, True),
                             c.rect(24, 28, 28, 31, 'b'), c.line(25, 28, 27, 28, 'c', 1, True),
                         ))
    # 萤那边
    P['p_qin'] = person(hair='g', hl='w', style='cap', cloth='n', cloth2='N', eyes='glasses', age=2, beard='g', nose='long', brow='thick',
                        extra=lambda c: (
                            c.rect(23, 24, 28, 30, 'd'), c.rect(24, 25, 27, 29, 'y', True),
                            c.rect(25, 26, 26, 28, 'Y', True), c.px(25, 26, 'w', True),
                            c.line(24, 23, 27, 23, 'N', 1, True),
                        ))
    P['p_ahe'] = person(hair='x', hl='n', style='short', cloth='G', cloth2='t', face='long', eyes='narrow', brow='thick', mouth='grin',
                        extra=lambda c: (
                            c.line(1, 22, 30, 22, 'n', 1, True), c.line(2, 21, 29, 21, 'N', 1, True),
                            c.rect(1, 24, 4, 29, 'N'), c.line(1, 26, 4, 26, 'x', 1, True), c.line(2, 22, 2, 24, 'm', 1, True),
                            c.rect(27, 24, 30, 29, 'N'), c.line(27, 26, 30, 26, 'x', 1, True), c.line(29, 22, 29, 24, 'm', 1, True),
                        ))
    P['p_douzi'] = person(hair='a', hl='A', style='short', cloth='R', cloth2='o', face='round', eyes='round', mouth='gap', nose='none',
                          extra=lambda c: (
                              c.px(11, 15, 'B', True), c.px(20, 15, 'B', True),
                              c.rect(3, 24, 8, 29, 'o'), c.rect(4, 25, 7, 28, 'Y', True),
                              c.px(5, 26, 'w', True), c.line(4, 23, 7, 23, 'n', 1, True), c.line(4, 30, 7, 30, 'n', 1, True),
                          ))
    # 钧那边
    P['p_oldshi'] = person(hair='j', hl='J', style='scarf', cloth='g', cloth2='s', age=2, beard='g', face='long', eyes='squint', brow='worried', nose='broad',
                           extra=lambda c: (
                               [c.px(x, y, 'h' if y == 28 else 'g' if y == 29 else '.') for y in range(28, 32) for x in range(2, 30)
                                if (y == 31 and x % 3 != 0) or (y == 30 and x % 2 == 0) or (y == 29 and x % 4 == 1) or (y == 28 and x % 5 == 2)]
                           ))
    P['p_guizhi'] = person(hair='a', hl='A', style='bun', cloth='Q', cloth2='v', age=1, brow='arched', mouth='smile', mark='mole',
                           extra=lambda c: (
                               c.line(13, 2, 19, 3, 'y', 1, True), c.px(15, 2, 'Y', True),
                               c.px(11, 15, 'B', True), c.px(20, 15, 'B', True),
                           ))
    P['p_shitou'] = person(hair='x', hl='n', style='short', cloth='N', cloth2='J', face='round', brow='angry', mouth='frown', mark='dirt',
                           extra=lambda c: (
                               c.px(11, 15, 'B', True), c.px(20, 15, 'B', True),
                               c.rect(22, 24, 29, 29, 'r'), c.line(22, 24, 29, 24, 'o', 1, True),
                               c.line(22, 27, 29, 27, 'u', 1, True), c.px(25, 25, 'u', True),
                           ))
    P['p_hans'] = person(hair='g', hl='h', style='helm', cloth='s', cloth2='d', age=2, beard='g', face='square', eyes='narrow', mark='scar', iris='C',
                         extra=lambda c: (
                             c.px(12, 13, 'C', True), c.px(19, 13, 'C', True),
                             c.line(8, 22, 24, 22, 'h', 1, True),
                         ))
    # 璃那边
    P['p_popo'] = person(hair='h', hl='w', style='bun', cloth='H', cloth2='d', eyes='closed', age=2, face='round', mouth='smile', nose='broad',
                         extra=lambda c: (
                             c.px(6, 27, 'Y', True), c.px(25, 28, 'Y', True), c.px(9, 29, 'C', True), c.px(22, 25, 'y', True),
                             c.line(19, 1, 22, 3, 'Y', 1, True), c.px(21, 1, 'w', True),
                         ))
    P['p_lifa'] = person(hair='g', hl='h', style='hood', cloth='m', cloth2='n', age=1, beard='N', face='long', brow='worried', eyes='narrow',
                         extra=lambda c: (
                             c.px(8, 5, 'w', True), c.px(9, 6, 'h', True), c.px(23, 5, 'w', True),
                             c.px(14, 2, 'w', True), c.px(26, 12, 'w', True), c.px(6, 14, 'h', True),
                         ))
    return P


# ---------------------------------------------------------------- 敌人 16×16（大型 24，精英 32，首领 48）
def mirror(c, cx=None):
    """把左半边镜像到右半边（对称生物用）。"""
    cx = cx if cx is not None else c.w // 2
    for y in range(c.h):
        for x in range(cx):
            v = c.g[y][x]; xx = c.w - 1 - x
            if v != '.': c.g[y][xx] = v
            if (x, y) in c.lock: c.lock.add((xx, y))


def pad(rows, size):
    """补透明边到 size×size（左右居中、底对齐，脚下位置不变）。敌人只用 16 / 24 / 32 / 48 四档，放进 UI 框时都能取整数倍。"""
    h, w = len(rows), len(rows[0]); l = (size - w) // 2
    return ['.' * size] * (size - h) + ['.' * l + r + '.' * (size - w - l) for r in rows]


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
    E['mini'] = pad(c.done(), 16)

    c = Cv(20, 20); c.poly([(3, 7), (7, 5), (13, 5), (17, 7), (18, 14), (15, 18), (5, 18), (2, 14)], 'g'); c.ell(10, 5, 4.5, 3.8, 'g')
    c.ell(2.5, 12, 2.5, 3.2, 's'); c.ell(17.5, 12, 2.5, 3.2, 's'); c.rect(5, 17, 8, 19, 's'); c.rect(12, 17, 15, 19, 's')
    c.rect(7, 4, 8, 5, 'Y', True); c.rect(12, 4, 13, 5, 'Y', True); c.line(8, 8, 12, 8, 'd', 1, True)
    c.line(6, 10, 9, 14, 'd', 1, True); c.line(13, 11, 15, 15, 'd', 1, True); c.px(10, 12, 'Y', True)
    for x, y in ((4, 7), (5, 7), (14, 6), (11, 2), (16, 16)): c.px(x, y, 'G', True)
    E['golem'] = pad(c.done(), 24)

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

    E.update(frost_enemies()); E.update(big_foes())
    return E


# ---------------------------------------------------------------- 第二套敌人：霜潮（冰原来的东西）
def frost_enemies():
    E = {}
    # 冰螨：一团带冰刺的小虫
    c = Cv(); c.ell(8, 10.5, 6.5, 4, 'g'); c.ell(8, 9.5, 5, 2.6, 'w')
    for x, y in ((4, 5), (8, 3), (12, 5)): c.poly([(x - 1.5, y + 4), (x, y), (x + 1.5, y + 4)], 'C')
    c.rect(5, 9, 6, 10, 'k', True); c.rect(10, 9, 11, 10, 'k', True); c.px(5, 9, 'R', True); c.px(10, 9, 'R', True)
    for x in (3, 6, 10, 13): c.line(x, 14, x - (1 if x < 8 else -1), 15, 's', 1)
    E['f_mite'] = c.done()
    # 雪鸮：白色大眼猫头鹰，张开翅膀
    c = Cv(); c.poly([(7, 7), (0, 4), (0, 9), (2, 12), (7, 12)], 'g'); c.line(1, 6, 1, 10, 'w', 1); mirror(c)
    c.ell(8, 8.5, 4, 5, 'w'); c.poly([(4.5, 4), (5, 1), (7, 4)], 'w'); c.poly([(9, 4), (11, 1), (11.5, 4)], 'w')
    c.ell(6, 6.5, 1.6, 1.6, 'Y', True); c.ell(10, 6.5, 1.6, 1.6, 'Y', True); c.px(6, 6, 'k', True); c.px(10, 6, 'k', True)
    c.poly([(7, 8), (9, 8), (8, 10)], 'o'); c.px(6, 11, 'g'); c.px(10, 11, 'g'); c.px(8, 12, 'g')
    E['f_owl'] = c.done()
    # 冻尸：结了冰的死人，蓝皮肤、破烂的旧衣、肩上冰棱
    c = Cv(); c.ell(8, 4.5, 3.6, 3.4, 'c'); c.rect(6, 5, 7, 6, 'k', True); c.rect(9, 5, 10, 6, 'k', True); c.px(6, 5, 'C', True); c.px(9, 5, 'C', True)
    c.line(7, 8, 9, 8, 'd', 1, True); c.rect(4, 9, 12, 13, 'm'); c.line(6, 10, 10, 10, 'n', 1, True); c.px(5, 13, '.'); c.px(9, 13, '.'); c.px(11, 12, 'x', True)
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
    E['f_chip'] = pad(c.done(), 16)
    # 雪人：大块头，白毛、冰角，撞墙会冻住你的卡
    c = Cv(20, 20); c.poly([(3, 8), (6, 5), (14, 5), (17, 8), (18, 15), (15, 19), (5, 19), (2, 15)], 'w'); c.ell(10, 6, 5, 4.2, 'w')
    c.poly([(5, 4), (3, 0), (7, 3)], 'C'); c.poly([(15, 4), (17, 0), (13, 3)], 'C')
    c.ell(10, 7.5, 3.6, 2.6, 'g'); c.rect(8, 6, 8, 7, 'k', True); c.rect(12, 6, 12, 7, 'k', True); c.px(8, 6, 'c', True); c.px(12, 6, 'c', True)
    c.line(8, 9, 12, 9, 'b', 1, True); c.px(9, 10, 'w', True); c.px(11, 10, 'w', True)
    c.ell(2.5, 12, 2.4, 3.4, 'g'); c.ell(17.5, 12, 2.4, 3.4, 'g'); c.rect(5, 18, 8, 19, 'g'); c.rect(12, 18, 15, 19, 'g')
    for x, y in ((6, 12), (13, 14), (9, 16), (11, 11)): c.px(x, y, 'g', True)
    E['f_yeti'] = pad(c.done(), 24)
    # 冰墙卫：举着一面冰盾
    c = Cv(); c.ell(8, 3.5, 3, 2.8, 's'); c.rect(5, 3, 11, 4, 's'); c.line(6, 3, 10, 3, 'C', 1, True)
    c.line(14, 0, 14, 15, 'g', 1); c.poly([(13, 0), (15, 0), (14, 2)], 'C')
    c.poly([(2, 6), (12, 6), (12, 12), (7, 16), (2, 12)], 'C'); c.poly([(4, 8), (10, 8), (10, 11), (7, 14), (4, 11)], 'c')
    c.line(5, 9, 7, 11, 'w', 1, True); c.rect(4, 15, 5, 15, 'd'); c.rect(9, 15, 10, 15, 'd')
    E['f_warden'] = c.done()
    # 霜巫：紫兜帽（霜潮主色是冰蓝，施法的三个各用一个副色：霜巫紫、法师白、祭司金），法杖顶着一颗冰珠，会给附近的怪回血
    c = Cv(); c.poly([(4, 15), (5, 5), (8, 1), (11, 5), (12, 15)], 'p'); c.ell(8, 6, 2.5, 2.2, 'k', True)
    c.px(7, 6, 'C', True); c.px(9, 6, 'C', True); c.rect(6, 10, 10, 11, 'P'); c.line(13, 3, 13, 15, 'g', 1)
    c.ell(13, 2, 1.8, 1.8, 'C'); c.px(13, 2, 'w', True); c.line(3, 7, 1, 5, 'w', 1); c.px(1, 4, 'C')
    E['f_witch'] = c.done()
    # 号角手：吹着骨号，催队伍快走
    c = Cv(); c.ell(8, 4, 3.5, 3, 'g'); c.poly([(4, 2), (5, 0), (6, 2)], 'w'); c.poly([(10, 2), (11, 0), (12, 2)], 'w')
    c.px(7, 4, 'b', True); c.px(9, 4, 'b', True); c.rect(5, 7, 11, 12, 'd'); c.line(6, 9, 10, 9, 's', 1, True)
    c.poly([(9, 6), (15, 3), (16, 6), (10, 8)], 'N'); c.px(15, 4, 'w', True); c.rect(5, 13, 6, 15, 'd'); c.rect(10, 13, 11, 15, 'd')
    E['f_horn'] = c.done()
    # 冰雷甲虫：深紫硬壳、高背，背着一颗冰雷，死了会炸
    c = Cv(); c.ell(8, 10.5, 6, 4.5, 'a'); c.ell(8, 9.5, 5, 3.2, 'A'); c.line(8, 7, 8, 13, 'a', 1, True)
    c.ell(3, 11, 2, 1.6, 'a'); c.px(2, 11, 'C', True); c.line(1, 10, 0, 8, 'g', 1)
    c.ell(9, 5.5, 3, 3, 'C'); c.px(8, 4, 'w', True); c.line(10, 3, 12, 1, 'N', 1); c.px(13, 0, 'Y', True); c.px(12, 0, 'o', True)
    for x in (4, 8, 12): c.px(x, 14, 'd'); c.px(x, 15, 'd')
    E['f_beetle'] = c.done()
    # 雪雾：一团会散开的风雪，时有时无
    c = Cv(); c.ell(8, 7, 5.5, 5, 'w'); c.poly([(3, 7), (13, 7), (14, 11), (12, 15), (10, 12), (8, 15), (6, 12), (3, 14)], 'w')
    c.line(4, 5, 7, 4, 'g', 1, True); c.line(9, 9, 12, 8, 'g', 1, True); c.line(5, 11, 8, 11, 'g', 1, True)
    c.rect(6, 6, 6, 7, 'b', True); c.rect(10, 6, 10, 7, 'b', True)
    E['f_wisp'] = c.done()
    # 冰棺祭司：白袍金冠的祭司，让冻尸站起来
    c = Cv(); c.poly([(3, 15), (5, 5), (8, 2), (11, 5), (13, 15)], 'g'); c.ell(8, 6, 2.4, 2.4, 'c'); c.px(7, 6, 'w', True); c.px(9, 6, 'w', True)
    for x in (6, 8, 10): c.poly([(x - 1, 3), (x, 0), (x + 1, 3)], 'Y')
    c.rect(5, 10, 11, 10, 'y'); c.line(8, 11, 8, 14, 'y', 1, True); c.line(14, 3, 14, 15, 'x', 1); c.rect(13, 1, 15, 4, 'C'); c.px(14, 2, 'b', True)
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


class Big(Cv):
    """按 k 倍坐标重新栅格化的画布：图元（矩形、椭圆、多边形、线）在大画布上重画，边缘是新的像素而不是放大的方块；单点细节画成 k 倍小块。
    用来把 32 格的设计改成 48 格首领，不是把小图整体放大。"""
    def __init__(s, w, h, k):
        super().__init__(round(w * k), round(h * k)); s.k = k

    raw = False

    def px(s, x, y, c, lock=False):
        if s.raw: return Cv.px(s, x, y, c, lock)
        k = s.k; x0, y0 = int(round(x * k)), int(round(y * k))
        for yy in range(y0, max(y0 + 1, int(round((y + 1) * k)))):
            for xx in range(x0, max(x0 + 1, int(round((x + 1) * k)))): Cv.px(s, xx, yy, c, lock)

    def rect(s, x0, y0, x1, y1, c, lock=False):
        k = s.k
        for y in range(int(round(y0 * k)), int(round((y1 + 1) * k))):
            for x in range(int(round(x0 * k)), int(round((x1 + 1) * k))): Cv.px(s, x, y, c, lock)

    def _raw(s, f, *a):
        s.raw = True
        try: f(s, *a)
        finally: s.raw = False

    def ell(s, cx, cy, rx, ry, c, lock=False):
        k = s.k; s._raw(Cv.ell, (cx + 0.5) * k - 0.5, (cy + 0.5) * k - 0.5, rx * k, ry * k, c, lock)

    def poly(s, pts, c, lock=False):
        k = s.k; s._raw(Cv.poly, [(x * k, y * k) for x, y in pts], c, lock)

    def line(s, x0, y0, x1, y1, c, t=1, lock=False):
        k = s.k; f = lambda v: (v + 0.5) * k - 0.5
        s._raw(Cv.line, f(x0), f(y0), f(x1), f(y1), c, max(1, round(t * k)) if t > 1 else t, lock)


# ---------------------------------------------------------------- 首领与精英：比小怪大一圈，细节更多
# 战场分辨率调高后小怪 16 格显得小，首领和精英单独画大图（精英 30 补边到 32，首领一律 48），不再把 16 格小怪放大两倍充数。
def big_foes():
    E = {}
    # 暗影骑士：角盔红眼、紫披风、左手塔盾、右手竖着大剑。和其他首领一样 48 格：按 32 格的设计在 48 格上重新栅格化
    c = Big(32, 32, 1.5)
    c.poly([(8, 10), (24, 10), (28, 31), (4, 31)], 'p'); c.line(7, 16, 5, 30, 'P', 1); c.line(25, 16, 27, 30, 'e', 1)
    c.rect(11, 23, 14, 29, 's'); c.rect(18, 23, 21, 29, 's'); c.rect(10, 29, 14, 30, 'd'); c.rect(18, 29, 22, 30, 'd')
    c.px(12, 25, 'g', True); c.px(19, 25, 'g', True)
    c.poly([(10, 11), (22, 11), (21, 23), (11, 23)], 's'); c.line(16, 12, 16, 17, 'g', 1)
    c.poly([(13, 16), (19, 16), (19, 26), (16, 28), (13, 26)], 'P'); c.rect(15, 18, 17, 22, 'Y'); c.rect(14, 19, 18, 20, 'Y')
    c.rect(11, 22, 21, 22, 'n'); c.px(16, 22, 'y', True)
    c.ell(9, 12, 3.6, 2.8, 'g'); c.ell(23, 12, 3.6, 2.8, 'g'); c.poly([(6, 11), (4, 7), (8, 10)], 'w'); c.poly([(26, 11), (28, 7), (24, 10)], 'w')
    c.ell(16, 6, 4.6, 4.8, 's'); c.rect(12, 7, 20, 10, 's'); c.poly([(12, 4), (9, 0), (11, 5)], 'g'); c.poly([(20, 4), (23, 0), (21, 5)], 'g')
    c.rect(13, 6, 19, 7, 'k', True); c.px(14, 6, 'R', True); c.px(18, 6, 'R', True); c.px(15, 6, 'o', True); c.px(17, 6, 'o', True)
    c.line(16, 1, 16, 4, 'd', 1, True); c.line(14, 9, 18, 9, 'd', 1, True)
    c.poly([(1, 14), (9, 14), (9, 24), (5, 28), (1, 24)], 'd'); c.poly([(2, 15), (8, 15), (8, 23), (5, 26), (2, 23)], 'p')
    c.ell(5, 19.5, 1.6, 2, 'R'); c.px(5, 19, 'Y', True)
    c.line(28, 1, 28, 20, 'g', 2); c.line(28, 2, 28, 19, 'w', 1, True); c.rect(25, 21, 31, 22, 'y'); c.rect(28, 23, 28, 26, 'n'); c.px(28, 27, 'Y')
    c.ell(25, 23, 1.8, 1.8, 'g')
    E['b_knight'] = c.done()

    # 深渊之眼：一颗长着獠牙眼睑的大眼，底下拖着一把触手
    c = Cv(48, 48)
    for i, (x0, dx) in enumerate(((9, -4), (15, -2), (21, -.5), (27, .5), (33, 2), (39, 4))):
        for j in range(14):
            t = j / 13; x = x0 + dx * t * 2.2 + math.sin(t * 4 + i * 1.3) * 2
            c.ell(x, 29 + j * 1.3, 2.4 - t * 1.4, 1.5, 'e' if j % 3 == 0 else 'r')
            if j % 3 == 1 and j < 11: c.px(x - .6, 29 + j * 1.3, 'o', True)
    c.ell(24, 19, 20, 16, 'r'); c.ell(24, 18, 18, 14, 'R')
    for x in range(6, 43, 4):
        h = 5 - abs(x - 24) * .1
        c.poly([(x - 2, 8 + abs(x - 24) * .28), (x, 8 + abs(x - 24) * .28 - h), (x + 2, 8 + abs(x - 24) * .28)], 'e')
    c.ell(24, 19, 15.5, 11, 'w'); c.ell(24, 21, 15, 9, 'g')
    c.ell(24, 19, 14.5, 9.5, 'w')
    for (x0, y0, x1, y1, x2, y2) in ((10, 15, 14, 17, 13, 20), (9, 22, 14, 21, 16, 24), (38, 14, 34, 17, 35, 20), (39, 22, 34, 21, 32, 24), (20, 10, 21, 12, 19, 13), (29, 27, 28, 25, 30, 24)):
        c.line(x0, y0, x1, y1, 'R', 1, True); c.line(x1, y1, x2, y2, 'r', 1, True)
    c.ell(24, 19, 8, 8, 'e'); c.ell(24, 19, 7, 7, 'R'); c.ell(24, 19, 5.2, 5.2, 'o'); c.ell(24, 19, 3.4, 3.4, 'y')
    c.rect(23, 13, 25, 25, 'k', True); c.rect(22, 16, 26, 22, 'k', True)
    c.rect(19, 14, 20, 15, 'w', True); c.px(21, 13, 'w', True); c.px(27, 23, 'y', True)
    for x in range(10, 39, 3): c.poly([(x, 7.5 + abs(x - 24) * .16), (x + 1.5, 11 + abs(x - 24) * .1), (x + 3, 7.5 + abs(x - 24) * .16)], 'w')
    for x in range(12, 37, 3): c.poly([(x, 30 - abs(x - 24) * .18), (x + 1.5, 26.5 - abs(x - 24) * .1), (x + 3, 30 - abs(x - 24) * .18)], 'w')
    E['b_eye'] = c.done()

    # 深渊母巢：鼓胀的紫色肉囊，背上挂满发光的卵，一张长牙的嘴，底下几条节肢
    c = Cv(48, 48)
    for sx in (1, -1):
        for (a, b, cc) in ((14, 34, 6), (12, 38, 3), (17, 38, 11)):  # 节肢：根部 x、膝盖高度、膝盖 x（左半边，右边镜像）
            x0, x1, x2 = 24 + sx * (24 - a), 24 + sx * (24 - cc), 24 + sx * (24 - cc + 3)
            c.line(x0, b - 4, x1, b, 'd', 2); c.line(x1, b, x2, min(47, b + 6), 'd', 2); c.px(x2, min(47, b + 6), 's')
    c.ell(24, 22, 19, 16, 'p'); c.ell(23, 19, 16, 13, 'P'); c.ell(20, 14, 8, 5, 'P')
    for (x, y, r) in ((11, 14, 3.2), (33, 11, 3.6), (38, 20, 3), (16, 7, 2.6), (27, 6, 2.4), (8, 23, 2.6), (40, 28, 2.4)):
        c.ell(x, y, r, r * .9, 'G'); c.ell(x - .6, y - .6, r * .55, r * .5, 'l'); c.px(x - 1, y - 1, 'w', True)
    for (x0, y0, x1, y1) in ((14, 18, 20, 12), (30, 16, 26, 24), (12, 27, 17, 24), (34, 26, 38, 23)): c.line(x0, y0, x1, y1, 'p', 1, True)
    c.ell(24, 29, 9, 5.5, 'e'); c.ell(24, 29.5, 7.5, 4, 'k', True)
    for x in range(17, 31, 2): c.poly([(x, 25.5), (x + 1, 28.5), (x + 2, 25.5)], 'w', True); c.poly([(x + 1, 33.5), (x + 2, 30.5), (x + 3, 33.5)], 'w', True)
    c.ell(24, 30, 2.5, 1.2, 'l', True)
    for (x, y) in ((19, 20), (29, 19), (24, 17)): c.rect(x - 1, y, x + 1, y + 1, 'Y', True); c.px(x, y, 'k', True)
    c.ell(24, 37, 13, 3, 'a')
    for x in (15, 20, 28, 33): c.px(x, 38, 'l', True)
    E['b_brood'] = c.done()

    # 屠夫：红皮大块头，一手剁骨刀一手铁链钩，满身疤
    c = Cv(30, 30)
    c.ell(15, 17, 9.5, 8.5, 'R'); c.ell(15, 12, 8, 5, 'R'); c.ell(15, 7, 4.5, 4.2, 'R')
    c.poly([(11, 5), (7, 0), (10, 6)], 'g'); c.poly([(19, 5), (23, 0), (20, 6)], 'g')
    c.rect(12, 6, 13, 7, 'Y', True); c.rect(17, 6, 18, 7, 'Y', True); c.line(12, 10, 18, 10, 'k', 1, True)
    c.px(13, 11, 'w', True); c.px(17, 11, 'w', True)
    c.poly([(8, 18), (22, 18), (21, 25), (9, 25)], 'n'); c.rect(8, 18, 22, 19, 'x'); c.px(15, 18, 'y', True)
    for (x0, y0, x1, y1) in ((10, 12, 13, 15), (19, 13, 21, 16), (11, 21, 14, 23)): c.line(x0, y0, x1, y1, 'e', 1, True)
    c.ell(4.5, 15, 3, 4, 'R'); c.ell(25.5, 15, 3, 4, 'R')
    c.rect(10, 25, 13, 28, 'r'); c.rect(17, 25, 20, 28, 'r'); c.rect(9, 28, 13, 29, 'x'); c.rect(17, 28, 21, 29, 'x')
    c.line(26, 18, 26, 22, 'n', 1); c.poly([(24, 3), (29, 3), (29, 15), (24, 18)], 'g'); c.line(25, 4, 25, 16, 'w', 1, True); c.px(28, 8, 'k', True)
    for y in range(18, 29, 2): c.px(3 + (y // 2) % 2, y, 's')
    c.ell(3.5, 28, 1.6, 1.4, 's')
    E['e_brute'] = pad(c.done(), 32)

    # 山岩巨像：一座会走的石山，身上嵌着发光的矿脉，头顶长着苔藓
    c = Cv(30, 30)
    c.poly([(5, 10), (10, 6), (20, 6), (25, 10), (27, 21), (23, 27), (7, 27), (3, 21)], 'g'); c.ell(15, 6, 6, 4.8, 'g')
    c.ell(3.5, 17, 3.5, 5, 's'); c.ell(26.5, 17, 3.5, 5, 's'); c.rect(1, 21, 6, 24, 's'); c.rect(24, 21, 29, 24, 's')
    c.rect(7, 26, 12, 29, 's'); c.rect(18, 26, 23, 29, 's')
    c.rect(11, 5, 13, 6, 'Y', True); c.rect(17, 5, 19, 6, 'Y', True); c.line(12, 9, 18, 9, 'd', 1, True)
    for (x0, y0, x1, y1) in ((8, 12, 12, 18), (12, 18, 10, 23), (21, 11, 18, 16), (18, 16, 22, 21), (14, 21, 16, 25)): c.line(x0, y0, x1, y1, 'd', 1, True)
    for (x, y) in ((13, 14), (14, 15), (20, 20), (9, 20)): c.px(x, y, 'Y', True)
    c.px(15, 15, 'o', True)
    for x, y in ((10, 2), (11, 1), (13, 1), (17, 1), (19, 2), (20, 3), (6, 8), (24, 9)): c.px(x, y, 'G', True)
    c.px(12, 2, 'l', True); c.px(18, 2, 'l', True)
    E['e_golem'] = pad(c.done(), 32)

    # 白骨主教：高冠骨面，紫袍拖地，手里骨杖挂着灯
    c = Cv(30, 30)
    c.poly([(5, 29), (9, 12), (15, 8), (21, 12), (25, 29)], 'p'); c.poly([(9, 29), (12, 14), (18, 14), (21, 29)], 'P')
    c.line(15, 15, 15, 28, 'y', 1); c.rect(13, 19, 17, 19, 'y')
    c.ell(15, 9, 3.8, 3.8, 'w'); c.poly([(11, 7), (12, 0), (15, 3), (18, 0), (19, 7)], 'y'); c.px(15, 3, 'R', True)
    c.rect(13, 9, 13, 10, 'k', True); c.rect(17, 9, 17, 10, 'k', True); c.px(13, 9, 'l', True); c.px(17, 9, 'l', True)
    c.line(14, 12, 16, 12, 'k', 1, True)
    c.ell(7, 16, 2.6, 2.2, 'p'); c.ell(23, 16, 2.6, 2.2, 'p'); c.line(8, 18, 5, 22, 'p', 2); c.rect(4, 22, 5, 23, 'w')
    c.line(26, 3, 26, 29, 'w', 1); c.ell(26, 3, 2.2, 2.2, 'w'); c.rect(25, 3, 25, 3, 'k', True); c.px(27, 3, 'k', True)
    c.line(24, 7, 22, 9, 'g', 1); c.rect(21, 9, 23, 12, 'l'); c.px(22, 10, 'Y', True)
    E['e_lich'] = pad(c.done(), 32)

    # 霜狼王：灰白大狼，背上冰棱，嘴里呵着冷气
    c = Cv(30, 30)
    c.poly([(3, 14), (8, 10), (18, 9), (22, 12), (22, 20), (4, 20)], 'g'); c.poly([(17, 11), (20, 6), (25, 6), (28, 9), (29, 12), (24, 14), (20, 16)], 'g')
    c.poly([(19, 8), (20, 3), (22, 7)], 's'); c.poly([(22, 7), (24, 3), (25, 7)], 'g')
    c.rect(23, 8, 24, 9, 'C', True); c.px(23, 8, 'w', True); c.line(25, 13, 28, 13, 'w', 1, True); c.px(29, 11, 'k', True)
    c.poly([(24, 13), (28, 13), (27, 15), (25, 15)], 'e'); c.px(26, 14, 'w', True)
    c.poly([(16, 10), (21, 14), (19, 19), (15, 17)], 'w')
    for x in (8, 12, 16): c.poly([(x - 1.5, 11), (x, 5), (x + 1.5, 11)], 'C')
    c.line(3, 14, 0, 9, 'g', 2); c.px(0, 8, 'w')
    c.rect(5, 20, 7, 27, 'g'); c.rect(10, 20, 12, 26, 's'); c.rect(16, 20, 18, 27, 'g'); c.rect(20, 20, 21, 26, 's')
    for x in (5, 16): c.rect(x, 27, x + 3, 28, 's')
    c.line(6, 17, 19, 17, 'w', 1, True); c.line(7, 13, 17, 13, 's', 1, True)
    for x, y in ((29, 17), (27, 18), (29, 20)): c.px(x, y, 'C', True)
    E['e_wolf'] = pad(c.done(), 32)

    # 老雪人：比城门还高的雪人，脸上插着两根冰柱，一身冰甲
    c = Cv(30, 30)
    c.poly([(4, 11), (9, 7), (21, 7), (26, 11), (27, 22), (23, 28), (7, 28), (3, 22)], 'w'); c.ell(15, 8, 7, 5.5, 'w')
    c.poly([(8, 5), (4, 0), (10, 4)], 'C'); c.poly([(22, 5), (26, 0), (20, 4)], 'C')
    c.ell(15, 10, 5, 3.4, 'g'); c.rect(12, 9, 12, 10, 'k', True); c.rect(18, 9, 18, 10, 'k', True); c.px(12, 9, 'c', True); c.px(18, 9, 'c', True)
    c.line(12, 12, 18, 12, 'b', 1, True); c.poly([(13, 12), (14, 16), (15, 12)], 'C', True); c.poly([(16, 12), (17, 17), (18, 12)], 'C', True)
    c.poly([(8, 15), (22, 15), (21, 22), (9, 22)], 'c'); c.line(10, 16, 13, 21, 'C', 1, True); c.line(15, 15, 15, 22, 'b', 1, True)
    c.ell(3, 17, 3, 5, 'g'); c.ell(27, 17, 3, 5, 'g'); c.rect(7, 27, 12, 29, 'g'); c.rect(18, 27, 23, 29, 'g')
    for x, y in ((6, 13), (24, 13), (10, 25), (20, 24)): c.px(x, y, 'g', True)
    for x in (1, 4, 26, 29): c.px(x, 22, 'C', True)
    E['e_yeti'] = pad(c.done(), 32)

    # 冰棺主祭：戴冰冠的高个祭司，背后立着一口冰棺
    c = Cv(30, 30)
    c.poly([(1, 27), (2, 4), (8, 1), (10, 4), (10, 27)], 'c'); c.poly([(3, 25), (3, 6), (7, 4), (8, 6), (8, 25)], 'C')
    c.rect(4, 10, 6, 17, 'b', True); c.px(5, 12, 'R', True)
    c.poly([(8, 29), (11, 13), (17, 9), (23, 13), (26, 29)], 'd'); c.poly([(12, 29), (14, 15), (20, 15), (22, 29)], 'b')
    c.line(17, 16, 17, 28, 'C', 1); c.rect(15, 21, 19, 21, 'C')
    c.ell(17, 10, 3.6, 3.6, 'c'); c.rect(15, 10, 15, 10, 'w', True); c.rect(19, 10, 19, 10, 'w', True); c.line(16, 12, 18, 12, 'b', 1, True)
    for x in (13, 17, 21): c.poly([(x - 1.5, 7), (x, 1 if x == 17 else 3), (x + 1.5, 7)], 'C')
    c.line(27, 3, 27, 29, 'x', 1); c.rect(25, 1, 29, 5, 'C'); c.px(27, 3, 'b', True); c.px(26, 2, 'w', True)
    c.ell(23, 17, 2.4, 2, 'd')
    E['e_priest'] = pad(c.done(), 32)

    # 哑钟：晨钟城丢了七百年的大吕。铜钟生满铜绿，钟口朝下，裂了一道缝漏出一点光；钟舌是一截白骨，两根断锁链垂到地上
    c = Cv(48, 48)
    for (x0, x1) in ((11, 5), (37, 43)):                                                              # 锁链：一节亮一节暗
        for i in range(0, 19):
            t = i / 18; x = x0 + (x1 - x0) * t; y = 12 + 34 * t
            c.px(x, y, 'g' if i % 2 else 's'); c.px(x + (1 if x1 > x0 else -1) * .6, y + 1, 'd')
    c.rect(19, 1, 29, 3, 'd'); c.ell(24, 3, 4.5, 3, 's'); c.ell(24, 3, 2.2, 1.4, 'k', True)
    def bw(y):  # 钟身每一行的半宽：顶上圆肩，腰身收一点，钟口外撇
        if y < 10: return 7 + (y - 5) * 2.2
        if y < 30: return 17 + (y - 10) * .12
        return 19.4 + (y - 30) ** 1.6 * .35
    for y in range(5, 41):
        w = bw(y)
        for x in range(round(24 - w), round(24 + w) + 1): c.px(x, y, 'n' if x > 24 + w * .45 else 'N')
    for y in range(7, 38):
        w = bw(y)
        for x in range(round(24 - w * .8), round(24 - w * .35)): c.px(x, y, 'y')                       # 左边受光
    for y in (13, 14, 33, 34):
        w = bw(y); c.line(24 - w + 1, y, 24 + w - 1, y, 'm', 1, True)                                  # 两道箍
    for x in range(12, 37, 3): c.px(x, 23, 'm', True); c.px(x + 1, 24, 'm', True)                      # 铭文
    for (x, y0, ln) in ((31, 15, 9), (15, 16, 6), (34, 26, 7), (20, 26, 4), (12, 33, 3), (28, 9, 4)):   # 铜绿往下淌
        for k in range(ln): c.px(x + (k % 3 == 2), y0 + k, 't' if k < ln - 2 else 'G', True)
    c.line(26, 6, 24, 15, 'k', 1, True); c.line(24, 15, 27, 23, 'k', 1, True); c.line(27, 23, 25, 32, 'k', 1, True)   # 裂缝
    c.px(24, 16, 'Y', True); c.px(26, 22, 'y', True)
    c.ell(24, 41, 18, 2.6, 'k', True)
    c.line(24, 40, 24, 45, 'w', 1); c.ell(24, 46, 2.2, 1.5, 'w'); c.px(23, 46, 'k', True); c.px(25, 46, 'k', True)
    E['b_bell'] = c.done()

    # 雾母：一团比城墙还高的雾，披着兜帽，帽子里只有两点冷光；雾里浮着几张没有五官的脸，两只长手拖进雾里
    c = Cv(48, 48)
    for (x, y, rx, ry) in ((24, 26, 17, 16), (14, 34, 9, 9), (34, 33, 10, 10), (24, 38, 16, 7), (24, 12, 9, 10)): c.ell(x, y, rx, ry, 'g')
    for (x, y, rx, ry) in ((21, 22, 9, 10), (14, 32, 5, 5), (19, 12, 5, 6)): c.ell(x, y, rx, ry, 'w')
    for (x, y) in ((7, 22), (41, 20), (4, 30), (44, 28), (10, 15), (38, 13)): c.ell(x, y, 2.4, 1.6, 'g')   # 飘出去的雾丝
    c.poly([(24, 1), (32, 7), (34, 17), (24, 21), (14, 17), (16, 7)], 's'); c.poly([(24, 3), (30, 8), (31, 15), (24, 19), (17, 15), (18, 8)], 'g')
    c.ell(24, 13, 5, 5.5, 'k', True); c.px(22, 13, 'C', True); c.px(26, 13, 'C', True)
    for (x0, y0, x1, y1) in ((15, 20, 6, 40), (33, 20, 42, 40)):
        c.line(x0, y0, x1, y1, 's', 2); c.line(x1, y1, x1 + (2 if x1 > 24 else -2), y1 + 5, 'g', 1)
        for k in range(3): c.px(x1 - 1 + k, y1 + 1, 's')
    for (x, y) in ((18, 28), (29, 26), (24, 35), (13, 37), (35, 36)):                                   # 雾里的脸：一圈暗，三个凹点
        c.ell(x, y, 2.4, 2.9, 'g'); c.px(x - 1, y - 1, 'd', True); c.px(x + 1, y - 1, 'd', True); c.px(x, y + 1, 's', True)
    for y in range(38, 48):                                                                             # 底下散成颗粒
        for x in range(0, 48):
            if c.get(x, y) != '.' and (x * 5 + y * 11) % 7 < (y - 37) // 2: c.px(x, y, '.')
    E['b_mist'] = c.done(hl={**HL, 'g': 'w', 's': 'g'})

    # 攻城王：一座会走的城门楼。石头垛口、门洞里的狼牙闸、门楼上一面黑红的旗，两侧搭着云梯，底下四个大木轮
    c = Cv(48, 48)
    c.rect(8, 12, 40, 38, 's'); c.rect(10, 14, 38, 36, 'g')
    for x in range(8, 41, 5): c.rect(x, 9, x + 2, 12, 's')                                           # 垛口
    for (y, x0, x1) in ((18, 10, 38), (24, 10, 38), (30, 10, 38)): c.line(x0, y, x1, y, 's', 1, True)   # 砖缝
    for y, off in ((14, 0), (20, 3), (26, 0), (32, 3)):
        for x in range(10 + off, 38, 6): c.px(x, y + 2, 's', True)
    c.poly([(17, 38), (17, 25), (24, 20), (31, 25), (31, 38)], 'k', True)                            # 门洞
    for x in range(18, 31, 2): c.line(x, 25, x, 32 + (x % 4) // 2, 'd', 1, True); c.px(x, 33 + (x % 4) // 2, 'g', True)   # 狼牙闸
    c.px(21, 36, 'R', True); c.px(27, 36, 'R', True)                                                  # 门里的眼睛
    c.rect(13, 16, 15, 18, 'k', True); c.rect(33, 16, 35, 18, 'k', True); c.px(14, 17, 'o', True); c.px(34, 17, 'o', True)   # 射孔里的火光
    c.line(24, 0, 24, 9, 'x', 1); c.poly([(25, 0), (34, 2), (31, 4), (34, 6), (25, 6)], 'e'); c.px(28, 3, 'w', True)   # 旗
    for sx in (1, -1):                                                                                 # 云梯
        xa, xb = (4, 7) if sx > 0 else (44, 41)
        c.line(xa, 14, xa, 40, 'n', 1); c.line(xb, 12, xb, 40, 'N', 1)
        for y in range(15, 40, 4): c.line(min(xa, xb), y, max(xa, xb), y, 'n', 1)
    c.rect(6, 38, 42, 41, 'x')
    for x in (11, 20, 29, 38): c.ell(x, 43, 4, 4, 'n'); c.ell(x, 43, 1.5, 1.5, 'm', True); c.line(x - 3, 43, x + 3, 43, 'm', 1, True)
    E['b_siege'] = c.done()

    # ---- 隐藏首领（完整游戏线第十五夜，每个守夜人一个） ----
    # 初誓者：第一个在墙上立誓的人。骨白色的旧盔甲，破披风，双手按着拄在地上的长剑，身后一面撕烂的旗；盔缝里是一点灯火
    c = Cv(48, 48)
    c.line(38, 2, 38, 30, 'x', 1); c.poly([(39, 3), (46, 5), (43, 9), (46, 13), (40, 15), (39, 12)], 'g'); c.px(42, 7, 's', True); c.px(41, 11, 's', True)
    c.poly([(12, 16), (36, 16), (41, 44), (7, 44)], 's'); c.poly([(14, 18), (22, 18), (18, 44), (9, 44)], 'g')
    for x in (10, 16, 25, 33, 38): c.px(x, 44, '.'); c.px(x + 1, 43, '.')
    c.poly([(16, 15), (32, 15), (31, 30), (17, 30)], 'w'); c.poly([(17, 17), (22, 17), (21, 29), (18, 29)], 'w')
    c.rect(16, 15, 32, 16, 'y'); c.line(24, 17, 24, 28, 'g', 1, True); c.rect(19, 21, 29, 21, 'g')
    c.ell(13, 18, 4, 3.2, 'w'); c.ell(35, 18, 4, 3.2, 'w'); c.line(10, 17, 16, 17, 'y', 1, True); c.line(32, 17, 38, 17, 'y', 1, True)
    c.ell(24, 9, 6, 6.5, 'w'); c.rect(18, 9, 30, 14, 'w'); c.line(24, 2, 24, 15, 'g', 1, True)
    c.rect(19, 9, 29, 10, 'k', True); c.px(23, 9, 'o', True); c.px(24, 9, 'Y', True); c.px(25, 10, 'o', True)
    c.poly([(18, 5), (14, 0), (19, 3)], 'y'); c.poly([(30, 5), (34, 0), (29, 3)], 'y')
    c.line(24, 30, 24, 47, 'w', 2); c.line(24, 31, 24, 46, 'g', 1, True); c.rect(19, 28, 29, 30, 'y'); c.ell(24, 26, 2, 2, 'y')
    c.ell(20, 30, 2.4, 2, 'w'); c.ell(28, 30, 2.4, 2, 'w')
    E['b_oath'] = c.done()

    # 灰袍：学院的院长。高个子，灰袍拖地，兜帽底下只露出一副眼镜的反光和白胡子；一手捧着发光的书，身后张开一大片遮光的黑布
    c = Cv(48, 48)
    c.poly([(2, 10), (14, 6), (24, 10), (34, 6), (46, 10), (44, 34), (36, 28), (24, 34), (12, 28), (4, 34)], 'p')
    for x in (8, 16, 32, 40): c.line(x, 9, x - 2 if x < 24 else x + 2, 30, 'a', 1, True)
    c.poly([(16, 14), (32, 14), (38, 46), (10, 46)], 's'); c.poly([(18, 15), (24, 15), (21, 46), (13, 46)], 'g')
    c.ell(24, 11, 7, 7.5, 's'); c.ell(24, 12, 5, 5.5, 'k', True)
    c.rect(20, 11, 22, 12, 'w', True); c.rect(26, 11, 28, 12, 'w', True); c.line(23, 11, 25, 11, 'g', 1, True)
    c.poly([(21, 15), (27, 15), (26, 24), (24, 27), (22, 24)], 'w')
    c.poly([(26, 26), (36, 24), (36, 31), (26, 33)], 'Y'); c.line(31, 25, 31, 32, 'y', 1, True); c.line(27, 28, 30, 27, 'N', 1, True); c.line(32, 27, 35, 26, 'N', 1, True)
    c.ell(28, 33, 2.4, 2, 'f'); c.ell(34, 33, 2.4, 2, 'f')
    c.line(11, 14, 9, 46, 'x', 1); c.rect(8, 11, 12, 15, 'd'); c.px(10, 13, 'C', True)
    E['b_grey'] = c.done()

    # 熄灯人：发条做的瘦高个。头是一只灯笼罩子，灯芯是灭的，冒着一缕烟；身子是一摞黄铜齿轮，一只手是长柄的灭烛罩，背上插着上弦的钥匙
    c = Cv(48, 48)
    c.line(20, 30, 16, 46, 'n', 2); c.line(28, 30, 32, 46, 'n', 2); c.rect(13, 45, 18, 46, 'm'); c.rect(30, 45, 35, 46, 'm')
    c.rect(21, 15, 27, 34, 'n')                                                                        # 脊梁
    for (x, y, r) in ((24, 23, 6.5), (18, 17, 4), (30, 17, 4), (24, 31, 4)):                             # 齿轮：外圈带齿，内圈暗，中间一颗轴
        for k in range(10):
            a = k * math.pi / 5; c.rect(round(x + math.cos(a) * (r + .5)) - 0, round(y + math.sin(a) * (r + .5)), round(x + math.cos(a) * (r + .5)), round(y + math.sin(a) * (r + .5)), 'N')
        c.ell(x, y, r, r, 'y'); c.ell(x, y, r * .62, r * .62, 'N', True); c.ell(x, y, r * .3, r * .3, 'm', True)
    c.rect(18, 2, 30, 4, 'd'); c.rect(17, 4, 31, 14, 'd'); c.rect(19, 5, 29, 13, 'k', True)
    for x in (21, 24, 27): c.line(x, 5, x, 13, 'd', 1, True)
    c.line(24, 9, 24, 12, 's', 1, True); c.px(24, 8, 'g', True)
    for (x, y) in ((25, 3), (26, 1), (25, 0)): c.px(x, y, 'g')
    c.line(32, 20, 40, 14, 'n', 1); c.line(40, 14, 44, 30, 'x', 1); c.poly([(41, 30), (47, 30), (44, 36)], 'g'); c.px(44, 31, 'k', True)
    c.line(16, 20, 8, 26, 'n', 1); c.line(8, 26, 6, 34, 'n', 1); c.ell(6, 35, 1.6, 1.6, 'y')
    c.line(24, 20, 24, 14, 'y', 1); c.rect(22, 13, 26, 14, 'y')
    E['b_snuff'] = c.done()

    # 黑墙：一段会走的城墙。黑砖，垛口，墙正中缺了一块砖，缺口里有一只眼；一把旧泥刀插在砖缝里；底下是几条石头腿
    c = Cv(48, 48)
    c.rect(4, 8, 44, 38, 'd')
    for x in range(4, 45, 6): c.rect(x, 4, x + 3, 8, 'd')
    for row, y in enumerate(range(8, 38, 4)):
        c.line(4, y, 44, y, 'k', 1, True)
        for x in range(4 + (row % 2) * 3, 45, 6): c.line(x, y, x, y + 3, 'k', 1, True)
    for (x, y) in ((8, 13), (20, 21), (33, 9), (39, 29), (11, 33), (26, 33)): c.rect(x, y, x + 3, y + 1, 's', True)
    c.rect(19, 16, 28, 20, 'k', True); c.ell(23.5, 18, 3, 1.6, 'R', True); c.ell(23.5, 18, 1.4, 1, 'Y', True); c.px(23, 18, 'k', True)   # 缺的那块砖，里面一只眼
    c.line(35, 14, 40, 20, 'g', 1, True); c.poly([(33, 12), (36, 12), (36, 15), (33, 15)], 'n')
    for x in (9, 18, 29, 38): c.rect(x, 38, x + 3, 44, 's'); c.rect(x - 1, 44, x + 4, 46, 'd')
    E['b_wall'] = c.done()

    # 失星：北天少了的那颗星。一颗八角的白星，裂纹里透出冷光，碎片绕着它慢慢转
    c = Cv(48, 48)
    pts = []
    for k in range(16):
        a = -math.pi / 2 + k * math.pi / 8; r = 21 if k % 2 == 0 else 9
        if k % 4 == 2: r = 15
        pts.append((24 + math.cos(a) * r, 24 + math.sin(a) * r))
    c.poly(pts, 'Y'); c.ell(24, 24, 9.5, 9.5, 'w'); c.ell(24, 24, 6, 6, 'C', True); c.ell(24, 24, 3, 3, 'w', True)
    for (x0, y0, x1, y1) in ((24, 15, 21, 9), (31, 22, 38, 19), (27, 31, 30, 38), (18, 27, 11, 30), (19, 19, 14, 15)): c.line(x0, y0, x1, y1, 'b', 1, True)
    for (x, y) in ((6, 8), (41, 6), (44, 38), (5, 40), (40, 44)): c.poly([(x, y - 2), (x + 2, y), (x, y + 2), (x - 2, y)], 'C')
    E['b_star'] = c.done()
    return E


# ---------------------------------------------------------------- 遗物、事件图标 16×16（原来 8×8 / 12×12，放在 16 格卡牌旁边太粗）
# 遗物模板用 g 当主色、s 当暗部画，输出时换成 X / Z，运行时 icon('potion:R') 再换成具体颜色。
def relic_templates():
    T = {}
    c = Cv(); c.rect(6, 1, 9, 2, 'n'); c.rect(7, 3, 8, 4, 'w', True); c.ell(8, 10, 5.6, 4.9, 'g'); c.line(4, 7, 11, 7, 'w', 1, True)
    c.px(5, 9, 'w', True); c.px(5, 10, 'w', True); c.px(10, 12, 'w', True); T['potion'] = c
    c = Cv(); c.ell(8, 10, 5.5, 4.5, 'y'); c.ell(8, 10, 3.4, 2.5, '.'); c.ell(8, 4, 3.2, 2.6, 'g'); c.px(7, 3, 'w', True); c.px(8, 6, 's', True); T['ring'] = c
    c = Cv(); c.poly([(2, 6), (5, 2), (11, 2), (14, 6), (8, 14)], 'g'); c.line(2, 6, 14, 6, 's', 1, True); c.line(6, 6, 8, 13, 's', 1, True)
    c.line(10, 6, 8, 13, 'g', 1, True); c.poly([(5, 3), (7, 3), (6, 5)], 'w', True); T['gem'] = c
    c = Cv(); c.rect(3, 3, 12, 12, 'g'); c.rect(2, 1, 13, 2, 'n'); c.rect(2, 13, 13, 14, 'n'); c.px(1, 1, 'N'); c.px(14, 1, 'N'); c.px(1, 14, 'N'); c.px(14, 14, 'N')
    for y in (5, 7, 9): c.line(5, y, 10 - (y == 9) * 2, y, 's', 1, True)
    T['scroll'] = c
    c = Cv(); c.poly([(2, 1), (14, 1), (14, 8), (8, 15), (2, 8)], 'g'); c.poly([(4, 3), (12, 3), (12, 8), (8, 12), (4, 8)], 's')
    c.rect(7, 4, 8, 10, 'w', True); c.rect(5, 6, 10, 7, 'w', True); T['badge'] = c
    c = Cv(); c.rect(3, 1, 13, 14, 'g'); c.rect(11, 2, 13, 14, 'w'); c.line(11, 2, 11, 14, 'g', 1); c.rect(3, 1, 4, 14, 's', True)
    c.ell(8, 7, 2.2, 2.2, 'y', True); c.px(8, 7, 'Y', True); c.rect(6, 11, 9, 11, 'y', True); T['book'] = c
    c = Cv(); c.rect(5, 2, 10, 10, 'g'); c.poly([(5, 9), (10, 9), (14, 11), (14, 13), (3, 13), (3, 10)], 'g'); c.rect(4, 1, 11, 3, 'n')
    c.rect(3, 13, 14, 14, 'x'); c.px(8, 5, 's', True); c.px(8, 7, 's', True); c.px(6, 6, 'w', True); T['boot'] = c
    c = Cv(); c.poly([(4, 14), (12, 14), (10, 11), (6, 11)], 'n'); c.ell(8, 6.5, 5.6, 5.6, 'g'); c.ell(6, 4.5, 1.6, 1.4, 'w', True)
    c.line(6, 9, 10, 7, 's', 1, True); c.px(10, 5, 'w', True); T['orb'] = c
    c = Cv(); c.ell(8, 12.5, 6, 2.8, 'n')
    for x0 in (1.5, 6, 10.5): c.poly([(x0, 12), (x0 + 4, 12), (x0 + 4, 6), (x0 + 3, 1), (x0 + 1.5, 5)], 'g'); c.px(x0 + 2.5, 3, 'w', True)
    T['claw'] = c
    c = Cv(); c.rect(6, 8, 9, 14, 'v'); c.ell(8, 6, 6.8, 5, 'g'); c.rect(0, 8, 15, 11, '.'); c.rect(6, 8, 9, 14, 'v'); c.line(3, 8, 12, 8, 's', 1, True)
    c.ell(5, 4, 1.3, 1.2, 'w', True); c.px(10, 3, 'w', True); c.px(11, 6, 'w', True); T['shroom'] = c
    out = {}
    for k, c in T.items():
        rows = c.done()
        out[k] = [r.replace('g', 'X').replace('s', 'Z') for r in rows]
    return out


def relic_icons():
    E = {}
    c = Cv(); c.poly([(1, 11), (10, 2), (14, 5), (5, 14)], 's'); c.poly([(1, 11), (10, 2), (12, 3), (3, 12)], 'g'); c.line(3, 10, 10, 3, 'w', 1, True)
    c.line(6, 11, 11, 6, 'd', 1, True); E['r_whet'] = c.done()
    c = Cv(); c.rect(3, 5, 12, 14, 'n'); c.rect(3, 7, 12, 7, 'x', True); c.rect(3, 12, 12, 12, 'x', True); c.rect(4, 4, 11, 4, 'N')
    c.poly([(6, 4), (8, 0), (10, 4)], 'o'); c.px(8, 2, 'Y', True); c.rect(6, 9, 9, 10, 'y', True); E['r_oil'] = c.done()
    c = Cv(); c.ell(5, 5.5, 3.5, 3.5, 'R'); c.ell(11, 5.5, 3.5, 3.5, 'R'); c.poly([(1.5, 6), (14.5, 6), (8, 14)], 'R')
    c.ell(8, 8, 2.5, 2.5, 'g'); c.ell(8, 8, 1, 1, 'd', True)
    for x, y in ((8, 5), (8, 11), (5, 8), (11, 8)): c.px(x, y, 'y', True)
    c.px(4, 4, 'w', True); E['r_heart'] = c.done()
    c = Cv(); c.rect(1, 6, 14, 14, 'g')
    for x in (1, 6, 11): c.rect(x, 2, x + 3, 5, 'g')
    for y, off in ((8, 0), (11, 3)):
        for x in range(1 + off, 15, 6): c.line(x, y, x, y + 2, 's', 1, True)
        c.line(1, y + 2, 14, y + 2, 's', 1, True)
    E['r_rampart'] = c.done()
    c = Cv(); c.ell(8, 8, 6.3, 6.3, 'y'); c.ell(8, 8, 4.4, 4.4, 'N'); c.ell(8, 8, 3.4, 3.4, 'y')
    c.poly([(8, 5), (9, 7), (11, 7), (9.5, 8.5), (10.5, 11), (8, 9.5), (5.5, 11), (6.5, 8.5), (5, 7), (7, 7)], 'R', True); c.px(5, 4, 'w', True)
    E['r_lucky'] = c.done()
    c = Cv(); c.line(2, 13, 9, 6, 'n', 3); c.ell(10.5, 5.5, 4.2, 4.2, 'y'); c.ell(10.5, 5.5, 2.8, 2.8, 'C'); c.px(9, 4, 'w', True); c.px(10, 4, 'w', True)
    c.px(12, 7, 'c', True); E['r_scope'] = c.done()
    c = Cv(); c.line(4, 13, 10, 5, 'n', 2); c.poly([(5, 2), (11, 0), (15, 5), (9, 8)], 'g'); c.line(6, 3, 11, 1, 'w', 1, True)
    c.px(2, 14, 'x'); E['r_hammer'] = c.done()
    c = Cv(); c.rect(5, 1, 10, 2, 'n'); c.ell(8, 9, 5.5, 5.5, 'C'); c.rect(3, 3, 12, 4, 'C'); c.ell(8, 11, 4.5, 3, 'y')
    for x, y in ((6, 10), (9, 9), (8, 12), (10, 12)): c.px(x, y, 'Y', True)
    c.px(4, 6, 'w', True); c.px(4, 7, 'w', True); E['r_jar'] = c.done()
    c = Cv(); c.rect(2, 1, 13, 2, 'n'); c.rect(2, 13, 13, 14, 'n'); c.poly([(4, 3), (11, 3), (8.5, 8), (11, 12), (4, 12), (6.5, 8)], 'C')
    c.poly([(5, 4), (10, 4), (8, 7), (7, 7)], 'y'); c.poly([(5, 12), (10, 12), (8, 10), (7, 10)], 'y'); c.px(7, 8, 'y', True); c.px(7, 9, 'y', True)
    E['r_glass'] = c.done()
    c = Cv(); c.line(3, 1, 3, 15, 'n', 1); c.poly([(4, 2), (14, 3), (11, 6), (14, 9), (4, 9)], 'R'); c.ell(8, 5.5, 1.6, 1.6, 'y', True)
    c.px(3, 0, 'Y'); E['r_flag'] = c.done()
    c = Cv(); c.line(4, 1, 8, 6, 'y', 1); c.line(12, 1, 8, 6, 'y', 1); c.poly([(8, 5), (13, 9), (8, 15), (3, 9)], 'C'); c.poly([(8, 7), (10, 9), (8, 12), (6, 9)], 'c')
    c.px(6, 8, 'w', True); E['r_charm'] = c.done()
    c = Cv(); c.poly([(8, 1), (14, 12), (8, 14), (2, 12)], 'P')
    for x in (5, 8, 11): c.line(8, 2, x, 13, 'p', 1, True)
    c.rect(3, 13, 13, 14, 'p'); c.px(6, 5, 'w', True); E['r_shell'] = c.done()
    c = Cv(); c.ell(8, 10, 6, 4.8, 'N'); c.poly([(5, 6), (11, 6), (12, 2), (4, 2)], 'N'); c.rect(5, 5, 11, 6, 'R', True)
    c.ell(8, 10.5, 2.2, 2.2, 'y'); c.px(8, 10, 'Y', True); c.px(4, 9, 'y', True); E['r_purse'] = c.done()
    return E


def event_icons():
    E = {}
    c = Cv(); c.ell(8, 10, 6, 5, 'N'); c.poly([(5, 6), (11, 6), (12, 2), (4, 2)], 'N'); c.rect(4, 5, 12, 6, 'n'); c.line(6, 9, 10, 9, 'n', 1, True)
    c.px(8, 12, 'y', True); E['bag'] = c.done()
    c = Cv(); c.ell(8, 8, 6.5, 5.5, 'd'); c.ell(8, 7, 6, 4.5, 'w'); c.rect(4, 6, 6, 7, 'k', True); c.rect(10, 6, 12, 7, 'k', True)
    c.poly([(1, 5), (4, 4), (2, 8)], 'w'); c.poly([(15, 5), (12, 4), (14, 8)], 'w'); c.line(6, 11, 10, 11, 'R', 1, True); E['mask'] = c.done()
    c = Cv(); c.rect(1, 7, 14, 14, 'n'); c.poly([(1, 7), (14, 7), (13, 2), (2, 2)], 'N'); c.rect(1, 7, 14, 7, 'y'); c.rect(1, 11, 14, 11, 'x', True)
    c.rect(7, 6, 8, 9, 'Y'); c.px(7, 9, 'k', True); E['chest'] = c.done()
    c = Cv(); c.rect(3, 9, 12, 14, 'g'); c.rect(2, 8, 13, 9, 's'); c.rect(6, 5, 9, 8, 'n'); c.poly([(7, 5), (8, 0), (9, 5)], 'o'); c.px(8, 3, 'Y', True)
    c.rect(6, 11, 9, 12, 'P', True); E['altar'] = c.done()
    c = Cv(); c.line(2, 14, 11, 5, 'n', 2); c.ell(12, 4, 2.5, 2.5, 'P'); c.px(11, 3, 'w', True)
    for x, y in ((14, 1), (9, 1), (15, 7)): c.px(x, y, 'Y', True)
    E['wand'] = c.done()
    c = Cv(); c.line(8, 9, 8, 15, 'n', 2); c.ell(8, 8, 4, 3.5, 'N'); c.ell(8, 3, 2.6, 2.6, 'N'); c.line(2, 7, 14, 7, 'n', 2)
    c.ell(8, 8, 1.6, 1.6, 'R', True); c.px(8, 8, 'w', True); E['dummy'] = c.done()
    c = Cv(); c.rect(2, 3, 13, 14, 'g'); c.rect(2, 2, 12, 12, 'w')
    for x, y in ((4, 4), (10, 4), (7, 7), (4, 10), (10, 10)): c.rect(x, y, x + 1, y + 1, 'R', True)
    E['dice'] = c.done()
    c = Cv(); c.poly([(8, 1), (13, 9), (8, 15), (3, 9)], 'c'); c.ell(8, 10, 4.8, 4.5, 'c'); c.px(6, 8, 'w', True); c.px(6, 9, 'w', True); c.px(7, 7, 'C', True)
    E['drop'] = c.done()
    c = Cv(); c.rect(6, 0, 9, 1, 'd'); c.rect(4, 2, 11, 3, 'd'); c.rect(4, 4, 11, 12, 'y'); c.rect(5, 5, 10, 11, 'Y'); c.ell(7.5, 8, 1.5, 2.2, 'o', True)
    c.rect(4, 4, 4, 12, 'd'); c.rect(11, 4, 11, 12, 'd'); c.rect(3, 13, 12, 14, 'd'); E['lantern'] = c.done()
    c = Cv(); c.poly([(2, 15), (3, 5), (8, 1), (13, 5), (14, 15)], 's'); c.ell(8, 10, 3.5, 3.5, 'k', True); c.ell(8, 11, 2.5, 2.2, 'o', True); c.px(8, 11, 'Y', True)
    c.rect(2, 14, 14, 15, 'd'); c.px(8, 0, 'g'); E['furnace'] = c.done()
    return E

# ---------------------------------------------------------------- 敌人走路帧：每种体型两帧，命名「图名~w1」「图名~w2」
# 不另外手画，按体型从原图挪像素得到，颜色、描边都是原图里的，不会出调色板外的颜色。
# 腿（legs）：脚下几行按身体中线分左右，w1 抬左脚、w2 抬右脚（抬起的那条腿收短一格），身子不动
# 跳（hop）：w1 压扁（去掉中间一行、往两边撑开一格），w2 拉长（中间一行复制一遍）
# 飞（flap）：两侧的翅膀 w1 往上一格、w2 往下一格，身体不动
# 飘（float）：最下面三行一行往左、一行往右摆，w1 / w2 方向相反
# 车（roll）：轮子以上的车身 w1 往下颠一格，w2 往右晃一格
# 首领和固定不动的精英不走路，不生成。模组加的敌人没有这两帧时，游戏里照旧用「脚下几行左右错一格」顶替。
GAIT = {
    'legs': ['skel', 'bug', 'shaman', 'shieldb', 'drummer', 'bomber', 'necro', 'berserker', 'golem', 'f_mite', 'f_husk', 'f_yeti', 'f_warden',
             'f_witch', 'f_horn', 'f_beetle', 'f_priest', 'f_wolf', 'f_mage', 'e_brute', 'e_golem', 'e_lich', 'e_wolf', 'e_yeti', 'e_priest'],
    'hop': ['slime', 'mini', 'f_chip', 'f_egg', 'chest_m', 'mimic', 'f_shell'],
    'flap': ['bat', 'f_owl', 'f_crow'],
    'float': ['ghost', 'f_wisp'],
    'roll': ['siege', 'catapult', 'f_sled', 'f_ballista'],
}


def _box(g):
    pts = [(x, y) for y, r in enumerate(g) for x, c in enumerate(r) if c != '.']
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def _shift(g, cells, dx, dy):
    """把 cells 这些格子整体挪 (dx, dy)：先全部擦掉再按新位置画回去，画出界的丢掉"""
    h, w = len(g), len(g[0]); src = {(x, y): g[y][x] for x, y in cells if g[y][x] != '.'}
    for x, y in src: g[y][x] = '.'
    for (x, y), c in src.items():
        if 0 <= x + dx < w and 0 <= y + dy < h: g[y + dy][x + dx] = c


def gait_frames(rows, kind):
    w, h = len(rows[0]), len(rows)
    x0, y0, x1, y1 = _box(rows)
    bh = y1 - y0 + 1
    out = []
    for k in (0, 1):
        g = [list(r) for r in rows]
        if kind == 'legs':
            feet = max(2, round(bh / 5))
            fy = y1 - feet + 1
            foot = [(x, y) for y in range(fy, y1 + 1) for x in range(w) if g[y][x] != '.']
            # 认腿：最下面一行里最宽的两段是两只脚；脚下区里离某只脚不超过 1 格的列算这条腿（垂到地上的武器、尾巴不算）
            # finding legs: the two widest runs on the bottom row are the feet; feet-zone columns within 1 cell of a foot belong to that leg (weapons or tails touching the ground don't)
            runs, x = [], 0
            while x < w:
                if g[y1][x] != '.':
                    s0 = x
                    while x < w and g[y1][x] != '.': x += 1
                    runs.append((s0, x - 1))
                else: x += 1
            fc = sorted({p[0] for p in foot})
            if len(runs) >= 2:
                legs = sorted(sorted(runs, key=lambda r: r[0] - r[1])[:2])
                dist = lambda x, r: max(r[0] - x, x - r[1], 0)
                me, other = legs[k], legs[1 - k]
                cols = [x for x in fc if dist(x, me) <= 1 and dist(x, me) < dist(x, other)]
            else:
                cx = sum(p[0] for p in foot) / len(foot)
                cols = [x for x in fc if (x < cx if k == 0 else x >= cx)]
            # 抬起的那条腿去掉最上面一行、往上收一格（腿弯起来），身子一格不动 / the lifted leg drops its top row and tucks up one cell (the knee bends); the body never moves
            for x in cols:
                col = [g[y][x] for y in range(fy + 1, y1 + 1)]
                for i, y in enumerate(range(fy, y1)): g[y][x] = col[i]
                g[y1][x] = '.'
        elif kind == 'hop':
            mid = y0 + bh // 2
            if k == 0:
                del g[mid]; g.insert(0, ['.'] * w)
                cx = (x0 + x1) // 2
                for y in range(h):
                    r = g[y]
                    left = r[:cx]; right = r[cx:]
                    if left and left[0] == '.': left = left[1:] + [left[-1] if left[-1] != '.' else '.']
                    if right and right[-1] == '.': right = [right[0] if right[0] != '.' else '.'] + right[:-1]
                    g[y] = (left + right)[:w]
            else:
                if y0 > 0:
                    g.insert(mid, list(g[mid])); del g[0]
        elif kind == 'flap':
            core = (x1 - x0 + 1) * 0.3
            wing = [(x, y) for y in range(h) for x in range(w) if g[y][x] != '.' and (x < x0 + core or x > x1 - core)]
            _shift(g, wing, 0, -1 if k == 0 else 1)
        elif kind == 'float':
            for i, y in enumerate(range(y1 - 2, y1 + 1)):
                d = (1 if (i + k) % 2 else -1)
                _shift(g, [(x, y) for x in range(w)], d, 0)
        elif kind == 'roll':
            wy = y1 - max(2, round(bh / 4)) + 1
            body = [(x, y) for y in range(0, wy) for x in range(w)]
            _shift(g, body, 0, 1) if k == 0 else _shift(g, body, 1, 0)
        out.append([''.join(r) for r in g])
    return out


def hand_rows(root):
    """hand.ts 里手画的图（有几种霜潮敌人画在那边），读出来一起补帧"""
    import re
    txt = open(os.path.join(root, 'src', 'data', 'art', 'hand.ts'), encoding='utf-8').read()
    return {m.group(1): re.findall(r'"([^"]*)"', m.group(2)) for m in re.finditer(r'"(\w+)": \[([^\]]*)\]', txt)}


def walk_frames(sprites):
    F = {}
    for kind, keys in GAIT.items():
        for k in keys:
            assert k in sprites, k
            a, b = gait_frames(sprites[k], kind)
            F[k + '~w1'], F[k + '~w2'] = a, b
    return F

SPRITES_HEAD = 'export const SPRITES: Record<string, string[]> = '


def write_ts(path):
    A = card_art(); P = {**portraits(), **enemies(), **relic_icons(), **event_icons()}
    for k, rows in {**A, **P}.items():
        assert all(len(r) == len(rows[0]) for r in rows), k
    out = ['/* 像素美术（由 tools/pixelgen.py 生成，勿手改）：卡牌图标 16×16、人物立绘 32×32、敌人与首领大图 / Pixel art (generated by tools/pixelgen.py, do not edit): card icons 16×16, hero portraits 32×32, enemy and boss art */',
           'export const EXTRA_PAL: Record<string, string> = ' + json.dumps(EXTRA_PAL) + ';',
           'export const SHAPES: Record<string, string[]> = ' + json.dumps(relic_templates(), ensure_ascii=False) + ';']
    # 保留文件里已有、但这里没有生成的图（有些图是别处加进来的），只覆盖同名的
    old = {}
    if os.path.exists(path):
        txt = open(path, encoding='utf-8').read()
        i = txt.find(SPRITES_HEAD)
        if i >= 0: old = json.loads(txt[i + len(SPRITES_HEAD):txt.rindex(';')])
    merged = {**old, **A, **P}
    root = os.path.join(os.path.dirname(path), '..', '..', '..')
    merged.update(walk_frames({**hand_rows(root), **merged}))
    out.append(SPRITES_HEAD + json.dumps(merged, indent=0, ensure_ascii=False) + ';')
    open(path, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return A, P


def _save_png(w, h, buf, path):
    import struct, zlib
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes(buf[y * w * 3:(y + 1) * w * 3]) for y in range(h))
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b''))


def preview(A, P, path):
    items = list(A.items()) + list(P.items())
    W = 8 if A else 3; cell = 72 if A else 200
    rows = math.ceil(len(items) / W)
    iw, ih = W * cell, rows * cell
    buf = bytearray([30, 34, 44] * (iw * ih))
    for i, (k, rws) in enumerate(items):
        h, w = len(rws), len(rws[0]); s = (cell - 8) // max(w, h)
        ox, oy = (i % W) * cell + 4, (i // W) * cell + 4
        for y, r in enumerate(rws):
            for x, ch in enumerate(r):
                if ch == '.': continue
                col = PAL[ch]; r0, g0, b0 = (int(col[j:j + 2], 16) for j in (1, 3, 5))
                for dy in range(s):
                    base = ((oy + y * s + dy) * iw + ox + x * s) * 3
                    for dx in range(s):
                        p = base + dx * 3
                        buf[p] = r0; buf[p + 1] = g0; buf[p + 2] = b0
    os.makedirs(os.path.dirname(path), exist_ok=True)
    _save_png(iw, ih, buf, path)


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..')
    A, P = write_ts(os.path.join(root, 'src', 'data', 'art', 'generated.ts'))
    E = enemies()
    print('cards', len(A), 'portraits', len(P))
    if '--preview' in sys.argv:
        preview(A, P, os.path.join(root, 'shots', 'art_preview.png'))
        preview({}, {k: v for k, v in P.items() if k.startswith('p_')}, os.path.join(root, 'shots', 'portrait_preview.png'))
        preview(E, {}, os.path.join(root, 'shots', 'enemy_preview.png'))
