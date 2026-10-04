# Headless feature tests at iPhone 13 and iPad sizes (real touch input via CDP), plus screenshots.
import asyncio,sys
from playwright.async_api import async_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'file:///workspace/zoes-unicorn-adventure/index.html'
OUT='/workspace/zoes-unicorn-adventure/';ok=True
def chk(n,c,i=''):
    global ok;ok&=bool(c);print(('PASS ' if c else 'FAIL ')+n,i)
async def run(p,b,name,dev,suf):
    errs=[];ctx=await b.new_context(**dev);m=await ctx.new_page();cdp=await ctx.new_cdp_session(m)
    m.on('pageerror',lambda e:errs.append(str(e)));m.on('console',lambda x:errs.append(x.text) if x.type=='error' else None)
    async def touch(kind,x,y):await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y}]})
    async def gtap(gx,gy):
        c=await m.evaluate(f'__W.toClient({gx},{gy})');await m.touchscreen.tap(c['x'],c['y'])
    await m.goto(BASE);await m.wait_for_timeout(600);chk(f'[{name}] no debug hook in public build',await m.evaluate('typeof window.__W')=='undefined')
    await m.goto(BASE+('&' if '?' in BASE else '?')+'debug=1');await m.wait_for_timeout(1000)
    vp=await m.evaluate('[innerWidth,innerHeight]')
    await m.touchscreen.tap(vp[0]*0.5,vp[1]*0.2);await m.wait_for_timeout(1200)
    a=await m.evaluate('({u:__W.audio.unlocked,r:__W.audio.running,c:__W.audio.clipCount,s:__W.state,th:__W.audio.theme})')
    chk(f'[{name}] first tap unlocks audio + title music',a['u'] and a['r'] and a['s']=='title' and a['th']=='title',str(a));chk(f'[{name}] 37 voice clips decoded',a['c']==37,str(a['c']))
    # colour pickers (mane + dress)
    t=await m.evaluate('__W.titleUI()');r=t['m'][2];await gtap(r[0]+r[2]/2,r[1]+r[3]/2);r=t['d'][1];await gtap(r[0]+r[2]/2,r[1]+r[3]/2);await m.wait_for_timeout(500)
    md=await m.evaluate('[__W.mane,__W.dress]');chk(f'[{name}] mane + dress pickers',md==[2,1],str(md))
    if suf=='':
        await m.wait_for_timeout(9000);ch=await m.evaluate('__W.audio.stats.chants');chk(f'[{name}] chant hook sung on the beat over title music',ch>=5,str(ch))
    await m.screenshot(path=OUT+f'screenshot-title{suf}.png')
    # back to rainbow mane for gameplay shots; GO button
    r=t['m'][0];await gtap(r[0]+r[2]/2,r[1]+r[3]/2);r=t['d'][0];await gtap(r[0]+r[2]/2,r[1]+r[3]/2)
    g=t['go'];await gtap(g[0]+g[2]/2,g[1]+g[3]/2);await m.wait_for_timeout(900)
    chk(f'[{name}] GO starts run + intro card',await m.evaluate('__W.state=="play"&&!!__W.card&&__W.card.i===0'))
    await m.wait_for_timeout(2600)
    # drag up and down with a real finger
    H=await m.evaluate('__W.H');S=vp[0]/await m.evaluate('__W.W')
    await touch('touchStart',vp[0]*0.6,H*0.5*S);
    for i in range(10):await touch('touchMove',vp[0]*0.6,(H*0.5-i*20)*S);await m.wait_for_timeout(30)
    await m.wait_for_timeout(600);y1=await m.evaluate('__W.uni.y')
    for i in range(16):await touch('touchMove',vp[0]*0.6,(H*0.3+i*25)*S);await m.wait_for_timeout(30)
    await m.wait_for_timeout(700);y2=await m.evaluate('__W.uni.y');await touch('touchEnd',0,0)
    chk(f'[{name}] drag flies up then down',y1<H*0.42 and y2>y1+150,f'{y1:.0f} -> {y2:.0f}')
    await gtap(300,H*0.35);await m.wait_for_timeout(1000);y3=await m.evaluate('__W.uni.y');chk(f'[{name}] tap = fly to that height',abs(y3-H*0.35)<40,f'{y3:.0f}')
    # treats
    await m.evaluate('__W.clear();const u=__W.uni;for(const k of ["star","lolli","cup","gem","fly"])__W.treat(k,u.x+30,u.y)');await m.wait_for_timeout(700)
    c=await m.evaluate('__W.counts');chk(f'[{name}] collects star/lollipop/cupcake/gem/butterfly',all(c[k]>=1 for k in c),str(c))
    chk(f'[{name}] butterfly friend follows',await m.evaluate('__W.friends')>=1)
    # boop by flying into a cloud; boop by tapping a cloud (magic wand)
    await m.evaluate('const u=__W.uni;__W.cloud(u.x+40,u.y-20)');await m.wait_for_timeout(500);b1=await m.evaluate('__W.boops')
    cl=await m.evaluate('__W.cloud(300,__W.TOPY()+40)&&[300,__W.TOPY()+40]');await gtap(cl[0],cl[1]);await m.wait_for_timeout(300);b2=await m.evaluate('__W.boops')
    chk(f'[{name}] fly-into boop + tap-to-boop turn clouds into rainbows',b1>=1 and b2>=2,f'{b1},{b2}')
    # scene with lots going on for the gameplay screenshot
    await m.evaluate('''__W.clear();const W=__W.W,H=__W.H,u=__W.uni;u.ty=H*0.45;
      for(let i=0;i<6;i++)__W.treat("star",u.x+90+i*36,H*0.45-Math.sin(i/5*Math.PI)*70);__W.treat("lolli",W*0.75,H*0.62);__W.treat("cup",W*0.55,H*0.7);__W.treat("gem",W*0.85,H*0.36);__W.treat("fly",W*0.62,H*0.25);
      __W.cloud(W*0.72,__W.TOPY()+70);const c=__W.cloud(W*0.42,__W.TOPY()+20);c.booped=1;c.bt=0.7;__W.pow("magnet",W*0.9,H*0.8)''')
    await m.wait_for_timeout(350);await m.screenshot(path=OUT+f'screenshot-gameplay{suf}.png')
    # rain: lose a heart, hearts regenerate, never game over
    await m.evaluate('__W.clear();const u=__W.uni;__W.freeze();__W.cloud(u.x,u.y-90)');await m.wait_for_timeout(300)
    h=await m.evaluate('__W.hearts');chk(f'[{name}] little rain = -1 heart',h==2,str(h))
    hs=[]
    for i in range(16):
        await m.evaluate('__W.clear()');await m.wait_for_timeout(450);hs.append(await m.evaluate('__W.hearts'))
    chk(f'[{name}] hearts regenerate',3 in hs,str(hs))
    await m.evaluate('__W.setHearts(1);const u=__W.uni;u.inv=0;__W.cloud(u.x,u.y-90)');await m.wait_for_timeout(300)
    st=await m.evaluate('({h:__W.hearts,hugs:__W.hugs,s:__W.state})');chk(f'[{name}] no game over: rainbow hug refills hearts',st['h']==3 and st['hugs']==1 and st['s']=='play',str(st))
    # power-ups
    await m.evaluate('__W.clear();const u=__W.uni;__W.pow("dash",u.x+20,u.y)');await m.wait_for_timeout(900)
    chk(f'[{name}] Rainbow Dash power-up',await m.evaluate('__W.power')=='dash' and await m.evaluate('__W.audio.theme')=='dash')
    await m.evaluate('const W=__W.W,H=__W.H;for(let i=0;i<7;i++)__W.treat("star",W*0.6+i*40,H*0.4+Math.sin(i)*60);__W.cloud(W*0.8,__W.TOPY()+60)');await m.wait_for_timeout(250)
    await m.screenshot(path=OUT+f'screenshot-powerup-dash{suf}.png')
    await m.evaluate('__W.clear();const u=__W.uni;__W.pow("bubble",u.x+20,u.y)');await m.wait_for_timeout(600)
    chk(f'[{name}] Giant Bubble power-up',await m.evaluate('__W.power')=='bubble')
    await m.evaluate('const u=__W.uni;u.inv=0;__W.cloud(u.x,u.y-100)');await m.wait_for_timeout(300);chk(f'[{name}] bubble shields from rain',await m.evaluate('__W.hearts')==3)
    await m.evaluate('const W=__W.W,H=__W.H;__W.treat("lolli",W*0.7,H*0.3);__W.treat("cup",W*0.8,H*0.6)');await m.wait_for_timeout(200)
    await m.screenshot(path=OUT+f'screenshot-powerup-bubble{suf}.png')
    await m.evaluate('__W.clear();const u=__W.uni;__W.pow("magnet",u.x+20,u.y)');await m.wait_for_timeout(500)
    await m.evaluate('const u=__W.uni;__W.treat("star",u.x+150,u.y-150);__W.treat("star",u.x+180,u.y+140)');n0=await m.evaluate('__W.counts.star');await m.wait_for_timeout(250)
    await m.screenshot(path=OUT+f'screenshot-powerup-magnet{suf}.png');await m.wait_for_timeout(1000)
    chk(f'[{name}] Magnet Sparkles pulls treats in',await m.evaluate('__W.counts.star')>=n0+2 and await m.evaluate('__W.power')=='magnet')
    # level cards
    for i,rt in enumerate([40,77,115]):
        await m.evaluate(f'__W.runT={rt}');await m.wait_for_timeout(1300)
        chk(f'[{name}] level {i+2} card',await m.evaluate(f'!!__W.card&&__W.card.i==={i+1}'))
    await m.wait_for_timeout(2000);await m.evaluate('__W.clear();const W=__W.W,H=__W.H;for(let i=0;i<5;i++)__W.treat("star",W*0.55+i*40,H*0.5);__W.cloud(W*0.75,__W.TOPY()+50)');await m.wait_for_timeout(300)
    await m.screenshot(path=OUT+f'screenshot-night{suf}.png')
    # castle + end dance party
    await m.evaluate('__W.setScore(2840);__W.runT=143');await m.wait_for_timeout(6200);await m.screenshot(path=OUT+f'screenshot-castle{suf}.png')
    await m.wait_for_timeout(2000);chk(f'[{name}] castle end screen + party music',await m.evaluate('__W.state')=='end' and await m.evaluate('__W.audio.theme')=='party')
    await m.wait_for_timeout(1500);await m.screenshot(path=OUT+f'screenshot-end{suf}.png')
    chk(f'[{name}] 3 stars',await m.evaluate('__W.stars')==3)
    await gtap(await m.evaluate('__W.W*0.5'),await m.evaluate('__W.H*0.55'));await m.wait_for_timeout(200)
    e=await m.evaluate('__W.endUI()');await gtap(e['again'][0]+60,e['again'][1]+30);await m.wait_for_timeout(500)
    chk(f'[{name}] AGAIN restarts',await m.evaluate('__W.state=="play"&&__W.runT<2'))
    vs=await m.evaluate('__W.audio.stats');chk(f'[{name}] voice lines played one at a time',vs['voice']>=8,str(vs))
    chk(f'[{name}] no JS errors',not errs,str(errs[:3]))
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--autoplay-policy=no-user-gesture-required'])
        await run(p,b,'iPhone 13',p.devices['iPhone 13'],'')
        await run(p,b,'iPad',p.devices['iPad (gen 7)'],'-ipad')
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED');sys.exit(0 if ok else 1)
asyncio.run(main())
