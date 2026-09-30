"""截图脚本：棋盘各品质卡牌、钻卡详情、已学天赋、战斗台词。"""
import asyncio, os
from playwright.async_api import async_playwright
URL='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','index.html'))
async def main():
    os.makedirs('shots',exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.route("**/fonts.g*/**",lambda r:r.abort())
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.click('#startBtn'); await pg.wait_for_timeout(300)
        await pg.click('.hero >> nth=1'); await pg.wait_for_timeout(500)
        for _ in range(8):
            s=await pg.query_selector('#stSkip')
            if s and await s.is_visible(): await s.click(); await pg.wait_for_timeout(250)
        await pg.evaluate("""()=>{const g=__game,G=g.G;for(const c of G.cards)c.el&&c.el.remove();G.cards=[];
          [['vial',0,null,0],['prism',1,null,1],['frost',2,'chill',3],['starfall',3,'echo',5]].forEach(([k,t,a,i])=>{const c=g.newCard(k,t,a);c.loc='board';c.idx=i;G.cards.push(c);});
          G.prep.step=3;G.prep.cur=null;g.afterChange();}""")
        await pg.wait_for_timeout(400); await pg.screenshot(path='shots/board.png')
        await pg.click('#board .card >> nth=3'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='shots/diamond_sheet.png')
        await pg.evaluate("()=>{document.querySelector('#sheet').hidden=true}")
        await pg.click('#treeBtn'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/tree.png')
        await pg.evaluate("()=>{document.querySelector('#sheet').hidden=true;const G=__game.G;G.round=6;G.nextWave=__game.makeWave(6);}")
        await pg.click('#goBtn'); await pg.wait_for_timeout(9500)
        await pg.screenshot(path='shots/battle6a.png')
        await pg.wait_for_timeout(9000)
        await pg.screenshot(path='shots/battle6b.png')
        print(errs); await b.close()
asyncio.run(main())
