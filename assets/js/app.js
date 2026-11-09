/* 游戏机风格个人网站 —— 无需构建，纯静态。
 * 内容都在 content/ 目录里，改那里就行，一般不需要动这个文件。 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SECTIONS = [
    { id: 'works', title: '作品', en: 'WORKS', desc: '做过的项目与作品' },
    { id: 'blog', title: '博客', en: 'BLOG', desc: '文章、笔记与想法' },
    { id: 'about', title: '关于', en: 'ABOUT', desc: '我是谁，在做什么' },
    { id: 'links', title: '链接', en: 'LINKS', desc: '在别处找到我' },
  ];

  const home = $('#home'), screen = $('#screen'), view = $('#view');
  const rail = $('#rail'), info = $('#info'), expander = $('#expander');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 隐私模式下忽略 */ } },
  };

  /* ---------- 数据 ---------- */
  const cache = new Map();
  function load(path, type = 'json') {
    if (!cache.has(path)) {
      cache.set(path, fetch(path).then((r) => {
        if (!r.ok) throw new Error(`${path} 加载失败 (${r.status})`);
        return type === 'json' ? r.json() : r.text();
      }));
    }
    return cache.get(path);
  }
  const data = {
    site: () => load('content/site.json'),
    works: () => load('content/works.json'),
    posts: () => load('content/posts/index.json')
      .then((list) => [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)))),
  };
  const md = (text) => `<article class="md">${window.marked.parse(text)}</article>`;
  const hue = (s) => ([...String(s)].reduce((h, c) => (h * 31 + c.codePointAt(0)) % 9973, 7) * 137) % 360;
  const tags = (list) => (list || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const cover = (w) => `<div class="cover" style="--h:${hue(w.id)}">${
    w.cover ? `<img src="${esc(w.cover)}" alt="" loading="lazy">` : esc([...w.title][0] || '')}</div>`;

  /* ---------- 各页面 ---------- */
  const pages = {
    async works([id]) {
      const works = await data.works();
      if (!id) {
        return {
          title: '作品',
          html: `<h1 class="page-title">作品</h1><p class="page-sub">共 ${works.length} 件</p>` +
            (works.length ? `<div class="grid">${works.map((w) => `
              <a class="card f" href="#/works/${encodeURIComponent(w.id)}">
                ${cover(w)}
                <div class="card-body">
                  <h2 class="card-title">${esc(w.title)}</h2>
                  <p class="card-sum">${esc(w.summary)}</p>
                  <div class="card-foot"><span class="year">${esc(w.year)}</span>${tags(w.tags)}</div>
                </div>
              </a>`).join('')}</div>` : '<p class="empty">还没有作品。</p>'),
        };
      }
      const w = works.find((x) => x.id === id);
      if (!w) return notFound();
      const body = w.content ? md(await load(`content/${w.content}`, 'text')) : '';
      const links = (w.links || []).map((l, i) =>
        `<a class="btn f${i ? '' : ' primary'}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('');
      return {
        title: w.title,
        html: `<div class="hero-cover">${cover(w)}</div>
          <div><h1 class="page-title">${esc(w.title)}</h1>
          <p class="meta"><time>${esc(w.year)}</time>${tags(w.tags)}</p>
          <p class="page-sub">${esc(w.summary)}</p>
          ${links ? `<div class="actions">${links}</div>` : ''}</div>${body}`,
      };
    },

    async blog([slug]) {
      const posts = await data.posts();
      if (!slug) {
        return {
          title: '博客',
          html: `<h1 class="page-title">博客</h1><p class="page-sub">共 ${posts.length} 篇</p>` +
            (posts.length ? `<div class="posts">${posts.map((p) => `
              <a class="post-item f" href="#/blog/${encodeURIComponent(p.slug)}">
                <time>${esc(p.date)}</time>
                <div><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p><div class="tags">${tags(p.tags)}</div></div>
              </a>`).join('')}</div>` : '<p class="empty">还没有文章。</p>'),
        };
      }
      const i = posts.findIndex((p) => p.slug === slug);
      if (i < 0) return notFound();
      const p = posts[i], newer = posts[i - 1], older = posts[i + 1];
      const text = await load(`content/posts/${p.slug}.md`, 'text');
      const link = (q, cls, label) => q
        ? `<a class="f ${cls}" href="#/blog/${encodeURIComponent(q.slug)}"><small>${label}</small>${esc(q.title)}</a>` : '';
      return {
        title: p.title,
        html: `<div><h1 class="page-title">${esc(p.title)}</h1>
          <p class="meta"><time>${esc(p.date)}</time>${tags(p.tags)}</p></div>
          ${md(text)}
          <nav class="pager">${link(older, 'prev', '← 上一篇')}${link(newer, 'next', '下一篇 →')}</nav>`,
      };
    },

    async about() {
      return { title: '关于', html: md(await load('content/about.md', 'text')) };
    },

    async links() {
      const site = await data.site();
      return {
        title: '链接',
        html: `<h1 class="page-title">链接</h1><p class="page-sub">在别处找到我</p>
          <div class="linklist">${(site.links || []).map((l) => `
            <a class="f" href="${esc(l.url)}" target="_blank" rel="noopener">
              <span>${esc(l.label)}</span><small>${esc(l.note || '')} ↗</small></a>`).join('')}</div>`,
      };
    },
  };
  const notFound = () => ({
    title: '找不到',
    html: '<h1 class="page-title">404</h1><p class="page-sub">这里什么都没有，按返回键回去吧。</p>',
  });

  /* ---------- 主界面 ---------- */
  let cur = 0;
  let siteName = '我的主页';

  function buildRail() {
    rail.innerHTML = SECTIONS.map((s, i) => `
      <a class="tile f" data-sec="${s.id}" data-i="${i}" href="#/${s.id}">
        <span class="tile-no">${String(i + 1).padStart(2, '0')}</span>
        <span><span class="tile-en">${s.en}</span><br>
          <span class="tile-title">${s.title}</span>
          <span class="tile-desc">${s.desc}</span></span>
      </a>`).join('');
    $$('.tile', rail).forEach((t) => {
      const pick = () => setCur(+t.dataset.i);
      t.addEventListener('focus', pick);
      t.addEventListener('mouseenter', pick);
    });
  }

  let infoToken = 0;
  async function setCur(i) {
    const changed = i !== cur || !info.firstChild;
    cur = i;
    const s = SECTIONS[i];
    $$('.tile', rail).forEach((t, k) => t.classList.toggle('cur', k === i));
    home.dataset.sec = s.id;
    if (!changed) return;
    const token = ++infoToken;
    let count = '', list = '';
    try {
      if (s.id === 'works') {
        const w = await data.works();
        count = `${w.length} 件`;
        list = w.slice(0, 3).map((x) => `<li><a class="f" href="#/works/${encodeURIComponent(x.id)}">
          <span>${esc(x.title)}</span><small>${esc(x.year)}</small></a></li>`).join('');
      } else if (s.id === 'blog') {
        const p = await data.posts();
        count = `${p.length} 篇`;
        list = p.slice(0, 3).map((x) => `<li><a class="f" href="#/blog/${encodeURIComponent(x.slug)}">
          <span>${esc(x.title)}</span><time>${esc(x.date)}</time></a></li>`).join('');
      } else if (s.id === 'links') {
        const site = await data.site();
        count = `${(site.links || []).length} 个`;
      }
    } catch (e) { console.error(e); }
    if (token !== infoToken) return;
    info.innerHTML = `
      <div class="info-head"><h2 class="info-title">${s.title}</h2><span class="info-count">${count}</span></div>
      <p class="info-desc">${s.desc}</p>
      ${list ? `<ul class="info-list">${list}</ul>` : ''}`;
  }

  /* ---------- 路由与展开动画 ---------- */
  const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let prev = null; // 上一个路由；null 表示首次加载

  function tileRect(sec) {
    const t = $(`.tile[data-sec="${sec}"]`, rail);
    return t ? t.getBoundingClientRect() : null;
  }
  function rectTransform(r) {
    return `translate(${r.left}px, ${r.top}px) scale(${r.width / innerWidth}, ${r.height / innerHeight})`;
  }
  function play(keyframes, duration) {
    if (reduced) return Promise.resolve();
    return expander.animate(keyframes, { duration, easing: 'cubic-bezier(.3,.7,.1,1)', fill: 'both' })
      .finished.catch(() => {});
  }
  const clearExpander = () => expander.getAnimations().forEach((a) => a.cancel());

  let routeToken = 0;
  async function onRoute() {
    const route = parse();
    const [sec, ...rest] = route;
    const token = ++routeToken;
    const from = prev;
    prev = route;

    if (!sec) { // 回到主界面：内容页收回到对应卡带里
      document.title = siteName;
      const wasOpen = !screen.hidden;
      const backSec = from && from[0];
      if (wasOpen && backSec) expander.dataset.sec = backSec;
      screen.hidden = true;
      home.inert = false;
      const i = Math.max(0, SECTIONS.findIndex((s) => s.id === backSec));
      setCur(backSec ? i : cur);
      $$('.tile', rail)[cur]?.focus({ preventScroll: true });
      const r = wasOpen && backSec && tileRect(backSec);
      if (r) {
        await play([
          { transform: 'none', opacity: 1 },
          { transform: rectTransform(r), opacity: 1, offset: .8 },
          { transform: rectTransform(r), opacity: 0 },
        ], 420);
        if (token === routeToken) clearExpander();
      }
      return;
    }

    const page = pages[sec];
    const meta = SECTIONS.find((s) => s.id === sec);
    const building = (page ? page(rest) : Promise.resolve(notFound()))
      .catch((e) => ({ title: '出错了', html: `<h1 class="page-title">出错了</h1><p class="page-sub">${esc(e.message)}</p>` }));

    // 从主界面进入：卡带放大铺满屏幕
    const opening = screen.hidden;
    const r = opening && from && meta && tileRect(sec);
    expander.dataset.sec = screen.dataset.sec = meta ? sec : 'works';
    if (r) {
      await play([{ transform: rectTransform(r), opacity: 1 }, { transform: 'none', opacity: 1 }], 400);
    }
    const result = await building;
    if (token !== routeToken) return;

    $('#screen-title').textContent = result.title;
    $('#screen-en').textContent = meta ? meta.en : '';
    $('#back').href = rest.length && meta ? `#/${sec}` : '#/';
    document.title = `${result.title} · ${siteName}`;
    view.innerHTML = result.html;
    screen.hidden = false;
    home.inert = true;
    screen.scrollTop = 0;
    $('#back').focus({ preventScroll: true });
    if (r) {
      await play([{ opacity: 1 }, { opacity: 0 }], 260);
      if (token === routeToken) clearExpander();
    }
  }

  /* ---------- 方向键 / 手柄导航 ---------- */
  const layer = () => (screen.hidden ? home : screen);
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

  function move(dir) {
    const items = $$('.f', layer()).filter(visible);
    const active = document.activeElement;
    if (!items.includes(active)) {
      (screen.hidden ? $$('.tile', rail)[cur] : items[0])?.focus();
      return true;
    }
    const a = active.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const horizontal = dir === 'left' || dir === 'right';
    const sign = dir === 'left' || dir === 'up' ? -1 : 1;
    let best = null, bestScore = Infinity;
    for (const el of items) {
      if (el === active) continue;
      const b = el.getBoundingClientRect();
      const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay;
      const main = (horizontal ? dx : dy) * sign, cross = Math.abs(horizontal ? dy : dx);
      if (main < 8) continue;
      // 完全在屏幕外的目标先不跳过去，让页面自然滚动（长文章阅读时很重要）
      if (b.bottom < 0 || b.top > innerHeight) continue;
      const score = main + cross * 2.5;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (!best) return false;
    best.focus();
    best.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    blip(520);
    return true;
  }

  function goBack() {
    const route = parse();
    if (!route.length) return;
    blip(300);
    location.hash = route.length > 1 ? `#/${route[0]}` : '#/';
  }

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!bootDone) { endBoot(); return; }
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
    if (dir) { if (move(dir)) e.preventDefault(); return; }
    if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); goBack(); }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('a.f, button.f')) blip(760); });

  // 手柄：十字键/左摇杆移动，A 确认，B 返回
  let padHeld = null, padAt = 0, padRepeat = false, padLoop = false;
  function pollPad(t) {
    const gp = [...(navigator.getGamepads?.() || [])].find(Boolean);
    if (!gp) { padLoop = false; return; }
    const b = (i) => gp.buttons[i]?.pressed;
    const [x = 0, y = 0] = gp.axes;
    const act = b(14) || x < -.6 ? 'left' : b(15) || x > .6 ? 'right'
      : b(12) || y < -.6 ? 'up' : b(13) || y > .6 ? 'down'
      : b(0) ? 'ok' : b(1) ? 'back' : null;
    if (!act) padHeld = null;
    else if (act !== padHeld || (act.length > 2 && act !== 'back' && t - padAt > (padRepeat ? 130 : 380))) {
      padRepeat = act === padHeld; padHeld = act; padAt = t;
      if (!bootDone) endBoot();
      else if (act === 'ok') document.activeElement?.click?.();
      else if (act === 'back') goBack();
      else if (!move(act) && (act === 'up' || act === 'down')) layer().scrollBy({ top: act === 'up' ? -120 : 120 });
    }
    requestAnimationFrame(pollPad);
  }
  addEventListener('gamepadconnected', () => { if (!padLoop) { padLoop = true; requestAnimationFrame(pollPad); } });

  /* ---------- 音效（默认关闭） ---------- */
  let soundOn = store.get('sound') === '1', audio = null;
  function blip(freq) {
    if (!soundOn) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(.04, t); g.gain.exponentialRampToValueAtTime(.0001, t + .08);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + .09);
    } catch { /* 没有音频设备时忽略 */ }
  }
  const btnSound = $('#btn-sound'), btnTheme = $('#btn-theme');
  function paintToggles() {
    btnSound.textContent = soundOn ? '音效 开' : '音效 关';
    btnSound.setAttribute('aria-pressed', soundOn);
    btnTheme.textContent = document.documentElement.dataset.theme === 'light' ? '深色' : '浅色';
  }
  btnSound.addEventListener('click', () => { soundOn = !soundOn; store.set('sound', soundOn ? '1' : '0'); paintToggles(); blip(760); });
  btnTheme.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next; store.set('theme', next); paintToggles();
  });

  /* ---------- 时钟 ---------- */
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }); };
  tick(); setInterval(tick, 15000);

  /* ---------- 开机动画 ---------- */
  const boot = $('#boot');
  let bootDone = false, bootTimers = [];
  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    bootTimers.forEach(clearTimeout);
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 400);
    try { sessionStorage.setItem('booted', '1'); } catch { /* 忽略 */ }
  }
  function runBoot() {
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch { /* 忽略 */ }
    // 同一次会话只播一次；直接打开文章链接时也不挡路
    if (seen || reduced || parse().length) { bootDone = true; boot.remove(); return; }
    boot.addEventListener('click', endBoot);
    requestAnimationFrame(() => boot.classList.add('on'));
    bootTimers.push(setTimeout(() => {
      const s = $('.device-screen', boot).getBoundingClientRect();
      boot.style.setProperty('--boot-scale', (Math.max(innerWidth / s.width, innerHeight / s.height) * 1.08).toFixed(2));
      boot.classList.add('open');
    }, 1500));
    bootTimers.push(setTimeout(endBoot, 2150));
  }

  /* ---------- 启动 ---------- */
  async function init() {
    buildRail();
    paintToggles();
    runBoot();
    try {
      const site = await data.site();
      siteName = site.name || siteName;
      $('#site-name').textContent = siteName;
      $('#avatar').textContent = site.avatarText || [...siteName][0];
      $('#tagline').textContent = site.tagline || '';
      const bootName = $('#boot-name');
      if (bootName) bootName.textContent = site.bootText || siteName;
    } catch (e) { console.error(e); }
    setCur(0);
    addEventListener('hashchange', onRoute);
    onRoute();
  }
  init();
})();
