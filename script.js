/* ── Cursor Trail ── */
const trailCanvas = document.getElementById('cursorTrail');
const tctx = trailCanvas.getContext('2d', { alpha: true });

let TW, TH;
function resizeTrail() {
  const dpr = window.devicePixelRatio || 1;
  TW = window.innerWidth;
  TH = window.innerHeight;
  trailCanvas.width  = TW * dpr;
  trailCanvas.height = TH * dpr;
  trailCanvas.style.width  = TW + 'px';
  trailCanvas.style.height = TH + 'px';
  tctx.scale(dpr, dpr);
}
resizeTrail();
window.addEventListener('resize', resizeTrail);

// Trail config — gold → lavender, physics-based like Obsidian Assembly
const TC = {
  length:         55,
  colorBase:      [232, 180, 154],   // rose-light
  colorEnd:       [184, 169, 217],   // lavender
  alphaBase:      0.92,
  alphaEnd:       0,
  maxWidth:       4.5,
  minWidth:       0.3,
  damping:        0.62,
  speedInfluence: 0.55,
  speedMax:       520,
  speedSmoothing: 0.18,
};

let curX = -300, curY = -300;
let prevX = -300, prevY = -300;
let lastT = 0, smoothSpd = 0;
let isHover = false;

// Particle chain — each follows the one before it
const chain = Array.from({ length: TC.length }, () => ({ x: -300, y: -300 }));

document.addEventListener('mousemove', e => { curX = e.clientX; curY = e.clientY; });

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpCol(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t | 0,
    c1[1] + (c2[1] - c1[1]) * t | 0,
    c1[2] + (c2[2] - c1[2]) * t | 0,
  ];
}

;(function drawTrail(ts) {
  requestAnimationFrame(drawTrail);

  const dt = Math.min(ts - lastT, 50);
  lastT = ts;

  // Cursor speed
  const dx = curX - prevX, dy = curY - prevY;
  const rawSpd = dt > 0 ? Math.sqrt(dx*dx + dy*dy) / (dt / 1000) : 0;
  smoothSpd = lerp(smoothSpd, Math.min(rawSpd, TC.speedMax), TC.speedSmoothing);
  const spdT = smoothSpd / TC.speedMax;
  prevX = curX; prevY = curY;

  // Update chain — head snaps to cursor, each link follows the previous with damping
  chain[0].x = lerp(chain[0].x, curX, 0.38);
  chain[0].y = lerp(chain[0].y, curY, 0.38);
  for (let i = 1; i < TC.length; i++) {
    const f = Math.pow(TC.damping, i * 0.06) * 0.38;
    chain[i].x = lerp(chain[i].x, chain[i-1].x, Math.max(f, 0.04));
    chain[i].y = lerp(chain[i].y, chain[i-1].y, Math.max(f, 0.04));
  }

  // Draw
  tctx.clearRect(0, 0, TW, TH);

  for (let i = 0; i < TC.length - 1; i++) {
    const t   = i / (TC.length - 1);
    const col = lerpCol(TC.colorBase, TC.colorEnd, t);
    const a   = TC.alphaBase * (1 - t) * (1 - t);           // quadratic fade
    const w   = lerp(TC.maxWidth + spdT * 3, TC.minWidth, t);

    tctx.beginPath();
    tctx.moveTo(chain[i].x,   chain[i].y);
    tctx.lineTo(chain[i+1].x, chain[i+1].y);
    tctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;
    tctx.lineWidth   = isHover ? w * 1.6 : w;
    tctx.lineCap     = 'round';
    tctx.lineJoin    = 'round';
    tctx.stroke();
  }

  // Crisp dot at cursor tip
  const dotR = isHover ? 5 : 3.5;
  tctx.beginPath();
  tctx.arc(chain[0].x, chain[0].y, dotR, 0, Math.PI * 2);
  tctx.fillStyle = `rgba(${TC.colorBase[0]},${TC.colorBase[1]},${TC.colorBase[2]},0.95)`;
  tctx.fill();
})();

// Hover pulse
document.querySelectorAll('a, button, .pill, .stag').forEach(el => {
  el.addEventListener('mouseenter', () => isHover = true);
  el.addEventListener('mouseleave', () => isHover = false);
});

/* ── Particles ── */
const pcv = document.getElementById('pcv');
const ctx = pcv.getContext('2d');
let W, H, pts = [];

function resize() {
  W = pcv.width  = window.innerWidth;
  H = pcv.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

class Pt {
  constructor() { this.reset(); }
  reset() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.sz = Math.random() * 1.4 + 0.4;
    this.vx = (Math.random() - .5) * 0.25;
    this.vy = (Math.random() - .5) * 0.25;
    this.op = Math.random() * 0.35 + 0.08;
    this.c  = Math.random() > .5
      ? `rgba(201,144,106,${this.op})`
      : `rgba(184,169,217,${this.op})`;
  }
  tick() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    ctx.fillStyle = this.c; ctx.fill();
  }
}

for (let i = 0; i < 90; i++) pts.push(new Pt());
;(function loop() {
  ctx.clearRect(0, 0, W, H);
  pts.forEach(p => { p.tick(); p.draw(); });
  requestAnimationFrame(loop);
})();

/* ── Nav scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

/* ── Mobile menu ── */
const mobMenu = document.getElementById('mobMenu');
document.getElementById('ham').addEventListener('click', () => mobMenu.classList.add('open'));
document.getElementById('mobClose').addEventListener('click', closeMob);
function closeMob() { mobMenu.classList.remove('open'); }

/* ── Typewriter ── */
const phrases = [
  'Turning ideas into pixel-perfect realities.',
  'Where code meets couture.',
  'Building experiences that inspire.',
  'Passionate about the details.',
  'Modern interfaces, timeless design.',
];
let pi = 0, ci = 0, del = false;
const twel = document.getElementById('tw');
function type() {
  const cur = phrases[pi];
  if (del) {
    twel.textContent = cur.slice(0, --ci);
  } else {
    twel.textContent = cur.slice(0, ++ci);
  }
  if (!del && ci === cur.length) { setTimeout(() => { del = true; }, 2600); }
  else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
  setTimeout(type, del ? 38 : 62);
}
setTimeout(type, 2200);

/* ── Scroll Reveal ── */
const revEls = document.querySelectorAll('.reveal');
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.1, rootMargin: '0px 0px -55px 0px' });
revEls.forEach(el => revObs.observe(el));

/* ── Skills Infinite Slider ── */
const sliderRows = [
  {
    id: 'srow1', dir: 'fwd',
    items: [
      { n:'HTML',              ico:'◈', f:true  },
      { n:'CSS',               ico:'◇', f:true  },
      { n:'JavaScript',        ico:'⚡', f:true  },
      { n:'GSAP',              ico:'✦', f:true  },
      { n:'React.js',          ico:'⚛', f:true  },
      { n:'Git',               ico:'◆', f:false },
      { n:'Figma',             ico:'✏', f:false },
    ]
  },
  {
    id: 'srow2', dir: 'rev',
    items: [
      { n:'WordPress',         ico:'◈', f:true  },
      { n:'WooCommerce',       ico:'◎', f:false },
      { n:'Elementor',         ico:'✦', f:false },
      { n:'Webflow',           ico:'▲', f:false },
      { n:'SEO Optimization',  ico:'⟡', f:false },
    ]
  },
  {
    id: 'srow3', dir: 'fwd',
    items: [
      { n:'MongoDB',           ico:'◈', f:false },
      { n:'Mongoose',          ico:'◎', f:false },
      { n:'NoSQL',             ico:'◆', f:false },
      { n:'SQL — Oracle',      ico:'▲', f:false },
    ]
  },
];

sliderRows.forEach(row => {
  const container = document.getElementById(row.id);
  const track = document.createElement('div');
  track.className = `slider-track track-${row.dir}`;

  // Render twice for seamless loop
  for (let pass = 0; pass < 2; pass++) {
    row.items.forEach(s => {
      const tag = document.createElement('div');
      tag.className = 'stag' + (s.f ? ' feat' : '');
      tag.innerHTML = `<span class="ico">${s.ico}</span>${s.n}`;
      track.appendChild(tag);
      const sep = document.createElement('div');
      sep.className = 'ssep'; sep.textContent = '✦';
      track.appendChild(sep);
    });
  }

  container.appendChild(track);

  // Pause on hover
  container.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  container.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
});

// Vary speeds so rows feel independent
document.querySelector('#srow1 .slider-track').style.animationDuration = '38s';
document.querySelector('#srow2 .slider-track').style.animationDuration = '29s';
document.querySelector('#srow3 .slider-track').style.animationDuration = '44s';

// Cursor grow on stags
document.querySelectorAll('.stag').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-grow'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-grow'));
});

/* ── Projects ── */
const projects = [
  {
    tag: 'Creative Dev', title: 'Aurum Hotel',
    desc: 'Agency-grade luxury hotel experience built in vanilla HTML, CSS & JS — no frameworks. Advanced GSAP: ScrollTrigger with pin + scrub synced to scroll velocity, chained timelines, and multi-property fromTo. Lenis smooth scroll wired directly into GSAP\'s RAF loop. Clip-path panel reveals, word-flip animations with CSS overflow masking, and cinematic CSS grain via SVG feTurbulence. The kind of UI you usually see from studios charging $50k+.',
    tech: ['GSAP / ScrollTrigger', 'Lenis Smooth Scroll', 'Vanilla JS', 'CSS3', 'SVG feTurbulence'],
    wide: true, link: 'project.html?id=aurum-hotel'
  },
  {
    tag: 'E-Commerce', title: 'Saredi Jewelry',
    desc: 'Full e-commerce build for a Latin-inspired jewelry brand — Elementor + WooCommerce, custom CSS animations, structured product catalog, and Facebook Pixel integration.',
    tech: ['WordPress', 'WooCommerce', 'Elementor', 'Custom CSS'],
    wide: false, link: 'project.html?id=saredi-jewelry'
  },
  {
    tag: 'Landing Page', title: 'Grocery Delivery',
    desc: 'Custom sales landing page for a grocery delivery service — pure HTML & CSS, no frameworks. Logo design, color palette, and full brand identity created from scratch.',
    tech: ['HTML5', 'CSS3', 'Flexbox / Grid', 'Logo Design'],
    wide: false, link: 'project.html?id=grocery-landing'
  },
  {
    tag: 'Lead Generation', title: 'Medellín Real Estate',
    desc: 'Bilingual (EN/ES) lead generation website for a Colombian real estate agency — HTML, CSS, JS & PHP, no CMS. JSON-based language switching and Google Ads optimized.',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'JSON i18n'],
    wide: false, link: 'project.html?id=medellin-real-estate'
  },
  {
    tag: 'Personal Project', title: 'To-Do App',
    desc: 'Vanilla JavaScript CRUD app with localStorage persistence — create, edit, and delete tasks that survive browser refreshes. Built to sharpen core JS skills.',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'localStorage'],
    wide: false, link: 'project.html?id=crud-todo'
  },
  {
    tag: 'API Integration', title: 'Javken Dashboard',
    desc: 'Live stock market dashboard powered by a REST API — async JS, real-time data rendering, and interactive Canvas charts that load on ticker click.',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'REST API'],
    wide: false, link: 'project.html?id=javken-dashboard'
  },
];
const pgrid = document.getElementById('pgrid');
projects.forEach((p, i) => {
  const c = document.createElement('div');
  c.className = 'pcard reveal' + (p.wide ? ' wide' : '');
  c.style.transitionDelay = (i * 0.09) + 's';
  c.innerHTML = `
    <span class="ptag">${p.tag}</span>
    <h3 class="ptitle">${p.title}</h3>
    <p class="pdesc">${p.desc}</p>
    <div class="ptech">${p.tech.map(t => `<span>${t}</span>`).join('')}</div>
    <a href="${p.link}" class="plink"${p.link.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>View Project</a>
  `;
  pgrid.appendChild(c);
});
document.querySelectorAll('.pcard').forEach(el => revObs.observe(el));

/* ── 3-D Tilt on cards ── */
document.addEventListener('mousemove', e => {
  document.querySelectorAll('.pcard, .glass-card').forEach(card => {
    const r = card.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom) {
      const rx_ =  ((e.clientY - r.top  - r.height/2) / (r.height/2)) * -7;
      const ry_ =  ((e.clientX - r.left - r.width /2) / (r.width /2)) *  7;
      card.style.transform = `perspective(900px) rotateX(${rx_}deg) rotateY(${ry_}deg) translateZ(6px)`;
    } else {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)';
    }
  });
});

/* ── Contact form ── */
document.getElementById('cfrm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('fsubtxt');
  const form = e.target;

  // Basic validation
  const name    = form.name.value.trim();
  const email   = form.email.value.trim();
  const message = form.message.value.trim();
  if (!name || !email || !message) {
    btn.textContent = 'Fill in all fields ✦';
    setTimeout(() => { btn.textContent = 'Send Message ✦'; }, 2400);
    return;
  }

  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch('https://formspree.io/f/kenpaorin@gmail.com', {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      btn.textContent = 'Message Sent ✦';
      form.reset();
    } else {
      btn.textContent = 'Something went wrong — try again';
    }
  } catch {
    btn.textContent = 'Connection error — try again';
  }

  btn.disabled = false;
  setTimeout(() => { btn.textContent = 'Send Message ✦'; }, 3500);
});
