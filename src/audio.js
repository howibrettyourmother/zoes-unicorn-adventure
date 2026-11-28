/*KFX-BEGIN*/
/* kfx.js v1 - recorded sound effects for the Wilson kids' games.
   One AAC sprite (audio/fx/fx.m4a + fx.json) of CC0 recordings (Kenney, OpenGameArt, Freesound CC0; see CREDITS-AUDIO.md).
   KFX.init({ctx:()=>AudioContext, out:()=>node, base:'audio/fx/', v:'ver', muted:()=>bool, duck:(depth,ms)=>{}})
   KFX.play('coin',{vol,rate})   KFX.bind(SFX,{gameName:'bankName'|['bankName',{opts}]|fn(args)->spec},{ok:fn})
   Keeps polyphony low (global + per-sound caps), gaps repeated triggers, varies pitch a little and never repeats the same take twice. */
(function(W){'use strict';
var K=W.KFX={stats:{play:0,drop:0,steal:0,decoded:0,err:0},ready:false};
var cfg={max:6},C=null,bus=null,ab=null,buf=null,idx=null,idxP=null,fetching=false,decoding=false,live=[],tlast={},lastI={},unlockedOnce=false;
var TONAL={chime:1,bell:1,star:1,correct:1,sparkle:1,magic:1,gem:1,coin:1,coins:1,pickup:1,power:1,shield:1,drip:1};
var JING={win:1,fanfare:1,levelup:1,sting:1,sad:1,fail:1,cheer:1,wow:1,airhorn:1,boom:1,roar:1,firework:1,rumble:1,stomp:1};
function prof(n){
  if(JING[n])return{gap:350,conc:1,jit:n==='boom'||n==='roar'||n==='stomp'?0.04:0,duck:n==='boom'||n==='stomp'||n==='rumble'?0.55:0.45,pri:3};
  if(TONAL[n])return{gap:70,conc:n==='coin'?3:2,jit:0.025,pri:2};
  if(n==='click'||n==='tap'||n==='tick'||n==='back'||n==='toggle'||n==='swipe'||n==='pop'||n==='squeak'||n==='pat'||n==='rustle')return{gap:55,conc:2,jit:0.06,pri:1};
  return{gap:80,conc:2,jit:0.05,pri:2};
}
function getC(){var c=null;try{c=cfg.ctx&&cfg.ctx()}catch(e){}if(c!==C){C=c;bus=null}return C}
function mkBus(){
  if(bus||!C)return bus;
  try{
    bus=C.createGain();bus.gain.value=cfg.gain==null?0.9:cfg.gain;
    var comp=C.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=8;comp.ratio.value=6;comp.attack.value=0.003;comp.release.value=0.14;
    bus.connect(comp);var o=typeof cfg.out==='function'?cfg.out():cfg.out;comp.connect(o||C.destination);
  }catch(e){bus=null}
  return bus;
}
function fetchSprite(){
  if(fetching||!cfg.base)return;fetching=true;var q=cfg.v?('?v='+cfg.v):'';
  try{
    fetch(cfg.base+'fx.json'+q).then(function(r){return r.json()}).then(function(j){idx=j}).catch(function(){K.stats.err++});
    fetch(cfg.base+'fx.m4a'+q).then(function(r){return r.arrayBuffer()}).then(function(a){ab=a;K.warm()}).catch(function(){K.stats.err++});
  }catch(e){K.stats.err++}
}
K.warm=function(){
  getC();if(!C||buf||decoding||!ab)return;decoding=true;
  var done=function(b){decoding=false;if(b){buf=b;K.ready=true;K.stats.decoded=1}else K.stats.err++};
  try{var p=C.decodeAudioData(ab.slice(0),done,function(){done(null)});if(p&&p.catch)p.catch(function(){})}catch(e){decoding=false}
};
K.init=function(o){
  for(var k in o)cfg[k]=o[k];
  fetchSprite();
  if(!unlockedOnce){unlockedOnce=true;
    ['pointerdown','touchend','click','keydown'].forEach(function(ev){W.addEventListener(ev,K.kick,{capture:true,passive:true})});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(K.kick,60)});
    W.addEventListener('pageshow',function(){setTimeout(K.kick,60)});
  }
};
/* gesture/visibility: make sure the context is running and the sprite is decoded (iOS needs resume() inside a tap) */
K.kick=function(){getC();if(!C)return;try{if(C.state!=='running'&&!document.hidden){var p=C.resume();p&&p.catch&&p.catch(function(){})}}catch(e){}K.warm()};
function pick(n,len){
  if(len<2)return 0;var i,t=0;do{i=(Math.random()*len)|0}while(i===lastI[n]&&++t<6);lastI[n]=i;return i}
K.play=function(name,o){
  o=o||{};getC();
  if(!C||C.state!=='running'||document.hidden)return false;
  if(cfg.muted&&cfg.muted())return false;
  if(!buf||!idx){K.warm();return false}
  var v=idx[name];if(!v||!v.length){K.stats.miss=(K.stats.miss||0)+1;return false}
  mkBus();if(!bus)return false;
  var P=prof(name),t=C.currentTime;
  if(t-(tlast[name]||-9)<P.gap/1000){K.stats.drop++;return false}
  live=live.filter(function(x){return x.end>t});
  var same=live.filter(function(x){return x.name===name});
  if(same.length>=P.conc)steal(same[0],t);
  if(live.length>=(cfg.max||6)){var lo=live[0];for(var i=1;i<live.length;i++)if(live[i].pri<lo.pri||(live[i].pri===lo.pri&&live[i].t0<lo.t0))lo=live[i];
    if(lo.pri>P.pri){K.stats.drop++;return false}steal(lo,t)}
  var seg=v[pick(name,v.length)],rate=(o.rate||1)*(1+(Math.random()*2-1)*(o.jit==null?P.jit:o.jit));
  var s=C.createBufferSource(),g=C.createGain();s.buffer=buf;s.playbackRate.value=rate;
  g.gain.value=(o.vol==null?1:o.vol);s.connect(g);g.connect(bus);
  try{s.start(t,seg[0],seg[1])}catch(e){return false}
  var rec={name:name,s:s,g:g,t0:t,end:t+seg[1]/rate+0.03,pri:P.pri};live.push(rec);
  s.onended=function(){try{g.disconnect()}catch(e){}};
  tlast[name]=t;K.stats.play++;
  if(P.duck&&cfg.duck&&!o.noduck){try{cfg.duck(P.duck,seg[1]/rate*1000)}catch(e){}}
  return true;
};
function steal(x,t){try{x.g.gain.cancelScheduledValues(t);x.g.gain.setTargetAtTime(0,t,0.008);x.s.stop(t+0.05)}catch(e){}x.end=t;K.stats.steal++}
/* bind(SFX, MAP, {ok}) - replace the game's synth effects with recordings; unmapped names keep their old behavior */
K.bind=function(SFX,MAP,opt){
  opt=opt||{};var bound=[];
  Object.keys(MAP).forEach(function(k){
    if(!(k in SFX))return;var m=MAP[k];
    SFX[k]=function(){
      try{
        if(opt.ok&&!opt.ok())return;
        var spec=typeof m==='function'?m.apply(null,arguments):m;if(!spec)return;
        if(typeof spec==='string')K.play(spec);
        else if(spec instanceof Array)K.play(spec[0],spec[1]);
        else if(spec.n)K.play(spec.n,spec);
      }catch(e){}
    };bound.push(k);
  });
  K.bound=(K.bound||[]).concat(bound);return bound;
};
})(window);

/*KFX-END*/
const AUD=(()=>{
  let C=null,master,musicBus,musicDuck,sfxBus,voiceBus,chantBus,noiseBuf,unlocked=false,silentEl=null,clips={},loading=false;
  let muted=localStorage.getItem('zua_muted')==='1';
  const R=Math.random,rr=(a,b)=>a+R()*(b-a),pick=a=>a[(R()*a.length)|0];
  const now=()=>C?C.currentTime:0;const stats={voice:0,last:'',dropped:0,sfx:0,chants:0,notes:0};
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
  function build(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;C=new AC();C.addEventListener&&C.addEventListener('statechange',()=>{if(C.state!=='running'&&!document.hidden&&unlocked)C.resume().catch(()=>{})});
    master=C.createGain();master.gain.value=muted?0:0.9;const comp=C.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=4;
    master.connect(comp);comp.connect(C.destination);
    const bus=v=>{const g=C.createGain();g.gain.value=v;g.connect(master);return g};
    musicBus=bus(0.36);musicDuck=C.createGain();musicDuck.connect(musicBus);sfxBus=bus(0.62);voiceBus=bus(1.2);chantBus=C.createGain();chantBus.gain.value=2.6;chantBus.connect(musicDuck);
    // tiny shimmering reverb-ish echo for the music box / glock (feedback delay)
    const dl=C.createDelay(1);dl.delayTime.value=0.29;const fb=C.createGain();fb.gain.value=0.28;const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
    musicDuck.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);const wet=C.createGain();wet.gain.value=0.35;lp.connect(wet);wet.connect(musicBus);
    const sr=C.sampleRate;noiseBuf=C.createBuffer(1,sr*2,sr);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=R()*2-1;
    /* synth disabled */0;}
  function unlock(){try{if(!C)build();if(!C)return;try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
      if(C.state!=='running')C.resume().catch(()=>{});
      const s=C.createBufferSource();s.buffer=C.createBuffer(1,1,22050);s.connect(C.destination);s.start(0);
      // looping near-silent <audio> => 'playback' audio session so sound works even with the iPhone ringer/silent switch on
      if(!silentEl){silentEl=document.createElement('audio');silentEl.setAttribute('playsinline','');silentEl.setAttribute('webkit-playsinline','');silentEl.setAttribute('x-webkit-airplay','deny');silentEl.preload='auto';silentEl.loop=true;silentEl.src=SILENT_MP3;silentEl.volume=0.01}
      if(silentEl.paused&&!document.hidden){const p=silentEl.play();p&&p.catch&&p.catch(()=>{})}
      if(!unlocked){unlocked=true;loadClips()}}catch(e){console.warn('unlock',e)}}
  ['touchstart','touchend','pointerdown','mousedown','click','keydown'].forEach(ev=>window.addEventListener(ev,unlock,{capture:true,passive:true}));
  const wake=()=>{if(C&&unlocked&&!document.hidden&&C.state!=='running')C.resume().catch(()=>{})};window.addEventListener('pageshow',wake);window.addEventListener('focus',wake);setInterval(wake,1500);
  document.addEventListener('visibilitychange',()=>{if(!C)return;if(document.hidden){C.suspend&&C.suspend().catch(()=>{});silentEl&&silentEl.pause()}
    else if(unlocked){C.resume().catch(()=>{});if(silentEl){const p=silentEl.play();p&&p.catch&&p.catch(()=>{})}}});
  function loadClips(){if(loading)return;loading=true;for(const k in CLIPS){try{const b=atob(CLIPS[k]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
    const p=C.decodeAudioData(u.buffer,x=>{clips[k]=x},()=>{});p&&p.catch&&p.catch(()=>{})}catch(e){}}}
  const ok=()=>C&&!muted&&C.state==='running';
  const safe=fn=>function(){try{if(!sfxOK())return;if(!ok())return;stats.sfx++;return fn.apply(null,arguments)}catch(e){}};
  function g(v,out){const x=C.createGain();x.gain.value=v;x.connect(out);return x}
  function env(x,t,a,h,r,v){x.gain.setValueAtTime(0.0001,t);x.gain.linearRampToValueAtTime(v,t+a);x.gain.setValueAtTime(v,t+a+h);x.gain.exponentialRampToValueAtTime(0.0001,t+a+h+r)}
  function o(type,f,t,d,out){const x=C.createOscillator();x.type=type;x.frequency.setValueAtTime(f,t);x.connect(out);x.start(t);x.stop(t+d+0.05);return x}
  function f(type,fr,q,out){const x=C.createBiquadFilter();x.type=type;x.frequency.value=fr;x.Q.value=q||0.7;x.connect(out);return x}
  function n(t,d,out){const s=C.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.connect(out);s.start(t,R());s.stop(t+d+0.05);return s}
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function bell(m,t,v,out,dec){// music-box / chime tone: sine + inharmonic shimmer partials
    const G=g(0,out);env(G,t,0.002,0.01,dec||0.7,v);o('sine',mtof(m),t,(dec||0.7)+0.1,G);
    const G2=g(0,out);env(G2,t,0.001,0.005,(dec||0.7)*0.3,v*0.3);o('sine',mtof(m)*2.76,t,0.4,G2);
    const G3=g(0,out);env(G3,t,0.001,0.003,0.08,v*0.18);o('sine',mtof(m)*5.4,t,0.15,G3)}
  // ---------- SFX ----------
  let combo=0,comboT=0;
  const SFX={
    chime:safe((k)=>{const t=now();if(t-comboT>1.4)combo=0;comboT=t;combo=Math.min(combo+1,10);const base=[84,86,88,91,93,96,98,100,103,105][combo-1];
      bell(base,t,0.16,sfxBus,0.5);bell(base+7,t+0.06,0.1,sfxBus,0.5);if(k)bell(base+12,t+0.12,0.09,sfxBus,0.6)}),
    sparkle:safe(()=>{const t=now();for(let i=0;i<6;i++)bell(pick([96,98,100,103,105,108]),t+i*0.045+rr(0,0.02),0.05,sfxBus,0.35)}),
    yum:safe(()=>{const t=now();[[0,72],[0.11,79],[0.22,84]].forEach(([d,m])=>{const G=g(0,sfxBus);env(G,t+d,0.01,0.05,0.12,0.13);const F=f('lowpass',900,6,G);F.frequency.setValueAtTime(500,t+d);F.frequency.exponentialRampToValueAtTime(2600,t+d+0.12);o('square',mtof(m-12),t+d,0.2,F)})}),
    boop:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.003,0.04,0.12,0.35);const x=o('sine',300,t,0.2,G);x.frequency.exponentialRampToValueAtTime(900,t+0.08);x.frequency.exponentialRampToValueAtTime(520,t+0.18);
      [72,76,79,84,88,91,96].forEach((m,i)=>bell(m+12,t+0.1+i*0.045,0.07,sfxBus,0.45))}),
    bubble:safe(()=>{const t=now();for(let i=0;i<7;i++){const s=t+i*0.06+rr(0,0.03),G=g(0,sfxBus);env(G,s,0.003,0.02,0.07,0.12);const x=o('sine',rr(300,600),s,0.12,G);x.frequency.exponentialRampToValueAtTime(rr(1200,2000),s+0.09)}}),
    pop:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.001,0.01,0.08,0.3);n(t,0.1,f('highpass',900,0.7,G));const H=g(0,sfxBus);env(H,t,0.001,0.02,0.06,0.2);const x=o('sine',600,t,0.1,H);x.frequency.exponentialRampToValueAtTime(1600,t+0.06)}),
    magic:safe(()=>{const t=now();[72,76,79,84,88,91,96,100,103,108].forEach((m,i)=>bell(m,t+i*0.05,0.09,sfxBus,0.6));const N=g(0,sfxBus);env(N,t,0.3,0.2,0.4,0.05);const F=f('bandpass',3000,1,N);n(t,1,F);F.frequency.exponentialRampToValueAtTime(9000,t+0.8)}),
    whoosh:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.12,0.1,0.3,0.18);const F=f('bandpass',400,1.5,G);n(t,0.6,F);F.frequency.exponentialRampToValueAtTime(3200,t+0.5)}),
    drip:safe(()=>{const t=now();for(let i=0;i<3;i++){const s=t+i*0.09,G=g(0,sfxBus);env(G,s,0.002,0.01,0.06,0.12);const x=o('sine',rr(900,1300),s,0.09,G);x.frequency.exponentialRampToValueAtTime(rr(300,500),s+0.07)}}),
    oops:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.02,0.15,0.2,0.13);const F=f('lowpass',1400,2,G);const x=o('triangle',520,t,0.4,F);x.frequency.exponentialRampToValueAtTime(330,t+0.35);
      const L=C.createOscillator(),LG=C.createGain();L.frequency.value=9;LG.gain.value=18;L.connect(LG);LG.connect(x.frequency);L.start(t);L.stop(t+0.45)}),
    giggle:safe((hi)=>{const t=now(),base=hi?1000:760;for(let k=0;k<5;k++){const s=t+k*0.085,G=g(0,sfxBus);env(G,s,0.01,0.02,0.05,0.07);const F=f('bandpass',base*2,2,G);const x=o('triangle',base*(1.15-k*0.04),s,0.08,F);x.frequency.exponentialRampToValueAtTime(base*0.85,s+0.07)}}),
    neigh:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.03,0.5,0.25,0.1);const F=f('bandpass',1500,1.5,G);const x=o('sawtooth',700,t,0.85,F);
      x.frequency.setValueAtTime(700,t);x.frequency.linearRampToValueAtTime(1100,t+0.12);x.frequency.linearRampToValueAtTime(500,t+0.75);
      const L=C.createOscillator(),LG=C.createGain();L.frequency.value=17;LG.gain.value=90;L.connect(LG);LG.connect(x.frequency);L.start(t);L.stop(t+0.85)}),
    heart:safe(()=>{const t=now();bell(88,t,0.1,sfxBus,0.4);bell(93,t+0.1,0.1,sfxBus,0.6)}),
    flap:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.01,0.03,0.08,0.06);const F=f('bandpass',900,1,G);n(t,0.12,F);F.frequency.exponentialRampToValueAtTime(400,t+0.1)}),
    clap:safe(()=>{clap(now(),0.3,sfxBus)}),
    firework:safe(()=>{const t=now(),G=g(0,sfxBus);env(G,t,0.002,0.02,0.5,0.22);n(t,0.6,f('lowpass',2200,0.7,G));for(let i=0;i<10;i++){const s=t+rr(0.05,0.5),B=g(0,sfxBus);env(B,s,0.001,0.004,0.04,0.06);n(s,0.05,f('highpass',4000,0.7,B))}bell(pick([96,100,103]),t+0.05,0.06,sfxBus,0.6)}),
    fanfare:safe(()=>{const t=now();[[72,0],[76,0.13],[79,0.26],[84,0.39],[88,0.6]].forEach(([m,d],i)=>{bell(m,t+d,0.14,sfxBus,i==4?1.2:0.5);const G=g(0,sfxBus);env(G,t+d,0.01,i==4?0.4:0.08,0.3,0.05);o('square',mtof(m),t+d,0.9,f('lowpass',2400,0.7,G))})}),
    cheer:safe(()=>{const t=now();for(let k=0;k<10;k++){const s=t+rr(0,0.5),G=g(0,sfxBus),d=rr(0.4,0.8);env(G,s,0.06,d*0.5,d*0.5,0.03);const F=f('bandpass',rr(1100,1800),2,G);const x=o('sawtooth',rr(420,640),s,d,F);x.frequency.linearRampToValueAtTime(rr(560,820),s+d*0.6)}
      for(let i=0;i<24;i++){const s=t+rr(0.05,1.4),G=g(0,sfxBus);env(G,s,0.001,0.005,0.03,rr(0.06,0.14));n(s,0.05,f('bandpass',rr(1000,2400),1.2,G))}})
  };
  /*KFX-BIND*/try{KFX.init({ctx:()=>C,out:()=>sfxBus,muted:()=>muted,base:'audio/fx/',v:'20261128audio',gain:1.3,duck:(d,ms)=>{try{if(window.BGM&&BGM.duck)BGM.duck(d,ms)}catch(e){}}});
  KFX.bind(SFX,{
 /* ---- shared across Fry / Bee / Doodle / Adventure ---- */
 shoot:['bloop',{vol:.7}], pop:'pop', zap:'zap', honey:function(b){return b?'gem':'coin'}, power:'power', shield:'shield', shieldPop:['pop',{rate:.72}],
 hurt:'hurt', heart:'chime', check:'correct', bossHit:'thud', bossDown:'boom', warn:'bell', whoosh:'whoosh', squawk:['quack',{rate:1.3}], puff:'swipe', beep:'tick',
 roar:'roar', boing:'boing', firework:'firework', cheer:'cheer', fanfare:'fanfare', splat:'splat', plop:'plop', munch:'yum', whistle:'whistle', honk:'honk',
 fart:'fart', wet:'squish', mega:'boom', charge:'power', click:'click', star:'star', win:'win', tap:'tap', collect:'coin', thud:'thud', back:'back', open:'open', close:'close',
 /* ---- Doodle & Zoe / Alex & Doodle ---- */
 meow:'meow', purr:'purr', chime:'chime', treat:'coin', hop:['jump',{vol:.8}], hop2:['jump',{vol:.8,rate:1.12}], land:'land', knock:'knock', quack:'quack', squeak:'squeak', pat:'pat',
 rustle:'rustle', sticker:'star', shutter:'shutter', hoot:['bloop',{rate:.62,jit:.02}], crackle:'rustle', plane:'whoosh',
 note:function(m){return {n:'bellnote',rate:Math.pow(2,(((m-60)%24+24)%24-12)/12),jit:0,vol:.9}},
 /* ---- Lava ---- */
 jump:'jump', rocket:'rocket', coin:'coin', gem:'gem', stomp:'stomp', bump:'thud', appear:'sparkle', bubble:'bubble', hot:['rumble',{vol:.7}], blorp:'bloop', rumble:'rumble',
 grumble:'grumble', spit:'splat',
 /* ---- River Run ---- */
 paddle:['splash',{vol:.38,rate:1.3}], brake:['whoosh',{vol:.5,rate:.8}], splash:'splash', sputter:'bloop', bonk:'bonk', acorn:'gem', wave:'chime', burp:'burp', scoop:'pickup',
 drop:'coins', snap:['bonk',{rate:1.3}], sneeze:'sneeze', fish:['splash',{vol:.6,rate:1.35}], yum:'yum',
 /* ---- Unicorn ---- */
 sparkle:'sparkle', boop:'bloop', magic:'magic', drip:'drip', oops:'oops', giggle:'giggle', neigh:'whistle', flap:'swipe', clap:['pat',{rate:1.5}],
 /* ---- Pirates ---- */
 squirt:['splash',{vol:.5,rate:1.4}], toss:'whoosh', ribbit:'ribbit', laughMan:['giggle',{rate:.8}], stamp:'stomp', rewind:'scratch', laughTrack:'giggle',
 streak:function(lv){return {n:'chime',rate:Math.pow(2,Math.min(12,Math.max(0,lv|0))/12),jit:0}}, superOn:'power', superOff:['power',{rate:.72}], toot:function(b){return b?'fart':'toot'},
 cloudPop:['pop',{rate:.8}], horn:'honk', hose:['drip',{vol:.5}], parade:'levelup'
},{ok:()=>C&&!muted&&C.state==='running'&&sfxOK()})}catch(e){console.warn('kfx',e)}
  // ---------- one voice at a time, with ducking ----------
  let curEnd=0,curPrio=0,queued=null,curSrc=null;
  function duck(t,end,mv,sv){musicDuck.gain.cancelScheduledValues(t);musicDuck.gain.setTargetAtTime(mv,t,0.04);musicDuck.gain.setTargetAtTime(1,end,0.2);
    sfxBus.gain.cancelScheduledValues(t);sfxBus.gain.setTargetAtTime(sv,t,0.04);sfxBus.gain.setTargetAtTime(0.62,end,0.2)}
  /*vguard*/let _vk='',_vt=0,_sx=[];function sfxOK(){const n=Date.now();_sx=_sx.filter(x=>n-x<350);if(_sx.length>=3)return false;_sx.push(n);return true}
  function say(k,prio,fromQ){const n=Date.now();if(k===_vk&&n-_vt<4000&&(prio||1)<4)return false;if((prio||1)<3&&C&&now()<curEnd-0.05)return false;const r=say0(k,prio);queued=null;if(r){_vk=k;_vt=n}return r}
  function say0(k,prio){prio=prio||1;if(!ok())return false;const b=clips[k];if(!b)return false;const t=now();
    if(t<curEnd&&prio>=4&&curSrc){try{curSrc.stop()}catch(e){}curEnd=t}// counting numbers never get dropped: the newest number cuts the old one
    if(t<curEnd){if(prio>=2&&(!queued||queued.prio<prio)){queued={k,prio};return true}stats.dropped++;return false}
    const s=C.createBufferSource();s.buffer=b;s.connect(voiceBus);s.start(t+0.02);curSrc=s;curEnd=t+0.02+b.duration+0.25;curPrio=prio;stats.voice++;stats.last=k;
    duck(t,curEnd,0.3,0.4);return true}
  // counting rule (Brett, 2026-10-24): speak numbers only while counting a small set (<=20); never repeat a number already said this round;
  // taps <0.35 s apart are shown, not spoken, and the final total is said once after the burst; numbers cut each other (never stack)
  const CR={said:new Set(),lastT:-9,pend:0,tm:0,max:10};
  function count(n,reset){if(reset||n<=1)CR.said.clear();const t=performance.now()/1000,fast=t-CR.lastT<0.35;CR.lastT=t;clearTimeout(CR.tm);
    if(!(n>=1&&n<=CR.max))return false;
    if(fast){CR.pend=n;CR.tm=setTimeout(()=>{const p=CR.pend;CR.pend=0;if(p&&!CR.said.has(p)&&numSay(p))CR.said.add(p)},450);stats.countFast=(stats.countFast||0)+1;return true}
    if(CR.said.has(n))return true;const ok=numSay(n);if(ok)CR.said.add(n);return ok}
  count.reset=()=>{CR.said.clear();CR.pend=0;clearTimeout(CR.tm)};
  function numSay(n){return say('n'+n,4)}
  setInterval(()=>{if(queued&&C&&now()>=curEnd){const q=queued;queued=null;say(q.k,q.prio)}},60);
  // ---------- music: ORIGINAL bubbly candy-pop tune (C major, 4/4) ----------
  // music box / glockenspiel lead, bubbly filtered-square bass, sparkle arps, handclaps, soft kick, and a sung-on-the-beat chant hook
  const CH={C:[60,64,67],Am:[57,60,64],F:[57,60,65],G:[55,59,62],Em:[55,59,64],Dm:[57,62,65]};
  const PROG=['C','Am','F','G','C','Am','F','G','F','G','Em','Am','F','G','C','C'];
  const ROOT={C:36,Am:45,F:41,G:43,Em:40,Dm:38};
  const _=-1,h=0;// rest / hold
  const MEL=[76,79,84,79,81,79,76,_, 72,76,81,76,79,76,72,_, 77,81,84,81,79,77,76,77, 79,h,74,h,71,74,79,_,
             76,79,84,79,86,84,79,76, 81,h,76,81,84,h,81,79, 77,79,81,77,76,77,79,74, 79,h,h,_,83,h,86,_,
             84,_,84,_,81,84,_,_, 83,_,83,_,79,83,_,_, 79,81,83,84,83,81,79,76, 81,h,h,_,76,79,81,_,
             84,_,84,_,81,84,86,84, 83,_,79,_,74,79,83,86, 84,h,79,h,76,h,72,h, 84,_,79,76,72,_,_,_];
  // chant hook (original words) placed on beats of bars 9-12: [bar, eighth, clip, pitch-rate]
  const CHANT=[[8,0,'c1',1.06],[8,2,'c2',1.12],[8,4,'c3',1.0],[9,0,'c4',1.1],[9,4,'c4',1.18],[10,0,'c1',1.06],[10,2,'c2',1.12],[10,4,'c5',1.0],[11,0,'c4',1.14]];
  let theme='off',step=0,nextT=0,s16=0.121,chantOn=true,loopN=0;
  const TEMPO={title:118,play:124,dash:132,night:112,party:132,end:120};
  function setTheme(th){if(th===theme)return;const was=theme;theme=th;if(was==='off'||th==='party'||th==='title'){step=th==='title'?96:0;loopN=0}if(C)nextT=Math.max(nextT,now()+0.05);s16=60/(TEMPO[th]||124)/4}
  function lead(m,t,v,night){if(night){bell(m+12,t,v*1.1,musicDuck,0.9)}else{const G=g(0,musicDuck);env(G,t,0.002,0.01,0.5,v);o('sine',mtof(m+12),t,0.6,G);const G2=g(0,musicDuck);env(G2,t,0.002,0.005,0.18,v*0.35);o('sine',mtof(m+12)*2.76,t,0.22,G2);
    const G3=g(0,musicDuck);env(G3,t,0.004,0.04,0.12,v*0.35);o('triangle',mtof(m),t,0.2,G3)}}
  function bubbly(m,t,v,d){const G=g(0,musicDuck);env(G,t,0.004,d*0.4,d*0.5,v);const F=f('lowpass',300,9,G);F.frequency.setValueAtTime(260,t);F.frequency.exponentialRampToValueAtTime(1800,t+0.04);F.frequency.exponentialRampToValueAtTime(320,t+d);o('square',mtof(m),t,d+0.05,F);
    const S=g(0,musicDuck);env(S,t,0.004,d*0.5,d*0.4,v*0.9);o('sine',mtof(m-12),t,d+0.05,S)}
  function arp(m,t,v){const G=g(0,musicDuck);env(G,t,0.001,0.004,0.12,v);o('sine',mtof(m),t,0.16,G)}
  function clap(t,v,out){out=out||musicDuck;for(let i=0;i<3;i++){const G=g(0,out);env(G,t+i*0.011,0.001,0.004,i==2?0.12:0.02,v);n(t+i*0.011,0.15,f('bandpass',1400,1.4,G))}}
  function kick(t,v){const G=g(0,musicDuck);env(G,t,0.002,0.03,0.18,v);const x=o('sine',150,t,0.22,G);x.frequency.exponentialRampToValueAtTime(48,t+0.16)}
  function hat(t,v){const G=g(0,musicDuck);env(G,t,0.001,0.005,0.03,v);n(t,0.05,f('highpass',8000,0.7,G))}
  function chant(k,t,rate){const b=clips[k];if(!b||t<curEnd)return;const s=C.createBufferSource();s.buffer=b;s.playbackRate.value=rate;s.connect(chantBus);s.start(t);stats.chants++;
    const e=t+b.duration/rate+0.05;if(e>curEnd)curEnd=e}
  function schedule(){return;if(!C||theme==='off'||C.state!=='running')return;if(nextT<now())nextT=now()+0.05;
    while(nextT<now()+0.15){const t=nextT,i=step%256,bar=(i/16)|0,s=i%16,e8=s>>1,ch=PROG[bar],night=theme==='night',soft=theme==='end'?0.7:1,full=theme==='play'||theme==='party'||theme==='dash';
      if(i===0)loopN=(step/256)|0;
      // bubbly bass: bouncy root-fifth-octave on eighths
      if(s%2===0){const pat=[0,12,7,12,0,12,7,14][e8];const m=ROOT[ch]+(pat===14?12:pat);if(!night||s%4===0)bubbly(m,t,(night?0.07:0.1)*soft,s16*1.7)}
      // chords: music-box dyads on the off-beats
      if(s===4||s===12||(theme==='party'&&s===10)){CH[ch].forEach((m,j)=>arp(m+12,t+j*0.01,0.035*soft))}
      // sparkle arps (16ths, up-down through chord, 2 octaves up)
      if(theme!=='end'&&(full||theme==='title'||night)){const tones=CH[ch].concat(CH[ch].map(x=>x+12));const idx=[0,1,2,3,4,5,4,3,2,1,0,1,2,3,4,5][s];if(!(night&&s%2))arp(tones[idx]+24,t,(night?0.02:0.016))}
      // drums
      if(full){if(s===0||s===8||(theme==='party'&&s===10))kick(t,0.32);if(s===4||s===12)clap(t,theme==='party'?0.2:0.14);if(s%2===0)hat(t,s%4===2?0.05:0.025);if(theme==='party'&&(s===14||s===15)&&bar%2)clap(t,0.09)}
      else if(theme==='title'){if(s===0)kick(t,0.18);if(s===4||s===12)clap(t,0.07);if(s%4===2)hat(t,0.03)}
      else if(night){if(s===0)kick(t,0.12);if(s===8)hat(t,0.03)}
      // lead melody
      if(s%2===0){const m=MEL[bar*8+e8];if(m>0){let d=1;while(bar*8+e8+d<128&&MEL[bar*8+e8+d]===0)d++;stats.notes++;lead(m,t,(night?0.08:0.075)*soft,night);if(theme==='party'&&d>1)lead(m+12,t,0.03,false)}}
      // chant hook over bars 9-12 (title & party every loop; in play every other loop, never over a speaking voice)
      if(chantOn&&(theme==='title'||theme==='party'||(theme==='play'&&loopN%2===1))&&s%2===0){for(const c of CHANT)if(c[0]===bar&&c[1]===e8)chant(c[2],t,c[3])}
      step++;nextT+=s16}}
  function setMuted(m){muted=m;localStorage.setItem('zua_muted',m?'1':'0');if(C)master.gain.setTargetAtTime(m?0:0.9,now(),0.03)}
  return{unlock,SFX,say,count,setTheme,setMuted,get muted(){return muted},get unlocked(){return unlocked&&!!C},get running(){return !!C&&C.state==='running'},get clipCount(){return Object.keys(clips).length},get theme(){return theme},stats,get speaking(){return C&&now()<curEnd},get beat(){return C&&theme!=='off'?(now()/(s16*4)):0}};
})();
