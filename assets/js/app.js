/* 游戏机风格个人网站 —— 无需构建，纯静态。
 * 内容都在 content/ 目录里，改那里就行，一般不需要动这个文件。 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.documentElement;

  const SECTIONS = [
    { id: 'works', title: '作品', en: 'WORKS', desc: '做过的项目与作品' },
    { id: 'blog', title: '博客', en: 'BLOG', desc: '文章、笔记与想法' },
    { id: 'about', title: '关于', en: 'ABOUT', desc: '我是谁，在做什么' },
    { id: 'links', title: '链接', en: 'LINKS', desc: '在别处找到我' },
  ];
  const SYSTEM = [
    { id: 'trophies', title: '成就', en: 'TROPHIES' },
    { id: 'settings', title: '设置', en: 'SYSTEM' },
  ];
  const metaOf = (id) => SECTIONS.find((s) => s.id === id) || SYSTEM.find((s) => s.id === id);

  const ICONS = {
    works: '<path d="M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z"/>',
    blog: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',
    about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    links: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
    lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  };
  ICONS.trophies = ICONS.trophy;
  const icon = (name) => `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg></span>`;

  const home = $('#home'), screen = $('#screen'), view = $('#view');
  const rail = $('#rail'), info = $('#info'), expander = $('#expander');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 隐私模式下忽略 */ } },
    list(k) { try { return JSON.parse(this.get(k)) || []; } catch { return []; } },
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
    w.cover ? `<img src="${esc(w.cover)}" alt="" loading="lazy">` : `<span>${esc([...w.title][0] || '')}</span>`}</div>`;
  const dateBadge = (d) => {
    const [, m, day] = String(d).split('-');
    return `<span class="mini-date"><b>${esc(day || '')}</b><small>${esc(+m || '')}月</small></span>`;
  };
  const tagAttr = (x) => esc((x.tags || []).join('|'));
  function filterBar(items) {
    const all = [...new Set(items.flatMap((x) => x.tags || []))];
    if (all.length < 2) return '';
    return `<div class="filters"><button class="chip f on" type="button" data-tag="">全部</button>${
      all.map((t) => `<button class="chip f" type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>`;
  }

  /* ---------- 各页面 ---------- */
  const pages = {
    async works([id]) {
      const works = await data.works();
      if (!id) {
        return {
          title: '作品',
          html: `<div><p class="kicker">WORKS</p><h1 class="page-title">作品</h1><p class="page-sub">共 ${works.length} 件</p></div>
            ${filterBar(works)}` +
            (works.length ? `<div class="grid">${works.map((w) => `
              <a class="card f" data-tags="${tagAttr(w)}" href="#/works/${encodeURIComponent(w.id)}">
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
          html: `<div><p class="kicker">BLOG</p><h1 class="page-title">博客</h1><p class="page-sub">共 ${posts.length} 篇</p></div>
            ${filterBar(posts)}` +
            (posts.length ? `<div class="posts">${posts.map((p) => `
              <a class="post-item f" data-tags="${tagAttr(p)}" href="#/blog/${encodeURIComponent(p.slug)}">
                ${dateBadge(p.date)}
                <div><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p>
                  <div class="tags"><span class="tag">${esc(String(p.date).slice(0, 4))}</span>${tags(p.tags)}</div></div>
              </a>`).join('')}</div>` : '<p class="empty">还没有文章。</p>'),
        };
      }
      const i = posts.findIndex((p) => p.slug === slug);
      if (i < 0) return notFound();
      const p = posts[i], newer = posts[i - 1], older = posts[i + 1];
      const text = await load(`content/posts/${p.slug}.md`, 'text');
      const chars = text.replace(/\s/g, '').length;
      const link = (q, cls, label) => q
        ? `<a class="f ${cls}" href="#/blog/${encodeURIComponent(q.slug)}"><small>${label}</small>${esc(q.title)}</a>` : '';
      return {
        title: p.title,
        html: `<div><p class="kicker">BLOG</p><h1 class="page-title">${esc(p.title)}</h1>
          <p class="meta"><time>${esc(p.date)}</time><span class="num">${chars} 字 · 约 ${Math.max(1, Math.ceil(chars / 400))} 分钟</span>${tags(p.tags)}</p></div>
          ${md(text)}
          <nav class="pager">${link(older, 'prev', '← 上一篇')}${link(newer, 'next', '下一篇 →')}</nav>`,
      };
    },

    async about() {
      return { title: '关于', html: `<p class="kicker">ABOUT</p>${md(await load('content/about.md', 'text'))}` };
    },

    async links() {
      const site = await data.site();
      return {
        title: '链接',
        html: `<div><p class="kicker">LINKS</p><h1 class="page-title">链接</h1><p class="page-sub">在别处找到我</p></div>
          <div class="linklist">${(site.links || []).map((l) => `
            <a class="f" href="${esc(l.url)}" target="_blank" rel="noopener">
              <span>${esc(l.label)}</span><small>${esc(l.note || '')} ↗</small></a>`).join('')}</div>`,
      };
    },

    async settings() {
      return {
        title: '设置',
        html: `<div><p class="kicker">SYSTEM</p><h1 class="page-title">设置</h1><p class="page-sub">设置只保存在你的浏览器里</p></div>
          <div class="rows" id="rows">${settingsRows()}</div>
          <div><h2 class="sub">操作方式</h2>
          <table class="keys">
            <tr><th></th><th>键盘</th><th>手柄</th></tr>
            <tr><td>选择</td><td><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd></td><td>十字键 / 左摇杆</td></tr>
            <tr><td>进入</td><td><kbd>Enter</kbd></td><td><i class="pad a">A</i></td></tr>
            <tr><td>返回</td><td><kbd>Esc</kbd></td><td><i class="pad b">B</i></td></tr>
            <tr><td>切换栏目</td><td><kbd>Q</kbd> <kbd>E</kbd></td><td>LB / RB</td></tr>
          </table></div>`,
      };
    },

    async trophies() {
      const got = store.list('trophies');
      const n = TROPHIES.filter((t) => got.includes(t.id)).length;
      return {
        title: '成就',
        html: `<div><p class="kicker">TROPHIES</p><h1 class="page-title">成就</h1>
          <p class="page-sub">已解锁 ${n} / ${TROPHIES.length}</p>
          <div class="meter"><i style="width:${(n / TROPHIES.length) * 100}%"></i></div></div>
          <div class="trophies">${TROPHIES.map((t) => {
            const on = got.includes(t.id);
            return `<div class="trophy${on ? '' : ' locked'}">${icon(on ? 'trophy' : 'lock')}
              <div><b>${on || !t.secret ? t.name : '？？？'}</b><small>${on || !t.secret ? t.desc : '隐藏成就'}</small></div></div>`;
          }).join('')}</div>`,
      };
    },
  };
  const notFound = () => ({
    title: '找不到',
    html: '<h1 class="page-title">404</h1><p class="page-sub">这里什么都没有，按返回键回去吧。</p>',
  });

  /* ---------- 设置 ---------- */
  let soundOn = store.get('sound') === '1';
  function settingsRows() {
    const row = (act, name, desc, val, on = true) => `
      <button class="row f" type="button" data-act="${act}">
        <span><b>${name}</b><small>${desc}</small></span><span class="row-val${on ? '' : ' off'}">${val}</span></button>`;
    const light = root.dataset.theme === 'light', fx = root.dataset.fx !== 'off';
    return row('theme', '外观', '深色或浅色界面', light ? '浅色' : '深色') +
      row('sound', '按键音效', '移动和确认时的提示音', soundOn ? '开' : '关', soundOn) +
      row('fx', '动态背景', '主界面的流动光斑和大字', fx ? '开' : '关', fx) +
      row('boot', '开机动画', '重新播放一次', '播放') +
      row('reset', '重置成就', '清空已解锁的成就', '重置', false);
  }
  const actions = {
    theme() { const v = root.dataset.theme === 'light' ? 'dark' : 'light'; root.dataset.theme = v; store.set('theme', v); },
    sound() { soundOn = !soundOn; store.set('sound', soundOn ? '1' : '0'); },
    fx() { const on = root.dataset.fx === 'off'; if (on) delete root.dataset.fx; else root.dataset.fx = 'off'; store.set('fx', on ? '1' : '0'); },
    boot() { try { sessionStorage.removeItem('booted'); } catch { /* 忽略 */ } location.hash = '#/'; location.reload(); },
    reset() { store.set('trophies', '[]'); store.set('seen', '[]'); paintTrophyCount(); },
  };
  view.addEventListener('click', (e) => {
    const row = e.target.closest('[data-act]');
    if (row) {
      const act = row.dataset.act;
      actions[act]?.();
      const rows = $('#rows');
      if (rows) { rows.innerHTML = settingsRows(); $(`[data-act="${act}"]`, rows)?.focus(); }
      return;
    }
    const chip = e.target.closest('[data-tag]');
    if (chip) { // 标签筛选
      const tag = chip.dataset.tag;
      $$('.filters .chip', view).forEach((c) => c.classList.toggle('on', c === chip));
      $$('[data-tags]', view).forEach((el) => { el.hidden = !!tag && !el.dataset.tags.split('|').includes(tag); });
    }
  });

  /* ---------- 成就 ---------- */
  const TROPHIES = [
    { id: 'hello', name: '开机', desc: '第一次来到这里' },
    { id: 'reader', name: '翻开第一页', desc: '打开一篇文章' },
    { id: 'finish', name: '读到最后', desc: '把一篇文章读完' },
    { id: 'viewer', name: '鉴赏家', desc: '查看一件作品的详情' },
    { id: 'tour', name: '四处逛逛', desc: '逛遍四个栏目' },
    { id: 'pad', name: '手柄玩家', desc: '接上手柄来访' },
    { id: 'owl', name: '夜猫子', desc: '在深夜到访', secret: true },
    { id: 'konami', name: '上上下下', desc: '输入了那串经典秘技', secret: true },
  ];
  function paintTrophyCount() {
    $('#trophy-count').textContent = `${store.list('trophies').filter((id) => TROPHIES.some((t) => t.id === id)).length}/${TROPHIES.length}`;
  }
  function unlock(id) {
    const got = store.list('trophies');
    const t = TROPHIES.find((x) => x.id === id);
    if (!t || got.includes(id)) return;
    store.set('trophies', JSON.stringify([...got, id]));
    paintTrophyCount();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon('trophy')}<span><small>成就解锁</small><b>${t.name}</b></span>`;
    $('#toasts').append(el);
    setTimeout(() => el.remove(), 4100);
    [660, 880, 1320].forEach((f, i) => setTimeout(() => blip(f), i * 90));
  }

  /* ---------- 主界面 ---------- */
  let cur = 0;
  let siteName = '关忆北';

  function buildRail() {
    rail.innerHTML = SECTIONS.map((s, i) => `
      <a class="tile f" data-sec="${s.id}" data-open="${s.id}" data-i="${i}" href="#/${s.id}">
        <span class="tile-art"></span>
        <span class="tile-top"><span class="tile-no">${String(i + 1).padStart(2, '0')}</span><span class="tile-count"></span></span>
        <span class="tile-ico">${icon(s.id)}</span>
        <span class="tile-label"><span class="tile-en">${s.en}</span>
          <span class="tile-title">${s.title}</span>
          <span class="tile-desc">${s.desc}</span></span>
      </a>`).join('');
    $$('.tile', rail).forEach((t) => {
      const pick = () => setCur(+t.dataset.i);
      t.addEventListener('focus', pick);
      t.addEventListener('mouseenter', pick);
      // 鼠标悬停时卡带跟着倾斜
      t.addEventListener('mousemove', (e) => {
        if (reduced || root.dataset.fx === 'off') return;
        const r = t.getBoundingClientRect();
        t.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 14}deg`);
        t.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 14}deg`);
      });
      t.addEventListener('mouseleave', () => { t.style.removeProperty('--rx'); t.style.removeProperty('--ry'); });
    });
    const count = (id, n) => { const el = $(`.tile[data-sec="${id}"] .tile-count`, rail); if (el) el.textContent = n; };
    data.works().then((w) => count('works', w.length)).catch(() => {});
    data.posts().then((p) => count('blog', p.length)).catch(() => {});
    data.site().then((s) => count('links', (s.links || []).length)).catch(() => {});
  }

  async function shelf(id) {
    if (id === 'works') {
      const w = await data.works();
      return [`${w.length} 件`, w.slice(0, 6).map((x) => `
        <a class="mini f" href="#/works/${encodeURIComponent(x.id)}">${cover(x)}
          <span class="mini-body"><b>${esc(x.title)}</b><small>${esc(x.summary)}</small></span></a>`).join('')];
    }
    if (id === 'blog') {
      const p = await data.posts();
      return [`${p.length} 篇`, p.slice(0, 6).map((x) => `
        <a class="mini f" href="#/blog/${encodeURIComponent(x.slug)}">${dateBadge(x.date)}
          <span class="mini-body"><b>${esc(x.title)}</b><small>${esc(x.summary)}</small></span></a>`).join('')];
    }
    if (id === 'about') {
      const [w, p] = await Promise.all([data.works(), data.posts()]);
      const tagCount = new Set([...w, ...p].flatMap((x) => x.tags || [])).size;
      const stat = (n, label) => `<div class="mini stat"><b>${n}</b><small>${label}</small></div>`;
      return ['', stat(w.length, '件作品') + stat(p.length, '篇文章') + stat(tagCount, '个标签') +
        '<a class="mini more f" href="#/about">了解更多 →</a>'];
    }
    const site = await data.site();
    return [`${(site.links || []).length} 个`, (site.links || []).map((l) => `
      <a class="mini f" href="${esc(l.url)}" target="_blank" rel="noopener">
        <span class="mini-body"><b>${esc(l.label)} ↗</b><small>${esc(l.note || '')}</small></span></a>`).join('')];
  }

  let infoToken = 0;
  async function setCur(i) {
    const changed = i !== cur || !info.firstChild;
    cur = i;
    const s = SECTIONS[i];
    $$('.tile', rail).forEach((t, k) => t.classList.toggle('cur', k === i));
    home.dataset.sec = s.id;
    if (!changed) return;
    const word = $('#bg-word');
    word.textContent = s.en;
    word.classList.remove('in'); void word.offsetWidth; word.classList.add('in');
    const token = ++infoToken;
    let count = '', items = '';
    try { [count, items] = await shelf(s.id); } catch (e) { console.error(e); }
    if (token !== infoToken) return;
    info.innerHTML = `
      <div class="info-head"><h2 class="info-title">${s.title}</h2><span class="info-desc">${s.desc}</span><span class="info-count">${count}</span></div>
      <div class="shelf">${items}</div>`;
  }

  /* ---------- 路由与展开动画 ---------- */
  const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  let prev = null; // 上一个路由；null 表示首次加载

  const originRect = (sec) => $(`[data-open="${sec}"]`, home)?.getBoundingClientRect();
  const clip = (r) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 22px)`;
  const FULL = 'inset(0px 0px 0px 0px round 0px)';
  function play(keyframes, duration) {
    if (reduced) return Promise.resolve();
    return expander.animate(keyframes, { duration, easing: 'cubic-bezier(.3,.7,.1,1)', fill: 'both' })
      .finished.catch(() => {});
  }
  const clearExpander = () => { expander.getAnimations().forEach((a) => a.cancel()); expander.innerHTML = ''; };

  $('#tabs').innerHTML = '<kbd>Q</kbd>' + SECTIONS.map((s) =>
    `<a class="tab" data-tab="${s.id}" data-sec="${s.id}" href="#/${s.id}" tabindex="-1">${s.title}</a>`).join('') + '<kbd>E</kbd>';

  let routeToken = 0;
  async function onRoute() {
    const route = parse();
    const [sec, ...rest] = route;
    const token = ++routeToken;
    const from = prev;
    prev = route;
    clearExpander();
    $('#progress').style.transform = '';

    if (!sec) { // 回到主界面：内容页收回到对应卡带里
      document.title = siteName;
      const wasOpen = !screen.hidden;
      const backSec = from && from[0];
      screen.hidden = true;
      home.inert = false;
      const i = SECTIONS.findIndex((s) => s.id === backSec);
      setCur(i >= 0 ? i : cur);
      (i < 0 && backSec ? $(`[data-open="${backSec}"]`, home) : $$('.tile', rail)[cur])?.focus({ preventScroll: true });
      const r = wasOpen && backSec && originRect(backSec);
      if (r) {
        expander.dataset.sec = backSec;
        await play([
          { clipPath: FULL, opacity: 1 },
          { clipPath: clip(r), opacity: 1, offset: .8 },
          { clipPath: clip(r), opacity: 0 },
        ], 440);
        if (token === routeToken) clearExpander();
      }
      return;
    }

    const page = pages[sec];
    const meta = metaOf(sec);
    const building = (page ? page(rest) : Promise.resolve(notFound()))
      .catch((e) => ({ title: '出错了', html: `<h1 class="page-title">出错了</h1><p class="page-sub">${esc(e.message)}</p>` }));

    // 从主界面进入：卡带放大铺满屏幕，中间是启动画面
    const r = screen.hidden && from && meta && originRect(sec);
    if (r) {
      expander.dataset.sec = sec;
      expander.innerHTML = `<div class="splash">${icon(sec)}<div class="splash-title">${meta.title}</div>
        <div class="splash-en">${meta.en}</div><div class="splash-bar"><i></i></div></div>`;
      await Promise.all([play([{ clipPath: clip(r), opacity: 1 }, { clipPath: FULL, opacity: 1 }], 460), reduced ? 0 : wait(720)]);
    }
    const result = await building;
    if (token !== routeToken) return;

    const main = SECTIONS.some((s) => s.id === sec);
    screen.dataset.sec = meta ? sec : 'works';
    $('#tabs').hidden = !main;
    $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === sec));
    $('#screen-title').textContent = result.title;
    $('#screen-en').textContent = meta ? (rest.length ? `${meta.en} / ${result.title}` : meta.en) : '';
    $('#back').href = rest.length && meta ? `#/${sec}` : '#/';
    document.title = `${result.title} · ${siteName}`;
    view.innerHTML = result.html;
    screen.hidden = false;
    home.inert = true;
    screen.scrollTop = 0;
    $('#back').focus({ preventScroll: true });

    if (main) {
      const seen = [...new Set([...store.list('seen'), sec])];
      store.set('seen', JSON.stringify(seen));
      if (SECTIONS.every((s) => seen.includes(s.id))) unlock('tour');
    }
    if (sec === 'blog' && rest.length && result.title !== '找不到') { unlock('reader'); setTimeout(onScroll, 2500); }
    if (sec === 'works' && rest.length && result.title !== '找不到') unlock('viewer');

    if (r) {
      await play([{ opacity: 1 }, { opacity: 0 }], 280);
      if (token === routeToken) clearExpander();
    }
  }

  // 阅读进度条
  function onScroll() {
    const [sec, slug] = parse();
    if (sec !== 'blog' || !slug || screen.hidden) return;
    const max = screen.scrollHeight - screen.clientHeight;
    const p = max > 0 ? screen.scrollTop / max : 1;
    $('#progress').style.transform = `scaleX(${max > 0 ? p : 0})`;
    if (p > .97) unlock('finish');
  }
  screen.addEventListener('scroll', onScroll, { passive: true });

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
    if (dir === 'up' && active.closest('#info')) { // 从内容架回到当前卡带
      $$('.tile', rail)[cur].focus(); blip(520); return true;
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
    location.hash = route.length > 1 && metaOf(route[0]) ? `#/${route[0]}` : '#/';
  }

  // Q / E（手柄 LB / RB）：在栏目之间切换
  function switchSection(delta) {
    const n = SECTIONS.length;
    if (screen.hidden) {
      $$('.tile', rail)[(cur + delta + n) % n].focus();
    } else {
      const i = SECTIONS.findIndex((s) => s.id === parse()[0]);
      if (i < 0) return;
      location.hash = `#/${SECTIONS[(i + delta + n) % n].id}`;
    }
    blip(600);
  }

  const KONAMI = 'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a';
  let typed = [];
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!bootDone) { endBoot(); return; }
    typed = [...typed, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-10);
    if (typed.join(' ') === KONAMI) {
      unlock('konami');
      root.classList.add('party');
      setTimeout(() => root.classList.remove('party'), 6000);
    }
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
    if (dir) { if (move(dir)) e.preventDefault(); return; }
    if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); goBack(); }
    else if (e.key === 'q' || e.key === 'Q') switchSection(-1);
    else if (e.key === 'e' || e.key === 'E') switchSection(1);
  });
  document.addEventListener('click', (e) => { if (e.target.closest('a.f, button.f, .tab')) blip(760); });

  // 手柄：十字键/左摇杆移动，A 确认，B 返回，LB/RB 切换栏目
  const DIRS = ['left', 'right', 'up', 'down'];
  let padHeld = null, padAt = 0, padRepeat = false, padLoop = false;
  function pollPad(t) {
    const gp = [...(navigator.getGamepads?.() || [])].find(Boolean);
    if (!gp) { padLoop = false; return; }
    const b = (i) => gp.buttons[i]?.pressed;
    const [x = 0, y = 0] = gp.axes;
    const act = b(14) || x < -.6 ? 'left' : b(15) || x > .6 ? 'right'
      : b(12) || y < -.6 ? 'up' : b(13) || y > .6 ? 'down'
      : b(0) ? 'ok' : b(1) ? 'back' : b(4) ? 'prev' : b(5) ? 'next' : null;
    const repeat = act === padHeld && DIRS.includes(act) && t - padAt > (padRepeat ? 130 : 380);
    if (!act) padHeld = null;
    else if (act !== padHeld || repeat) {
      padRepeat = act === padHeld; padHeld = act; padAt = t;
      if (!bootDone) endBoot();
      else if (act === 'ok') document.activeElement?.click?.();
      else if (act === 'back') goBack();
      else if (act === 'prev') switchSection(-1);
      else if (act === 'next') switchSection(1);
      else if (!move(act) && (act === 'up' || act === 'down')) layer().scrollBy({ top: act === 'up' ? -120 : 120 });
    }
    requestAnimationFrame(pollPad);
  }
  addEventListener('gamepadconnected', () => {
    unlock('pad');
    if (!padLoop) { padLoop = true; requestAnimationFrame(pollPad); }
  });

  /* ---------- 音效（默认关闭，在设置里打开） ---------- */
  let audio = null;
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

  /* ---------- 时钟与问候 ---------- */
  function tick() {
    const now = new Date(), h = now.getHours();
    $('#clock').textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    $('#date').textContent = `${now.getMonth() + 1}月${now.getDate()}日 周${'日一二三四五六'[now.getDay()]}`;
    $('#greeting').textContent = h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  }
  tick(); setInterval(tick, 15000);

  /* ---------- 开机动画 ---------- */
  const boot = $('#boot');
  let bootDone = false, bootTimers = [];
  function welcome() {
    setTimeout(() => { unlock('hello'); if (new Date().getHours() < 5) unlock('owl'); }, 700);
  }
  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    bootTimers.forEach(clearTimeout);
    boot.classList.add('done');
    setTimeout(() => boot.remove(), 400);
    try { sessionStorage.setItem('booted', '1'); } catch { /* 忽略 */ }
    welcome();
  }
  function runBoot() {
    let seen = false;
    try { seen = sessionStorage.getItem('booted') === '1'; } catch { /* 忽略 */ }
    // 同一次会话只播一次；直接打开文章链接时也不挡路
    if (seen || reduced || parse().length) { bootDone = true; boot.remove(); welcome(); return; }
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
    $$('[data-ico]').forEach((el) => { el.outerHTML = icon(el.dataset.ico); });
    buildRail();
    paintTrophyCount();
    runBoot();
    try {
      const site = await data.site();
      siteName = site.name || siteName;
      $('#site-name').textContent = siteName;
      $('#avatar').textContent = site.avatarText || [...siteName][0];
      if (site.avatar) { // 有头像图片就用图片，加载失败时保留文字
        const img = new Image();
        img.alt = '';
        img.onload = () => $('#avatar').replaceChildren(img);
        img.src = site.avatar;
      }
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
