/* ============================================================
   AUDIO MODULE — narasi suara + efek suara, tanpa file eksternal
   speak('teks')     -> antre & baca teks, TIDAK akan kepotong kalimat lain
   playClick()        -> bunyi klik pelan (misal: satu gigi bersih)
   playSuccess()       -> chime ceria (jawaban benar / pilihan sehat)
   playError()         -> nada turun (jawaban salah / pilihan manis / misi dilewati)
   playCelebrate()     -> fanfare kecil (misi besar selesai)
   toggleMute()        -> nyalakan/matikan semua suara
   ============================================================ */

let audioMuted = false;
let actx = null;
let audioUnlocked = false;

function getActx(){
  if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  return actx;
}

function unlockAudio(){
  if(audioUnlocked) return;
  audioUnlocked = true;
  try{
    const ctx = getActx();
    if(ctx.state === 'suspended') ctx.resume();
    playTone([1], 0.001, 'sine');
  }catch(e){ console.warn('[audio] gagal unlock AudioContext:', e); }
  try{ window.speechSynthesis.getVoices(); }catch(e){}
}
['pointerdown','touchstart','click','keydown'].forEach(evt=>{
  document.addEventListener(evt, unlockAudio, { once:true, passive:true });
});

function playTone(freqs, dur=0.18, type='sine', gap=0.09){
  if(audioMuted) return;
  try{
    const ctx = getActx();
    if(ctx.state === 'suspended') ctx.resume();
    freqs.forEach((f,i)=>{
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = f;
      const t0 = ctx.currentTime + i*gap;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0+0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t0); osc.stop(t0+dur+0.02);
    });
  }catch(e){ console.warn('[audio] playTone gagal:', e); }
}
function playClick(){ playTone([720], 0.08, 'sine'); }
function playSuccess(){ playTone([523,659,784], 0.16, 'sine'); }
function playError(){ playTone([300,220], 0.22, 'sine'); }
function playCelebrate(){ playTone([523,659,784,1046], 0.18, 'triangle'); }

/* --- Antrean narasi: tiap kalimat WAJIB selesai sebelum kalimat berikutnya mulai --- */
let speechQueue = [];
let isSpeaking = false;

function speak(text){
  if(audioMuted || !text) return;
  speechQueue.push(text);
  processQueue();
}

function processQueue(){
  if(isSpeaking || speechQueue.length === 0) return;
  const text = speechQueue.shift();
  isSpeaking = true;

  const voices = window.speechSynthesis.getVoices();
  if(voices.length === 0){
    // voice belum siap dimuat browser, tunggu lalu coba lagi
    window.speechSynthesis.onvoiceschanged = () => { doSpeak(text); };
    setTimeout(()=>doSpeak(text), 300);
    return;
  }
  doSpeak(text);
}

function doSpeak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID'; u.rate = 0.95; u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('id'));
    if(idVoice) u.voice = idVoice;
    u.onend = () => { isSpeaking = false; processQueue(); };
    u.onerror = () => { isSpeaking = false; processQueue(); };
    window.speechSynthesis.speak(u);
  }catch(e){
    console.warn('[audio] speak gagal:', e);
    isSpeaking = false;
    processQueue();
  }
}

function toggleMute(){
  audioMuted = !audioMuted;
  const btn = document.getElementById('muteBtn');
  if(btn) btn.textContent = audioMuted ? '🔇' : '🔊';
  if(audioMuted){
    window.speechSynthesis.cancel();
    speechQueue = [];
    isSpeaking = false;
  } else {
    unlockAudio();
    playClick();
  }
}