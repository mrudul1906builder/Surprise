/* Romantic cinematic experience — vanilla JS */
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Canvas sizing helper ---------- */
  function fitCanvas(c){
    const r = c.getBoundingClientRect();
    c.width = Math.floor(r.width * DPR);
    c.height = Math.floor(r.height * DPR);
    return c.getContext('2d');
  }

  /* ---------- Stars (multi-layer twinkle + parallax) ---------- */
  const starsC = $('#stars');
  let starsCtx = fitCanvas(starsC);
  let stars = [];
  function buildStars(){
    stars = [];
    const w = starsC.width, h = starsC.height;
    const count = Math.floor((w*h)/6000); // density
    for(let i=0;i<count;i++){
      const layer = Math.random()<.65?1: Math.random()<.7?2:3;
      stars.push({
        x: Math.random()*w, y: Math.random()*h,
        r: (layer===3?1.6:layer===2?1.1:.7) * (0.6+Math.random()*0.9),
        a: Math.random(), s: 0.002+Math.random()*0.01,
        layer, hue: Math.random()<.15?'rgba(200,220,255,':'rgba(255,240,245,'
      });
    }
  }
  buildStars();

  /* ---------- Shooting stars ---------- */
  const shootC = $('#shooters');
  let shootCtx = fitCanvas(shootC);
  let shooters = [];
  function spawnShooter(big=false){
    const w = shootC.width, h = shootC.height;
    const startX = Math.random()*w*0.6;
    const startY = Math.random()*h*0.4;
    const angle = (Math.PI/6) + Math.random()*0.3;
    const speed = (big?18:11)*DPR;
    shooters.push({
      x:startX,y:startY,
      vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
      life: big?110:80, age:0, len: big?260:180, big
    });
  }
  setInterval(()=>{ if(document.hidden) return; if(Math.random()<.7) spawnShooter(); }, 4200);

  /* ---------- Petals ---------- */
  const petalC = $('#petals');
  let petalCtx = fitCanvas(petalC);
  let petals = [];
  function makePetal(fromTop=false){
    const w = petalC.width, h = petalC.height;
    return {
      x: Math.random()*w,
      y: fromTop? -20 : Math.random()*h,
      vx: (Math.random()-0.5)*0.4*DPR,
      vy: (0.3+Math.random()*0.6)*DPR,
      r: (6+Math.random()*10)*DPR,
      rot: Math.random()*Math.PI*2,
      vr: (Math.random()-0.5)*0.02,
      a: 0.55+Math.random()*0.4,
      glow: Math.random()<.35
    };
  }
  function buildPetals(n){
    petals = [];
    for(let i=0;i<n;i++) petals.push(makePetal(false));
  }
  buildPetals(28);
  let petalIntensity = 1;

  function drawPetal(p){
    petalCtx.save();
    petalCtx.translate(p.x,p.y); petalCtx.rotate(p.rot);
    if(p.glow){
      petalCtx.shadowColor='rgba(255,230,240,.9)'; petalCtx.shadowBlur=18*DPR;
    }
    const g = petalCtx.createRadialGradient(0,0,0,0,0,p.r);
    g.addColorStop(0,`rgba(255,255,255,${p.a})`);
    g.addColorStop(1,'rgba(255,220,235,0)');
    petalCtx.fillStyle=g;
    petalCtx.beginPath();
    petalCtx.ellipse(0,0,p.r,p.r*0.55,0,0,Math.PI*2);
    petalCtx.fill();
    petalCtx.restore();
  }

  /* ---------- Main render loop ---------- */
  let t = 0;
  function tick(){
    t++;
    // stars
    const sw=starsC.width, sh=starsC.height;
    starsCtx.clearRect(0,0,sw,sh);
    for(const st of stars){
      st.a += st.s * (Math.random()<.5?1:-1);
      if(st.a<0.15) st.a=0.15; if(st.a>1) st.a=1;
      // slow parallax
      st.x += (st.layer===3?0.05:st.layer===2?0.03:0.015);
      if(st.x>sw) st.x=0;
      const y = st.y + Math.sin((t+st.x)/400)*0.4*st.layer;
      starsCtx.beginPath();
      starsCtx.fillStyle = st.hue + st.a + ')';
      starsCtx.shadowColor = st.hue + '0.8)';
      starsCtx.shadowBlur = st.layer*4;
      starsCtx.arc(st.x,y,st.r,0,Math.PI*2);
      starsCtx.fill();
    }

    // petals
    const pw=petalC.width, ph=petalC.height;
    petalCtx.clearRect(0,0,pw,ph);
    for(const p of petals){
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr;
      if(p.y>ph+40 || p.x<-40 || p.x>pw+40){
        Object.assign(p, makePetal(true));
      }
      drawPetal(p);
    }

    // shooters
    const rw=shootC.width, rh=shootC.height;
    shootCtx.clearRect(0,0,rw,rh);
    for(let i=shooters.length-1;i>=0;i--){
      const s=shooters[i]; s.age++; s.x+=s.vx; s.y+=s.vy;
      const grad = shootCtx.createLinearGradient(s.x,s.y, s.x-s.vx/Math.hypot(s.vx,s.vy)*s.len, s.y-s.vy/Math.hypot(s.vx,s.vy)*s.len);
      grad.addColorStop(0, `rgba(255,255,255,${1 - s.age/s.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      shootCtx.strokeStyle=grad; shootCtx.lineWidth=(s.big?3:2)*DPR;
      shootCtx.shadowColor='rgba(255,240,250,.9)'; shootCtx.shadowBlur=(s.big?24:14)*DPR;
      shootCtx.beginPath();
      shootCtx.moveTo(s.x,s.y);
      shootCtx.lineTo(s.x-s.vx/Math.hypot(s.vx,s.vy)*s.len, s.y-s.vy/Math.hypot(s.vx,s.vy)*s.len);
      shootCtx.stroke();
      if(s.age>s.life || s.x>rw+200 || s.y>rh+200) shooters.splice(i,1);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- Resize ---------- */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      starsCtx = fitCanvas(starsC); buildStars();
      shootCtx = fitCanvas(shootC);
      petalCtx = fitCanvas(petalC); buildPetals(28*petalIntensity);
    }, 120);
  });

  /* ---------- Typewriter ---------- */
  function typewrite(el){
    if(el.dataset.typed) return;
    const text = el.textContent;
    el.textContent = '';
    el.dataset.typed = '1';
    const cursor = document.createElement('span'); cursor.className='cursor';
    el.appendChild(cursor);
    let i = 0;
    const step = () => {
      if(i<text.length){
        cursor.insertAdjacentText('beforebegin', text[i++]);
        setTimeout(step, 34 + Math.random()*40);
      } else {
        setTimeout(()=>cursor.remove(), 800);
      }
    };
    step();
  }

  /* ---------- Scene management ---------- */
  const scenes = $$('.scene');
  const order = ['intro', '1','2','3','propose'];
  let current = 0;
  let timer;
  let skipped = false;
  let started = false;

  function showScene(key){
    scenes.forEach(s=>{
      const k = s.id==='intro'?'intro':s.dataset.scene;
      if(k===key){
        s.classList.add('active');
        const h = s.querySelector('.tw'); if(h) typewrite(h);
      } else if(s.classList.contains('active')){
        s.classList.add('leaving');
        s.classList.remove('active');
        setTimeout(()=>s.classList.remove('leaving'), 1300);
      }
    });
  }

  /* Cinematic timeline — hits proposal ~22s in */
  const timeline = [
    { at: 0,     do: () => showScene('1') },
    { at: 7000,  do: () => showScene('2') },
    { at: 14000, do: () => { showScene('3'); } },
    { at: 20500, do: () => { spawnShooter(true); spawnShooter(true); document.body.classList.add('celebrate'); } },
    { at: 22500, do: () => { showScene('propose'); } },
  ];
  let tlStart = 0;
  const tlTimers = [];
  function runTimeline(){
    tlStart = performance.now();
    timeline.forEach(step => {
      tlTimers.push(setTimeout(()=>{ if(!skipped) step.do(); }, step.at));
    });
  }
  function clearTimeline(){ tlTimers.forEach(clearTimeout); tlTimers.length=0; }

  /* ---------- Audio ---------- */
  const audio = $('#audio');
  audio.volume = 0.85;
  const mute = $('#mute');
  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    mute.querySelector('.on').style.display = audio.muted?'none':'';
    mute.querySelector('.off').style.display = audio.muted?'':'none';
  });

  /* ---------- Skip ---------- */
  $('#skip').addEventListener('click', () => {
    if(skipped) return;
    skipped = true; clearTimeline();
    spawnShooter(true);
    document.body.classList.add('celebrate');
    showScene('propose');
  });

  /* ---------- Rose tap → start ---------- */
  const roseTap = $('#roseTap');
  const intro = $('#intro');
  function startExperience(){
    if(started) return; started = true;
    roseTap.classList.add('bloom-out');
    // sparkle burst on tap
    for(let i=0;i<3;i++) spawnShooter(false);
    audio.play().catch(()=>{});
    setTimeout(()=>{
      intro.classList.remove('active');
      intro.classList.add('leaving');
      mute.hidden = false; $('#skip').hidden = false;
      showScene('1');
      typewrite($('.scene[data-scene="1"] .tw'));
      runTimeline();
    }, 900);
  }
  roseTap.addEventListener('click', startExperience);
  roseTap.addEventListener('touchend', e => { e.preventDefault(); startExperience(); }, {passive:false});

  /* ---------- Proposal buttons ---------- */
  const noBtn = $('#no');
  const yesBtn = $('#yes');
  const noMsg = $('#noMsg');
  let dodges = 0;
  noBtn.addEventListener('pointerenter', dodge);
  noBtn.addEventListener('touchstart', dodge, {passive:true});
  noBtn.addEventListener('click', e => {
    if(dodges < 2){ e.preventDefault(); return; }
    noMsg.hidden = false;
  });
  function dodge(e){
    if(dodges >= 2) return;
    dodges++;
    const parent = noBtn.parentElement.getBoundingClientRect();
    const b = noBtn.getBoundingClientRect();
    const maxX = parent.width - b.width - 8;
    const maxY = 140;
    const dx = (Math.random()*2-1) * Math.min(maxX/2, 120);
    const dy = (Math.random()*2-1) * Math.min(maxY, 60) - 20;
    noBtn.style.transform = `translate(${dx}px, ${dy}px) rotate(${(Math.random()*20-10)}deg)`;
    setTimeout(()=>{ noBtn.style.transform=''; }, 900);
  }

  /* YES flow */
  yesBtn.addEventListener('click', () => {
    document.body.classList.add('celebrate');
    // boost petals + confetti
    petalIntensity = 2.4;
    for(let i=0;i<50;i++) petals.push(makePetal(true));
    // sparkle burst
    for(let i=0;i<3;i++) spawnShooter(false);
    showScene('yes1');
    setTimeout(()=>{
      showScene('yes2');
      setTimeout(()=> spawnShooter(true), 1200);
    }, 3000);
  });

  /* Prevent audio pause on visibility change resumption issues */
  document.addEventListener('visibilitychange', () => {
    if(!document.hidden && started && audio.paused) audio.play().catch(()=>{});
  });
})();
