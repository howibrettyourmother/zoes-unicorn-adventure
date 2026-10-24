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
    setInterval(schedule,25);}
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
  function schedule(){if(window.BGM&&BGM.ready)return;if(!C||theme==='off'||C.state!=='running')return;if(nextT<now())nextT=now()+0.05;
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
  return{unlock,SFX,say,setTheme,setMuted,get muted(){return muted},get unlocked(){return unlocked&&!!C},get running(){return !!C&&C.state==='running'},get clipCount(){return Object.keys(clips).length},get theme(){return theme},stats,get speaking(){return C&&now()<curEnd},get beat(){return C&&theme!=='off'?(now()/(s16*4)):0}};
})();
