# Simulated start-to-finish run: a "kid bot" keeps a real finger on the screen (CDP touch) and drags the unicorn
# toward treats / grumpy clouds, at 4x game speed, iPhone 13.
import asyncio,sys,json
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'file:///workspace/zoes-unicorn-adventure/index.html'
OUT='/workspace/zoes-unicorn-adventure/';ok=True
def chk(n,c,i=''):
    global ok;ok&=bool(c);print(('PASS ' if c else 'FAIL ')+n,i)
BOT='''(()=>{const u=__W.uni;let best=null,bs=-1e9;for(const o of __W.objs()){if(o.got||o.x<u.x-10||o.x>u.x+300)continue;if(o.type==='c'&&o.booped)continue;
 const sc=(o.type==='c'?140:o.type==='p'?160:o.k==='gem'?120:o.k==='star'?40:80)-(o.x-u.x)*0.5-Math.abs(o.y-u.y)*0.15;if(sc>bs){bs=sc;best=o}}
 return{y:best?(best.type==='c'?best.y+20:best.y):null,st:__W.state,rt:__W.runT,sec:__W.seen.length,card:!!__W.card,pw:__W.power}})()'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required'])
        ctx=await b.new_context(**p.devices['iPhone 13']);m=await ctx.new_page();errs=[];cdp=await ctx.new_cdp_session(m)
        m.on('pageerror',lambda e:errs.append(str(e)));m.on('console',lambda x:errs.append(x.text) if x.type=='error' else None)
        await m.goto(BASE+('&' if '?' in BASE else '?')+'debug=1');await m.wait_for_timeout(900)
        vp=await m.evaluate('[innerWidth,innerHeight]');S=vp[0]/await m.evaluate('__W.W')
        await m.touchscreen.tap(vp[0]*0.5,vp[1]*0.2);await m.wait_for_timeout(500)
        g=(await m.evaluate('__W.titleUI()'))['go'];await m.touchscreen.tap((g[0]+g[2]/2)*S,(g[1]+g[3]/2)*S);await m.wait_for_timeout(300)
        chk('GO button starts the run',await m.evaluate('__W.state')=='play')
        await m.evaluate('__W.TS=4');t0=asyncio.get_event_loop().time();down=False;moves=0;shots=set();fy=vp[1]*0.5
        while True:
            i=await m.evaluate(BOT)
            if i['st']!='play' or asyncio.get_event_loop().time()-t0>120:break
            if i['y'] is not None:
                fy=i['y']*S
                if not down:await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':vp[0]*0.7,'y':fy}]});down=True
                else:await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':vp[0]*0.7,'y':fy}]})
                moves+=1
            for k,sec,at in [('clouds',1,22),('forest',2,58),('waterfall',3,96),('night',4,128)]:
                if i['sec']==sec and k not in shots and i['rt']>at and not i['card']:
                    shots.add(k);await m.screenshot(path=OUT+f'screenshot-run-{k}.png')
            await m.wait_for_timeout(60)
        if down:await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        r=await m.evaluate('({s:__W.state,score:__W.score,c:__W.counts,boops:__W.boops,rain:__W.rainHits,hugs:__W.hugs,pw:__W.usedPowers,seen:__W.seen,cards:__W.cards,stars:__W.stars,v:__W.audio.stats,fr:__W.friends})')
        print(json.dumps(r));print('finger moves',moves,'real secs',round(asyncio.get_event_loop().time()-t0))
        chk('reached the castle dance party',r['s']=='end')
        chk('all 4 levels + intro cards',r['seen']==[0,1,2,3] and r['cards']==4,str(r['seen']))
        chk('lots of treats',sum(r['c'].values())>=60,str(r['c']))
        chk('every treat type collected',all(v>=1 for v in r['c'].values()),str(r['c']))
        chk('grumpy clouds booped into rainbows',r['boops']>=8,str(r['boops']))
        chk('all 3 power-ups used',set(r['pw'])>={'dash','magnet','bubble'},str(r['pw']))
        chk('engaged kid earns 3 stars',r['stars']==3,f"{r['stars']} ({r['score']})")
        chk('many voice lines, one at a time',r['v']['voice']>=12,json.dumps(r['v']))
        await m.evaluate('__W.TS=1');await m.wait_for_timeout(3500);await m.screenshot(path=OUT+'screenshot-run-end.png')
        chk('no JS errors',not errs,str(errs[:3]))
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED');sys.exit(0 if ok else 1)
asyncio.run(main())
