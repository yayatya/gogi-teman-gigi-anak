document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.room-track');
  const dots = document.querySelectorAll('.room-dots .dot');

  window.scrollRoom = function(direction) {
    if (!track) return;
    const roomWidth = track.clientWidth;
    track.scrollBy({ left: direction * roomWidth, behavior: 'smooth' });
  };

  window.goToRoom = function(index) {
    if (!track) return;
    const roomWidth = track.clientWidth;
    track.scrollTo({ left: index * roomWidth, behavior: 'smooth' });
  };

  if (track) {
    track.addEventListener('scroll', () => {
      const roomWidth = track.clientWidth;
      const activeIndex = Math.round(track.scrollLeft / roomWidth);
      
      dots.forEach((dot, idx) => {
        if (idx === activeIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });
  }
});

let game = { day:1, gigi:80, stage:'sarapan', missionDone:false };
const stageRoom = { sarapan:'dapur', sikat_pagi:'mandi', camilan:'dapur', sikat_malam:'mandi', tidur:'kamar' };
const stageOrder = ['sarapan','sikat_pagi','camilan','sikat_malam','tidur'];
const roomIndex = { kamar:0, dapur:1, mandi:2 };
const stagePenalty = { sarapan:-5, sikat_pagi:-20, camilan:-5, sikat_malam:-20, tidur:0 };
const skipMsg = {
  sarapan: { id:'dapurBubble', text:'Nggak sarapan? Nanti lemas... 😕' },
  sikat_pagi: { id:'mandiBubble', text:'Nggak sikat gigi? Gigi jadi kotor & mulai rusak! 😢' },
  camilan: { id:'dapurBubble', text:'Baik, nggak jajan dulu 🙂' },
  sikat_malam: { id:'mandiBubble', text:'Tidur tanpa sikat gigi bikin gigi berlubang! 😢' },
};

const breakfastFoods = [
  { emoji:'🍞🥚', label:'Roti & Telur', good:true },
  { emoji:'🍩', label:'Donat Manis', good:false }
];
const snackFoods = [
  { emoji:'🍎🥕', label:'Buah & Sayur', good:true },
  { emoji:'🍬', label:'Permen', good:false }
];

const quizBank = [
  { q:'Gigi sebaiknya disikat berapa kali sehari?', opts:['2 kali','1 kali'], correct:0 },
  { q:'Kapan waktu paling tepat untuk sikat gigi?', opts:['Setelah sarapan & sebelum tidur','Hanya saat mandi pagi'], correct:0 },
  { q:'Bagaimana cara menyikat gigi yang benar?', opts:['Gerakan memutar lembut','Digosok sekuat-kuatnya'], correct:0 },
  { q:'Makanan mana yang paling baik untuk gigi?', opts:['Buah & sayur','Permen & coklat'], correct:0 },
  { q:'Setelah makan makanan manis, sebaiknya kita...', opts:['Sikat gigi setelahnya','Dibiarkan saja'], correct:0 },
];
let quizIndex = 0, quizCorrect = 0;

/* ---------------- Room carousel ---------------- */
const track = document.getElementById('roomTrack');

function scrollRoom(dir){
  const w = track.clientWidth;
  track.scrollBy({ left: dir * w, behavior: 'smooth' });
}

function scrollToRoom(name){
  const w = track.clientWidth;
  track.scrollTo({ left: roomIndex[name] * w, behavior: 'smooth' });
}

track.addEventListener('scroll', ()=>{
  clearTimeout(track._t);
  track._t = setTimeout(()=>{
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    document.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active', i===idx));
  }, 80);
});

/* ---------------- HUD ---------------- */
function updateHUD(){
  document.getElementById('dayPill').textContent = 'Hari ' + game.day;
  const periodMap = { sarapan:'🌞 Pagi', sikat_pagi:'🌞 Pagi', camilan:'⛅ Siang', sikat_malam:'🌙 Malam', tidur:'🌙 Malam' };
  document.getElementById('periodPill').textContent = periodMap[game.stage];
  const skyClass = game.stage==='sarapan'||game.stage==='sikat_pagi' ? 'pagi' : (game.stage==='camilan' ? 'siang' : 'malam');
  document.querySelectorAll('[data-sky]').forEach(s=>{ s.className='sky '+skyClass; });

  const g = Math.max(0, Math.min(100, game.gigi));
  document.getElementById('gigiFill').style.width = g + '%';
  const tooth = document.getElementById('gigiTooth');
  const fill = document.getElementById('gigiFill');
  if(g >= 70){ tooth.style.background='#ffffff'; fill.style.background='linear-gradient(90deg,var(--teal, #37D6B8),#37D6B8)'; }
  else if(g >= 40){ tooth.style.background='#F3E3A8'; fill.style.background='linear-gradient(90deg,var(--sun, #F3E3A8),#F3E3A8)'; }
  else{ tooth.style.background='#C9A46B'; fill.style.background='linear-gradient(90deg,var(--bad, #c9503a),#c9503a)'; }
}
function adjustGigi(n){ game.gigi = Math.max(0, Math.min(100, game.gigi+n)); updateHUD(); }

/* ---------------- Mission state ---------------- */
function initMission(){ applyStage(); scrollToRoom(stageRoom[game.stage]); }

function applyStage(){
  game.missionDone = false;
  updateHUD();
  document.getElementById('objBed').classList.remove('pulse');
  document.getElementById('objTable').classList.remove('pulse');
  document.getElementById('objBrush').classList.remove('pulse');
  document.querySelectorAll('.dot').forEach(d=>d.classList.remove('pending'));

  const targetRoom = stageRoom[game.stage];
  if(targetRoom==='kamar') document.getElementById('objBed').classList.add('pulse');
  if(targetRoom==='dapur') document.getElementById('objTable').classList.add('pulse');
  if(targetRoom==='mandi') document.getElementById('objBrush').classList.add('pulse');
  document.querySelector('.dot[data-i="'+roomIndex[targetRoom]+'"]').classList.add('pending');

  document.getElementById('kamarBubble').textContent = targetRoom==='kamar' ? 'Waktunya tidur! 🌙' : 'Belum ngantuk~';
  document.getElementById('dapurBubble').textContent = targetRoom==='dapur' ? (game.stage==='sarapan' ? 'Aku lapar, sarapan yuk! 🍳' : 'Aku mau camilan~ 😋') : 'Belum lapar~';
  document.getElementById('mandiBubble').textContent = targetRoom==='mandi' ? 'Waktunya sikat gigi! 🪥' : 'Gigi masih bersih~';

  /* AUDIO: baca misi yang lagi aktif */
  const activeBubbleText = { kamar:'Waktunya tidur!', dapur:(game.stage==='sarapan'?'Aku lapar, sarapan yuk!':'Aku mau camilan!'), mandi:'Waktunya sikat gigi!' }[targetRoom];
  speak(activeBubbleText);

  renderFoodTable();
}

function renderFoodTable(){
  const table = document.getElementById('foodTable');
  table.innerHTML = '';
  const active = (game.stage==='sarapan' || game.stage==='camilan');
  const foods = game.stage==='camilan' ? snackFoods : breakfastFoods;
  foods.forEach(f=>{
    const el = document.createElement('div');
    el.className = 'food-slot' + (active ? '' : ' dim');
    el.innerHTML = f.emoji + '<span class="food-label">'+f.label+'</span>';
    if(active) el.onclick = ()=>chooseFood(f);
    table.appendChild(el);
  });
}

function chooseFood(f){
  game.missionDone = true;
  if(!f.good){ adjustGigi(-10); playError(); } else { playSuccess(); }
  const bubble = document.getElementById('dapurBubble');
  bubble.innerHTML = f.good
    ? '✅ Enak & sehat untuk gigi!'
    : '⚠️ Manis begini bisa bikin gigi berlubang kalau tak disikat.';
  /* AUDIO: baca feedback pilihan makanan */
  speak(f.good ? 'Enak dan sehat untuk gigi!' : 'Manis begini bisa bikin gigi berlubang kalau tidak disikat.');
  document.getElementById('objTable').classList.remove('pulse');
  document.querySelector('.dot[data-i="1"]').classList.remove('pending');
  setTimeout(()=>{ advanceStage(); }, 900);
}

function tapBrush(){
  if(stageRoom[game.stage] !== 'mandi') return;
  openBrush();
}
function tapBed(){
  if(stageRoom[game.stage] !== 'kamar') return;
  document.getElementById('modalQuiz').classList.add('active');
  setupQuiz();
}

/* ---------------- Brushing modal ---------------- */
function openBrush(){
  const modal = document.getElementById('modalBrush');
  modal.classList.add('active');
  /* AUDIO: baca instruksi sikat gigi */
  speak('Gerakkan sikat memutar lembut ke seluruh gigi.');
  const mouth = document.getElementById('brushMouth');
  mouth.innerHTML = '';
  document.getElementById('brushFill').style.width = '0%';
  const btn = document.getElementById('brushDoneBtn');
  btn.disabled = true; btn.textContent = 'Selesai';

  const teeth = [];
  for(let i=0;i<4;i++){
    const wrap = document.createElement('div'); wrap.className='tooth-wrap';
    const base = document.createElement('canvas'); base.width=48; base.height=70;
    const plaque = document.createElement('canvas'); plaque.width=48; plaque.height=70;
    wrap.appendChild(base); wrap.appendChild(plaque); mouth.appendChild(wrap);
    drawToothBase(base.getContext('2d'),48,70);
    drawPlaque(plaque.getContext('2d'),48,70);
    const t = { wrap, strokes:0, required:11, clean:false };
    teeth.push(t);

    let brushing=false;
    const erase=(cx,cy)=>{
      const rect = plaque.getBoundingClientRect();
      const x=cx-rect.left, y=cy-rect.top;
      if(x<-10||y<-10||x>rect.width+10||y>rect.height+10) return;
      const ctx = plaque.getContext('2d');
      ctx.save(); ctx.globalCompositeOperation='destination-out';
      ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.fill(); ctx.restore();
      if(!t.clean){
        t.strokes++;
        if(t.strokes>=t.required){ t.clean=true; ctx.clearRect(0,0,48,70); wrap.classList.add('done'); spawnSparkle(wrap); }
        const cleanCount = teeth.filter(x=>x.clean).length;
        const pct = Math.round((cleanCount/teeth.length)*100);
        document.getElementById('brushFill').style.width = pct+'%';
        if(pct>=100){ btn.disabled=false; btn.textContent='Gigi Bersih! Selesai ✓'; }
      }
    };
    const start=(e)=>{brushing=true; move(e); e.preventDefault();};
    const move=(e)=>{ if(!brushing) return; const pt=e.touches?e.touches[0]:e; erase(pt.clientX,pt.clientY); };
    const end=()=>{brushing=false;};
    plaque.addEventListener('mousedown',start);
    plaque.addEventListener('mousemove',move);
    window.addEventListener('mouseup',end);
    plaque.addEventListener('touchstart',start,{passive:false});
    plaque.addEventListener('touchmove',move,{passive:false});
    plaque.addEventListener('touchend',end);
  }
}
function drawToothBase(ctx,w,h){ ctx.clearRect(0,0,w,h); ctx.fillStyle='#fff'; toothPath(ctx,w,h); ctx.fill(); ctx.strokeStyle='#EADFC8'; ctx.lineWidth=2; toothPath(ctx,w,h); ctx.stroke(); }
function toothPath(ctx,w,h){
  ctx.beginPath();
  ctx.moveTo(2,h*0.35);
  ctx.quadraticCurveTo(2,2,w*0.5,2);
  ctx.quadraticCurveTo(w-2,2,w-2,h*0.35);
  ctx.quadraticCurveTo(w-2,h*0.8,w*0.72,h-4);
  ctx.quadraticCurveTo(w*0.5,h*0.7,w*0.28,h-4);
  ctx.quadraticCurveTo(2,h*0.8,2,h*0.35);
  ctx.closePath();
}
function drawPlaque(ctx,w,h){
  ctx.clearRect(0,0,w,h); ctx.save(); toothPath(ctx,w,h); ctx.clip();
  ctx.fillStyle='rgba(178,163,74,0.9)';
  for(let i=0;i<6;i++){ const bx=Math.random()*w, by=Math.random()*h*0.85+h*0.05, br=8+Math.random()*9;
    ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}
function spawnSparkle(wrap){
  /* AUDIO: klik pelan tiap satu gigi bersih */
  playClick();
  const s=document.createElement('div'); s.className='sparkle'; s.textContent='✨'; s.style.left='10px'; s.style.top='-6px'; wrap.appendChild(s); setTimeout(()=>s.remove(),900);
}

function closeBrush(){
  document.getElementById('modalBrush').classList.remove('active');
  game.missionDone = true;
  adjustGigi(15);
  /* AUDIO: fanfare + narasi pas semua gigi bersih */
  playCelebrate();
  speak('Gigi bersih, kerja bagus!');
  document.getElementById('objBrush').classList.remove('pulse');
  document.querySelector('.dot[data-i="2"]').classList.remove('pending');
  advanceStage();
}

/* ---------------- Lewati misi ---------------- */
function skipCurrentStage(){
  const anyModalOpen = document.querySelector('.modal-backdrop.active');
  if(anyModalOpen) return;

  if(game.stage === 'tidur'){
    document.getElementById('quizScoreLabel').textContent = '0/5 (kuis dilewati)';
    document.getElementById('gigiScoreLabel').textContent = Math.round(game.gigi)+'%';
    document.getElementById('dayDoneLabel').textContent = 'Hari '+game.day+' Selesai! 🌟';
    document.getElementById('modalDay').classList.add('active');
    return;
  }

  const wasSkipped = !game.missionDone;
  if(wasSkipped){
    const penalty = stagePenalty[game.stage];
    if(penalty) adjustGigi(penalty);
    /* AUDIO: nada peringatan + narasi konsekuensi */
    playError();
    const msg = skipMsg[game.stage];
    if(msg){ document.getElementById(msg.id).textContent = msg.text; speak(msg.text); }
  }
  setTimeout(()=>{ advanceStage(); }, wasSkipped ? 800 : 0);
}

/* ---------------- Stage progression ---------------- */
function advanceStage(){
  const i = stageOrder.indexOf(game.stage);
  if(i < stageOrder.length-1){
    game.stage = stageOrder[i+1];
    applyStage();
    scrollToRoom(stageRoom[game.stage]);
  }
}

/* ---------------- Quiz ---------------- */
function setupQuiz(){ quizIndex=0; quizCorrect=0; renderQuiz(); }
function renderQuiz(){
  const item = quizBank[quizIndex];
  document.getElementById('quizProgress').textContent = 'Soal '+(quizIndex+1)+' dari '+quizBank.length;
  document.getElementById('quizQ').textContent = item.q;
  /* AUDIO: bacakan soal kuis */
  speak(item.q);
  const wrap = document.getElementById('quizOpts'); wrap.innerHTML='';
  document.getElementById('quizNextBtn').style.display='none';
  item.opts.forEach((opt,i)=>{
    const b = document.createElement('button'); b.className='quiz-opt'; b.textContent=opt;
    b.onclick = ()=>{
      wrap.querySelectorAll('.quiz-opt').forEach(o=>o.disabled=true);
      if(i===item.correct){
        b.classList.add('correct'); b.textContent+='  ✓'; quizCorrect++;
        playSuccess(); speak('Benar!');
      } else {
        b.classList.add('wrong'); b.textContent+='  ✗'; wrap.children[item.correct].classList.add('correct');
        playError(); speak('Belum tepat.');
      }
      document.getElementById('quizNextBtn').style.display='block';
      document.getElementById('quizNextBtn').textContent = (quizIndex<quizBank.length-1) ? 'Soal Berikutnya' : 'Lihat Ringkasan';
    };
    wrap.appendChild(b);
  });
}
function nextQuizQuestion(){
  quizIndex++;
  if(quizIndex>=quizBank.length){
    document.getElementById('modalQuiz').classList.remove('active');
    document.getElementById('quizScoreLabel').textContent = quizCorrect+'/'+quizBank.length;
    document.getElementById('gigiScoreLabel').textContent = Math.round(game.gigi)+'%';
    document.getElementById('dayDoneLabel').textContent = 'Hari '+game.day+' Selesai! 🌟';
    document.getElementById('modalDay').classList.add('active');
  } else { renderQuiz(); }
}

/* ---------------- Day loop ---------------- */
function nextDay(){
  document.getElementById('modalDay').classList.remove('active');
  game.day++;
  game.stage = 'sarapan';
  document.getElementById('objBed').classList.remove('pulse');
  applyStage();
  scrollToRoom('dapur');
}

updateHUD();