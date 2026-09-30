"""冒烟测试：机器人自动玩一整局，报告每夜城墙剩余、同屏最多敌人数和页面报错。
用法：python3 tools/smoke_test.py [人物序号0/1] [shots]"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
HERO=int(sys.argv[1]) if len(sys.argv)>1 else 0
SHOTS=len(sys.argv)>2
BOT="""()=>{const g=__game,G=g.G;const P=G.prep;
 if(G.phase!=='prep')return 'wait';
 if(P.step>=3)return 'ready';
 if(!P.cur){const pref=['train','field','grocer','altar','parcel','shop','black','giant','smith','forge','storm','frostshop','chest','furnace','enchant','job','bank','spring','gamble'];
   const d=P.doors.slice().sort((a,b)=>(pref.indexOf(a)+99)%120-(pref.indexOf(b)+99)%120)[0];g.enterEvent(d);return 'enter '+d;}
 const c=P.cur;
 if(c.mode==='shop'||c.mode==='pick'||c.mode==='gift'){
   const aff=c.offers.filter(o=>!o.sold&&o.price<=G.gold).sort((a,b)=>(b.card.tier-a.card.tier)||(b.price-a.price));
   if(aff.length&&g.acquire(aff[0],null))return 'got '+aff[0].card.key;
   g.finishStep();return 'leave';}
 if(c.mode==='choice'||c.mode==='relic'){if(c.opts.length)c.opts[0].act();else g.finishStep();return 'chose';}
 if(c.mode==='gshop'){const it=c.goods.find(x=>!x.sold&&x.price<=G.gold&&G.gold-x.price>=4);if(it){G.gold-=it.price;it.sold=true;g.gainRelic(it.k,true);return 'gear';}g.finishStep();return 'leave';}
 if(c.mode==='reward'){c.apply();g.finishStep();return 'reward';}
 g.finishStep();return 'skip';}"""
async def skip(pg):
    for _ in range(20):
        vis=await pg.evaluate("()=>{const s=document.querySelector('#story');return s&&!s.hidden&&getComputedStyle(s).display!=='none'}")
        if not vis: return
        b=await pg.query_selector('#stSkip')
        if b: await b.click()
        await pg.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=["--use-gl=swiftshader","--enable-webgl","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.route("**/fonts.g*/**",lambda r:r.abort())
        await pg.goto('file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','dist','index.html'))); await pg.wait_for_timeout(400)
        await pg.click('#startBtn'); await pg.wait_for_timeout(400)
        await pg.click(f'.hero >> nth={HERO}'); await pg.wait_for_timeout(800)
        for rnd in range(1,9):
            await skip(pg)
            for k in range(40):
                r=await pg.evaluate(BOT)
                if r=='ready': break
                if r=='wait': await skip(pg); await pg.wait_for_timeout(200)
            # spend skill points
            await pg.evaluate("()=>{const G=__game.G;}")
            await pg.evaluate("()=>__game.openTree()")
            for _ in range(6):
                n=await pg.query_selector('.node.can')
                if not n: break
                await n.click(); await pg.wait_for_timeout(120)
            await pg.evaluate("()=>{const s=document.querySelector('#sheet');if(s)s.hidden=true;}")
            st=await pg.evaluate("({r:__game.G.round,g:__game.G.gold,w:__game.G.wall,rel:__game.G.relics.length,sp:__game.G.sp,n:__game.G.cards.length})")
            print(json.dumps(st))
            await pg.evaluate("__game.G.speed=%d"%(1 if SHOTS and rnd in (3,7) else 20))
            await pg.click('#goBtn')
            if SHOTS and rnd in (3,7):
                await pg.wait_for_timeout(13000); await pg.screenshot(path=f'shots/battle_{rnd}.png'); await pg.evaluate("__game.G.speed=20")
            maxn=0
            for _ in range(900):
                ph=await pg.evaluate("__game.G.phase")
                if ph!='battle': break
                n=await pg.evaluate("__game.B?__game.B.en.length:0"); maxn=max(maxn,n)
                await pg.wait_for_timeout(100)
            info=await pg.evaluate("({ph:__game.G.phase,w:__game.G.wall})"); print('  ',info,'maxEnemies',maxn)
            if info['ph']=='report':
                if rnd==8: break
                await pg.wait_for_timeout(300); await pg.click('#cashBtn'); await pg.wait_for_timeout(500)
            else: break
        await pg.wait_for_timeout(3000); await skip(pg)
        if SHOTS: await pg.screenshot(path='shots/end.png')
        print('errs',errs[:5]); await b.close()
asyncio.run(main())
