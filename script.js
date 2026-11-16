// =========================================
// nuts Coffee の動きをつけるファイル
// =========================================

// --- 1. 車輪にドーナツを並べる ---
// 4種類（こだわり・メニュー・ギャラリー・アクセス）× 3回くり返しで、12個を円の縁に並べる
const kinds = [
  { panel: 'concept', label: 'こだわり',   en: 'CONCEPT', img: 'images/gallery5.jpg' },
  { panel: 'menu',    label: 'メニュー',   en: 'MENU',    img: 'images/hero.jpg' },
  { panel: 'gallery', label: 'ギャラリー', en: 'GALLERY', img: 'images/gallery5.jpg' },
  { panel: 'access',  label: 'アクセス',   en: 'ACCESS',  img: 'images/gallery5.jpg' },
];

const wheel = document.querySelector('.wheel');

for (let i = 0; i < 12; i++) {
  const k = i % 4;
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'wheel-item';
  item.dataset.panel = kinds[k].panel;
  item.style.setProperty('--i', i);
  item.setAttribute('aria-label', `${kinds[k].label}を開く`);
  item.innerHTML =
    `<span class="donut-float"><span class="donut donut-${k}">` +
    `<img src="${kinds[k].img}" alt=""></span></span>` +
    `<span class="item-label"><small>${kinds[k].en}</small>${kinds[k].label}</span>`;
  wheel.appendChild(item);
}

// --- 2. 車輪を回す（自動でゆっくり回る＋指やマウスでなぞって回せる） ---
const stage = document.querySelector('.hero-stage');
const disc = document.querySelector('.wheel-disc');
const discText = disc.querySelector('svg');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTO_SPEED = reduceMotion ? 0 : -4; // 1秒に 4度（90秒で1周）。動きを減らす設定なら止める

let angle = 0;        // 今の車輪の角度
let velocity = 0;     // なぞった勢い（1秒に何度）
let dragging = false; // なぞっている途中か
let hovering = false; // マウスがドーナツの上にあるか
let lastX = 0;
let lastTime = 0;
let moved = 0;        // なぞった距離（少しでも動いたら「押した」ではなく「なぞった」とみなす）
let radius = 500;     // 車輪の半径（なぞり始めに測る）

// 毎フレーム（1秒に約60回）車輪の角度を更新する
let prev = performance.now();
function tick(now) {
  const dt = Math.min((now - prev) / 1000, 0.05);
  prev = now;

  if (!dragging) {
    // なぞった勢いで少しすべり、だんだん弱まる
    angle += velocity * dt;
    velocity *= Math.pow(0.04, dt);
    if (Math.abs(velocity) < 1) velocity = 0;

    // ドーナツにマウスを乗せている間・画面が開いている間は自動で回さない
    const paused = hovering || document.body.classList.contains('panel-open');
    if (!paused) angle += AUTO_SPEED * dt;
  }

  wheel.style.transform = `rotate(${angle}deg)`;
  discText.style.transform = `rotate(${angle / 2}deg)`; // 文字は半分の速さ
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

stage.addEventListener('pointerdown', (e) => {
  dragging = true;
  moved = 0;
  velocity = 0;
  lastX = e.clientX;
  lastTime = e.timeStamp;
  // 車輪の中心から円の縁までの距離 ＝ 半径
  radius = wheel.getBoundingClientRect().top - disc.getBoundingClientRect().top;
});

window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dt = Math.max((e.timeStamp - lastTime) / 1000, 0.008);
  // 指が動いた距離のぶんだけ、ドーナツが指についてくるように回す
  const deg = (dx / radius) * (180 / Math.PI);
  angle += deg;
  velocity = velocity * 0.5 + (deg / dt) * 0.5;
  moved += Math.abs(dx);
  lastX = e.clientX;
  lastTime = e.timeStamp;
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  velocity = Math.max(-300, Math.min(300, velocity)); // 勢いが強すぎないように
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

// マウスがドーナツの上にあるかどうか
wheel.querySelectorAll('.wheel-item').forEach((item) => {
  item.addEventListener('mouseenter', () => { hovering = true; });
  item.addEventListener('mouseleave', () => { hovering = false; });
});

// --- 3. 画面（パネル）を開く・閉じる ---
let topZ = 20; // 後から開いた画面ほど手前に出す

function openPanel(id, x, y) {
  const panel = document.getElementById(id);
  if (!panel) return;

  // 押した場所から円が広がるように、場所を伝える
  panel.style.setProperty('--x', `${x}px`);
  panel.style.setProperty('--y', `${y}px`);
  panel.style.zIndex = ++topZ;
  panel.scrollTop = 0;
  panel.classList.add('is-open');
  document.body.classList.add('panel-open');

  // ほかに開いている画面は、新しい画面が広がりきってから閉じる
  setTimeout(() => {
    document.querySelectorAll('.panel.is-open').forEach((p) => {
      if (p !== panel) p.classList.remove('is-open');
    });
  }, 900);
}

function closePanels() {
  document.querySelectorAll('.panel.is-open').forEach((p) => p.classList.remove('is-open'));
  document.body.classList.remove('panel-open');
}

// ドーナツを押したとき：押した場所から開く
wheel.addEventListener('click', (e) => {
  const item = e.target.closest('.wheel-item');
  if (!item || moved > 8) return; // なぞって回したときは開かない
  const rect = item.querySelector('.donut').getBoundingClientRect();
  openPanel(item.dataset.panel, rect.left + rect.width / 2, rect.top + rect.height / 2);
});

// 上のメニューを押したとき：押したリンクの場所から開く
document.querySelectorAll('header a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const id = link.getAttribute('href').slice(1);
    if (id === 'top') {
      closePanels(); // 店名を押すとトップに戻る
    } else {
      openPanel(id, e.clientX, e.clientY);
    }
  });
});

// 「×」ボタン・Esc キーで閉じる
document.querySelectorAll('.panel-close').forEach((btn) => {
  btn.addEventListener('click', closePanels);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanels();
});

// --- 4. 画面の中の項目に「何番目か」をつける（順番に遅れて出てくるため） ---
document.querySelectorAll('.columns, .gallery, .access-wrap').forEach((group) => {
  [...group.children].forEach((child, n) => child.style.setProperty('--n', n));
});
document.querySelectorAll('.instagram').forEach((el) => el.style.setProperty('--n', 3));

// --- お知らせ：Google スプレッドシートから読み込む ---
// ▼ スプレッドシートを「ウェブに公開」したときの CSV のアドレスを、'' の中に貼ります。
//   空のままなら、HTML に書いてある見本のお知らせがそのまま出ます。
//   表の形：1行目は見出し（日付・ラベル・お知らせ）、2行目から上に新しいものを書く
const NEWS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8hzlUkCWV7Sm8Rrhz5LCfZJLYUn4Rl6GB31U_w2gUP-XfbOO4HIh0l3LIlQbe3QgtU8szoqjfhMRF/pub?gid=0&single=true&output=csv';
const NEWS_MAX = 6; // 表示するお知らせの数（上から順に）

// CSV（カンマ区切りの文字）を、表の形（行と列）に直す
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// 表を読んで [{ date, tag, text }, ...] にする。読めないときは null（見本のお知らせのまま）
async function fetchNews() {
  if (!NEWS_SHEET_URL) return null;
  try {
    const res = await fetch(NEWS_SHEET_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const items = parseCSV(await res.text())
      .slice(1)
      .map((r) => ({ date: (r[0] || '').trim(), tag: (r[1] || '').trim(), text: (r[2] || '').trim() }))
      .filter((n) => n.text)
      .slice(0, NEWS_MAX);
    return items.length ? items : null;
  } catch (err) {
    console.warn('お知らせを読み込めませんでした', err);
    return null;
  }
}

// 「2026.11.10」「2026/11/10」「2026年11月10日」を、機械が読める日付（2026-11-10）にする
function toISODate(s) {
  const m = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
}

// 文字は textContent で入れる（表に何を書かれても、安全に文字として出す）
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

async function loadNews() {
  const list = document.getElementById('news-list');
  const items = await fetchNews();
  if (list && items) {
    list.replaceChildren(...items.map((n) => {
      const li = el('li', n.tag ? '' : 'no-tag');
      const time = el('time', '', n.date);
      const iso = toISODate(n.date);
      if (iso) time.dateTime = iso;
      li.append(time, el('span', 'news-tag', n.tag), el('p', '', n.text));
      return li;
    }));
  }
  // 順番に少しずつ遅れて出てくるように、何番目かをつける
  if (list) [...list.children].forEach((li, n) => li.style.setProperty('--n', n));
}

loadNews();
