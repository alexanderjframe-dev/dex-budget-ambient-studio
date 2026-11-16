/* Dex Budget v1.7 — optional original, synthesized ambience. No audio files or tracking. */
(() => {
  'use strict';
  const KEY='dex_ambient_sound_v1';
  const options=['off','rain','ocean','wind'];
  const titles={off:'Sound is off',rain:'Soft rain',ocean:'Ocean',wind:'Night air'};
  let preference={sound:'off',volume:20};
  try { const p=JSON.parse(localStorage.getItem(KEY));if(p&&typeof p==='object') {preference.sound=options.includes(p.sound)?p.sound:'off';preference.volume=Math.max(0,Math.min(50,Number(p.volume)||0));}} catch(_){}
  let context=null, master=null, nodes=[], buffer=null, playing='off';
  const $=id=>document.getElementById(id);
  const write=()=>{try{localStorage.setItem(KEY,JSON.stringify(preference))}catch(_){}};
  function init(){
    if(context)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw Error('This browser cannot play generated audio.');
    context=new AudioContext(); master=context.createGain();master.gain.value=0;master.connect(context.destination);
    const length=Math.max(1,Math.floor(context.sampleRate*3));buffer=context.createBuffer(1,length,context.sampleRate);
    const channel=buffer.getChannelData(0);let brown=0;
    for(let i=0;i<length;i++){brown=(brown+Math.random()*2-1)*.985;channel[i]=brown*.16;}
  }
  function stopNodes(){for(const x of nodes){try{x.stop?.()}catch(_){ }try{x.disconnect?.()}catch(_){}}nodes=[];}
  function addNoise(cutoff,highpass){
    const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
    const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=cutoff;
    const hp=context.createBiquadFilter();hp.type='highpass';hp.frequency.value=highpass;
    const gain=context.createGain();gain.gain.value=1;
    source.connect(hp);hp.connect(low);low.connect(gain);gain.connect(master);
    source.start();nodes.push(source,hp,low,gain);
    return gain;
  }
  function addLfo(gain,frequency,depth,base){
    const lfo=context.createOscillator(),amplitude=context.createGain();
    lfo.type='sine';lfo.frequency.value=frequency;amplitude.gain.value=depth;
    gain.gain.setValueAtTime(base,context.currentTime);
    lfo.connect(amplitude);amplitude.connect(gain.gain);lfo.start();nodes.push(lfo,amplitude);
  }
  function updateUI(info){
    $('soundNow').textContent=info||titles[playing];
    $('soundSubtitle').textContent=playing==='off'?'Nothing plays automatically.':'Original ambient audio · tap Off to stop';
    $('soundVolume').value=String(preference.volume);$('soundVolumeLabel').textContent=preference.volume+'%';
    document.querySelectorAll('[data-sound]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sound===playing)));
  }
  function volume(){if(master&&context)master.gain.setTargetAtTime(preference.volume/100*.43,context.currentTime,.35);}
  async function play(name){
    if(!options.includes(name))return;
    preference.sound=name;write();
    if(name==='off'){stop();return;}
    try{
      init();await context.resume();
      // Node replacement is immediate, overall gain fades softly.
      master.gain.setValueAtTime(0,context.currentTime);stopNodes();
      const g=name==='rain'?addNoise(3200,250):name==='ocean'?addNoise(850,40):addNoise(480,30);
      if(name==='rain')addLfo(g,.12,.075,.85);
      if(name==='ocean')addLfo(g,.12,.36,.56);
      if(name==='wind')addLfo(g,.07,.35,.52);
      playing=name;volume();updateUI();$('soundStatus').textContent='Playing '+titles[name].toLowerCase()+'. It will stop when you leave Dex.';
    }catch(e){playing='off';preference.sound='off';write();updateUI();$('soundStatus').textContent='Could not start audio: '+e.message;}
  }
  function stop(){if(context && master){master.gain.setValueAtTime(0,context.currentTime);stopNodes();context.suspend().catch(()=>{});}playing='off';preference.sound='off';write();updateUI();$('soundStatus').textContent='Audio is off.';}
  document.querySelectorAll('[data-sound]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.sound==='off')stop();else play(b.dataset.sound)}));
  $('stopAudio').addEventListener('click',stop);
  $('soundVolume').addEventListener('input',e=>{preference.volume=Math.max(0,Math.min(50,Number(e.target.value)));write();volume();updateUI();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && playing!=='off')stop();});
  window.addEventListener('pagehide',()=>{if(playing!=='off')stop()});
  // Stored preferences do NOT auto-play on any visit.
  updateUI();
  window.DexAudio={status:()=>({playing,volume:preference.volume,active:!!context&&context.state==='running'}),stop};
})();
