(()=>{
const cv=document.getElementById('c'),X=cv.getContext('2d');
const Q=location.search,DEBUG=/[?&]debug=1/.test(Q),OG=/[?&]og=1/.test(Q);
let W=400,H=760,DPR=1,SC=1,TOP=0;
const safeEl=document.createElement('div');safeEl.style.cssText='position:fixed;top:0;left:0;height:env(safe-area-inset-top);width:1px;pointer-events:none;visibility:hidden';document.body.appendChild(safeEl);
function resize(){const vw=innerWidth,vh=innerHeight;DPR=Math.min(devicePixelRatio||1,Math.min(vw,vh)>=700?1.5:2.5);SC=Math.min(vw/400,vh/(vw>vh&&vh>=700?520:560));W=vw/SC;H=vh/SC;TOP=(safeEl.offsetHeight||0)/SC;
  cv.width=Math.round(vw*DPR);cv.height=Math.round(vh*DPR);cv.style.width=vw+'px';cv.style.height=vh+'px'}
addEventListener('resize',resize);resize();
const R=Math.random,rr=(a,b)=>a+R()*(b-a),pick=a=>a[(R()*a.length)|0],clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3),back=t=>{t=clamp(t,0,1);const c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const FONT='"Baloo2Z","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
// ---------------- palette & state ----------------
const RAINBOW=['#ff6b9a','#ffa36b','#ffe066','#7fe39a','#6ec6ff','#b57bff'];
const MANES=[RAINBOW,['#ff7ac8','#ff9ad6','#ffb8e2'],['#a77bff','#c39bff','#dcc2ff'],['#59b8ff','#86ceff','#b5e3ff'],['#4fdcb4','#7fe8c9','#b0f3df'],['#ffc23a','#ffd76e','#ffe8a3']];
const DRESSES=['#ff7cc0','#b58bff','#5fd0e6','#ffcf5a','#7fe0a0','#ff8f80'];
let mane=+(localStorage.getItem('zua_mane')||0),dress=+(localStorage.getItem('zua_dress')||0),best=+(localStorage.getItem('zua_best')||0);
if(!(mane>=0&&mane<6))mane=0;if(!(dress>=0&&dress<6))dress=0;
const RUN=150;let TS=1;
let state='title',T=0,runT=0,worldX=0,speed=0,endT=0;
let uni,objs,parts,floats,trail,decor,friends,hearts,regen,score,counts,boops,rainHits,hugs,lastPraise,lastOops,section,card,castle,spawnT,cloudT,powT,powIx,nextDecor,seen,cards,idleT,power,powerT,shake,usedPowers;
const SECTIONS=[
 {n:'Cotton Candy Clouds',sky:['#ffb3dc','#ffe9f6'],hill:'#ffd1ea',ground:'#fff4fb',at:0,theme:'play'},
 {n:'Lollipop Forest',sky:['#9fe8ff','#fff0d6'],hill:'#b7f0c8',ground:'#8fe0b4',at:0.25,theme:'play'},
 {n:'Rainbow Waterfall',sky:['#8fd0ff','#ffd9f0'],hill:'#c7b8ff',ground:'#7fd6ff',at:0.5,theme:'play'},
 {n:'Starry Night Castle',sky:['#24185a','#7d4fb8'],hill:'#4a3591',ground:'#5f44a8',at:0.75,theme:'night'}];
const GY=()=>H-62;const TOPY=()=>TOP+96;const UX=()=>Math.min(W*0.28,170);
function reset(){uni={x:UX(),y:H*0.45,vy:0,ty:H*0.45,wing:0,gal:0,inv:0,cheer:0,wand:0,wandT:null,tilt:0,bounce:0};
  objs=[];parts=[];floats=[];trail=[];decor=[];friends=[];hearts=3;regen=0;score=0;counts={star:0,lolli:0,cup:0,gem:0,fly:0};boops=0;rainHits=0;hugs=0;lastPraise=-9;lastOops=-99;
  section=0;card=null;castle=null;spawnT=2.6;cloudT=6;powT=17;powIx=0;nextDecor=[0,0,0];seen=[];cards=0;idleT=0;power=null;powerT=0;shake=0;usedPowers=[];runT=0;worldX=0;speed=0;
  for(let i=0;i<40;i++){worldX+=12;spawnDecor(true)}worldX=0}
function sectionIx(){const p=runT/RUN;let s=0;SECTIONS.forEach((S,i)=>{if(p>=S.at)s=i});return s}
// ---------------- decor (3 parallax layers) ----------------
const PAR=[0.22,0.5,1];
function spawnDecor(pre){const s=state==='play'?sectionIx():0;for(let L=0;L<3;L++){const wx=worldX*PAR[L];if(wx<nextDecor[L])continue;
  nextDecor[L]=wx+[rr(150,260),rr(110,190),rr(55,120)][L];let k,y,sc=rr(0.8,1.2);const x=pre?rr(-60,W+60):W+120;
  if(L===0){k=[pick(['puff','puff','castleF']),pick(['puff','lolliF','puff']),pick(['rainbow','fall','fall']),pick(['crystal','moonCloud','crystal'])][s];y=k==='puff'||k==='moonCloud'?rr(TOPY(),H*0.5):GY()-rr(30,70);if(k==='castleF'&&R()<0.6)k='puff'}
  else if(L===1){k=[pick(['ccTree','puff2','ccTree']),pick(['lolli','lolli','cane']),pick(['fall2','rainbowS','lolli']),pick(['mush','crystal2','mush'])][s];y=k==='puff2'?rr(H*0.3,H*0.6):GY()+4}
  else{k=[pick(['fluff','fluff','heartP']),pick(['gumdrop','gumdrop','flower','cane2']),pick(['lily','flower','gumdrop']),pick(['glow','glow','flowerN'])][s];y=GY()+rr(6,30)}
  decor.push({k,L,x,y,s:sc,ph:R()*9,c:pick(RAINBOW),c2:pick(RAINBOW)})}
  decor=decor.filter(d=>d.x>-200)}
// ---------------- spawning ----------------
const TV={star:10,lolli:25,cup:30,gem:75,fly:40};
function addTreat(k,x,y){const o={type:'t',k,x,y,y0:y,ph:R()*9,r:k==='gem'?20:18};objs.push(o);return o}
function lane(){return rr(TOPY()+30,GY()-50)}
function spawnStuff(dt){if(runT>RUN-9||card&&card.t<1.6)return;const s=sectionIx(),X0=W+40;
  spawnT-=dt;if(spawnT<=0){spawnT=rr(1.0,1.6);const r=R();const y=lane();
    if(r<0.36){const n=5+(R()*3|0),amp=rr(30,70),ph=R()*TAU;for(let i=0;i<n;i++)addTreat('star',X0+i*38,clamp(y+Math.sin(ph+i*0.7)*amp,TOPY()+10,GY()-40))}
    else if(r<0.5){for(let i=0;i<5;i++)addTreat('star',X0+i*36,y-Math.sin(i/4*Math.PI)*80+40)}
    else if(r<0.7)addTreat('lolli',X0,y);
    else if(r<0.84)addTreat('cup',X0,y);
    else if(r<0.92){addTreat('fly',X0,y)}
    else addTreat('gem',X0,y)}
  cloudT-=dt;if(cloudT<=0){cloudT=rr(3.4,5.2)-s*0.35;objs.push({type:'c',x:X0+30,y:rr(TOPY()+10,Math.max(TOPY()+20,GY()-250)),ph:R()*9,booped:0,bt:0,r:40})}
  powT-=dt;if(powT<=0){powT=rr(20,25);const k=['dash','magnet','bubble'][powIx++%3];objs.push({type:'p',k,x:X0+20,y:lane(),y0:0,ph:R()*9,r:30})}}
// ---------------- input ----------------
let ui={},ptr=null,titleUI={},endUI={};
function toGame(e){return{x:e.clientX/SC,y:e.clientY/SC}}
function inRect(p,r){return r&&p.x>=r[0]&&p.x<=r[0]+r[2]&&p.y>=r[1]&&p.y<=r[1]+r[3]}
cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=toGame(e);
  if(state==='title'){titleTap(p);return}
  if(state==='end'){endTap(p);return}
  if(inRect(p,ui.mute)){AUD.setMuted(!AUD.muted);return}
  if(card&&card.t<2)card.t=Math.max(card.t,1.6);
  ptr={id:e.pointerId};idleT=0;
  // tap a grumpy cloud = magic wand boop!
  let bc=null,bd=70;for(const o of objs)if(o.type==='c'&&!o.booped){const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<bd){bd=d;bc=o}}
  if(bc){wandBoop(bc);return}
  uni.ty=clamp(p.y,TOPY(),GY()-30);AUD.SFX.flap();uni.wing=1},{passive:false});
cv.addEventListener('pointermove',e=>{if(!ptr||state!=='play')return;const p=toGame(e);idleT=0;uni.ty=clamp(p.y,TOPY(),GY()-30)});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>{ptr=null}));
addEventListener('keydown',e=>{if(state!=='play')return;if(e.key==='ArrowUp')uni.ty=Math.max(TOPY(),uni.ty-50);if(e.key==='ArrowDown')uni.ty=Math.min(GY()-30,uni.ty+50)});
function wandBoop(c){uni.wand=0.5;uni.wandT={x:c.x,y:c.y,t:0};boop(c,true)}
// ---------------- game events ----------------
function praise(pool,gap,prio){if(runT-lastPraise<(gap||2.4))return false;if(AUD.say(pick(pool),prio||1)){lastPraise=runT;return true}return false}
let cntN=0,cntT=-9;
function collect(o){o.got=1;counts[o.k]++;score+=TV[o.k];const S=AUD.SFX;
  floatText('+'+TV[o.k],o.x,o.y-26,o.k==='gem'?'#b57bff':'#ff5fa8');glitter(o.x,o.y,o.k==='star'?10:18,o.k==='gem'?1.4:1);
  if(o.k==='star'){S.chime();cntT=runT;cntN=counts.star;AUD.say('n'+Math.min(cntN,100),4);lastPraise=runT;floatText(String(cntN),o.x,o.y-52,'#ff5fa8');if(counts.star%15===0)setTimeout(()=>{if(runT-cntT>1.2)AUD.say('z2',2)},1600)}// say each star's true number: one, two ... twenty-three (kids-voice pack)
  else if(o.k==='lolli'){S.yum();S.chime(1);praise(['lolli','lolli','z1','z3'],1.6)}
  else if(o.k==='cup'){S.yum();S.chime(1);praise(['cup','z3','z1','z7'],1.8)}
  else if(o.k==='gem'){S.sparkle();S.chime(1);hearts3(o.x,o.y);praise(['gem','z4','z5'],1,2)}
  else if(o.k==='fly'){S.sparkle();S.giggle(true);if(friends.length<6)friends.push({ph:R()*TAU,c:pick(RAINBOW),r:rr(46,70)});praise(['fly','fly','z3'],1.6)}
  uni.cheer=Math.max(uni.cheer,0.5)}
function boop(c,wand){if(c.booped)return;c.booped=1;c.bt=0;boops++;score+=50;AUD.SFX.boop();if(!wand)AUD.SFX.giggle(false);glitter(c.x,c.y,26,1.4);ringFx(c.x,c.y,60);floatText('+50',c.x,c.y-50,'#ff5fa8');
  uni.cheer=1.2;praise(boops===1?['rain']:['rain','boop','boop2','z2','z1','z4'],1.3,boops===1?2:1)}
function rainHit(c){if(uni.inv>0||power&&(power.k==='dash'||power.k==='bubble'))return;rainHits++;hearts--;uni.inv=1.8;shake=0.25;uni.bounce=1;AUD.SFX.drip();AUD.SFX.oops();
  for(let i=0;i<10;i++)parts.push({x:uni.x+rr(-20,20),y:uni.y-20,vx:rr(-80,80),vy:rr(-160,-40),life:0.7,t:0,r:rr(2,4),col:'#9fd8ff',drop:1});
  if(hearts<=0){hearts=3;hugs++;uni.inv=3.2;AUD.say('hug',3);lastPraise=runT;AUD.SFX.magic();hearts3(uni.x,uni.y,14)}
  else if(runT-lastOops>10){if(AUD.say(pick(['oops','oops2']),2)){lastOops=runT;lastPraise=runT}}}
function getPower(o){o.got=1;power={k:o.k};powerT=7.5;usedPowers.push(o.k);AUD.SFX.magic();glitter(o.x,o.y,30,1.6);ringFx(o.x,o.y,80);
  AUD.say(o.k,3);lastPraise=runT;if(o.k==='dash'){AUD.setTheme('dash');AUD.SFX.whoosh();AUD.SFX.neigh()}if(o.k==='bubble')AUD.SFX.bubble();uni.cheer=1.5}
// ---------------- particles ----------------
function glitter(x,y,n,sp){for(let i=0;i<n;i++){const a=R()*TAU,v=rr(50,190)*sp;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:rr(0.5,1),t:0,r:rr(2.5,6)*sp,col:pick(RAINBOW.concat(['#fff','#fff','#ffd6f0'])),star:R()<0.55,rot:R()*6})}}
function hearts3(x,y,n){for(let i=0;i<(n||6);i++)parts.push({x:x+rr(-20,20),y,vx:rr(-50,50),vy:rr(-140,-60),life:rr(1,1.6),t:0,r:rr(6,11),col:pick(['#ff6b9a','#ff9ad6','#ffb3dc','#b57bff']),heart:1,g:-20})}
function ringFx(x,y,r){parts.push({ring:1,x,y,t:0,life:0.6,r})}
function floatText(s,x,y,col){floats.push({s,x,y,t:0,col})}
function confetti(n){for(let i=0;i<n;i++)parts.push({x:rr(0,W),y:rr(-60,-10),vx:rr(-40,40),vy:rr(60,170),life:rr(2.4,4),t:0,r:rr(4,7),col:pick(RAINBOW.concat(['#fff','#ffd6f0'])),conf:1,rot:R()*6})}
// ---------------- flow ----------------
function startGame(){reset();state='play';AUD.setTheme('play');showCard(0);setTimeout(()=>{if(state==='play')AUD.say('hello',2)},200);AUD.SFX.neigh()}
function showCard(i){card={i,t:0};cards++;seen.push(i);setTimeout(()=>{if(state==='play')AUD.say('s'+(i+1),2)},i?300:1900)}
function goTitle(){state='title';AUD.setTheme('title');reset()}
function themeNow(){return power&&power.k==='dash'?'dash':SECTIONS[sectionIx()].theme}
function update(dt){T+=dt;
  for(const p of parts){p.t+=dt;if(p.ring)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.conf){p.rot+=dt*5;p.vx*=0.99}else if(p.heart){p.vy+=(p.g||0)*dt;p.vx*=0.98}else if(p.fw){p.vy+=60*dt;p.vx*=0.985;p.vy*=0.985}else{p.vy+=(p.drop?500:220)*dt;p.rot=(p.rot||0)+dt*6}}
  if(parts.length>500)parts.splice(0,parts.length-500);parts=parts.filter(p=>p.t<p.life);
  for(const f of floats){f.t+=dt;f.y-=40*dt}floats=floats.filter(f=>f.t<1.1);
  if(card){card.t+=dt;if(card.t>2.6)card=null}
  if(state==='title'){worldX+=60*dt;for(const d of decor)d.x-=60*dt*PAR[d.L];spawnDecor();uni.wing+=dt;return}
  if(state==='end'){endT+=dt;if(endT<5&&R()<dt*3)confetti(5);if(R()<dt*1.2)hearts3(rr(40,W-40),H*0.8,2);if(endT>1&&R()<dt*0.7)firework(rr(60,W-60),rr(TOP+180,H*0.4),true);return}
  if(state!=='play')return;
  runT+=dt;idleT+=dt;
  const dashing=power&&power.k==='dash';const tgtSp=runT>RUN-3?40:card&&card.t<1.6?90:dashing?330:155;speed=lerp(speed,tgtSp,dt*2);worldX+=speed*dt;
  for(const d of decor)d.x-=speed*dt*PAR[d.L];spawnDecor();
  const s=sectionIx();if(s!==section){section=s;showCard(s);AUD.SFX.fanfare()}
  const th=themeNow();if(AUD.theme!==th)AUD.setTheme(th);
  spawnStuff(dt);
  // gentle autopilot when the finger is off for a while (helps little hands): drift toward the next treat
  if(!ptr&&idleT>3.5){let tg=null,bx=1e9;for(const o of objs){if((o.type==='t'||o.type==='p')&&!o.got&&o.x>uni.x+20&&o.x<uni.x+260&&o.x<bx){bx=o.x;tg=o}}if(tg)uni.ty=lerp(uni.ty,tg.y,dt*0.8)}
  // unicorn spring
  const ay=(uni.ty-uni.y)*30-uni.vy*10;uni.vy+=ay*dt;uni.y+=uni.vy*dt;uni.y=clamp(uni.y,TOPY()-10,GY()-20);uni.x=lerp(uni.x,UX()+(dashing?30:0),dt*3);
  uni.tilt=clamp(uni.vy*0.0012,-0.35,0.35);uni.wing=Math.max(0,uni.wing-dt*2);uni.gal+=dt*(speed/30);
  uni.inv=Math.max(0,uni.inv-dt);uni.cheer=Math.max(0,uni.cheer-dt);uni.wand=Math.max(0,uni.wand-dt);uni.bounce=Math.max(0,uni.bounce-dt*2);shake=Math.max(0,shake-dt);
  if(uni.wandT){uni.wandT.t+=dt;uni.wandT.x-=speed*dt;if(uni.wandT.t>0.45)uni.wandT=null}
  // rainbow trail
  for(const p of trail)p.x-=speed*dt;trail.push({x:uni.x-34,y:uni.y+6});trail=trail.filter(p=>p.x>-30);if(trail.length>160)trail.shift();
  if(R()<dt*(dashing?40:12))parts.push({x:uni.x-36,y:uni.y+rr(-6,16),vx:-speed*0.6,vy:rr(-20,20),life:rr(0.4,0.8),t:0,r:rr(2,4),col:pick(['#fff','#ffe066','#ffd6f0']),star:1,rot:0,g:0});
  if(hearts<3){regen+=dt;if(regen>5){regen=0;hearts++;AUD.SFX.heart();hearts3(36+(hearts-1)*36,TOP+30,3)}}else regen=0;
  if(power){powerT-=dt;if(powerT<=0){if(power.k==='bubble'){AUD.SFX.pop();glitter(uni.x,uni.y,24,1.2)}power=null;uni.inv=Math.max(uni.inv,1)}}
  const mag=power&&power.k==='magnet'?240:70,cr=power&&power.k==='bubble'?72:44,dash=dashing;
  for(const o of objs){o.ph+=dt;o.x-=speed*dt;
    if(o.type==='t'&&!o.got){if(o.k==='fly'){o.y=o.y0+Math.sin(o.ph*2.2)*22;o.x+=Math.sin(o.ph*3)*20*dt}else o.y=o.y0+Math.sin(o.ph*3)*4;
      const dx=uni.x-o.x,dy=uni.y-o.y,d=Math.hypot(dx,dy);if(d<mag){const k=mag>100?7:3;o.x+=dx*dt*k;o.y0+=dy*dt*k;o.y+=dy*dt*k}if(d<cr)collect(o)}
    else if(o.type==='p'&&!o.got){o.y=(o.y0||(o.y0=o.y))+Math.sin(o.ph*2)*10;if(Math.hypot(uni.x-o.x,uni.y-o.y)<cr+10)getPower(o)}
    else if(o.type==='c'){o.bt+=dt;if(!o.booped){const d=Math.hypot(uni.x+10-o.x,uni.y-20-o.y);if(d<(dash?90:cr+18))boop(o,false);
        else if(Math.abs(uni.x-o.x)<34&&uni.y-o.y>30&&uni.y-o.y<190)rainHit(o);
        if(R()<dt*2&&o.x<W)0}
      else o.y-=dt*6}}
  objs=objs.filter(o=>o.x>-140&&!o.got);
  // the castle at the end
  if(runT>RUN-9&&!castle){castle={x:W+260}}
  if(castle){castle.x=Math.max(W*0.68,castle.x-speed*dt*0.5)}
  if(runT>=RUN)finish()}
function stars(){return score>=2200?3:score>=900?2:1}
function finish(){state='end';endT=0;uni.cheer=0;power=null;AUD.setTheme('party');AUD.SFX.fanfare();AUD.SFX.cheer();AUD.say('castle',3);setTimeout(()=>{if(state==='end')AUD.say('party',2)},2300);setTimeout(()=>{if(state==='end')AUD.say(pick(['z8','z5','z4']),2)},4600);
  if(score>best){best=score;localStorage.setItem('zua_best',best)}confetti(90)}
function firework(x,y,quiet){const col=pick(RAINBOW);for(let i=0;i<34;i++){const a=i/34*TAU,v=rr(80,150);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rr(1,1.5),t:0,r:rr(2.5,4.5),col:R()<0.3?'#fff':col,star:R()<0.5,fw:1,rot:0})}if(!quiet||R()<0.5)AUD.SFX.firework()}
// ================= DRAWING =================
function rrect(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()}
function circ(x,y,r,fill){X.beginPath();X.arc(x,y,Math.max(0.1,r),0,TAU);X.fillStyle=fill;X.fill()}
function ell(x,y,rx,ry,fill,rot){X.beginPath();X.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),rot||0,0,TAU);X.fillStyle=fill;X.fill()}
function txt(s,x,y,size,fill,align,stroke,wt){X.font=(wt||'800 ')+size+'px '+FONT;X.textAlign=align||'center';X.textBaseline='middle';
  if(stroke){X.lineJoin='round';X.lineWidth=size*0.22;X.strokeStyle=stroke;X.strokeText(s,x,y)}X.fillStyle=fill;X.fillText(s,x,y)}
function star5(x,y,r,fill,rot,inner){X.beginPath();for(let i=0;i<10;i++){const a=(rot||0)-Math.PI/2+i*Math.PI/5,rad=i%2?r*(inner||0.48):r;X.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}X.closePath();X.fillStyle=fill;X.fill()}
function star4(x,y,r,c){X.beginPath();X.moveTo(x,y-r);X.quadraticCurveTo(x,y,x+r,y);X.quadraticCurveTo(x,y,x,y+r);X.quadraticCurveTo(x,y,x-r,y);X.quadraticCurveTo(x,y,x,y-r);X.fillStyle=c;X.fill()}
function heart(x,y,s,fill){X.save();X.translate(x,y);X.scale(s/16,s/16);X.beginPath();X.moveTo(0,6);X.bezierCurveTo(-16,-4,-9,-17,0,-8);X.bezierCurveTo(9,-17,16,-4,0,6);X.closePath();X.fillStyle=fill;X.fill();X.restore()}
function mixC(a,b,t){const p=x=>[1,3,5].map(i=>parseInt(x.substr(i,2),16));const A=p(a),B=p(b);return'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')'}
function rainbowArc(x,y,r,w,alpha,prog){X.save();X.globalAlpha=alpha;X.lineCap='round';const end=Math.PI+Math.PI*(prog==null?1:prog);RAINBOW.forEach((c,i)=>{X.strokeStyle=c;X.lineWidth=w;X.beginPath();X.arc(x,y,r-i*w*0.95,Math.PI,end);X.stroke()});X.restore()}
function cloudShape(x,y,s,fill){X.fillStyle=fill;X.beginPath();[[-26,4,18],[-10,-8,22],[12,-10,20],[28,2,16],[0,6,22]].forEach(([a,b,r])=>{X.moveTo(x+a*s+r*s,y+b*s);X.arc(x+a*s,y+b*s,r*s,0,TAU)});X.fill()}
// ---------- Zoe on her unicorn ----------
function drawZoe(o){// local coords: sitting point (0,0) on unicorn back
  const cheer=o.cheer,dc=DRESSES[o.dress==null?dress:o.dress];
  // leg + shoe dangling on the near side
  X.strokeStyle='#ffd7bd';X.lineWidth=5;X.lineCap='round';X.beginPath();X.moveTo(4,2);X.lineTo(9,18);X.stroke();ell(11,20,5,3.2,'#ff6fb5');
  // dress (flared skirt over the unicorn's back)
  X.beginPath();X.moveTo(-6,-18);X.lineTo(6,-18);X.quadraticCurveTo(16,0,18,6);X.quadraticCurveTo(0,10,-16,6);X.quadraticCurveTo(-14,0,-6,-18);X.closePath();X.fillStyle=dc;X.fill();
  X.strokeStyle='rgba(255,255,255,0.7)';X.lineWidth=2;X.beginPath();X.moveTo(-15,5);X.quadraticCurveTo(0,9,17,5);X.stroke();
  for(let i=0;i<4;i++){const k=Math.sin(T*6+i*1.7);if(k>0.3)star4(-10+i*8,-6+(i%2)*6,1.5+k*1.6,'#fff')}// glittery dress
  // arms
  X.strokeStyle='#ffd7bd';X.lineWidth=4.5;X.beginPath();
  if(cheer){X.moveTo(-3,-15);X.lineTo(-12,-32);X.moveTo(3,-15);X.lineTo(13,-32);X.stroke();circ(-12,-33,2.8,'#ffd7bd');circ(13,-33,2.8,'#ffd7bd')}
  else{X.moveTo(3,-15);X.lineTo(15,-8);X.stroke();// holding the mane
    // wand arm
    const wa=o.wand?-1.9:-0.6+Math.sin(T*3)*0.15;X.save();X.translate(-3,-15);X.rotate(wa);X.beginPath();X.moveTo(0,0);X.lineTo(0,13);X.stroke();X.strokeStyle='#ffe28a';X.lineWidth=2;X.beginPath();X.moveTo(0,12);X.lineTo(0,24);X.stroke();star5(0,26,o.wand?7:5,'#ffd23f',T*3);if(o.wand)star4(0,26,12,'rgba(255,255,255,0.8)');X.restore()}
  // head
  const hy=-30;circ(-11,hy+2,6,'#e8b04a');circ(11,hy+2,6,'#e8b04a');circ(-11,hy-3,2.6,'#ff7cc0');circ(11,hy-3,2.6,'#ff7cc0');// pigtails + bows
  X.beginPath();X.arc(0,hy,12.5,Math.PI,0);X.fillStyle='#e8b04a';X.fill();
  circ(0,hy,11.5,'#ffe0c8');
  const blink=Math.sin(T*1.3+3)>0.985;
  if(o.happy||cheer||blink){X.strokeStyle='#3a2a20';X.lineWidth=1.8;X.lineCap='round';[-1,1].forEach(sd=>{X.beginPath();X.arc(sd*4.3+2,hy-0.5,2,Math.PI*1.1,Math.PI*1.9);X.stroke()})}
  else[-1,1].forEach(sd=>{circ(sd*4.3+2,hy-1,2.2,'#2b1d14');circ(sd*4.3+2.8,hy-2,0.8,'#fff')});
  circ(-4,hy+4,2.5,'rgba(255,120,160,0.45)');circ(9,hy+4,2.5,'rgba(255,120,160,0.45)');
  X.beginPath();if(cheer||o.open){X.ellipse(2.5,hy+5,3.2,2.6,0,0,TAU);X.fillStyle='#d6456b';X.fill()}else{X.arc(2.5,hy+3.5,3.6,0.2,Math.PI-0.2);X.strokeStyle='#8a3a2a';X.lineWidth=1.5;X.stroke()}
  X.beginPath();X.arc(0,hy-2,11.5,Math.PI*1.08,Math.PI*1.95);X.strokeStyle='#e8b04a';X.lineWidth=4;X.stroke();// bangs
  // sparkly crown
  X.save();X.translate(0,hy-11);X.beginPath();X.moveTo(-9,2);X.lineTo(-10,-8);X.lineTo(-5,-3);X.lineTo(0,-11);X.lineTo(5,-3);X.lineTo(10,-8);X.lineTo(9,2);X.closePath();
  const cg=X.createLinearGradient(0,-11,0,2);cg.addColorStop(0,'#fff3a0');cg.addColorStop(1,'#ffbf1f');X.fillStyle=cg;X.fill();X.strokeStyle='#e89a00';X.lineWidth=1;X.stroke();
  circ(0,-2,2.4,'#ff4fa0');circ(-6,-1,1.5,'#6ec6ff');circ(6,-1,1.5,'#b57bff');const tw=Math.sin(T*5);if(tw>0)star4(7,-10,2+tw*3,'#fff');if(tw<-0.4)star4(-8,-11,2-tw*2,'#fff');X.restore()}
function drawUnicorn(x,y,o){o=o||{};const s=o.s||1,col=MANES[o.mane==null?mane:o.mane],fly=o.fly!==false;X.save();X.translate(x,y);X.rotate(o.rot||0);X.scale(s,s);
  const gal=o.gal||0,flap=Math.sin(T*(o.fast?16:9)+(o.wingBoost||0)*3);
  const mc=i=>col[i%col.length];
  // tail
  for(let i=0;i<Math.max(3,col.length);i++){const sw=Math.sin(T*5+i*0.6)*6;X.strokeStyle=mc(i);X.lineWidth=7;X.lineCap='round';X.beginPath();X.moveTo(-36,-6+i*1.5);X.bezierCurveTo(-52,-14+i*3+sw,-60,6+i*4-sw,-70+sw*0.5,4+i*5);X.stroke()}
  // far legs
  const leg=(lx,ph,far)=>{X.save();X.translate(lx,12);const a=fly?(lx>0?-0.9:0.9)+Math.sin(T*4+ph)*0.15:Math.sin(gal+ph)*0.7;X.rotate(a);rrect(-4.5,-2,9,24,4.5);X.fillStyle=far?'#eadff7':'#fff';X.fill();rrect(-5,18,10,6,3);X.fillStyle=far?'#e39ad0':'#ff9fd6';X.fill();X.restore()};
  leg(-22,1.6,true);leg(22,0.4,true);
  // far wing
  X.save();X.translate(-4,-14);X.rotate(-0.6+flap*0.45);ell(-14,-10,22,9,'#f2e6ff',-0.5);X.restore();
  // body
  const bg=X.createLinearGradient(0,-24,0,24);bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#f1e4ff');ell(0,0,38,22,bg);
  ell(-6,8,26,9,'rgba(230,200,255,0.35)');
  // cutie mark: little heart + stars
  heart(-18,2,7,'#ff8fc8');star4(-11,-4,3,'#ffd23f');
  leg(-16,0,false);leg(28,2.2,false);
  // neck + head
  X.beginPath();X.moveTo(18,-14);X.quadraticCurveTo(30,-30,36,-46);X.lineTo(52,-40);X.quadraticCurveTo(44,-20,36,2);X.closePath();X.fillStyle='#fff';X.fill();
  ell(46,-44,15,13,'#fff');ell(58,-38,11,9,'#ffe6f3',0.2);circ(63,-38,1.6,'#e39ad0');
  // ear
  X.beginPath();X.moveTo(38,-54);X.lineTo(40,-68);X.lineTo(47,-56);X.closePath();X.fillStyle='#fff';X.fill();X.beginPath();X.moveTo(40,-56);X.lineTo(41,-64);X.lineTo(45,-57);X.closePath();X.fillStyle='#ffc2e3';X.fill();
  // horn (golden spiral)
  X.save();X.translate(49,-54);X.rotate(0.35);X.beginPath();X.moveTo(-5,0);X.lineTo(0,-26);X.lineTo(5,0);X.closePath();const hg=X.createLinearGradient(-5,0,5,-20);hg.addColorStop(0,'#ffcf3a');hg.addColorStop(0.5,'#fff6b0');hg.addColorStop(1,'#ffb3dc');X.fillStyle=hg;X.fill();
  X.strokeStyle='rgba(230,150,0,0.6)';X.lineWidth=1.2;for(let i=1;i<4;i++){const yy=-i*6;X.beginPath();X.moveTo(-5+i*1.2,yy+2);X.lineTo(5-i*1.2,yy-1);X.stroke()}
  const tw=Math.sin(T*4+1);if(tw>0.2)star4(0,-28,3+tw*5,'#fff');X.restore();
  // eye
  if(o.happy){X.strokeStyle='#3b2a4a';X.lineWidth=2.2;X.lineCap='round';X.beginPath();X.arc(48,-45,4,Math.PI*1.1,Math.PI*1.9);X.stroke()}
  else{ell(48,-45,4.2,5.2,'#3b2a4a');circ(49.5,-47,1.6,'#fff');circ(47,-43,0.8,'#fff');X.strokeStyle='#3b2a4a';X.lineWidth=1.6;X.beginPath();X.moveTo(45,-50);X.lineTo(42,-53);X.moveTo(47,-50.5);X.lineTo(45.5,-54.5);X.stroke()}
  circ(52,-37,3.6,'rgba(255,130,180,0.45)');X.beginPath();X.arc(60,-34,3.5,0.3,Math.PI-0.6);X.strokeStyle='#d0739f';X.lineWidth=1.4;X.stroke();
  // mane: fluffy puffs down the neck
  const puffs=[[40,-58,8],[34,-52,9],[30,-42,9],[26,-32,8.5],[22,-22,8],[17,-13,7]];puffs.forEach(([px,py,r],i)=>{const wv=Math.sin(T*6-i*0.7)*1.6;circ(px-3+wv,py,r,mc(i));circ(px-5+wv,py-2,r*0.4,'rgba(255,255,255,0.35)')});
  circ(46,-58,6,mc(0));circ(51,-57,4.5,mc(1));
  // Zoe rides here
  if(o.zoe!==false){X.save();X.translate(4,-18);drawZoe({cheer:o.cheer,happy:o.happy,wand:o.wand,dress:o.dress,open:o.open});X.restore()}
  // near wing (fluffy, feathered, flapping)
  X.save();X.translate(-2,-12);X.rotate(-0.4+flap*0.5-(o.wingBoost||0)*0.5);
  X.beginPath();X.moveTo(0,0);X.bezierCurveTo(-8,-26,-34,-34,-44,-24);X.quadraticCurveTo(-36,-20,-40,-14);X.quadraticCurveTo(-30,-12,-32,-6);X.quadraticCurveTo(-18,-6,-16,0);X.closePath();
  const wg=X.createLinearGradient(0,0,-44,-24);wg.addColorStop(0,'#ffffff');wg.addColorStop(1,'#ffc6e8');X.fillStyle=wg;X.fill();X.strokeStyle='rgba(220,170,240,0.8)';X.lineWidth=1.2;X.stroke();X.restore();
  X.restore()}
// ---------- treats & friends ----------
function drawLolli(x,y,r,rot){X.fillStyle='#fff';X.fillRect(x-2,y+r*0.6,4,r*1.5);X.save();X.translate(x,y);X.rotate(rot||0);circ(0,0,r,'#ffe9f6');
  X.lineWidth=r*0.32;X.lineCap='round';RAINBOW.forEach((c,i)=>{X.strokeStyle=c;X.beginPath();for(let a=0;a<1.05;a+=0.05){const ang=a*TAU+i*TAU/6,rad=r*0.9*a;X.lineTo(Math.cos(ang)*rad,Math.sin(ang)*rad)}X.stroke()});
  circ(-r*0.35,-r*0.4,r*0.22,'rgba(255,255,255,0.7)');X.restore();X.fillStyle='#ff7cc0';X.beginPath();X.moveTo(x-2,y+r*0.8);X.lineTo(x-9,y+r*0.8-5);X.lineTo(x-9,y+r*0.8+5);X.fill();X.beginPath();X.moveTo(x+2,y+r*0.8);X.lineTo(x+9,y+r*0.8-5);X.lineTo(x+9,y+r*0.8+5);X.fill()}
function drawCup(x,y,s){X.save();X.translate(x,y);X.scale(s,s);X.beginPath();X.moveTo(-13,0);X.lineTo(13,0);X.lineTo(9,16);X.lineTo(-9,16);X.closePath();X.fillStyle='#8fd6ff';X.fill();
  X.strokeStyle='#5fb8e8';X.lineWidth=1.5;for(let i=-8;i<=8;i+=4){X.beginPath();X.moveTo(i,1);X.lineTo(i*0.7,15);X.stroke()}
  ell(0,-1,15,6,'#ffb3dc');ell(0,-7,12,6,'#ffc6e5');ell(0,-12,8,5,'#ffd6ee');circ(0,-19,4.5,'#ff3f7f');circ(-1.5,-20.5,1.4,'rgba(255,255,255,0.8)');
  [[-8,-4,'#ffe066'],[6,-6,'#7fe39a'],[-2,-10,'#6ec6ff'],[9,-1,'#b57bff'],[-10,0,'#fff']].forEach(([a,b,c])=>{X.fillStyle=c;X.fillRect(a,b,3,1.6)});X.restore()}
function drawGem(x,y,r,ph){X.save();X.translate(x,y);X.rotate(Math.sin(ph*2)*0.15);const g=X.createLinearGradient(-r,-r,r,r);RAINBOW.forEach((c,i)=>g.addColorStop(i/5,c));
  X.beginPath();X.moveTo(-r,-r*0.3);X.lineTo(-r*0.5,-r*0.85);X.lineTo(r*0.5,-r*0.85);X.lineTo(r,-r*0.3);X.lineTo(0,r);X.closePath();X.fillStyle=g;X.fill();X.strokeStyle='#fff';X.lineWidth=1.6;X.stroke();
  X.beginPath();X.moveTo(-r,-r*0.3);X.lineTo(r,-r*0.3);X.moveTo(-r*0.5,-r*0.85);X.lineTo(-r*0.25,-r*0.3);X.lineTo(0,r);X.lineTo(r*0.25,-r*0.3);X.lineTo(r*0.5,-r*0.85);X.strokeStyle='rgba(255,255,255,0.7)';X.lineWidth=1;X.stroke();
  const tw=Math.sin(ph*5);if(tw>0)star4(r*0.5,-r*0.6,3+tw*5,'#fff');X.restore()}
function drawFly(x,y,c,ph,s){s=s||1;const fl=Math.abs(Math.sin(T*14+ph));X.save();X.translate(x,y);X.scale(s,s);
  ell(-7*fl-2,-4,9*fl+1.5,8,c,-0.3);ell(7*fl+2,-4,9*fl+1.5,8,c,0.3);ell(-5*fl-1,6,6*fl+1,5,c,0.3);ell(5*fl+1,6,6*fl+1,5,c,-0.3);
  circ(-6*fl-2,-5,2.5*fl+0.5,'rgba(255,255,255,0.6)');circ(6*fl+2,-5,2.5*fl+0.5,'rgba(255,255,255,0.6)');
  rrect(-1.6,-8,3.2,16,1.6);X.fillStyle='#6b4a8a';X.fill();X.strokeStyle='#6b4a8a';X.lineWidth=1;X.beginPath();X.moveTo(0,-8);X.lineTo(-4,-14);X.moveTo(0,-8);X.lineTo(4,-14);X.stroke();X.restore()}
function drawStarT(x,y,ph){const r=14+Math.sin(ph*4)*1.5;circ(x,y,r+6,'rgba(255,240,150,0.25)');star5(x,y,r+2,'#ffb300',ph,0.5);star5(x,y,r,'#ffe066',ph,0.5);star5(x-2,y-2,r*0.45,'rgba(255,255,255,0.6)',ph,0.5);
  const tw=Math.sin(ph*6);if(tw>0.4)star4(x+10,y-10,tw*6,'#fff')}
function drawTreat(o){const x=o.x,y=o.y;if(x<-60||x>W+80)return;
  if(o.k==='star')drawStarT(x,y,o.ph);
  else if(o.k==='lolli'){circ(x,y,26,'rgba(255,200,230,0.25)');drawLolli(x,y-4,15,o.ph*1.5)}
  else if(o.k==='cup'){circ(x,y,26,'rgba(255,200,230,0.25)');drawCup(x,y+2,1.15)}
  else if(o.k==='gem'){circ(x,y,30+Math.sin(o.ph*5)*3,'rgba(200,170,255,0.3)');drawGem(x,y,17,o.ph)}
  else if(o.k==='fly'){drawFly(x,y,'#ff9ad6',o.ph,1.4);if(Math.sin(o.ph*4)>0.6)star4(x+14,y-12,4,'#fff')}}
function drawPower(o){const x=o.x,y=o.y,p=1+Math.sin(o.ph*5)*0.06;X.save();X.translate(x,y);X.scale(p,p);
  const g=X.createRadialGradient(-8,-10,4,0,0,30);g.addColorStop(0,'rgba(255,255,255,0.95)');g.addColorStop(0.6,'rgba(255,220,245,0.55)');g.addColorStop(1,'rgba(200,170,255,0.75)');circ(0,0,30,g);
  X.strokeStyle='rgba(255,255,255,0.95)';X.lineWidth=2.5;X.beginPath();X.arc(0,0,30,0,TAU);X.stroke();
  X.rotate(o.ph*2);for(let i=0;i<4;i++){const a=i*TAU/4;star4(Math.cos(a)*38,Math.sin(a)*38,4,pick?RAINBOW[i]:'#fff')}X.rotate(-o.ph*2);
  powIcon(o.k,0,2,1);X.restore()}
function powIcon(k,x,y,s){X.save();X.translate(x,y);X.scale(s,s);
  if(k==='dash'){rainbowArc(0,8,18,3.2,1);X.strokeStyle='#fff';X.lineWidth=3;X.lineCap='round';[[-20,14],[-24,4]].forEach(([a,b])=>{X.beginPath();X.moveTo(a,b);X.lineTo(a-8,b);X.stroke()});star5(10,-14,6,'#ffd23f')}
  else if(k==='magnet'){X.lineWidth=8;X.lineCap='butt';X.strokeStyle='#ff5fa8';X.beginPath();X.arc(0,-2,11,Math.PI,0,false);X.stroke();X.fillStyle='#ff5fa8';X.fillRect(-15,-2,8,10);X.fillRect(7,-2,8,10);X.fillStyle='#e0e6f0';X.fillRect(-15,8,8,5);X.fillRect(7,8,8,5);
    star4(-14,-18,4,'#ffd23f');star4(15,-16,3,'#ffd23f');star4(0,18,3,'#fff')}
  else{circ(0,0,15,'rgba(150,220,255,0.55)');X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(0,0,15,0,TAU);X.stroke();circ(-5,-6,4,'rgba(255,255,255,0.85)');circ(14,12,5,'rgba(150,220,255,0.6)');circ(-14,12,3.5,'rgba(255,190,230,0.7)')}
  X.restore()}
function drawCloud(o){const x=o.x,y=o.y;if(x<-120||x>W+120)return;const b=Math.sin(o.ph*2)*3;
  if(!o.booped){// grumpy little rain cloud
    for(let i=0;i<7;i++){const k=((o.ph*1.6+i/7)%1);const dx=-24+i*8+Math.sin(i*7)*3;X.globalAlpha=1-k*0.6;X.beginPath();const dy=y+20+k*160;X.moveTo(x+dx,dy-9);X.quadraticCurveTo(x+dx+6,dy+2,x+dx,dy+6);X.quadraticCurveTo(x+dx-6,dy+2,x+dx,dy-9);X.fillStyle='#7cc4ff';X.fill();circ(x+dx-1.5,dy+1,1.4,'rgba(255,255,255,0.8)')}X.globalAlpha=1;
    cloudShape(x,y+b+4,1.15,'rgba(90,80,140,0.18)');cloudShape(x,y+b,1.15,'#b9b3d6');cloudShape(x-3,y+b-4,0.9,'#cbc6e6');
    X.strokeStyle='#4b3f6b';X.lineWidth=2.6;X.lineCap='round';X.beginPath();X.moveTo(x-14,y+b-8);X.lineTo(x-5,y+b-4);X.moveTo(x+14,y+b-8);X.lineTo(x+5,y+b-4);X.stroke();
    circ(x-8,y+b+1,2.6,'#4b3f6b');circ(x+8,y+b+1,2.6,'#4b3f6b');X.beginPath();X.arc(x,y+b+14,6,Math.PI*1.15,Math.PI*1.85);X.stroke();
    // little "boop me" sparkle ring hint
    X.globalAlpha=0.35+0.25*Math.sin(T*5+o.ph);X.strokeStyle='#fff';X.lineWidth=2.5;X.setLineDash([5,7]);X.beginPath();X.arc(x,y+b,48,0,TAU);X.stroke();X.setLineDash([]);X.globalAlpha=1}
  else{const k=ease(o.bt*1.6);rainbowArc(x,y+30,40+k*30,6,Math.min(1,o.bt*3)*(o.bt>3?Math.max(0,1-(o.bt-3)):1),k);
    const sc=1.15+Math.sin(o.bt*14)*0.1*Math.max(0,1-o.bt*2);cloudShape(x,y+b,sc,'#fff');cloudShape(x-3,y+b-4,sc*0.8,'#fff7fc');
    X.strokeStyle='#5b4a7a';X.lineWidth=2.4;X.lineCap='round';[-8,8].forEach(d=>{X.beginPath();X.arc(x+d,y+b+1,3,Math.PI*1.1,Math.PI*1.9);X.stroke()});
    circ(x-15,y+b+6,4,'rgba(255,130,180,0.5)');circ(x+15,y+b+6,4,'rgba(255,130,180,0.5)');X.beginPath();X.ellipse(x,y+b+9,5,4,0,0,Math.PI);X.fillStyle='#d6456b';X.fill();
    if(o.bt<1.2)txt('BOOP!',x,y-40-o.bt*20,18,'#fff','center','#ff5fa8')}}
// ---------- world ----------
function secBlend(){if(state!=='play'&&state!=='end')return{a:0,b:0,k:0};if(state==='end')return{a:3,b:3,k:0};const p=runT/RUN;for(let i=1;i<4;i++){const at=SECTIONS[i].at;if(p>=at-0.02&&p<at+0.02)return{a:i-1,b:i,k:(p-(at-0.02))/0.04}}const s=sectionIx();return{a:s,b:s,k:0}}
function skyCol(j){const {a,b,k}=secBlend();return mixC(SECTIONS[a].sky[j],SECTIONS[b].sky[j],k)}
function nightK(){const {a,b,k}=secBlend();return lerp(a===3?1:0,b===3?1:0,k)}
function drawDecor(d){const x=d.x,y=d.y,s=d.s;if(x<-160||x>W+160)return;const nk=nightK();
  switch(d.k){
  case'puff':case'puff2':case'moonCloud':{const a=d.L===0?0.75:0.95;X.globalAlpha=a;cloudShape(x,y,s*(d.L===0?2.2:1.5),d.k==='moonCloud'?'rgba(170,140,230,0.5)':d.L===0?'#ffffff':'#fff4fb');
    cloudShape(x+8,y+6,s*(d.L===0?1.6:1.1),d.k==='moonCloud'?'rgba(150,120,220,0.4)':(d.ph%2>1?'#ffd6ee':'#e3dcff'));X.globalAlpha=1;break}
  case'castleF':{X.globalAlpha=0.35;drawCastle(x,y+60,0.5,true);X.globalAlpha=1;break}
  case'ccTree':{// cotton candy on a stick
    X.fillStyle='#fff';X.fillRect(x-2.5,y-60*s,5,60*s);const c=d.ph%2>1?'#ffb3dc':'#bfe3ff';circ(x,y-70*s,22*s,c);circ(x-14*s,y-60*s,15*s,c);circ(x+14*s,y-62*s,16*s,c);circ(x-6*s,y-80*s,10*s,'rgba(255,255,255,0.45)');break}
  case'lolliF':{X.globalAlpha=0.55;drawLolli(x,y-70*s,30*s,T*0.3+d.ph);X.fillStyle='#fff';X.fillRect(x-3,y-40*s,6,80*s);X.globalAlpha=1;break}
  case'lolli':{X.fillStyle='#fff';X.fillRect(x-3,y-90*s,6,90*s);X.save();X.translate(x,y-100*s);X.rotate(T*0.4+d.ph);circ(0,0,26*s,'#fff');X.lineWidth=9*s;X.lineCap='round';
    [d.c,d.c2,'#fff'].forEach((c,i)=>{X.strokeStyle=c;X.beginPath();for(let a=0;a<1.02;a+=0.04){const ang=a*TAU*1.4+i*2.1,rad=24*s*a;X.lineTo(Math.cos(ang)*rad,Math.sin(ang)*rad)}X.stroke()});X.restore();ell(x,y,18*s,5,'rgba(0,80,40,0.15)');break}
  case'cane':case'cane2':{const h=(d.k==='cane'?80:36)*s;X.save();X.translate(x,y);X.lineCap='round';X.lineWidth=(d.k==='cane'?10:6)*s;X.strokeStyle='#fff';X.beginPath();X.moveTo(0,0);X.lineTo(0,-h);X.arc(-10*s,-h,10*s,0,Math.PI,true);X.stroke();
    X.strokeStyle='#ff5f8f';X.setLineDash([6*s,6*s]);X.beginPath();X.moveTo(0,0);X.lineTo(0,-h);X.arc(-10*s,-h,10*s,0,Math.PI,true);X.stroke();X.setLineDash([]);X.restore();break}
  case'gumdrop':{X.beginPath();X.moveTo(x-14*s,y);X.quadraticCurveTo(x-14*s,y-24*s,x,y-24*s);X.quadraticCurveTo(x+14*s,y-24*s,x+14*s,y);X.closePath();X.fillStyle=d.c;X.fill();circ(x-5*s,y-16*s,3*s,'rgba(255,255,255,0.6)');
    for(let i=0;i<4;i++){X.fillStyle='rgba(255,255,255,0.8)';X.fillRect(x-9*s+i*5*s,y-10*s+(i%2)*5,2,2)}break}
  case'flower':case'flowerN':{const c=d.k==='flowerN'?'#d7b8ff':d.c;X.strokeStyle='#5cc98a';X.lineWidth=2.5;X.beginPath();X.moveTo(x,y);X.lineTo(x,y-18*s);X.stroke();for(let i=0;i<5;i++){const a=i/5*TAU+T*0.3;circ(x+Math.cos(a)*5*s,y-18*s+Math.sin(a)*5*s,4*s,c)}circ(x,y-18*s,3.4*s,'#ffe066');break}
  case'fluff':{ell(x,y,26*s,10*s,'rgba(255,255,255,0.9)');ell(x+14*s,y-4,14*s,8*s,'#fff');break}
  case'heartP':{X.strokeStyle='#7fd6a0';X.lineWidth=2.5;X.beginPath();X.moveTo(x,y);X.lineTo(x,y-16*s);X.stroke();heart(x,y-20*s,10*s,d.c);break}
  case'rainbow':{rainbowArc(x,y+30,110*s,9*s,0.45);cloudShape(x-100*s,y+26,1.1*s,'#fff');cloudShape(x+100*s,y+26,1.1*s,'#fff');break}
  case'rainbowS':{rainbowArc(x,y,60*s,6*s,0.8);cloudShape(x-56*s,y-2,0.7*s,'#fff');cloudShape(x+56*s,y-2,0.7*s,'#fff');break}
  case'fall':case'fall2':{const w=(d.k==='fall'?60:44)*s,top=d.k==='fall'?TOPY()+rr(0,0)+40:y-170*s;const bot=GY()+10;X.save();X.globalAlpha=d.k==='fall'?0.38:0.9;
    rrect(x-w/2-12,top-16,w+24,26,13);X.fillStyle=d.k==='fall'?'#d9ccff':'#c8b6ff';X.fill();
    RAINBOW.forEach((c,i)=>{X.fillStyle=c;X.fillRect(x-w/2+i*w/6,top,w/6+0.5,bot-top)});
    X.fillStyle='rgba(255,255,255,0.45)';for(let i=0;i<6;i++){const yy=top+((T*120+i*50+d.ph*30)%(bot-top));X.fillRect(x-w/2+((i*13)%w),yy,3,18)}
    for(let i=0;i<5;i++)circ(x-w/2+i*w/4,bot-4+Math.sin(T*6+i)*3,9,'rgba(255,255,255,0.85)');X.restore();break}
  case'crystal':case'crystal2':{const h=(d.k==='crystal'?120:60)*s;X.save();X.globalAlpha=d.k==='crystal'?0.6:0.95;X.beginPath();X.moveTo(x-14*s,y+10);X.lineTo(x-10*s,y-h+20*s);X.lineTo(x,y-h);X.lineTo(x+10*s,y-h+20*s);X.lineTo(x+14*s,y+10);X.closePath();
    const g=X.createLinearGradient(x,y-h,x,y);g.addColorStop(0,'#ffd6f5');g.addColorStop(1,'#9b7bff');X.fillStyle=g;X.fill();X.fillStyle='rgba(255,255,255,0.35)';X.fillRect(x-4*s,y-h+16*s,3*s,h-30*s);
    if(Math.sin(T*3+d.ph)>0.7)star4(x,y-h,6,'#fff');X.restore();break}
  case'mush':{X.fillStyle='#f5e8ff';rrect(x-5*s,y-26*s,10*s,26*s,4);X.fill();X.beginPath();X.arc(x,y-24*s,22*s,Math.PI,0);X.closePath();const gl=0.6+0.4*Math.sin(T*2+d.ph);X.fillStyle=d.ph%2>1?'#ff8fd0':'#7fe3ff';X.fill();
    circ(x,y-30*s,30*s,`rgba(255,200,255,${0.12*gl})`);circ(x-8*s,y-32*s,3.5*s,'#fff');circ(x+7*s,y-36*s,2.5*s,'#fff');circ(x+12*s,y-28*s,2*s,'#fff');break}
  case'glow':{const gl=0.5+0.5*Math.sin(T*3+d.ph);circ(x,y-14+Math.sin(T*2+d.ph)*8,3+gl*2,`rgba(255,250,170,${0.5+gl*0.5})`);circ(x,y-14+Math.sin(T*2+d.ph)*8,9,`rgba(255,250,170,${0.18*gl})`);break}
  case'lily':{ell(x,y,14*s,5*s,'#7fe0a0');circ(x,y-3,4*s,'#ffb3dc');break}
  }
  if(nk>0&&d.L<2&&d.k!=='crystal'&&d.k!=='crystal2'&&d.k!=='mush'){}}
function drawCastle(x,gy,s,flat){X.save();X.translate(x,gy);X.scale(s,s);const wall='#ffc6e5',tower='#ffb0da',roof='#b57bff';
  if(!flat){circ(0,-120,150,'rgba(255,220,255,0.18)')}
  rrect(-90,-120,180,120,8);X.fillStyle=wall;X.fill();for(let i=0;i<7;i++){X.fillStyle=wall;X.fillRect(-90+i*28,-134,16,16)}
  const tw=(tx,h,w)=>{X.fillStyle=tower;X.fillRect(tx-w/2,-h,w,h);X.beginPath();X.moveTo(tx-w/2-8,-h);X.lineTo(tx,-h-w*1.3);X.lineTo(tx+w/2+8,-h);X.closePath();X.fillStyle=roof;X.fill();
    X.fillStyle='#fff6a8';rrect(tx-6,-h+22,12,18,6);X.fill();const wv=Math.sin(T*5+tx)*3;X.fillStyle='#8a6bb0';X.fillRect(tx-1,-h-w*1.3-24,2,26);X.beginPath();X.moveTo(tx+1,-h-w*1.3-24);X.lineTo(tx+22,-h-w*1.3-18+wv);X.lineTo(tx+1,-h-w*1.3-12);X.fillStyle='#ff5fa8';X.fill();heart(tx+10,-h-w*1.3-18+wv*0.5,6,'#fff')};
  tw(-90,170,40);tw(90,170,40);tw(0,210,50);
  X.beginPath();X.moveTo(-28,0);X.lineTo(-28,-48);X.arc(0,-48,28,Math.PI,0);X.lineTo(28,0);X.closePath();X.fillStyle='#c48be0';X.fill();X.strokeStyle='#fff';X.lineWidth=3;X.stroke();heart(0,-46,14,'#ff7cc0');
  [[-60,-80],[60,-80],[-60,-40],[60,-40]].forEach(([a,b])=>{X.fillStyle='#fff6a8';rrect(a-8,b-10,16,20,8);X.fill()});
  for(let i=0;i<8;i++){const k=Math.sin(T*3+i*1.3);if(k>0.3)star4(-100+i*28,-150-((i*37)%60),3+k*5,'#fff')}
  X.restore()}
function drawWorld(){const nk=nightK();
  const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,skyCol(0));g.addColorStop(1,skyCol(1));X.fillStyle=g;X.fillRect(0,0,W,H);
  // stars (night) / glitter specks (day)
  for(let i=0;i<60;i++){const sx=((i*97.3-worldX*0.05)%(W+20)+W+20)%(W+20)-10,sy=(i*53.7)%(GY()-40)+10;const tw=Math.sin(T*2+i*1.7);
    if(nk>0){X.globalAlpha=nk*(0.5+0.5*tw);if(i%7===0)star4(sx,sy,3+tw*3,'#fff');else circ(sx,sy,1.4,'#fff')}else if(i%3===0&&tw>0.6){X.globalAlpha=(tw-0.6)*1.5;star4(sx,sy,2+tw*2,'#fff')}X.globalAlpha=1}
  // sun / smiling moon
  const mx=W-70,my=TOPY()+30;
  if(nk<1){X.globalAlpha=1-nk;circ(mx,my,44,'rgba(255,240,170,0.35)');circ(mx,my,30,'#fff1a8');X.strokeStyle='#d9a400';X.lineWidth=2;X.beginPath();X.arc(mx,my+3,9,0.2,Math.PI-0.2);X.stroke();circ(mx-9,my-4,2.5,'#7a5a00');circ(mx+9,my-4,2.5,'#7a5a00');circ(mx-15,my+4,4,'rgba(255,150,170,0.5)');circ(mx+15,my+4,4,'rgba(255,150,170,0.5)');X.globalAlpha=1}
  if(nk>0){X.globalAlpha=nk;circ(mx,my,46,'rgba(255,250,210,0.18)');X.save();X.beginPath();X.rect(0,0,W,H);X.arc(mx+13,my-9,25,0,TAU);X.clip('evenodd');circ(mx,my,30,'#fff7cf');X.restore();X.strokeStyle='#b89a40';X.lineWidth=2;X.beginPath();X.arc(mx-16,my+2,3,Math.PI*1.1,Math.PI*1.9);X.stroke();X.beginPath();X.arc(mx-12,my+10,4,0.2,Math.PI-0.4);X.stroke();X.globalAlpha=1}
  // far hills
  const {a,b,k}=secBlend();const hill=mixC(SECTIONS[a].hill,SECTIONS[b].hill,k),gr=mixC(SECTIONS[a].ground,SECTIONS[b].ground,k);
  X.beginPath();X.moveTo(0,H);for(let x=0;x<=W+10;x+=10){const wx=x+worldX*0.15;X.lineTo(x,GY()-60+Math.sin(wx*0.012)*26+Math.sin(wx*0.031)*10)}X.lineTo(W,H);X.closePath();X.fillStyle=hill;X.globalAlpha=0.8;X.fill();X.globalAlpha=1;
  for(const d of decor)if(d.L===0)drawDecor(d);
  X.beginPath();X.moveTo(0,H);for(let x=0;x<=W+10;x+=10){const wx=x+worldX*0.4;X.lineTo(x,GY()-22+Math.sin(wx*0.02)*12)}X.lineTo(W,H);X.closePath();X.fillStyle=mixC(hill.startsWith('#')?hill:'#ffffff',gr.startsWith('#')?gr:'#ffffff',0.5);X.fillStyle=hill;X.globalAlpha=0.55;X.fill();X.globalAlpha=1;
  for(const d of decor)if(d.L===1)drawDecor(d);
  // near ground: soft bumpy candy land
  X.beginPath();X.moveTo(0,H);for(let x=0;x<=W+8;x+=8){const wx=x+worldX;X.lineTo(x,GY()+Math.sin(wx*0.035)*5+Math.sin(wx*0.011)*6)}X.lineTo(W,H);X.closePath();X.fillStyle=gr;X.fill();
  X.strokeStyle='rgba(255,255,255,0.6)';X.lineWidth=3;X.beginPath();for(let x=0;x<=W+8;x+=8){const wx=x+worldX;X.lineTo(x,GY()+3+Math.sin(wx*0.035)*5+Math.sin(wx*0.011)*6)}X.stroke();
  // sprinkles in the ground
  for(let i=0;i<24;i++){const sx=((i*71-worldX)%(W+40)+W+40)%(W+40)-20,sy=GY()+16+(i*29)%40;X.fillStyle=RAINBOW[i%6];X.save();X.translate(sx,sy);X.rotate(i);X.fillRect(-4,-1.5,8,3);X.restore()}
  for(const d of decor)if(d.L===2)drawDecor(d);
  if(castle)drawCastle(castle.x,GY()+8,Math.min(1,H/700)*0.95)}
function drawTrail(){if(trail.length<3)return;const dash=power&&power.k==='dash';const w=dash?6:4.2;X.lineCap='round';X.lineJoin='round';
  for(let i=0;i<6;i++){X.strokeStyle=RAINBOW[i];X.lineWidth=w;X.globalAlpha=0.85;X.beginPath();for(let j=0;j<trail.length;j++){const p=trail[j];const off=(i-2.5)*w*0.92+Math.sin(T*8-j*0.25)*1.5;X.lineTo(p.x,p.y+off)}X.stroke()}X.globalAlpha=1;
  for(let j=0;j<trail.length;j+=8){const p=trail[j],k=Math.sin(T*6+j);if(k>0.5)star4(p.x,p.y+rr(-12,12),2+k*3,'#fff')}}
function drawFriends(cx,cy,layer){friends.forEach((f,i)=>{const a=T*1.4+f.ph+i*TAU/Math.max(1,friends.length);if(layer!=null&&(Math.sin(a)<0)!==(layer===0))return;drawFly(cx+Math.cos(a)*f.r,cy-20+Math.sin(a)*f.r*0.55,f.c,f.ph,0.8)})}
function drawPlayer(){const dash=power&&power.k==='dash',bub=power&&power.k==='bubble',mag=power&&power.k==='magnet';const x=uni.x,y=uni.y+Math.sin(T*3)*3+Math.sin(uni.bounce*14)*uni.bounce*6;
  if(dash){for(let i=0;i<3;i++){X.globalAlpha=0.25-i*0.07;drawUnicorn(x-26*(i+1),y,{rot:uni.tilt,gal:uni.gal,fast:1,zoe:false,happy:1})}X.globalAlpha=1;
    const g=X.createRadialGradient(x,y-20,10,x,y-20,90);g.addColorStop(0,'rgba(255,255,255,0.5)');g.addColorStop(1,'rgba(255,200,240,0)');circ(x,y-20,90,g)}
  if(mag){X.save();X.translate(x,y-20);for(let i=0;i<10;i++){const a=T*2+i*TAU/10,r=60+Math.sin(T*4+i)*10;star4(Math.cos(a)*r,Math.sin(a)*r,3+((i+T*4|0)%3),RAINBOW[i%6])}X.restore()}
  drawFriends(x,y,0);
  if(uni.inv>0&&!dash&&Math.sin(T*28)>0.2)X.globalAlpha=0.55;
  drawUnicorn(x,y,{rot:uni.tilt,gal:uni.gal,fast:dash,cheer:uni.cheer>0.3,happy:uni.cheer>0||dash,wand:uni.wand>0,wingBoost:uni.wing});X.globalAlpha=1;
  if(bub){const p=1+Math.sin(T*4)*0.04;X.save();X.translate(x+4,y-22);X.scale(p,1/p);const g=X.createRadialGradient(-26,-30,6,0,0,80);g.addColorStop(0,'rgba(255,255,255,0.55)');g.addColorStop(0.7,'rgba(180,230,255,0.15)');g.addColorStop(1,'rgba(220,170,255,0.45)');circ(0,0,80,g);
    X.strokeStyle='rgba(255,255,255,0.85)';X.lineWidth=3;X.beginPath();X.arc(0,0,80,0,TAU);X.stroke();X.lineWidth=5;X.strokeStyle='rgba(255,255,255,0.7)';X.beginPath();X.arc(0,0,66,Math.PI*1.1,Math.PI*1.4);X.stroke();X.restore()}
  if(uni.wandT){const w=uni.wandT,k=w.t/0.45;const sx=x-4,sy=y-60;X.strokeStyle=`rgba(255,240,150,${1-k})`;X.lineWidth=6*(1-k)+1;X.beginPath();X.moveTo(sx,sy);X.lineTo(w.x,w.y);X.stroke();for(let i=0;i<5;i++){const q=(k+i/5)%1;star4(lerp(sx,w.x,q),lerp(sy,w.y,q),5,'#fff')}}
  drawFriends(x,y,1)}
function drawParts(){for(const p of parts){const k=1-p.t/p.life;
  if(p.ring){const e=ease(p.t/p.life);X.strokeStyle=`rgba(255,255,255,${0.85*k})`;X.lineWidth=4*k+1;X.beginPath();X.arc(p.x,p.y,p.r*(0.3+e),0,TAU);X.stroke();continue}
  X.globalAlpha=Math.min(1,k*1.6);
  if(p.conf){X.save();X.translate(p.x,p.y);X.rotate(p.rot);X.fillStyle=p.col;X.fillRect(-p.r,-p.r/2,p.r*2,p.r);X.restore()}
  else if(p.heart)heart(p.x,p.y,p.r*2,p.col);
  else if(p.star){star4(p.x,p.y,p.r*(0.6+k*0.6),p.col)}
  else{circ(p.x,p.y,p.r*(0.5+k*0.5),p.col)}X.globalAlpha=1}
  for(const f of floats){X.globalAlpha=1-Math.max(0,f.t-0.6)/0.5;txt(f.s,f.x,f.y,20,'#fff','center',f.col);X.globalAlpha=1}}
// ---------- HUD ----------
function speaker(x,y,m){X.save();X.translate(x,y);X.fillStyle='#ff5fa8';X.beginPath();X.moveTo(-10,-5);X.lineTo(-4,-5);X.lineTo(4,-12);X.lineTo(4,12);X.lineTo(-4,5);X.lineTo(-10,5);X.closePath();X.fill();
  X.strokeStyle='#ff5fa8';X.lineWidth=2.6;X.lineCap='round';if(m){X.beginPath();X.moveTo(8,-6);X.lineTo(18,6);X.moveTo(18,-6);X.lineTo(8,6);X.stroke()}else{X.beginPath();X.arc(6,0,6,-0.9,0.9);X.stroke();X.beginPath();X.arc(6,0,12,-0.9,0.9);X.stroke()}X.restore()}
function drawHUD(){const top=TOP+8;rrect(8,top,W-16,48,24);X.fillStyle='rgba(255,255,255,0.85)';X.fill();X.strokeStyle='rgba(255,170,220,0.9)';X.lineWidth=3;X.stroke();
  for(let i=0;i<3;i++){const on=i<hearts;const p=on?1+Math.sin(T*4+i)*0.06:1;heart(34+i*34,top+25,24*p,on?'#ff5f9a':'rgba(255,150,190,0.3)');if(on)circ(29+i*34,top+19,2.5,'rgba(255,255,255,0.7)')}
  star5(150,top+24,14,'#ffc21a',0);star5(150,top+24,10,'#ffe066',0);txt(String(score),168,top+26,25,'#b0418a','left');
  if(power){const k=powerT/7.5;X.save();X.translate(W-104,top+24);circ(0,0,19,'rgba(255,220,245,0.9)');X.strokeStyle='#ff5fa8';X.lineWidth=4;X.beginPath();X.arc(0,0,19,-Math.PI/2,-Math.PI/2+TAU*k);X.stroke();powIcon(power.k,0,2,0.6);X.restore()}
  ui.mute=[W-60,top-4,56,56];speaker(W-38,top+24,AUD.muted);
  // progress: rainbow road to the castle
  const py=top+58,px0=36,pw=W-90;rrect(px0,py,pw,12,6);X.fillStyle='rgba(255,255,255,0.7)';X.fill();const p=clamp(runT/RUN,0,1);
  const g=X.createLinearGradient(px0,0,px0+pw,0);RAINBOW.forEach((c,i)=>g.addColorStop(i/5,c));rrect(px0,py,Math.max(12,pw*p),12,6);X.fillStyle=g;X.fill();
  SECTIONS.forEach(S=>circ(px0+pw*S.at,py+6,3.5,'#fff'));
  X.save();X.translate(px0+pw+20,py+4);X.scale(0.16,0.16);drawCastle(0,40,1,true);X.restore();
  X.save();X.translate(px0+pw*p,py+6);circ(0,0,10,'#fff');X.strokeStyle='#ff9ad6';X.lineWidth=2.5;X.stroke();X.scale(0.26,0.26);X.translate(-46,44);drawUnicorn(0,0,{zoe:false,happy:1});X.restore();
  // first-seconds hint: a bouncing finger showing drag up/down
  if(runT<7&&!card){const a=Math.min(1,(7-runT));X.globalAlpha=a*0.9;const hy=H*0.5+Math.sin(T*2.5)*90,hx=uni.x+90;handIcon(hx,hy);X.strokeStyle='rgba(255,255,255,0.8)';X.lineWidth=4;X.setLineDash([6,8]);X.beginPath();X.moveTo(hx,H*0.5-110);X.lineTo(hx,H*0.5+110);X.stroke();X.setLineDash([]);X.globalAlpha=1}}
function handIcon(x,y){X.save();X.translate(x,y);circ(0,0,26,'rgba(255,255,255,0.35)');rrect(-9,-2,22,26,10);X.fillStyle='#ffe0c8';X.fill();rrect(-9,-26,9,30,4.5);X.fill();X.strokeStyle='#e0a888';X.lineWidth=1.5;rrect(-9,-26,9,30,4.5);X.stroke();rrect(-9,-2,22,26,10);X.stroke();X.restore()}
function secIcon(i,x,y,s){X.save();X.translate(x,y);X.scale(s,s);
  if(i===0){X.beginPath();X.moveTo(-14,8);X.lineTo(14,8);X.lineTo(0,46);X.closePath();X.fillStyle='#fff';X.fill();X.strokeStyle='#ff9ad6';X.lineWidth=3;X.beginPath();X.moveTo(-8,16);X.lineTo(6,14);X.moveTo(-4,28);X.lineTo(5,26);X.stroke();[[-16,-2,16,'#ffb3dc'],[14,-4,17,'#bfe3ff'],[0,-18,19,'#ffc6e5'],[-2,2,15,'#ffd6ee']].forEach(([a,b,r,c])=>circ(a,b,r,c));circ(-6,-24,6,'rgba(255,255,255,0.6)');star4(20,-24,5,'#fff')}
  else if(i===1){drawLolli(0,-6,28,T)}
  else if(i===2){rainbowArc(0,22,40,6,1);X.fillStyle='#8fd6ff';for(let k=0;k<3;k++){X.beginPath();const dy=((T*40+k*14)%40);X.arc(-6+k*6,0+dy-14,3,0,TAU);X.fill()}}
  else{drawCastle(0,40,0.3,true);circ(28,-34,10,'#fff7cf');circ(33,-37,9,'#c8a8ff')}X.restore()}
function drawCard(){const c=card,t=c.t,k=back(t*2.2),out=t>2.1?ease((t-2.1)*2.5):0;X.save();X.globalAlpha=1-out;X.translate(W/2,H*0.36-out*60);X.scale(k*0.88,k*0.88);X.rotate(-0.03+Math.sin(T*2)*0.02);
  rrect(-150,-120,300,240,40);X.fillStyle='rgba(255,250,253,0.96)';X.fill();X.lineWidth=7;const g=X.createLinearGradient(-150,0,150,0);RAINBOW.forEach((cc,i)=>g.addColorStop(i/5,cc));X.strokeStyle=g;X.stroke();
  secIcon(c.i,0,-30,1.3);for(let i=0;i<6;i++){const a=T*1.5+i*TAU/6;star4(Math.cos(a)*120,-30+Math.sin(a)*70,6,RAINBOW[i])}
  txt(SECTIONS[c.i].n,0,70,SECTIONS[c.i].n.length>17?26:30,'#ff5fa8','center','#fff');
  for(let i=0;i<4;i++)circ(-45+i*30,100,i===c.i?8:5,i<=c.i?RAINBOW[i*2%6]:'#eee');X.restore()}
// ---------- title ----------
function titleLayout(){const land=W>H*1.25;if(OG)return{land:1,tx:W*0.69,ty:H*0.27,ux:W*0.29,uy:H*0.6,us:2.3,og:1};if(land)return{land,tx:W*0.28,ty:TOP+Math.max(56,H*0.13),ux:W*0.27,uy:H*0.6,us:Math.min(1.9,H/300),px:W*0.56,py:H*0.3,go:[W*0.73,H*0.74]};
  const us=Math.min(1.75,H/400);return{land,tx:W/2,ty:TOP+Math.max(50,H*0.085),ux:W/2-10,uy:TOP+H*(H<700?0.42:0.39),us,px:(W-330)/2,py:H*0.62,go:[W/2,Math.min(H-70,H*0.62+52+86)]}}
function titleWords(x,y,sz){X.save();X.translate(x,y);X.rotate(-0.04+Math.sin(T*1.5)*0.015);
  X.font='800 '+sz*1.35+'px '+FONT;const w=X.measureText("Zoe's").width;const g=X.createLinearGradient(-w/2,0,w/2,0);RAINBOW.forEach((c,i)=>g.addColorStop(i/5,c));
  txt("Zoe's",0,0,sz*1.35,g,'center','#fff');X.lineWidth=3;X.strokeStyle='#ff5fa8';X.strokeText("Zoe's",0,0);
  txt('Unicorn Adventure',0,sz*1.15,sz*0.82,'#ff5fa8','center','#fff');for(let i=0;i<5;i++){const k=Math.sin(T*3+i*1.4);if(k>0)star4(-w/2-20+i*(w+40)/4,-sz*0.8+(i%2)*sz*1.6,3+k*6,'#fff')}X.restore()}
function swatch(x,y,r,cols,sel){if(sel){circ(x,y,r+6,'#fff');circ(x,y,r+3,'#ff9ad6')}if(cols.length>3){cols.forEach((c,i)=>{X.beginPath();X.moveTo(x,y);X.arc(x,y,r,i*TAU/6-Math.PI/2,(i+1)*TAU/6-Math.PI/2);X.closePath();X.fillStyle=c;X.fill()})}else{circ(x,y,r,cols[0]);circ(x+r*0.3,y+r*0.3,r*0.45,cols[1])}
  circ(x-r*0.35,y-r*0.35,r*0.25,'rgba(255,255,255,0.7)');if(sel){star4(x+r,y-r,5+Math.sin(T*6)*2,'#fff')}}
function dressIcon(x,y,c,s){X.save();X.translate(x,y);X.scale(s,s);X.beginPath();X.moveTo(-6,-14);X.lineTo(6,-14);X.lineTo(8,-6);X.lineTo(16,14);X.quadraticCurveTo(0,18,-16,14);X.lineTo(-8,-6);X.closePath();X.fillStyle=c;X.fill();X.strokeStyle='#fff';X.lineWidth=2;X.stroke();star4(0,2,4,'#fff');X.restore()}
function drawTitle(){drawWorld();const L=titleLayout();titleUI={go:null,m:[],d:[],mute:null,said:titleUI.said};
  rainbowArc(L.ux+10,L.uy+40*L.us,130*L.us,10*L.us,0.55);
  drawUnicorn(L.ux,L.uy+Math.sin(T*2)*8,{s:L.us,happy:Math.sin(T*1.1)>0.7,cheer:Math.sin(T*1.1)>0.7,wingBoost:0});
  if(R()<0.15)parts.push({x:L.ux-60*L.us+rr(-10,10),y:L.uy+rr(-20,20),vx:rr(-80,-30),vy:rr(-20,20),life:1,t:0,r:rr(2,5),col:pick(RAINBOW),star:1,rot:0});
  titleWords(L.tx,L.ty,L.og?62:L.land?34:Math.min(40,W/9));
  if(OG){txt('Fly, sparkle & boop the grumpy clouds!',L.tx,H*0.66,30,'#fff','center','#ff5fa8');const cx=L.tx,cy=H*0.84;drawLolli(cx-150,cy-6,20,T);drawCup(cx-75,cy,1.5);drawStarT(cx,cy,0.3);drawGem(cx+75,cy,22,0.5);drawFly(cx+150,cy,'#ff9ad6',0.3,1.8);for(let i=0;i<14;i++)star4((i*173)%W,(i*97)%(H*0.6)+20,4+(i%3)*3,'#fff');drawParts();return}
  // pickers: mane color row + dress color row (no reading needed)
  const rowW=330,x0=L.land?L.px:L.px;
  for(let row=0;row<2;row++){const y=L.py+row*56;rrect(x0,y-25,rowW,50,25);X.fillStyle='rgba(255,255,255,0.75)';X.fill();
    if(row===0){X.save();X.translate(x0+28,y+14);X.scale(0.34,0.34);drawUnicorn(0,0,{zoe:false,happy:1,fly:true});X.restore()}else dressIcon(x0+28,y,DRESSES[dress],1);
    for(let i=0;i<6;i++){const sx=x0+74+i*43,sel=row===0?i===mane:i===dress;swatch(sx,y,sel?16:14,row===0?MANES[i]:[DRESSES[i],mixC(DRESSES[i],'#ffffff',0.5)],sel);(row===0?titleUI.m:titleUI.d).push([sx-21,y-25,42,50])}}
  const [gx,gy]=L.go,p=1+Math.sin(T*5)*0.05;X.save();X.translate(gx,gy);X.scale(p,p);rrect(-105,-42,210,84,42);const g=X.createLinearGradient(0,-42,0,42);g.addColorStop(0,'#ff9ad6');g.addColorStop(1,'#ff5fa8');X.fillStyle=g;X.fill();X.lineWidth=6;X.strokeStyle='#fff';X.stroke();
  X.beginPath();X.moveTo(-58,-20);X.lineTo(-58,20);X.lineTo(-26,0);X.closePath();X.fillStyle='#fff';X.fill();txt('GO!',24,4,48,'#fff','center','#d63f8a');star4(90,-34,6+Math.sin(T*6)*3,'#fff');X.restore();titleUI.go=[gx-115,gy-50,230,100];
  if(best>0){star5(gx-30,gy+64,10,'#ffd23f');txt(String(best),gx-14,gy+66,20,'#fff','left','#ff5fa8')}
  titleUI.mute=[W-64,H-64,60,60];circ(W-34,H-34,26,'rgba(255,255,255,0.9)');speaker(W-36,H-34,AUD.muted);drawParts()}
function titleTap(p){if(inRect(p,titleUI.mute)){AUD.setMuted(!AUD.muted);return}
  if(inRect(p,titleUI.go)){AUD.SFX.magic();startGame();return}
  let hit=false;(titleUI.m||[]).forEach((r,i)=>{if(inRect(p,r)){mane=i;localStorage.setItem('zua_mane',i);hit=true}});(titleUI.d||[]).forEach((r,i)=>{if(inRect(p,r)){dress=i;localStorage.setItem('zua_dress',i);hit=true}});
  if(hit){AUD.SFX.sparkle();glitter(p.x,p.y,14,1);if(R()<0.6)AUD.say(pick(['pretty','hehe']),1)}
  else glitter(p.x,p.y,10,0.8);
  if(!titleUI.said&&AUD.unlocked){titleUI.said=1;setTimeout(()=>AUD.say('title',2),350)}AUD.setTheme('title')}
// ---------- the castle dance party ----------
function drawEnd(){drawWorld();
  // disco lights
  X.save();X.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const a=Math.sin(T*1.3+i*1.4)*0.6,c=RAINBOW[i];X.save();X.translate(W/2,TOP+(H<700?52:110));X.rotate(a);const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');
    X.globalAlpha=0.18;X.fillStyle=g;X.beginPath();X.moveTo(0,0);X.lineTo(-60,H);X.lineTo(60,H);X.closePath();X.fill();X.restore()}X.restore();
  // disco ball
  const short=H<700,ballY=TOP+(short?52:110);X.strokeStyle='#ddd';X.lineWidth=2;X.beginPath();X.moveTo(W/2,0);X.lineTo(W/2,ballY-24);X.stroke();X.save();X.translate(W/2,ballY);circ(0,0,26,'#e8e0ff');X.save();X.beginPath();X.arc(0,0,26,0,TAU);X.clip();
  for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const c=((i+j+Math.floor(T*6))%3+3)%3;X.fillStyle=['#ffffff','#ffc6e5','#c9b8ff'][c];X.fillRect(i*8-3.5+((T*20)%8),j*8-3.5,7,7)}X.restore();star4(-10,-10,6+Math.sin(T*8)*3,'#fff');X.restore();
  // dancing unicorn + Zoe
  const L=W>H*1.25;const dx=L?W*0.3:W*0.38,dy=GY()-70,bob=Math.abs(Math.sin(T*Math.PI*2*132/120/2))*-18;const s=Math.min(1.5,H/420);
  drawUnicorn(dx,dy+bob,{s,rot:Math.sin(T*4.4)*0.12,cheer:Math.sin(T*4.4)>-0.2,happy:1,fly:false,gal:T*6});drawFriends(dx,dy+bob-20);
  for(let i=0;i<2;i++){const cx=i?W-60:54,cy=GY()-24-Math.abs(Math.sin(T*3.5+i*1.6))*26;if(!L&&i)continue;rainbowArc(cx,cy+14,30,4,0.9);cloudShape(cx,cy,0.7,'#fff');X.strokeStyle='#5b4a7a';X.lineWidth=2;[-6,6].forEach(d=>{X.beginPath();X.arc(cx+d,cy,2.4,Math.PI*1.1,Math.PI*1.9);X.stroke()});X.beginPath();X.ellipse(cx,cy+6,3.5,3,0,0,Math.PI);X.fillStyle='#d6456b';X.fill()}
  // panel
  const k=back(endT*1.8),pw=Math.min(W-30,380),ph=short?200:250,px=(W-pw)/2,py=ballY+(short?30:40);X.save();X.translate(W/2,py+ph/2);X.scale(k,k);X.translate(-W/2,-(py+ph/2));
  rrect(px,py,pw,ph,30);X.fillStyle='rgba(255,250,253,0.95)';X.fill();X.lineWidth=6;const g=X.createLinearGradient(px,0,px+pw,0);RAINBOW.forEach((c,i)=>g.addColorStop(i/5,c));X.strokeStyle=g;X.stroke();
  const st=stars();for(let i=0;i<3;i++){const on=i<st&&endT>0.7+i*0.4;const sp=on?1+Math.max(0,0.35-(endT-0.7-i*0.4))*2.5:1;X.save();X.translate(W/2+(i-1)*76,py+52+(i===1?-8:4));X.scale(sp,sp);X.rotate(on?Math.sin(T*3+i)*0.08:0);star5(0,0,34,on?'#ffb300':'#e8dff0',0,0.5);star5(0,0,28,on?'#ffe066':'#f4eef8',0,0.5);if(on)star5(-6,-6,10,'rgba(255,255,255,0.7)',0,0.5);X.restore();
    if(on&&!endUI['s'+i]){endUI['s'+i]=1;AUD.SFX.chime(1);glitter(W/2+(i-1)*76,py+52,20,1.2)}}
  const items=[['star',counts.star],['lolli',counts.lolli],['cup',counts.cup],['gem',counts.gem],['fly',counts.fly],['cloud',boops]];const cw=(pw-20)/6;
  items.forEach(([kk,v],i)=>{const cx=px+10+cw*(i+0.5),cy=py+ph*(short?0.5:0.47);const ph2=T*2+i;
    if(kk==='star')drawStarT(cx,cy,ph2*0.3);else if(kk==='lolli')drawLolli(cx,cy-4,13,ph2*0.5);else if(kk==='cup')drawCup(cx,cy,1);else if(kk==='gem')drawGem(cx,cy,14,ph2);else if(kk==='fly')drawFly(cx,cy,'#ff9ad6',ph2,1.1);else{rainbowArc(cx,cy+8,16,3,1);cloudShape(cx,cy+6,0.45,'#fff')}
    txt(String(v),cx,cy+(short?31:36),22,'#b0418a')});
  X.font='800 30px '+FONT;const sw2=X.measureText(String(score)).width;star5(W/2-sw2/2-8,py+ph-(short?28:36),14,'#ffc21a');txt(String(score),W/2+14,py+ph-(short?26:34),30,'#ff5fa8','center','#fff');
  if(score>=best&&score>0){txt('NEW BEST!',W/2,py+ph-(short?2:6),15,'#fff','center','#b57bff')}
  X.restore();
  // buttons
  const by=H-58,ar=[W/2+20,by-36,150,72],hr=[W/2-140,by-36,96,72];endUI.again=ar;endUI.home=hr;if(endT>1.2){
    rrect(...ar,36);X.fillStyle='#ff5fa8';X.fill();X.lineWidth=5;X.strokeStyle='#fff';X.stroke();X.save();X.translate(ar[0]+48,by);X.strokeStyle='#fff';X.lineWidth=6;X.lineCap='round';X.beginPath();X.arc(0,0,14,-0.4,Math.PI*1.5);X.stroke();X.beginPath();X.moveTo(14,-14);X.lineTo(4,-16);X.lineTo(12,-4);X.closePath();X.fillStyle='#fff';X.fill();X.restore();txt('GO!',ar[0]+104,by+3,30,'#fff','center','#d63f8a');
    rrect(...hr,36);X.fillStyle='#b57bff';X.fill();X.lineWidth=5;X.strokeStyle='#fff';X.stroke();X.save();X.translate(hr[0]+48,by+4);X.fillStyle='#fff';X.beginPath();X.moveTo(-18,-2);X.lineTo(0,-18);X.lineTo(18,-2);X.closePath();X.fill();X.fillRect(-12,-4,24,18);X.fillStyle='#b57bff';rrect(-4,4,8,10,3);X.fill();X.restore()}
  drawParts()}
function endTap(p){if(endT>1.2&&inRect(p,endUI.again)){AUD.SFX.magic();endUI={};startGame();return}if(endT>1.2&&inRect(p,endUI.home)){endUI={};goTitle();return}
  firework(p.x,p.y);AUD.SFX.giggle(R()<0.5);if(R()<0.25)AUD.say(pick(['hehe','z3','z4']),1)}
// ---------------- loop ----------------
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;try{for(let i=0;i<TS;i++)update(dt);render()}catch(e){console.error(e)}requestAnimationFrame(frame)}
function render(){X.setTransform(DPR*SC,0,0,DPR*SC,0,0);X.clearRect(0,0,W,H);
  if(state==='title'){drawTitle();return}
  if(state==='end'){drawEnd();return}
  X.save();if(shake>0)X.translate(rr(-1,1)*shake*12,rr(-1,1)*shake*12);
  drawWorld();drawTrail();for(const o of objs)if(o.type==='c')drawCloud(o);for(const o of objs){if(o.type==='t')drawTreat(o);else if(o.type==='p')drawPower(o)}
  drawPlayer();X.restore();drawParts();drawHUD();if(card)drawCard()}
reset();AUD.setTheme('title');requestAnimationFrame(frame);
if(DEBUG)window.__W={get state(){return state},get score(){return score},get counts(){return counts},get boops(){return boops},get hearts(){return hearts},get uni(){return uni},get power(){return power&&power.k},get usedPowers(){return usedPowers},
  audio:AUD,start:startGame,objs:()=>objs,clear(){objs=[]},treat(k,x,y){return addTreat(k,x,y)},cloud(x,y){const o={type:'c',x,y,ph:0,booped:0,bt:0,r:40};objs.push(o);return o},pow(k,x,y){const o={type:'p',k,x,y,y0:y,ph:0,r:30};objs.push(o);return o},
  set runT(v){runT=v},get runT(){return runT},end(){finish()},freeze(){speed=0},set TS(v){TS=v},get seen(){return seen},get cards(){return cards},get card(){return card},get stars(){return stars()},get rainHits(){return rainHits},get hugs(){return hugs},get friends(){return friends.length},
  get mane(){return mane},get dress(){return dress},titleUI:()=>titleUI,endUI:()=>endUI,toClient:(x,y)=>({x:x*SC,y:y*SC}),get W(){return W},get H(){return H},GY,TOPY,setScore(v){score=v},setHearts(v){hearts=v}};
})();
