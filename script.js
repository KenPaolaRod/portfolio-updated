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
  maxWidth:       2.2,
  minWidth:       0.15,
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
    const w   = lerp(TC.maxWidth + spdT * 1.2, TC.minWidth, t);

    tctx.beginPath();
    tctx.moveTo(chain[i].x,   chain[i].y);
    tctx.lineTo(chain[i+1].x, chain[i+1].y);
    tctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;
    tctx.lineWidth   = isHover ? w * 1.3 : w;
    tctx.lineCap     = 'round';
    tctx.lineJoin    = 'round';
    tctx.stroke();
  }

  // Crisp dot at cursor tip
  const dotR = isHover ? 3 : 2;
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

/* ── Toolkit ── */
const TK_ICON = {
  html:        '<svg viewBox="0 0 24 24"><polyline points="8 6 3 12 8 18"/><polyline points="16 6 21 12 16 18"/></svg>',
  css:         '<svg viewBox="0 0 24 24"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
  js:          '<svg viewBox="0 0 24 24"><path d="M8 3c-2.5 0-2.5 4-2.5 4s0 3-2.5 3 2.5 0 2.5 3 0 4 2.5 4"/><path d="M16 3c2.5 0 2.5 4 2.5 4s0 3 2.5 3-2.5 0-2.5 3 0 4-2.5 4"/></svg>',
  react:       '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
  git:         '<svg viewBox="0 0 24 24"><circle cx="6" cy="3" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 5v11"/><path d="M18 8a9 9 0 0 1-9 9"/></svg>',
  figma:       '<svg viewBox="0 0 24 24"><path d="M14 3l7 7-11 11H3v-7z"/><path d="M14 10l-3 3"/></svg>',
  canva:       '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.6-3-1.6-2.2 0-4 2-4 4.4 0 2 1.4 3.7 3.4 3.7 1.4 0 2.6-.8 3.2-2"/></svg>',
  wordpress:   '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3.6 9.8L8.5 20"/><path d="M9 6.5l5.5 13.4"/><path d="M16 7.2c1.5 0 1.5 2.3 0 5L13.6 17"/><path d="M3.6 14.2L7 7"/></svg>',
  woocommerce: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M6 11h2l1 3 2-4 2 4 1-3h2"/></svg>',
  elementor:   '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="18"/><rect x="13" y="3" width="8" height="6"/><rect x="13" y="13" width="8" height="8"/></svg>',
  webflow:     '<svg viewBox="0 0 24 24"><polyline points="3 6 6 18 12 8 18 18 21 6"/></svg>',
  beaver:      '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 8h3a3 3 0 0 1 0 6H9z"/><path d="M9 8v8"/><path d="M9 14h3.5a3 3 0 0 1 0 2H9"/></svg>',
  shopify:     '<svg viewBox="0 0 24 24"><path d="M7 7l1-2c.5-1 1.5-1 2-1l3 1 4-1v17l-12-2z"/><path d="M11 11c0-1 1-1.5 2-1.5"/></svg>',
  ghl:         '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 11h4v4"/><path d="M16 8v8"/></svg>',
  mongodb:     '<svg viewBox="0 0 24 24"><path d="M12 3c-3 4-5 8 0 18 5-10 3-14 0-18z"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
  mongoose:    '<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="7" y1="8" x2="11" y2="16"/><line x1="17" y1="8" x2="13" y2="16"/></svg>',
  nosql:       '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg>',
  oracle:      '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
  apis:        '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="12" r="2.5"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><path d="M12 3v5"/><path d="M12 16v5"/></svg>',
  webhooks:    '<svg viewBox="0 0 24 24"><polyline points="13 2 4 13 11 13 10 22 20 11 13 11 14 2"/></svg>',
  dns:         '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>',
  cloudflare:  '<svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1A4 4 0 0 1 19 18z"/></svg>',
  seo:         '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><line x1="14.5" y1="14.5" x2="20" y2="20"/><line x1="7" y1="11" x2="7" y2="13"/><line x1="10" y1="9" x2="10" y2="13"/><line x1="13" y1="7" x2="13" y2="13"/></svg>',
  analytics:   '<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="20" y2="20"/><rect x="6"  y="13" width="3" height="7"/><rect x="11" y="8"  width="3" height="12"/><rect x="16" y="4"  width="3" height="16"/></svg>',
  gtm:         '<svg viewBox="0 0 24 24"><path d="M20 13l-7 7-9-9V4h7z"/><circle cx="9" cy="9" r="1.4" fill="currentColor" stroke="none"/></svg>',
  gads:        '<svg viewBox="0 0 24 24"><path d="M9 3 3 13l3 5 6-10z"/><path d="M15 3l6 10-3 5L12 8z"/><circle cx="7" cy="18" r="2"/></svg>',
  clickup:     '<svg viewBox="0 0 24 24"><polyline points="4 16 12 8 20 16"/><polyline points="4 11 12 3 20 11"/></svg>',
  monday:      '<svg viewBox="0 0 24 24"><line x1="3" y1="7"  x2="14" y2="7"/><line x1="3" y1="12" x2="20" y2="12"/><line x1="3" y1="17" x2="11" y2="17"/></svg>',
  claude:      '<svg viewBox="0 0 24 24"><path d="M12 2l2.1 6.3L20.5 10l-6.4 1.7L12 18l-2.1-6.3L3.5 10l6.4-1.7z"/></svg>',
};

const toolkit = [
  {
    cat: 'Frontend Development',
    tools: [
      { n:'HTML',       k:'html' },
      { n:'CSS',        k:'css' },
      { n:'JavaScript', k:'js' },
      { n:'React.js',   k:'react' },
      { n:'Git',        k:'git' },
    ]
  },
  {
    cat: 'CMS & No-Code',
    tools: [
      { n:'WordPress',      k:'wordpress' },
      { n:'WooCommerce',    k:'woocommerce' },
      { n:'Elementor',      k:'elementor' },
      { n:'Webflow',        k:'webflow' },
      { n:'Beaver Builder', k:'beaver' },
      { n:'Shopify',        k:'shopify' },
      { n:'GHL',            k:'ghl' },
    ]
  },
  {
    cat: 'Design',
    tools: [
      { n:'Figma', k:'figma' },
      { n:'Canva', k:'canva' },
    ]
  },
  {
    cat: 'Backend & Data',
    tools: [
      { n:'MongoDB',     k:'mongodb' },
      { n:'Mongoose',    k:'mongoose' },
      { n:'NoSQL',       k:'nosql' },
      { n:'SQL (Oracle)',k:'oracle' },
      { n:'APIs',        k:'apis' },
      { n:'Webhooks',    k:'webhooks' },
    ]
  },
  {
    cat: 'Infrastructure & SEO',
    tools: [
      { n:'DNS',         k:'dns' },
      { n:'Cloudflare',  k:'cloudflare' },
      { n:'SEO',         k:'seo' },
      { n:'Analytics',   k:'analytics' },
      { n:'Tag Manager', k:'gtm' },
      { n:'Google Ads',  k:'gads' },
    ]
  },
  {
    cat: 'Collaboration & AI',
    tools: [
      { n:'ClickUp',       k:'clickup' },
      { n:'Monday',        k:'monday' },
      { n:'Claude Code',   k:'claude' },
      { n:'Claude Design', k:'claude' },
    ]
  },
];

(function renderToolkit() {
  const grid = document.getElementById('toolkitGrid');
  if (!grid) return;
  const frag = document.createDocumentFragment();
  toolkit.forEach(group => {
    const col = document.createElement('div');
    col.className = 'toolkit-cat';

    const label = document.createElement('div');
    label.className = 'toolkit-cat-label';
    label.textContent = group.cat;
    col.appendChild(label);

    const chips = document.createElement('div');
    chips.className = 'toolkit-chips';
    group.tools.forEach(t => {
      const ico = TK_ICON[t.k] || '';
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span class="chip-ico">${ico}</span>${t.n}`;
      chips.appendChild(chip);
    });
    col.appendChild(chips);
    frag.appendChild(col);
  });
  grid.appendChild(frag);

  document.querySelectorAll('.chip').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-grow'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-grow'));
  });
})();

/* ── Projects ── */
const projects = [
  {
    tag: 'AI & Brand', title: 'Nova AI Vodka',
    desc: 'Editorial marketing site for NOVA — "the first vodka distilled by intelligence" — built in Next.js. Monochrome luxury aesthetic with monospace batch numerals, cinematic product photography, and a live AI Bartender that generates custom cocktail recipes from mood, complexity, and flavor inputs. Batch scanning flow (QR/NFC) unlocks personalized content per bottle.',
    tech: ['Next.js', 'React', 'AI Integration', 'Tailwind CSS', 'Vercel'],
    wide: false, link: 'project.html?id=nova-ai-vodka'
  },
  {
    tag: 'Landing Page', title: 'Muse Mindfulness',
    desc: 'Clean, conversion-focused landing page for Muse — a mindfulness platform built around guided meditation, structured programs, and everyday presence tools. Minimalist design mirrors the brand philosophy: calm, intentional, and distraction-free.',
    tech: ['HTML5', 'CSS3', 'JavaScript', 'GitHub Pages'],
    wide: false, link: 'project.html?id=musa-mindfulness'
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
