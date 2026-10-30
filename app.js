'use strict';
/* =====================================================================
   Sodo — ứng dụng sơ đồ tư duy chạy hoàn toàn trên trình duyệt.
   Dữ liệu lưu trong localStorage. Không cần máy chủ hay bước build.
   ===================================================================== */

/* ---------------- Tiện ích ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const FONT = "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif";
const SKETCH_FONT = "'Pangolin', 'Be Vietnam Pro', system-ui, sans-serif";
const EMOJI_FONT = "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

const ICONS = {
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  child: '<rect x="2.5" y="9" width="7" height="6" rx="1.5"/><path d="M9.5 12h3"/><path d="M17.5 8.5v7M14 12h7"/>',
  sibling: '<rect x="5" y="3" width="10" height="6" rx="1.5"/><path d="M10 9v3"/><path d="M10 15.5v6M7 18.5h6"/>',
  relate: '<path d="M5 19C5 11 10 6 18 6" stroke-dasharray="3 3"/><path d="m14 3 4 3-3 4"/><circle cx="5" cy="19" r="2"/>',
  outline: '<path d="M9 6h12M13 12h8M13 18h8M4 6h.01M8 12h.01M8 18h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  text: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4M9 10h6M9 14h6M9 18h3"/>',
  fold: '<path d="m7 15 5-5 5 5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  quiz: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.6 6.6C4.2 8.2 3 12 3 12s4 6 9 6c1.5 0 2.9-.4 4.1-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  check: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.5h6V4"/><path d="m9 13 2 2 4-4"/>',
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(el => {
    if (!el.querySelector(':scope > svg.i')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });
}

function toast(msg, ms = 2200) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const safeName = s => (String(s || 'so-do').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'so-do').slice(0, 80);

function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  if (s < 86400 * 7) return Math.floor(s / 86400) + ' ngày trước';
  return new Date(t).toLocaleDateString('vi-VN');
}

/* ---------------- Hộp thoại ---------------- */
function modal({ title, body = '', actions = [{ label: 'Đóng', value: null }], onOpen, wide }) {
  return new Promise(resolve => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" ${wide ? 'style="width:min(640px,100%)"' : ''}>
      <h3>${esc(title)}</h3><div class="mbody">${body}</div>
      <div class="foot">${actions.map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div></div>`;
    const close = v => { back.remove(); document.removeEventListener('keydown', onKey, true); resolve(v); };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(null); }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const p = actions.findIndex(a => a.primary);
        if (p >= 0) { e.preventDefault(); e.stopPropagation(); close(resolveVal(actions[p])); }
      }
    };
    const resolveVal = a => (typeof a.value === 'function' ? a.value(back) : a.value);
    back.addEventListener('pointerdown', e => { if (e.target === back) close(null); });
    back.addEventListener('click', e => {
      const b = e.target.closest('.foot button');
      if (b) close(resolveVal(actions[+b.dataset.i]));
    });
    document.addEventListener('keydown', onKey, true);
    $('#modal-root').appendChild(back);
    onOpen?.(back);
  });
}
const modalOpen = () => !!$('#modal-root').children.length;
async function promptText(title, value = '', placeholder = '') {
  return modal({
    title,
    body: `<input class="field" style="width:100%" value="${esc(value)}" placeholder="${esc(placeholder)}">`,
    actions: [{ label: 'Hủy', value: null }, { label: 'Đồng ý', primary: true, value: m => $('input', m).value.trim() }],
    onOpen: m => { const i = $('input', m); i.focus(); i.select(); },
  });
}
const confirmBox = (title, text, label = 'Xóa') => modal({
  title, body: `<p>${esc(text)}</p>`,
  actions: [{ label: 'Hủy', value: false }, { label, danger: true, primary: true, value: true }],
});

/* ---------------- Chủ đề màu ---------------- */
const THEMES = {
  classic: { name: 'Cổ điển', bg: '#f6f7fb', dot: '#dde2ec', text: '#1f2937', rel: '#5b6478', root: { fill: '#25324d', text: '#ffffff', line: '#25324d' }, palette: ['#f0643c', '#20a36b', '#2f80ed', '#9b51e0', '#f2a516', '#0fa3b1', '#e8488a', '#6a9e1f'], d1: 'fill', deep: 'underline' },
  fresh: { name: 'Tươi sáng', bg: '#fffaf2', dot: '#efe4d3', text: '#3d3631', rel: '#8a7f75', root: { fill: '#ffffff', text: '#3d3631', stroke: '#3d3631', line: '#3d3631' }, palette: ['#ef8354', '#6aa84f', '#4f9fd6', '#c06c84', '#e9b949', '#6c5b7b'], d1: 'tint', deep: 'underline' },
  ocean: { name: 'Đại dương', bg: '#eef6fb', dot: '#d3e5f1', text: '#163246', rel: '#4a6b82', root: { fill: '#0b4f71', text: '#ffffff', line: '#0b4f71' }, palette: ['#118ab2', '#06a77d', '#3a86ff', '#00a6c7', '#4361ee', '#2a9d8f'], d1: 'fill', deep: 'underline' },
  dark: { name: 'Ban đêm', bg: '#14161b', dot: '#262a33', text: '#e7e9ee', rel: '#9aa3b5', root: { fill: '#f4f5f7', text: '#14161b', line: '#f4f5f7' }, palette: ['#ff8a5b', '#4ade80', '#60a5fa', '#c084fc', '#facc15', '#2dd4bf', '#f472b6'], d1: 'fill', deep: 'underline' },
  chalk: { name: 'Bảng phấn', bg: '#1f3a2c', dot: '#2b4b3a', text: '#f2f5ee', rel: '#cfe3d3', root: { fill: 'transparent', text: '#ffffff', stroke: '#f2f5ee', line: '#f2f5ee' }, palette: ['#ffd6a5', '#caffbf', '#9bf6ff', '#ffadad', '#fdffb6', '#bdb2ff'], d1: 'outline', deep: 'underline' },
  mono: { name: 'Tối giản', bg: '#ffffff', dot: '#ececec', text: '#1a1a1a', rel: '#777777', root: { fill: '#1a1a1a', text: '#ffffff', line: '#1a1a1a' }, palette: ['#3a3a3a'], d1: 'outline', deep: 'underline' },
};
const LAYOUTS = {
  map: { name: 'Sơ đồ tư duy', svg: '<rect x="38" y="17" width="24" height="10" rx="3" fill="currentColor"/><path d="M62 22c8 0 8-12 16-12M62 22c8 0 8 12 16 12M38 22c-8 0-8-12-16-12M38 22c-8 0-8 12-16 12" stroke="currentColor" stroke-width="2" fill="none"/>' },
  right: { name: 'Sang phải', svg: '<rect x="8" y="17" width="24" height="10" rx="3" fill="currentColor"/><path d="M32 22c10 0 10-16 22-16M32 22h22M32 22c10 0 10 16 22 16" stroke="currentColor" stroke-width="2" fill="none"/><path d="M58 6h22M58 22h22M58 38h22" stroke="currentColor" stroke-width="3"/>' },
  left: { name: 'Sang trái', svg: '<rect x="68" y="17" width="24" height="10" rx="3" fill="currentColor"/><path d="M68 22c-10 0-10-16-22-16M68 22H46M68 22c-10 0-10 16-22 16" stroke="currentColor" stroke-width="2" fill="none"/><path d="M20 6h22M20 22h22M20 38h22" stroke="currentColor" stroke-width="3"/>' },
  down: { name: 'Sơ đồ tổ chức', svg: '<rect x="38" y="3" width="24" height="10" rx="3" fill="currentColor"/><path d="M50 13v8M20 21h60M20 21v6M50 21v6M80 21v6" stroke="currentColor" stroke-width="2" fill="none"/><rect x="10" y="29" width="20" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="40" y="29" width="20" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="70" y="29" width="20" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>' },
  tree: { name: 'Cây thư mục', svg: '<rect x="24" y="3" width="26" height="9" rx="3" fill="currentColor"/><path d="M30 12v26M30 20h10M30 29h10M30 38h10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M44 20h28M44 29h22M44 38h30" stroke="currentColor" stroke-width="3"/>' },
  timeline: { name: 'Trục thời gian', svg: '<rect x="2" y="17" width="18" height="10" rx="3" fill="currentColor"/><path d="M20 22h74M88 17l6 5-6 5M33 18V7h14M55 26v11h14M77 18V7h12" stroke="currentColor" stroke-width="2" fill="none"/><rect x="27" y="18" width="13" height="8" rx="2" fill="currentColor"/><rect x="49" y="18" width="13" height="8" rx="2" fill="currentColor"/><rect x="71" y="18" width="13" height="8" rx="2" fill="currentColor"/>' },
  fishbone: { name: 'Xương cá', svg: '<rect x="76" y="16" width="22" height="12" rx="3" fill="currentColor"/><path d="M76 22H4M68 22 58 5M46 22 36 5M24 22 14 5M68 22 58 39M46 22 36 39M24 22 14 39M50 12h11M28 12h11M50 32h11M28 32h11" stroke="currentColor" stroke-width="2" fill="none"/>' },
};

const SWATCH = ['#f0643c', '#f2a516', '#e9c46a', '#20a36b', '#0fa3b1', '#2f80ed', '#4f46e5', '#9b51e0', '#e8488a', '#c92a2a', '#5c6474', '#1f2937'];
const FILLS = ['#ffffff', '#fff3bf', '#d3f9d8', '#d0ebff', '#e5dbff', '#ffe3e3', '#f1f3f5', '#f0643c', '#20a36b', '#2f80ed', '#9b51e0', '#1f2937'];
const TEXTS = ['#1f2937', '#ffffff', '#c92a2a', '#2f80ed', '#20a36b', '#e8590c'];
const EMOJIS = ['⭐', '❗', '❓', '💡', '✅', '❌', '⚠️', '🎯', '📌', '📅', '⏰', '💰', '📚', '✏️', '🔥', '🚀', '🏆', '🔑', '🧠', '💬', '📈', '📉', '🔍', '🛠️', '❤️', '👍', '👎', '🙂', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '🟢', '🟡', '🔴', '🏫', '👩‍🏫', '🧪', '🌏'];

function ink(hex, light = '#ffffff', dark = '#1f2937') {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return dark;
  let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(c => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? dark : light;
}

/* ---------------- Mô hình dữ liệu ---------------- */
function walk(node, fn, parent = null, depth = 0) {
  if (fn(node, parent, depth) === false) return;
  node.children.forEach(c => walk(c, fn, node, depth + 1));
}
const countNodes = n => { let c = 0; walk(n, () => { c++; }); return c; };
function cloneFresh(n) {
  return { ...JSON.parse(JSON.stringify(n)), id: uid(), children: n.children.map(cloneFresh) };
}
function normalizeNode(n) {
  const out = { id: n.id || uid(), text: String(n.text ?? ''), children: (n.children || []).map(normalizeNode) };
  for (const k of ['icon', 'note', 'collapsed', 'side', 'style', 'image']) if (n[k] != null && n[k] !== '') out[k] = n[k];
  if (Number.isFinite(n.offset?.x) && Number.isFinite(n.offset?.y)) out.offset = { x: n.offset.x, y: n.offset.y };
  const links = [...(n.link ? [{ url: n.link }] : []), ...(Array.isArray(n.links) ? n.links : [])].filter(l => l?.url);
  if (links.length) out.links = links.map(l => (l.title ? { url: String(l.url), title: String(l.title) } : { url: String(l.url) }));
  if (Array.isArray(n.files) && n.files.length) out.files = n.files.filter(f => f?.id).map(f => ({ id: f.id, name: String(f.name || 'tệp'), size: +f.size || 0, type: f.type || '' }));
  return out;
}
function newMap(root, title, extra = {}) {
  return {
    id: uid(), title: title || root.text || 'Sơ đồ chưa đặt tên', theme: 'classic', layout: 'map',
    root, relations: [], createdAt: Date.now(), updatedAt: Date.now(), view: null, ...extra,
  };
}
/** Chia nhánh cấp 1 sang trái/phải cho cân đối (chỉ với nhánh chưa có side). */
function assignSides(root) {
  let r = 0, l = 0;
  root.children.forEach(c => { if (c.side === 'left') l += countNodes(c); else if (c.side === 'right') r += countNodes(c); });
  root.children.forEach(c => {
    if (c.side) return;
    const w = countNodes(c);
    if (r <= l) { c.side = 'right'; r += w; } else { c.side = 'left'; l += w; }
  });
}

/* ---------------- Đọc/ghi các định dạng dàn ý ---------------- */
/** Biến văn bản thụt lề / Markdown thành danh sách nút gốc. */
function parseOutline(text) {
  const roots = [], stack = [];
  let headingDepth = -1, last = null;
  for (const raw of String(text).replace(/\r/g, '').split('\n')) {
    if (!raw.trim()) continue;
    const quote = /^\s*>\s?(.*)$/.exec(raw);
    if (quote && last) { last.note = (last.note ? last.note + '\n' : '') + quote[1]; continue; }
    let key, body;
    const h = /^\s*(#{1,6})\s+(.*)$/.exec(raw);
    if (h) {
      headingDepth = h[1].length - 1; key = headingDepth * 1000; body = h[2];
    } else {
      const ind = raw.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
      key = (headingDepth + 1) * 1000 + ind + 1;
      body = raw.trim().replace(/^([-*+•–]|\d+[.)])\s+/, '');
    }
    body = body.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\[( |x)\]\s*/i, '').trim();
    let link;
    const md = /^\[(.+?)\]\((https?:\/\/[^)]+)\)$/.exec(body);
    if (md) { body = md[1]; link = md[2]; }
    const node = { id: uid(), text: body, children: [] };
    if (link) node.links = [{ url: link }];
    while (stack.length && stack[stack.length - 1].key >= key) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node); else roots.push(node);
    stack.push({ key, node });
    last = node;
  }
  return roots;
}
function outlineToRoot(text, fallbackTitle = 'Chủ đề trung tâm') {
  const roots = parseOutline(text);
  if (!roots.length) return null;
  if (roots.length === 1) return roots[0];
  return { id: uid(), text: fallbackTitle, children: roots };
}
function toMarkdown(root) {
  const out = [`# ${root.text}`];
  if (root.note) root.note.split('\n').forEach(l => out.push('> ' + l));
  out.push('');
  const rec = (n, d) => {
    const [first, ...more] = n.links || [];
    const t = (first ? `[${n.text}](${first.url})` : n.text) + more.map(l => ` · [${linkLabel(l)}](${l.url})`).join('');
    out.push(`${'  '.repeat(d)}- ${n.icon ? n.icon + ' ' : ''}${t.replace(/\n/g, ' ')}`);
    if (n.note) n.note.split('\n').forEach(l => out.push(`${'  '.repeat(d + 1)}> ${l}`));
    n.children.forEach(c => rec(c, d + 1));
  };
  root.children.forEach(c => rec(c, 0));
  return out.join('\n') + '\n';
}
function toPlainOutline(node) {
  const out = [];
  walk(node, (n, p, d) => { out.push('  '.repeat(d) + n.text.replace(/\n/g, ' ')); });
  return out.join('\n');
}
function toFreeMind(root) {
  const rec = n => `<node TEXT="${esc(n.text)}"${n.links?.length ? ` LINK="${esc(n.links[0].url)}"` : ''}${n.side ? ` POSITION="${n.side}"` : ''}${n.collapsed ? ' FOLDED="true"' : ''}>` +
    (n.note ? `<richcontent TYPE="NOTE"><html><body><p>${esc(n.note)}</p></body></html></richcontent>` : '') +
    n.children.map(rec).join('') + '</node>';
  return `<map version="1.0.1">\n${rec(root)}\n</map>\n`;
}
function parseXmlTree(text) {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.querySelector('parsererror')) return null;
  const fm = doc.querySelector('map > node');
  if (fm) {
    const rec = el => {
      const n = { id: uid(), text: el.getAttribute('TEXT') || '', children: [] };
      if (el.getAttribute('LINK')) n.links = [{ url: el.getAttribute('LINK') }];
      if (el.getAttribute('FOLDED') === 'true') n.collapsed = true;
      const pos = el.getAttribute('POSITION'); if (pos === 'left' || pos === 'right') n.side = pos;
      const note = el.querySelector(':scope > richcontent[TYPE="NOTE"]');
      if (note) n.note = note.textContent.trim();
      [...el.children].filter(c => c.tagName === 'node').forEach(c => n.children.push(rec(c)));
      return n;
    };
    return rec(fm);
  }
  const body = doc.querySelector('opml > body');
  if (body) {
    const rec = el => {
      const n = { id: uid(), text: el.getAttribute('text') || el.getAttribute('title') || '', children: [] };
      if (el.getAttribute('_note')) n.note = el.getAttribute('_note');
      [...el.children].filter(c => c.tagName === 'outline').forEach(c => n.children.push(rec(c)));
      return n;
    };
    const tops = [...body.children].filter(c => c.tagName === 'outline').map(rec);
    const title = doc.querySelector('opml > head > title')?.textContent || 'Chủ đề trung tâm';
    return tops.length === 1 ? tops[0] : { id: uid(), text: title, children: tops };
  }
  return null;
}

/* ---------------- Mẫu có sẵn ---------------- */
const TEMPLATES = [
  { id: 'blank', name: 'Sơ đồ trống', text: 'Chủ đề trung tâm' },
  {
    id: 'brainstorm', name: 'Động não', icons: ['❓', '💡', '🛠️', '✅'], text: `Vấn đề cần giải quyết
  Câu hỏi
    Ai bị ảnh hưởng?
    Tại sao điều này quan trọng?
  Ý tưởng
    Ý tưởng 1
    Ý tưởng 2
    Ý tưởng 3
  Nguồn lực
    Con người
    Thời gian
    Kinh phí
  Hành động tiếp theo
    Việc cần làm ngay
    Người phụ trách` },
  {
    id: 'lesson', name: 'Kế hoạch bài dạy', theme: 'fresh', icons: ['🎯', '📚', '👩‍🏫', '📈'], text: `Tên bài học
  Mục tiêu
    Kiến thức
    Năng lực
    Phẩm chất
  Chuẩn bị
    Giáo viên: phiếu học tập, trình chiếu
    Học sinh: sách giáo khoa, dụng cụ
  Tiến trình dạy học
    Hoạt động 1: Mở đầu
    Hoạt động 2: Hình thành kiến thức
    Hoạt động 3: Luyện tập
    Hoạt động 4: Vận dụng
  Đánh giá
    Câu hỏi kiểm tra nhanh
    Bài tập về nhà` },
  {
    id: 'summary', name: 'Tóm tắt bài học', theme: 'chalk', layout: 'right', icons: ['🧠', '🧪', '⚠️', '✏️'], text: `Chủ đề bài học
  Khái niệm chính
    Định nghĩa
    Tính chất
  Ví dụ minh họa
    Ví dụ 1
    Ví dụ 2
  Lưu ý / lỗi hay gặp
  Bài tập tự luyện
    Cơ bản
    Nâng cao` },
  {
    id: 'swot', name: 'Phân tích SWOT', theme: 'ocean', icons: ['💪', '⚠️', '🚀', '🌩️'], text: `Phân tích SWOT
  Điểm mạnh
    Điểm mạnh 1
    Điểm mạnh 2
  Điểm yếu
    Điểm yếu 1
    Điểm yếu 2
  Cơ hội
    Cơ hội 1
    Cơ hội 2
  Thách thức
    Thách thức 1
    Thách thức 2` },
  {
    id: 'project', name: 'Kế hoạch dự án', icons: ['🎯', '📅', '👥', '💰', '⚠️'], text: `Tên dự án
  Mục tiêu
    Mục tiêu chính
    Tiêu chí thành công
  Mốc thời gian
    Giai đoạn 1
    Giai đoạn 2
    Nghiệm thu
  Nhân sự
    Trưởng nhóm
    Thành viên
  Ngân sách
  Rủi ro
    Rủi ro 1
    Phương án dự phòng` },
  {
    id: 'org', name: 'Sơ đồ tổ chức', layout: 'down', theme: 'ocean', text: `Hiệu trưởng
  Phó HT chuyên môn
    Tổ Toán – Tin
    Tổ Ngữ văn
    Tổ Ngoại ngữ
  Phó HT cơ sở vật chất
    Tổ Văn phòng
    Thư viện – Thiết bị
  Đoàn – Đội
    Ban chấp hành Đoàn` },
  {
    id: 'timeline', name: 'Dòng thời gian', layout: 'timeline', theme: 'fresh', text: `Việt Nam 1930 – 1975
  1930
    Thành lập Đảng Cộng sản Việt Nam
  1945
    Cách mạng tháng Tám
    2/9: Tuyên ngôn Độc lập
  1954
    Chiến thắng Điện Biên Phủ
    Hiệp định Giơ-ne-vơ
  1975
    Giải phóng miền Nam
    Thống nhất đất nước` },
  {
    id: 'fishbone', name: 'Phân tích nguyên nhân', layout: 'fishbone', text: `Kết quả học tập chưa cao
  Học sinh
    Chưa tự giác ôn bài
    Mất gốc kiến thức cũ
  Phương pháp
    Ít hoạt động thực hành
    Chưa phân hóa theo năng lực
  Giáo viên
    Lớp quá đông
    Ít thời gian kèm riêng
  Gia đình
    Ít quan tâm việc học
    Thiếu góc học tập
  Cơ sở vật chất
    Thiếu thiết bị dạy học` },
];
const GUIDE = {
  name: 'Hướng dẫn sử dụng', icons: ['👋', '🧭', '🎨', '📤'], text: `Chào mừng đến với Sodo
  Bắt đầu
    Nhấp đúp một nút để sửa chữ
    Tab: thêm nút con
    Enter: thêm nút cùng cấp
    Delete: xóa nút
  Sắp xếp
    Kéo nút ra chỗ trống để đặt tự do
    Alt + ↑/↓ để đổi thứ tự
    Bấm vòng tròn bên cạnh nút để thu gọn
  Trang trí
    Đổi màu, hình dạng ở bảng bên phải
    Thêm biểu tượng, ghi chú, liên kết
    Đổi chủ đề và bố cục ở thẻ Sơ đồ
  Chia sẻ
    Xuất ảnh PNG, SVG hoặc in PDF
    Xuất Markdown, FreeMind
    Trình chiếu từng nhánh`,
};
function mapFromTemplate(t) {
  const root = outlineToRoot(t.text);
  (t.icons || []).forEach((ic, i) => { if (root.children[i]) root.children[i].icon = ic; });
  assignSides(root);
  return newMap(root, t.id === 'blank' ? 'Sơ đồ mới' : root.text, { theme: t.theme || 'classic', layout: t.layout || 'map' });
}

/* ---------------- Lưu trữ ---------------- */
const Store = {
  index() { try { return JSON.parse(localStorage.getItem('sodo.index') || '[]'); } catch { return []; } },
  load(id) { try { return JSON.parse(localStorage.getItem('sodo.map.' + id)); } catch { return null; } },
  save(map, thumb) {
    try {
      localStorage.setItem('sodo.map.' + map.id, JSON.stringify(map));
      const list = this.index();
      const old = list.find(m => m.id === map.id);
      const entry = { id: map.id, title: map.title, updatedAt: map.updatedAt, count: countNodes(map.root), thumb: thumb ?? old?.thumb ?? null };
      localStorage.setItem('sodo.index', JSON.stringify([entry, ...list.filter(m => m.id !== map.id)]));
      if (typeof Drive !== 'undefined' && !Drive.busy) Drive.scheduleSync();
      return true;
    } catch (err) {
      console.error(err);
      toast('Không lưu được: bộ nhớ trình duyệt đã đầy. Hãy xuất tệp .json để sao lưu.', 4000);
      return false;
    }
  },
  remove(id) {
    localStorage.removeItem('sodo.map.' + id);
    localStorage.setItem('sodo.index', JSON.stringify(this.index().filter(m => m.id !== id)));
  },
};

/* =====================================================================
   BỐ CỤC — tính kích thước & vị trí mọi nút, cùng các đường nối.
   ===================================================================== */
const mctx = document.createElement('canvas').getContext('2d');
const wcache = new Map();
function tw(str, font) {
  const k = font + '\u0000' + str;
  let w = wcache.get(k);
  if (w == null) {
    mctx.font = font; w = mctx.measureText(str).width;
    if (wcache.size > 8000) wcache.clear();
    wcache.set(k, w);
  }
  return w;
}
function wrapText(text, font, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (let word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (tw(test, font) <= maxW) { line = test; continue; }
      if (line) { out.push(line); line = ''; }
      while (word.length > 1 && tw(word, font) > maxW) {
        let i = word.length - 1;
        while (i > 1 && tw(word.slice(0, i), font) > maxW) i--;
        out.push(word.slice(0, i)); word = word.slice(i);
      }
      line = word;
    }
    out.push(line);
  }
  return out;
}
/* ----- Công thức toán: chữ đặt giữa hai dấu $ được vẽ bằng MathJax (SVG) ----- */
const MATH_RE = /\$(?!\s)([^$\n]+?)(?<!\s)\$/g;
const hasMath = t => { MATH_RE.lastIndex = 0; return MATH_RE.test(t || ''); };
const MJ = {
  state: 'idle',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js',
  cache: new Map(),
  load() {
    if (this.state !== 'idle') return;
    this.state = 'loading';
    window.MathJax = { svg: { fontCache: 'none' }, startup: { typeset: false }, options: { enableMenu: false } };
    loadScript(this.src).then(() => window.MathJax.startup.promise).then(() => {
      this.state = 'ready';
      if (S.map) render();
    }).catch(err => { console.warn('Không tải được MathJax', err); this.state = 'failed'; });
  },
  /** Trả về { svg, w, h, d } với kích thước tính bằng px theo cỡ chữ fs. */
  get(tex, fs) {
    const key = fs + '|' + tex;
    let m = this.cache.get(key);
    if (m) return m;
    const ex = fs * 0.5;
    const node = window.MathJax.tex2svg(tex, { display: false, em: fs, ex });
    const svg = node.querySelector('svg');
    const w = parseFloat(svg.getAttribute('width')) * ex, h = parseFloat(svg.getAttribute('height')) * ex;
    const d = -parseFloat(/vertical-align:\s*(-?[\d.]+)ex/.exec(svg.getAttribute('style') || '')?.[1] || 0) * ex;
    svg.setAttribute('width', w.toFixed(2)); svg.setAttribute('height', h.toFixed(2));
    svg.removeAttribute('style'); svg.removeAttribute('focusable'); svg.removeAttribute('role');
    svg.querySelectorAll('title').forEach(t => t.remove());
    m = { svg: svg.outerHTML, w, h, d };
    if (this.cache.size > 2000) this.cache.clear();
    this.cache.set(key, m);
    return m;
  },
};
/** Chia chữ có công thức thành các dòng (tự xuống dòng theo bề rộng tối đa). Trả về null nếu MathJax chưa sẵn sàng. */
function mathLines(text, font, fs, lh, maxW) {
  if (MJ.state !== 'ready') { MJ.load(); return null; }
  const space = tw(' ', font), out = [];
  for (const para of String(text).split('\n')) {
    const tokens = [];
    let last = 0;
    MATH_RE.lastIndex = 0;
    for (let m; (m = MATH_RE.exec(para));) {
      para.slice(last, m.index).split(/(\s+)/).forEach(s => { if (s) tokens.push(/^\s+$/.test(s) ? { sp: true } : { t: 'text', s, w: tw(s, font) }); });
      try { tokens.push({ t: 'math', tex: m[1], ...MJ.get(m[1], fs) }); }
      catch { tokens.push({ t: 'text', s: m[0], w: tw(m[0], font) }); }
      last = m.index + m[0].length;
    }
    para.slice(last).split(/(\s+)/).forEach(s => { if (s) tokens.push(/^\s+$/.test(s) ? { sp: true } : { t: 'text', s, w: tw(s, font) }); });
    // xếp các mẩu vào dòng, giữ khoảng trắng giữa các mẩu
    let line = [], w = 0, pendingSpace = false;
    const flush = () => { out.push(line); line = []; w = 0; pendingSpace = false; };
    for (const tk of tokens) {
      if (tk.sp) { pendingSpace = line.length > 0; continue; }
      const add = (pendingSpace ? space : 0) + tk.w;
      if (line.length && w + add > maxW) flush();
      tk.x = w + (line.length && pendingSpace ? space : 0);
      w = tk.x + tk.w; line.push(tk); pendingSpace = false;
    }
    flush();
  }
  return out.map(segs => {
    const A = Math.max(fs * 0.78, ...segs.filter(s => s.t === 'math').map(s => s.h - s.d));
    const D = Math.max(fs * 0.24, ...segs.filter(s => s.t === 'math').map(s => s.d));
    const h = Math.max(lh, Math.ceil(A + D + 6));
    return { segs, w: segs.length ? segs[segs.length - 1].x + segs[segs.length - 1].w : 0, h, base: (h - A - D) / 2 + A, plain: segs.map(s => s.s ?? `$${s.tex}$`).join(' ') };
  });
}
/** Nội dung SVG của khối chữ có công thức, gốc tọa độ ở góc trên-trái khối chữ. */
function mathBlockSVG(b) {
  const [, ital, weight] = /^(italic )?(\d+)/.exec(b.font);
  const out = [];
  let y = 0;
  for (const l of b.mlines) {
    for (const s of l.segs) {
      if (s.t === 'math') out.push(s.svg.replace('<svg', `<svg x="${s.x.toFixed(2)}" y="${(y + l.base - (s.h - s.d)).toFixed(2)}"`).replace(/currentColor/g, b.text));
      else out.push(`<text x="${s.x.toFixed(2)}" y="${(y + l.base).toFixed(2)}" font-size="${b.fs}" font-weight="${weight}"${ital ? ' font-style="italic"' : ''} fill="${b.text}" xml:space="preserve">${esc(s.s)}</text>`);
    }
    y += l.h;
  }
  return out.join('');
}
const mathImgCache = new Map();
function mathImage(svg, color) {
  const key = color + svg;
  let im = mathImgCache.get(key);
  if (!im) {
    im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/currentColor/g, color));
    if (mathImgCache.size > 1000) mathImgCache.clear();
    mathImgCache.set(key, im);
  }
  return im;
}

const anchorY = b => (b.shape === 'underline' ? b.y + b.h - b.ul / 2 : b.y + b.h / 2);
const radiusOf = b => ({ rounded: b.depth === 0 ? 16 : 10, rect: 3, pill: b.h / 2 }[b.shape] || 0);

/* ---------------- Hình dạng nút & nét vẽ tay ---------------- */
const PATH_SHAPES = new Set(['ellipse', 'cloud', 'hexagon']);
const hashStr = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
const rng = seed => () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822507) + 0x6d2b79f5 >>> 0) / 4294967296);
/** Đường viền của nút trong hệ tọa độ riêng (0,0)–(w,h), lùi 1px cho nét viền 2px. */
function shapePath(shape, w, h, r) {
  const f = v => +v.toFixed(2);
  if (shape === 'ellipse') {
    const rx = w / 2 - 1, ry = h / 2 - 1;
    return `M1,${f(h / 2)} A${f(rx)},${f(ry)} 0 1 0 ${w - 1},${f(h / 2)} A${f(rx)},${f(ry)} 0 1 0 1,${f(h / 2)} Z`;
  }
  if (shape === 'hexagon') {
    const k = Math.min(h * 0.3, w / 3);
    return `M1,${f(h / 2)} L${f(k)},1 H${f(w - k)} L${w - 1},${f(h / 2)} L${f(w - k)},${h - 1} H${f(k)} Z`;
  }
  if (shape === 'cloud') {
    // Các "múi" cung tròn nối các điểm trên một hình elip nhỏ hơn
    const bump = Math.min(w, h) * 0.13, rx = w / 2 - bump - 1, ry = h / 2 - bump - 1;
    const per = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = Math.max(7, Math.round(per / (bump * 3.6)));
    const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + 0.3; return [w / 2 + rx * Math.cos(a), h / 2 + ry * Math.sin(a)]; });
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i <= n; i++) {
      const [x0, y0] = pts[i - 1], [x, y] = pts[i % n];
      const rr = Math.hypot(x - x0, y - y0) * 0.62;
      d += ` A${f(rr)},${f(rr)} 0 0 1 ${f(x)},${f(y)}`;
    }
    return d + ' Z';
  }
  r = Math.max(0, Math.min(r - 1, (h - 2) / 2, (w - 2) / 2));
  const R = f(r), x2 = w - 1, y2 = h - 1;
  return r ? `M${f(1 + r)},1 H${f(x2 - r)} A${R},${R} 0 0 1 ${x2},${f(1 + r)} V${f(y2 - r)} A${R},${R} 0 0 1 ${f(x2 - r)},${y2} H${f(1 + r)} A${R},${R} 0 0 1 1,${f(y2 - r)} V${f(1 + r)} A${R},${R} 0 0 1 ${f(1 + r)},1 Z`
    : `M1,1 H${x2} V${y2} H1 Z`;
}
/** Làm nét "run tay": lấy mẫu dọc đường path rồi lệch nhẹ theo pháp tuyến bằng nhiễu mượt (cố định theo seed). */
const roughCache = new Map();
let roughEl = null;
function roughen(d, seed, amp, closed = false) {
  const key = `${seed}|${amp}|${closed ? 1 : 0}|${d}`;
  const hit = roughCache.get(key);
  if (hit) return hit;
  if (!roughEl) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden');
    roughEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(roughEl); document.body.appendChild(svg);
  }
  const rand = rng(seed), out = [];
  for (const sub of d.split(/(?=M)/)) {
    roughEl.setAttribute('d', sub);
    const L = roughEl.getTotalLength();
    if (!(L > 1)) { out.push(sub); continue; }
    const n = Math.max(4, Math.ceil(L / 7));
    // Đường khép kín dùng tần số nguyên để điểm đầu và cuối khớp nhau
    const f1 = closed ? 1 + Math.floor(rand() * 2) : 0.6 + rand() * 1.2, f2 = closed ? 3 + Math.floor(rand() * 3) : 2.5 + rand() * 2.5;
    const p1 = rand() * 6.283, p2 = rand() * 6.283;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * L, t = closed ? (i / n) * 6.283 : s / 55;
      const p = roughEl.getPointAtLength(s), q = roughEl.getPointAtLength(Math.min(L, s + 0.5)), o = roughEl.getPointAtLength(Math.max(0, s - 0.5));
      const tx = q.x - o.x, ty = q.y - o.y, tl = Math.hypot(tx, ty) || 1;
      const taper = closed ? 1 : Math.min(1, Math.sin(Math.PI * i / n) * 1.6 + 0.15);
      const k = amp * taper * (Math.sin(t * f1 + p1) + 0.45 * Math.sin(t * f2 + p2));
      pts.push([p.x - (ty / tl) * k, p.y + (tx / tl) * k]);
    }
    if (closed) pts[pts.length - 1] = pts[0];
    const f = v => v.toFixed(1);
    let path = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) path += ` Q${f(pts[i][0])},${f(pts[i][1])} ${f((pts[i][0] + pts[i + 1][0]) / 2)},${f((pts[i][1] + pts[i + 1][1]) / 2)}`;
    path += ` L${f(pts.at(-1)[0])},${f(pts.at(-1)[1])}${closed ? ' Z' : ''}`;
    out.push(path);
  }
  const res = out.join(' ');
  if (roughCache.size > 4000) roughCache.clear();
  roughCache.set(key, res);
  return res;
}
/** Đường cong nối nút cha A với nút con B đã bị kéo đi: ngang hay dọc tùy B nằm bên cạnh hay phía trên/dưới. */
function connector(A, B) {
  const ca = A.x + A.w / 2, cb = B.x + B.w / 2, ma = A.y + A.h / 2, mb = B.y + B.h / 2;
  const gapX = Math.abs(cb - ca) - (A.w + B.w) / 2, gapY = Math.abs(mb - ma) - (A.h + B.h) / 2;
  if (gapX >= gapY) {
    const px = cb > ca ? A.x + A.w : A.x, py = anchorY(A), qx = cb > ca ? B.x : B.x + B.w, qy = anchorY(B), mx = (px + qx) / 2;
    return `M${px},${py} C${mx},${py} ${mx},${qy} ${qx},${qy}`;
  }
  const py = mb > ma ? A.y + A.h : A.y, qy = mb > ma ? B.y : B.y + B.h, my = (py + qy) / 2;
  return `M${ca},${py} C${ca},${my} ${cb},${my} ${cb},${qy}`;
}
/** Dịch một path chỉ gồm lệnh tuyệt đối (M L H V C Q A Z) đi (dx, dy). */
function shiftPath(d, dx, dy) {
  const f = v => +v.toFixed(2);
  return d.replace(/([MLHVCQAZ])([^MLHVCQAZ]*)/g, (_, c, args) => {
    const n = (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    if (c === 'H') return 'H' + n.map(v => f(v + dx)).join(' ');
    if (c === 'V') return 'V' + n.map(v => f(v + dy)).join(' ');
    if (c === 'A') return 'A' + n.map((v, i) => (i % 7 === 5 ? f(v + dx) : i % 7 === 6 ? f(v + dy) : v)).join(' ');
    if (c === 'Z') return 'Z';
    return c + n.map((v, i) => f(v + (i % 2 ? dy : dx))).join(' ');
  });
}
/** Như roughen nhưng tính theo hình dạng tương đối, nên đường nối chỉ bị dịch chỗ vẫn dùng lại được kết quả cũ. */
function roughenAt(d, seed, amp) {
  const m = /M\s*(-?[\d.]+)[ ,](-?[\d.]+)/.exec(d);
  if (!m) return roughen(d, seed, amp);
  const ox = +m[1], oy = +m[2];
  return shiftPath(roughen(shiftPath(d, -ox, -oy), seed, amp), ox, oy);
}
let sketchFont = 'idle';
function loadSketchFont() {
  if (sketchFont !== 'idle') return;
  sketchFont = 'loading';
  document.fonts.load('16px "Pangolin"', 'Tiếng Việt').then(() => {
    sketchFont = 'ready'; wcache.clear();
    if (S.map?.sketch) render();
  }).catch(() => { sketchFont = 'failed'; });
}

function computeLayout(map) {
  const theme = THEMES[map.theme] || THEMES.classic;
  const mode = map.layout || 'map';
  const fam = map.sketch ? SKETCH_FONT : FONT;
  if (map.sketch) loadSketchFont();
  const boxes = new Map(), edges = [];

  function prep(n, depth, branch, idx) {
    const st = n.style || {};
    const color = depth === 0 ? (st.color || theme.root.line)
      : (st.color || (depth === 1 ? theme.palette[idx % theme.palette.length] : branch));
    const shape = st.shape || (depth <= 1 ? 'rounded' : mode === 'down' ? 'rounded' : theme.deep);
    const boxed = shape !== 'underline' && shape !== 'none';
    let fill = 'transparent', stroke = null, text = theme.text;
    if (depth === 0) { fill = theme.root.fill; stroke = theme.root.stroke || null; text = theme.root.text; }
    else if (depth === 1) {
      if (theme.d1 === 'fill') { fill = color; text = ink(color); }
      else if (theme.d1 === 'tint') { fill = color + '2e'; stroke = color; }
      else stroke = color;
    } else if (boxed) stroke = color;
    if (st.fill) { fill = st.fill; if (fill !== 'transparent') text = ink(fill, '#ffffff', '#1f2937'); }
    if (!boxed) { fill = 'transparent'; stroke = null; }
    if (st.textColor) text = st.textColor;

    const fs = st.fontSize || (depth === 0 ? 24 : depth === 1 ? 17 : 14);
    const weight = st.bold != null ? (st.bold ? 700 : 400) : depth === 0 ? 700 : depth === 1 ? 600 : 400;
    const font = `${st.italic ? 'italic ' : ''}${weight} ${fs}px ${fam}`;
    const lh = Math.round(fs * 1.35);
    const [padX0, padT, padB] = boxed ? (depth === 0 ? [24, 14, 14] : depth === 1 ? [16, 9, 9] : [12, 6, 6]) : [4, 3, 7];
    const padX = shape === 'pill' ? padX0 + 6 : padX0;
    const maxW = depth === 0 ? 300 : 240;
    // Khi đang sửa chữ thì hiện dạng thô để ô nhập khớp vị trí; còn lại vẽ công thức
    const mlines = n.id !== S.editing && hasMath(n.text) ? mathLines(n.text, font, fs, lh, maxW) : null;
    const lines = mlines ? mlines.map(l => l.plain) : wrapText(n.text || '', font, maxW);
    const textW = Math.ceil(Math.max(depth === 0 ? 40 : 16, ...(mlines ? mlines.map(l => l.w) : lines.map(l => tw(l, font))))) + 2;
    const textH = mlines ? mlines.reduce((a, l) => a + l.h, 0) : lines.length * lh;
    const iconW = n.icon ? Math.round(fs * 1.25) + 4 : 0;
    const nInd = (n.note ? 1 : 0) + (n.links?.length ? 1 : 0) + (n.files?.length ? 1 : 0);
    const indW = nInd ? nInd * 18 + 4 : 0;
    // Ảnh (nếu có) nằm phía trên dòng chữ; hàng chữ được căn giữa theo bề rộng ảnh
    const contentW = iconW + textW + indW;
    const imgW = n.image ? Math.min(n.image.dw || 200, n.image.w) : 0;
    const imgH = n.image ? Math.round(imgW * n.image.h / n.image.w) : 0;
    const innerW = Math.max(contentW, imgW);
    const padL = padX + (innerW - contentW) / 2;
    const padTop = padT + (imgH ? imgH + 8 : 0);
    const w0 = Math.ceil(padX * 2 + innerW);
    const h0 = Math.ceil(padTop + padB + Math.max(textH, iconW ? fs * 1.3 : 0));
    // Hình bầu dục / đám mây / lục giác cần thêm chỗ để chữ nằm gọn bên trong
    const [dx, dy] = shape === 'hexagon' ? [Math.round(h0 * 0.3), 0]
      : shape === 'ellipse' ? [Math.round(w0 * 0.1 + 4), Math.round(h0 * 0.16 + 2)]
      : shape === 'cloud' ? [Math.round(w0 * 0.14 + 8), Math.round(h0 * 0.25 + 6)] : [0, 0];
    const w = w0 + 2 * dx, h = h0 + 2 * dy;
    const b = {
      id: n.id, node: n, depth, x: 0, y: 0, w, h, color, fill, stroke, text, shape, fs, font, lh, lines,
      padX: padX + dx, padL: padL + dx, padT: padTop + dy, padB: padB + dy, textW, textH, mlines, iconW, indW, dir: 1, kids: [],
      imgX: padX + dx + (innerW - imgW) / 2, imgY: padT + dy, imgW, imgH,
      ew: depth === 1 ? 3.5 : depth === 2 ? 2.2 : 1.6, ul: depth <= 1 ? 3 : 2,
    };
    // Hình vẽ bằng đường path (hình đặc biệt, hoặc mọi khung khi bật kiểu vẽ tay)
    if (boxed && (PATH_SHAPES.has(shape) || map.sketch)) {
      const d = shapePath(shape, w, h, radiusOf(b));
      // Vẽ tay: viền đi hai lượt lệch nhau như nét bút chì
      b.path = map.sketch ? roughen(d, hashStr(n.id), 1.9, true) + ' ' + roughen(d, hashStr(n.id) + 7, 1.6, true) : d;
    } else if (shape === 'underline' && map.sketch) b.upath = roughen(`M1,${h - b.ul / 2} H${w - 1}`, hashStr(n.id), 1.4);
    boxes.set(n.id, b);
    if (!n.collapsed) n.children.forEach((c, i) => { const k = prep(c, depth + 1, color, i); k.parent = b; b.kids.push(k); });
    return b;
  }
  const root = prep(map.root, 0, null, 0);
  const edge = (p, c, d) => edges.push({ from: p.id, to: c.id, d, color: c.color, w: c.ew });
  // Danh sách thụt lề kiểu cây thư mục: nút ở (left, top), con xếp dọc bên dưới; trả về chiều cao khối
  const treeIn = b => (b.depth === 0 ? 40 : 32);
  const treeH = b => (b.kids.length ? b.h + 12 + b.kids.reduce((a, k) => a + treeH(k) + 10, -10) : b.h);
  const treeW = b => Math.max(b.w, ...b.kids.map(k => treeIn(b) + treeW(k)));
  const extentOf = (b, f, a0) => b.kids.reduce((a, k) => extentOf(k, f, a), f(a0, b));
  const treePlace = (b, left, top) => {
    b.dir = 'tree'; b.x = left; b.y = top;
    let cy = top + b.h + 12;
    const x0 = b.x + Math.min(18, b.w / 2), y0 = b.y + b.h;
    for (const k of b.kids) {
      const hk = treePlace(k, left + treeIn(b), cy);
      const ky = anchorY(k), r = Math.min(8, ky - y0);
      edge(b, k, `M${x0},${y0} V${ky - r} Q${x0},${ky} ${x0 + r},${ky} H${k.x}`);
      cy += hk + 10;
    }
    return b.kids.length ? cy - 10 - top : b.h;
  };

  if (mode === 'down') {
    const HG = d => (d === 0 ? 40 : 22), VG = d => (d === 0 ? 64 : 46);
    const measure = b => {
      if (!b.kids.length) return (b.sw = b.w);
      const s = b.kids.reduce((a, k) => a + measure(k), 0) + HG(b.depth) * (b.kids.length - 1);
      return (b.sw = Math.max(b.w, s));
    };
    const place = (b, left, top) => {
      b.dir = 'down'; b.x = left + (b.sw - b.w) / 2; b.y = top;
      if (!b.kids.length) return;
      const total = b.kids.reduce((a, k) => a + k.sw, 0) + HG(b.depth) * (b.kids.length - 1);
      let cx = left + (b.sw - total) / 2;
      const ky = top + b.h + VG(b.depth);
      for (const k of b.kids) {
        place(k, cx, ky);
        const px = b.x + b.w / 2, py = b.y + b.h, qx = k.x + k.w / 2, qy = k.y, my = (py + qy) / 2;
        edge(b, k, `M${px},${py} C${px},${my} ${qx},${my} ${qx},${qy}`);
        cx += k.sw + HG(b.depth);
      }
    };
    measure(root); place(root, -root.sw / 2, -root.h / 2);
  } else if (mode === 'tree') {
    treePlace(root, -root.w / 2, -root.h / 2);
  } else if (mode === 'timeline') {
    // Gốc bên trái, các mốc (cấp 1) nằm trên trục ngang; ý con treo xen kẽ trên/dưới trục
    root.dir = 1; root.x = -root.w / 2; root.y = -root.h / 2;
    const axis = { color: root.color, w: 3 }, band = Math.max(root.h / 2, ...root.kids.map(k => k.h / 2)) + 16;
    const ext = [-Infinity, -Infinity];
    let ax = root.x + root.w, prev = root;
    root.kids.forEach((k, i) => {
      const up = i % 2 === 0, side = up ? 0 : 1;
      k.dir = up ? 'tree-up' : 'tree';
      k.x = Math.max(ax + 40, ext[side] + 28); k.y = -k.h / 2;
      edges.push({ from: prev.id, to: k.id, d: `M${ax},0 H${k.x}`, ...axis });
      if (k.kids.length) {
        const x0 = k.x + Math.min(18, k.w / 2);
        if (up) {
          let cy = -band - k.kids.reduce((a, c) => a + treeH(c) + 10, -10);
          for (const c of k.kids) {
            const hc = treePlace(c, k.x + 32, cy), ky = anchorY(c), r = Math.min(8, k.y - ky);
            edge(k, c, `M${x0},${k.y} V${ky + r} Q${x0},${ky} ${x0 + r},${ky} H${c.x}`);
            cy += hc + 10;
          }
        } else {
          let cy = band;
          const y0 = k.y + k.h;
          for (const c of k.kids) {
            const hc = treePlace(c, k.x + 32, cy), ky = anchorY(c), r = Math.min(8, ky - y0);
            edge(k, c, `M${x0},${y0} V${ky - r} Q${x0},${ky} ${x0 + r},${ky} H${c.x}`);
            cy += hc + 10;
          }
        }
      }
      ext[side] = Math.max(ext[side], extentOf(k, (a, c) => Math.max(a, c.x + c.w), -Infinity));
      ax = k.x + k.w; prev = k;
    });
    const end = ax + 44;
    edges.push({ from: prev.id, to: prev.id, d: `M${ax},0 H${end} M${end - 9},-6 L${end},0 L${end - 9},6`, ...axis });
  } else if (mode === 'fishbone') {
    // Đầu cá (gốc) bên phải, xương sống nằm ngang; nhóm nguyên nhân (cấp 1) trên các xương chéo,
    // nguyên nhân (cấp 2) là các gân ngang gắn vào xương chéo
    root.dir = -1; root.x = -root.w / 2; root.y = -root.h / 2;
    const m = 0.55, ext = [root.x - 6, root.x - 6], sxs = [];
    root.kids.forEach((k, i) => {
      const up = i % 2 === 0, side = up ? 0 : 1, s = up ? -1 : 1;
      k.dir = up ? 'down' : 'up';
      const causes = up ? k.kids.slice().reverse() : k.kids;
      const slots = [];
      let d = 22;
      for (const c of causes) { const th = treeH(c); slots.push([c, d, th]); d += th + 12; }
      const hb = Math.max(48, d - 12 + 18);
      const sx = ext[side] - 34 - Math.max(0, k.w / 2 - m * hb);
      const bx = t => sx - m * t;
      sxs.push(sx);
      k.x = bx(hb) - k.w / 2; k.y = up ? -hb - k.h : hb;
      edge(root, k, `M${sx},0 L${bx(hb)},${s * hb}`);
      for (const [c, d0, th] of slots) {
        const tw = treeW(c);
        treePlace(c, bx(d0 + th) - 14 - tw, up ? -(d0 + th) : d0);
        const ay = anchorY(c);
        edge(k, c, `M${c.x + c.w},${ay} H${bx(Math.abs(ay))}`);
      }
      ext[side] = Math.min(sx, extentOf(k, (a, c) => Math.min(a, c.x), Infinity));
    });
    const tail = Math.min(root.x - 60, ...sxs.map(x => x - 36), ...ext.map(x => x - 12));
    edges.push({ from: root.id, to: root.id, d: `M${root.x},0 H${tail}`, color: root.color, w: 4 });
  } else {
    const HG = d => (d === 0 ? 64 : 38), VG = d => (d === 0 ? 22 : 10);
    const measure = b => {
      if (!b.kids.length) return (b.sh = b.h);
      const s = b.kids.reduce((a, k) => a + measure(k), 0) + VG(b.depth) * (b.kids.length - 1);
      return (b.sh = Math.max(b.h, s));
    };
    const hEdge = (p, c, dir) => {
      const px = dir > 0 ? p.x + p.w : p.x, py = anchorY(p);
      const qx = dir > 0 ? c.x : c.x + c.w, qy = anchorY(c);
      const mx = (px + qx) / 2;
      edge(p, c, `M${px},${py} C${mx},${py} ${mx},${qy} ${qx},${qy}`);
    };
    const placeGroup = (parent, kids, dir, top) => {
      const total = kids.reduce((a, k) => a + k.sh, 0) + VG(parent.depth) * (kids.length - 1);
      let cy = top - total / 2;
      const ex = dir > 0 ? parent.x + parent.w + HG(parent.depth) : parent.x - HG(parent.depth);
      for (const k of kids) { place(k, ex, cy, dir); hEdge(parent, k, dir); cy += k.sh + VG(parent.depth); }
    };
    const place = (b, ex, top, dir) => {
      b.dir = dir; b.x = dir > 0 ? ex : ex - b.w; b.y = top + (b.sh - b.h) / 2;
      if (b.kids.length) placeGroup(b, b.kids, dir, b.y + b.h / 2);
    };
    root.x = -root.w / 2; root.y = -root.h / 2;
    root.dir = mode === 'left' ? -1 : 1;
    root.kids.forEach(measure);
    const right = mode === 'left' ? [] : mode === 'right' ? root.kids : root.kids.filter(k => k.node.side !== 'left');
    const left = mode === 'left' ? root.kids : mode === 'right' ? [] : root.kids.filter(k => k.node.side === 'left');
    if (right.length) placeGroup(root, right, 1, 0);
    if (left.length) placeGroup(root, left, -1, 0);
  }

  // Nút được kéo tự do: dời cả nhánh theo offset rồi nối lại đường tới nút cha
  const moved = [...boxes.values()].filter(b => b.depth > 0 && b.node.offset);
  if (moved.length) {
    const orig = new Map([...boxes.values()].map(b => [b.id, [b.x, b.y]]));
    const shiftSub = (b, dx, dy) => { b.x += dx; b.y += dy; b.kids.forEach(k => shiftSub(k, dx, dy)); };
    for (const b of moved) shiftSub(b, b.node.offset.x, b.node.offset.y);
    for (const e of edges) {
      const A = boxes.get(e.from), B = boxes.get(e.to), [ax, ay] = orig.get(e.from), [bx, by] = orig.get(e.to);
      const da = [A.x - ax, A.y - ay], db = [B.x - bx, B.y - by];
      if (da[0] === db[0] && da[1] === db[1]) { if (da[0] || da[1]) e.d = shiftPath(e.d, da[0], da[1]); }
      else e.d = connector(A, B);
    }
  }
  if (map.sketch) for (const e of edges) e.d = roughenAt(e.d, hashStr(e.from + e.to), 2.6);

  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const b of boxes.values()) {
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h);
  }
  return { boxes, edges, root, theme, mode, font: fam, bounds: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } };
}

/** Hình học của một mối nối (đường cong nét đứt có mũi tên). */
function relGeom(rel, L) {
  const A = L.boxes.get(rel.from), B = L.boxes.get(rel.to);
  if (!A || !B) return null;
  const ca = { x: A.x + A.w / 2, y: A.y + A.h / 2 }, cb = { x: B.x + B.w / 2, y: B.y + B.h / 2 };
  const border = (b, c, t) => {
    const dx = t.x - c.x, dy = t.y - c.y;
    const s = Math.min(Math.abs(dx) > 0.01 ? (b.w / 2 + 4) / Math.abs(dx) : Infinity, Math.abs(dy) > 0.01 ? (b.h / 2 + 4) / Math.abs(dy) : Infinity);
    return { x: c.x + dx * s, y: c.y + dy * s };
  };
  const a = border(A, ca, cb), b = border(B, cb, ca);
  const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist, ny = dx / dist, k = clamp(dist * 0.3, 30, 140);
  const c1 = { x: a.x + dx * 0.25 + nx * k, y: a.y + dy * 0.25 + ny * k };
  const c2 = { x: a.x + dx * 0.75 + nx * k, y: a.y + dy * 0.75 + ny * k };
  const ang = Math.atan2(b.y - c2.y, b.x - c2.x), s = 11;
  const head = [b, { x: b.x - s * Math.cos(ang - 0.42), y: b.y - s * Math.sin(ang - 0.42) }, { x: b.x - s * Math.cos(ang + 0.42), y: b.y - s * Math.sin(ang + 0.42) }];
  return {
    d: `M${a.x},${a.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${b.x},${b.y}`,
    head: `M${head.map(p => `${p.x},${p.y}`).join(' L')} Z`,
    mid: { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 },
  };
}

/* =====================================================================
   VẼ RA ẢNH (PNG/thumbnail) & SVG — dùng chung dữ liệu bố cục.
   ===================================================================== */
function renderCanvas(map, { scale = 2, pad = 48, width, height } = {}) {
  const L = computeLayout(map), bb = L.bounds;
  const W = bb.w + pad * 2, H = bb.h + pad * 2;
  let k = width ? Math.min(width / W, height / H) : scale;
  if (!width) k = Math.min(k, 12000 / Math.max(W, H));
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(width || W * k); cv.height = Math.ceil(height || H * k);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = L.theme.bg; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, (cv.width - W * k) / 2 + (pad - bb.x) * k, (cv.height - H * k) / 2 + (pad - bb.y) * k);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const e of L.edges) { ctx.strokeStyle = e.color; ctx.lineWidth = e.w; ctx.stroke(new Path2D(e.d)); }
  for (const b of L.boxes.values()) drawNodeCanvas(ctx, b);
  ctx.font = `500 12px ${FONT}`;
  for (const r of map.relations || []) {
    const g = relGeom(r, L); if (!g) continue;
    ctx.strokeStyle = ctx.fillStyle = L.theme.rel; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
    ctx.stroke(new Path2D(g.d)); ctx.setLineDash([]); ctx.fill(new Path2D(g.head));
    if (r.label) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = L.theme.bg; ctx.lineWidth = 5; ctx.strokeText(r.label, g.mid.x, g.mid.y);
      ctx.fillStyle = L.theme.rel; ctx.fillText(r.label, g.mid.x, g.mid.y); ctx.textAlign = 'left';
    }
  }
  return cv;
}
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}
function drawNodeCanvas(ctx, b) {
  const r = radiusOf(b);
  if (b.path || b.upath) {
    ctx.save(); ctx.translate(b.x, b.y);
    if (b.path) {
      const p = new Path2D(b.path);
      if (b.fill && b.fill !== 'transparent') { ctx.fillStyle = b.fill; ctx.fill(p); }
      if (b.stroke) { ctx.strokeStyle = b.stroke; ctx.lineWidth = 2; ctx.stroke(p); }
    }
    if (b.upath) { ctx.strokeStyle = b.color; ctx.lineWidth = b.ul; ctx.stroke(new Path2D(b.upath)); }
    ctx.restore();
  } else {
    if (b.fill && b.fill !== 'transparent') { ctx.fillStyle = b.fill; roundRectPath(ctx, b.x, b.y, b.w, b.h, r); ctx.fill(); }
    if (b.shape === 'underline') { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y + b.h - b.ul, b.w, b.ul); }
    else if (b.stroke) { ctx.strokeStyle = b.stroke; ctx.lineWidth = 2; roundRectPath(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, Math.max(0, r - 1)); ctx.stroke(); }
  }
  const innerH = b.h - b.padT - b.padB, midY = b.y + b.padT + innerH / 2;
  const top = midY - b.textH / 2;
  let x = b.x + b.padL;
  const im = b.node.image && imageFor(b.node.image.src);
  if (im?.complete && im.naturalWidth) {
    ctx.save(); roundRectPath(ctx, b.x + b.imgX, b.y + b.imgY, b.imgW, b.imgH, 6); ctx.clip();
    ctx.drawImage(im, b.x + b.imgX, b.y + b.imgY, b.imgW, b.imgH); ctx.restore();
  }
  ctx.textBaseline = 'middle';
  if (b.node.icon) { ctx.font = `${b.fs}px ${EMOJI_FONT}`; ctx.fillStyle = b.text; ctx.fillText(b.node.icon, x, midY); x += b.iconW; }
  ctx.font = b.font; ctx.fillStyle = b.text;
  if (b.mlines) {
    ctx.textBaseline = 'alphabetic';
    let y = top;
    for (const l of b.mlines) {
      for (const sg of l.segs) {
        if (sg.t === 'text') ctx.fillText(sg.s, x + sg.x, y + l.base);
        else { const im = mathImage(sg.svg, b.text); if (im.complete && im.naturalWidth) ctx.drawImage(im, x + sg.x, y + l.base - (sg.h - sg.d), sg.w, sg.h); }
      }
      y += l.h;
    }
    ctx.textBaseline = 'middle';
  } else b.lines.forEach((l, i) => ctx.fillText(l, x, top + b.lh * (i + 0.5)));
  if (b.indW) {
    ctx.font = `12px ${EMOJI_FONT}`;
    let ix = x + b.textW + 6;
    if (b.node.note) { ctx.fillText('📝', ix, midY); ix += 18; }
    if (b.node.links?.length) { ctx.fillText('🔗', ix, midY); ix += 18; }
    if (b.node.files?.length) ctx.fillText('📎', ix, midY);
  }
}
/** Khung nút vẽ bằng path (dùng chung cho màn hình và xuất SVG). */
const nodeShapeSVG = b => (b.path ? `<path d="${b.path}" fill="${b.fill === 'transparent' ? 'none' : b.fill}" stroke="${b.stroke || 'none'}" stroke-width="2" stroke-linejoin="round"/>` : '')
  + (b.upath ? `<path d="${b.upath}" fill="none" stroke="${b.color}" stroke-width="${b.ul}" stroke-linecap="round"/>` : '');
function renderSVG(map) {
  const L = computeLayout(map), bb = L.bounds, pad = 48;
  const W = Math.ceil(bb.w + pad * 2), H = Math.ceil(bb.h + pad * 2);
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${bb.x - pad} ${bb.y - pad} ${W} ${H}" font-family="${esc(L.font)}">`,
    `<rect x="${bb.x - pad}" y="${bb.y - pad}" width="${W}" height="${H}" fill="${L.theme.bg}"/>`];
  for (const e of L.edges) o.push(`<path d="${e.d}" fill="none" stroke="${e.color}" stroke-width="${e.w}" stroke-linecap="round"/>`);
  for (const b of L.boxes.values()) {
    const r = radiusOf(b);
    if (b.path || b.upath) o.push(`<g transform="translate(${b.x} ${b.y})">${nodeShapeSVG(b)}</g>`);
    else {
      if (b.fill !== 'transparent') o.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${r}" fill="${b.fill}"/>`);
      if (b.shape === 'underline') o.push(`<rect x="${b.x}" y="${b.y + b.h - b.ul}" width="${b.w}" height="${b.ul}" fill="${b.color}"/>`);
      else if (b.stroke) o.push(`<rect x="${b.x + 1}" y="${b.y + 1}" width="${b.w - 2}" height="${b.h - 2}" rx="${Math.max(0, r - 1)}" fill="none" stroke="${b.stroke}" stroke-width="2"/>`);
    }
    const midY = b.y + b.padT + (b.h - b.padT - b.padB) / 2, top = midY - b.textH / 2;
    let x = b.x + b.padL;
    if (b.node.image) o.push(`<image href="${b.node.image.src}" x="${b.x + b.imgX}" y="${b.y + b.imgY}" width="${b.imgW}" height="${b.imgH}" preserveAspectRatio="none"/>`);
    const [, ital, weight] = /^(italic )?(\d+)/.exec(b.font);
    if (b.node.icon) { o.push(`<text x="${x}" y="${midY}" font-size="${b.fs}" dominant-baseline="central">${esc(b.node.icon)}</text>`); x += b.iconW; }
    if (b.mlines) o.push(`<g transform="translate(${x} ${top})">${mathBlockSVG(b)}</g>`);
    else b.lines.forEach((l, i) => o.push(`<text x="${x}" y="${top + b.lh * (i + 0.5)}" font-size="${b.fs}" font-weight="${weight}"${ital ? ' font-style="italic"' : ''} fill="${b.text}" dominant-baseline="central" xml:space="preserve">${esc(l)}</text>`));
    if (b.indW) o.push(`<text x="${x + b.textW + 6}" y="${midY}" font-size="12" dominant-baseline="central">${b.node.note ? '📝' : ''}${b.node.links?.length ? '🔗' : ''}${b.node.files?.length ? '📎' : ''}</text>`);
  }
  for (const r of map.relations || []) {
    const g = relGeom(r, L); if (!g) continue;
    o.push(`<path d="${g.d}" fill="none" stroke="${L.theme.rel}" stroke-width="2" stroke-dasharray="7 5"/><path d="${g.head}" fill="${L.theme.rel}"/>`);
    if (r.label) o.push(`<text x="${g.mid.x}" y="${g.mid.y}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="500" fill="${L.theme.rel}" stroke="${L.theme.bg}" stroke-width="5" paint-order="stroke">${esc(r.label)}</text>`);
  }
  o.push('</svg>');
  return o.join('\n');
}
/** Ảnh trong nút được tải sẵn để vẽ lên canvas khi xuất PNG / ảnh thu nhỏ. */
const imgCache = new Map();
function imageFor(src) {
  let im = imgCache.get(src);
  if (!im) { im = new Image(); im.src = src; imgCache.set(src, im); }
  return im;
}
function preloadImages(map) {
  const list = [];
  walk(map.root, n => { if (n.image) list.push(imageFor(n.image.src)); });
  if (MJ.state === 'ready') {
    for (const b of computeLayout(map).boxes.values()) {
      b.mlines?.forEach(l => l.segs.forEach(sg => { if (sg.t === 'math') list.push(mathImage(sg.svg, b.text)); }));
    }
  }
  return Promise.all(list.map(im => (im.complete ? null : new Promise(r => { im.onload = im.onerror = r; }))));
}
const makeThumb = map => renderCanvas(map, { width: 400, height: 250, pad: 30 }).toDataURL('image/jpeg', 0.78);

/* =====================================================================
   TRẠNG THÁI TRÌNH SOẠN THẢO
   ===================================================================== */
const S = {
  map: null, L: null, index: new Map(), sel: null, selRel: null, editing: null,
  view: { x: 0, y: 0, k: 1 }, undo: [], redo: [], panelTab: 'node', panelOpen: true, outlineOpen: false,
  relFrom: null, matches: null, matchList: [], matchIdx: -1, presenting: null, clip: null, clipText: '',
};
const canvas = $('#canvas'), world = $('#world'), nodesEl = $('#nodes'), edgesEl = $('#edges'), relsEl = $('#rels');
const editorEl = $('#node-editor'), panelBody = $('#panel-body'), olList = $('#ol-list');

function reindex() {
  S.index = new Map();
  walk(S.map.root, (n, p, d) => { S.index.set(n.id, { node: n, parent: p, depth: d }); });
}
const getNode = id => S.index.get(id)?.node;
const parentOf = id => S.index.get(id)?.parent;
const isRoot = id => id === S.map.root.id;
function isInside(id, ancestorId) {
  for (let cur = id; cur; cur = parentOf(cur)?.id) if (cur === ancestorId) return true;
  return false;
}

/* ----- Lịch sử thao tác ----- */
const snap = () => JSON.stringify({ root: S.map.root, relations: S.map.relations, layout: S.map.layout, theme: S.map.theme, sketch: !!S.map.sketch });
function pushHist(s = snap()) { S.undo.push(s); if (S.undo.length > 200) S.undo.shift(); S.redo.length = 0; }
function restore(s) {
  Object.assign(S.map, JSON.parse(s)); reindex();
  if (!S.index.has(S.sel)) S.sel = null;
  if (!S.map.relations.some(r => r.id === S.selRel)) S.selRel = null;
}
function undo() { if (S.editing) commitEdit(); if (!S.undo.length) return; S.redo.push(snap()); restore(S.undo.pop()); changed(); }
function redo() { if (!S.redo.length) return; S.undo.push(snap()); restore(S.redo.pop()); changed(); }
function commit(fn) { pushHist(); fn(); changed(); }
function changed() { reindex(); render(); scheduleSave(); }

/* ----- Lưu tự động ----- */
let saveTimer, thumbTimer;
/** content=false: chỉ lưu vị trí xem (kéo/zoom), không tính là đã sửa sơ đồ. */
function scheduleSave(content = true) {
  if (content) S.dirty = true;
  $('#save-state').textContent = 'Đang lưu…';
  clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 450);
  clearTimeout(thumbTimer); thumbTimer = setTimeout(() => saveNow(true), 2500);
}
function saveNow(withThumb = false) {
  if (!S.map) return;
  clearTimeout(saveTimer);
  if (S.temp) { clearTimeout(thumbTimer); $('#save-state').textContent = 'Bản chia sẻ · chưa lưu'; return; }
  if (withThumb) clearTimeout(thumbTimer);
  if (S.dirty) { S.map.updatedAt = Date.now(); S.dirty = false; }
  S.map.view = { ...S.view };
  let thumb;
  if (withThumb) { try { thumb = makeThumb(S.map); } catch (e) { console.warn(e); } }
  if (Store.save(S.map, thumb)) $('#save-state').textContent = 'Đã lưu';
}

/* =====================================================================
   VẼ LÊN MÀN HÌNH
   ===================================================================== */
/** Vẽ lại riêng phần sơ đồ (không đụng bảng bên phải) — dùng khi kéo nút. */
function drawMap() {
  const L = (S.L = computeLayout(S.map));
  const pf = S.presenting ? presentFocus() : null;
  edgesEl.innerHTML = L.edges.map(e => `<path d="${e.d}" stroke="${e.color}" stroke-width="${e.w}" fill="none" stroke-linecap="round"${pf && pf.has(e.to) && pf.has(e.from) ? ' class="pf"' : ''}/>`).join('');
  renderNodes(L, pf);
  renderRels(L);
  positionEditor(L);
  return L;
}
function render() {
  if (!S.map) return;
  const L = drawMap();
  canvas.style.backgroundColor = L.theme.bg;
  canvas.style.backgroundImage = `radial-gradient(${L.theme.dot} 1.2px, transparent 1.3px)`;
  applyView();
  renderPanel();
  if (S.outlineOpen) renderOutline();
  $('[data-act="undo"]').disabled = !S.undo.length;
  $('[data-act="redo"]').disabled = !S.redo.length;
}

function togglePos(b) {
  const ay = anchorY(b) - b.y;
  if (b.dir === 'down') return [b.w / 2, b.h + 11];
  if (b.dir === 'tree') return [Math.min(18, b.w / 2), b.h + 11];
  if (b.dir === 'tree-up') return [Math.min(18, b.w / 2), -11];
  if (b.dir === 'up') return [b.w / 2, -11];
  return b.dir > 0 ? [b.w + 11, ay] : [-11, ay];
}
function countDesc(n) { return countNodes(n) - 1; }

function renderNodes(L, pf) {
  const out = [];
  for (const b of L.boxes.values()) {
    const n = b.node;
    const cls = ['node', 's-' + b.shape];
    const drawn = b.path || b.upath;
    if (drawn) cls.push('s-path');
    if (b.id === S.sel) cls.push('sel');
    if (b.id === S.editing) cls.push('editing');
    if (S.matches?.has(b.id)) cls.push('match');
    if (pf?.has(b.id)) cls.push('pf');
    if (S.quiz && !S.quiz.shown.has(b.id)) cls.push('hid');
    const shadow = drawn ? 'none' : b.shape === 'underline' ? `inset 0 -${b.ul}px 0 ${b.color}` : b.stroke ? `inset 0 0 0 2px ${b.stroke}` : 'none';
    const style = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;padding:${b.padT}px ${b.padX}px ${b.padB}px ${b.padL}px;` +
      `background:${drawn ? 'transparent' : b.fill};color:${b.text};font:${b.font};line-height:${b.lh}px;border-radius:${drawn ? 0 : radiusOf(b)}px;box-shadow:${shadow};--c:${b.color}`;
    let inner = drawn ? `<svg class="nshape" width="${b.w}" height="${b.h}">${nodeShapeSVG(b)}</svg>` : '';
    if (n.image) inner += `<img class="nimg" src="${n.image.src}" alt="" draggable="false" style="left:${b.imgX}px;top:${b.imgY}px;width:${b.imgW}px;height:${b.imgH}px">`;
    if (n.icon) inner += `<span class="ic" style="width:${b.iconW}px;font-size:${b.fs}px">${esc(n.icon)}</span>`;
    inner += b.mlines
      ? `<svg class="tx" width="${b.textW}" height="${b.textH}" style="overflow:visible;font-family:${L.font}">${mathBlockSVG(b)}</svg>`
      : `<span class="tx">${esc(b.lines.join('\n'))}</span>`;
    if (b.indW) {
      inner += '<span class="inds">' +
        (n.note ? `<span class="ind" data-act="ind-note" data-id="${b.id}" title="${esc(n.note)}">📝</span>` : '') +
        (n.links?.length ? `<span class="ind" data-act="ind-link" data-id="${b.id}" title="${esc(n.links.map(linkLabel).join('\n'))}">🔗</span>` : '') +
        (n.files?.length ? `<span class="ind" data-act="ind-files" data-id="${b.id}" title="${esc(n.files.map(f => f.name).join('\n'))}">📎</span>` : '') + '</span>';
    }
    if (!S.presenting) {
      const [tx, ty] = togglePos(b);
      const pos = `left:${tx}px;top:${ty}px`;
      const hasTog = b.depth > 0 && n.children.length;
      if (hasTog) {
        inner += n.collapsed
          ? `<button class="tog col" data-act="tog" data-id="${b.id}" style="${pos}" title="Mở rộng">${countDesc(n)}</button>`
          : `<button class="tog" data-act="tog" data-id="${b.id}" style="${pos}" title="Thu gọn">−</button>`;
      }
      if (b.id === S.sel && !S.editing && !S.quiz) {
        // Nút "+" luôn hiện ở nút đang chọn; nếu đã có nút thu gọn thì đặt lệch ra ngoài
        const off = hasTog ? 24 : 0;
        const [ax, ay] = typeof b.dir === 'string' ? [tx + off, ty] : [tx + off * b.dir, ty];
        inner += `<button class="tog add" data-act="tog-add" data-id="${b.id}" style="left:${ax}px;top:${ay}px" title="Thêm nút con (Tab)">+</button>`;
      }
    }
    out.push(`<div class="${cls.join(' ')}" data-id="${b.id}" style="${style}">${inner}</div>`);
  }
  nodesEl.innerHTML = out.join('');
}

function renderRels(L) {
  const color = L.theme.rel;
  relsEl.innerHTML = (S.map.relations || []).map(r => {
    const g = relGeom(r, L); if (!g) return '';
    return `<g class="rel-g${r.id === S.selRel ? ' sel' : ''}">
      <path class="rel" d="${g.d}" stroke="${color}"/><path class="rel-head" d="${g.head}" fill="${color}"/>
      ${r.label ? `<text class="rel-label" x="${g.mid.x}" y="${g.mid.y}" text-anchor="middle" dominant-baseline="central" fill="${color}" stroke="${L.theme.bg}">${esc(r.label)}</text>` : ''}
      <path class="rel-hit" data-rel="${r.id}" d="${g.d}"/></g>`;
  }).join('');
}

function applyView() {
  const v = S.view;
  world.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`;
  const g = 24 * v.k;
  canvas.style.backgroundSize = `${g}px ${g}px`;
  canvas.style.backgroundPosition = `${v.x}px ${v.y}px`;
  $('#zoom-label').textContent = Math.round(v.k * 100) + '%';
}
function animateView(fn) {
  world.classList.add('anim');
  fn(); applyView();
  clearTimeout(animateView.t);
  animateView.t = setTimeout(() => world.classList.remove('anim'), 420);
}
function zoomAt(k, sx, sy) {
  const r = canvas.getBoundingClientRect();
  const px = (sx ?? r.left + r.width / 2) - r.left, py = (sy ?? r.top + r.height / 2) - r.top;
  k = clamp(k, 0.15, 4);
  const wx = (px - S.view.x) / S.view.k, wy = (py - S.view.y) / S.view.k;
  S.view = { k, x: px - wx * k, y: py - wy * k };
  applyView();
}
function fitTo(bb, { max = 1, pad = 60, anim = true } = {}) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const k = clamp(Math.min((W - pad * 2) / bb.w, (H - pad * 2) / bb.h, max), 0.15, 4);
  const set = () => { S.view = { k, x: W / 2 - (bb.x + bb.w / 2) * k, y: H / 2 - (bb.y + bb.h / 2) * k }; };
  if (anim) animateView(set); else { set(); applyView(); }
}
const fitAll = (anim = true) => S.L && fitTo(S.L.bounds, { anim });
function centerOn(id, anim = true) {
  const b = S.L.boxes.get(id); if (!b) return;
  const set = () => { S.view.x = canvas.clientWidth / 2 - (b.x + b.w / 2) * S.view.k; S.view.y = canvas.clientHeight / 2 - (b.y + b.h / 2) * S.view.k; };
  anim ? animateView(set) : (set(), applyView());
}
function ensureVisible(id) {
  const b = S.L?.boxes.get(id); if (!b) return;
  const { x, y, k } = S.view, W = canvas.clientWidth, H = canvas.clientHeight, m = 50;
  const l = b.x * k + x, t = b.y * k + y, r = l + b.w * k, btm = t + b.h * k;
  let dx = 0, dy = 0;
  if (l < m) dx = m - l; else if (r > W - m) dx = Math.max(W - m - r, m - l);
  if (t < m) dy = m - t; else if (btm > H - m) dy = Math.max(H - m - btm, m - t);
  if (dx || dy) animateView(() => { S.view.x += dx; S.view.y += dy; });
}
const screenToWorld = (cx, cy) => {
  const r = canvas.getBoundingClientRect();
  return { x: (cx - r.left - S.view.x) / S.view.k, y: (cy - r.top - S.view.y) / S.view.k };
};

/* =====================================================================
   THAO TÁC VỚI NÚT
   ===================================================================== */
function select(id, { reveal = false } = {}) {
  if (S.editing && S.editing !== id) commitEdit();
  S.sel = id; S.selRel = null;
  if (id) S.panelTab = 'node';
  render();
  if (reveal && id) ensureVisible(id);
}
function pickSide() {
  let r = 0, l = 0;
  S.map.root.children.forEach(c => { const w = countNodes(c); c.side === 'left' ? (l += w) : (r += w); });
  return r <= l ? 'right' : 'left';
}
const blankNode = (text = 'Ý tưởng mới') => ({ id: uid(), text, children: [] });

function addChild(pid = S.sel, { edit = true } = {}) {
  if (!pid) pid = S.map.root.id;
  if (S.editing) commitEdit();
  const n = blankNode();
  commit(() => {
    const p = getNode(pid);
    if (isRoot(pid)) n.side = pickSide();
    p.children.push(n); p.collapsed = false;
    S.sel = n.id; S.selRel = null; S.panelTab = 'node';
  });
  if (edit) startEdit(n.id, { fresh: true });
  return n.id;
}
function addSibling(id = S.sel, { edit = true, before = false } = {}) {
  if (!id || isRoot(id)) return addChild(S.map.root.id, { edit });
  if (S.editing) commitEdit();
  const n = blankNode();
  commit(() => {
    const p = parentOf(id), cur = getNode(id);
    if (isRoot(p.id)) n.side = cur.side || 'right';
    p.children.splice(p.children.indexOf(cur) + (before ? 0 : 1), 0, n);
    S.sel = n.id; S.selRel = null;
  });
  if (edit) startEdit(n.id, { fresh: true });
  return n.id;
}
function deleteNode(id = S.sel) {
  if (!id) return;
  if (isRoot(id)) { toast('Không thể xóa chủ đề trung tâm'); return; }
  const p = parentOf(id), cur = getNode(id);
  const i = p.children.indexOf(cur);
  const next = p.children[i + 1] || p.children[i - 1] || p;
  commit(() => {
    const gone = new Set(); walk(cur, n => { gone.add(n.id); });
    p.children.splice(i, 1);
    S.map.relations = S.map.relations.filter(r => !gone.has(r.from) && !gone.has(r.to));
    S.sel = next.id;
  });
}
function toggleCollapse(id = S.sel) {
  const n = getNode(id);
  if (!n || !n.children.length || isRoot(id)) return;
  commit(() => { n.collapsed = !n.collapsed; });
}
function setCollapsedAll(collapsed) {
  commit(() => walk(S.map.root, (n, p, d) => {
    if (d === 0) return;
    if (n.children.length) n.collapsed = collapsed && d >= 1;
  }));
  fitAll();
}
function expandTo(id) {
  for (let p = parentOf(id); p; p = parentOf(p.id)) p.collapsed = false;
}
function moveNode(id, targetId, pos, side) {
  if (id === targetId || isInside(targetId, id)) return;
  commit(() => {
    const node = getNode(id), from = parentOf(id);
    from.children.splice(from.children.indexOf(node), 1);
    const target = getNode(targetId);
    let parent;
    if (pos === 'child') { parent = target; target.children.push(node); target.collapsed = false; }
    else {
      parent = parentOf(targetId);
      parent.children.splice(parent.children.indexOf(target) + (pos === 'after' ? 1 : 0), 0, node);
    }
    if (parent === S.map.root) node.side = side || (pos === 'child' ? pickSide() : target.side) || 'right';
    else delete node.side;
    delete node.offset;
    S.sel = id;
  });
}
function reorder(delta) {
  const id = S.sel; if (!id || isRoot(id)) return;
  const p = parentOf(id), list = p.children, i = list.indexOf(getNode(id));
  const sameSide = c => !(isRoot(p.id) && S.map.layout === 'map') || (c.side === 'left') === (list[i].side === 'left');
  let j = i + delta;
  while (j >= 0 && j < list.length && !sameSide(list[j])) j += delta;
  if (j < 0 || j >= list.length) return;
  commit(() => { const [n] = list.splice(i, 1); list.splice(j, 0, n); });
}
function setStyle(key, val) {
  const n = getNode(S.sel); if (!n) return;
  commit(() => {
    n.style = { ...(n.style || {}) };
    if (val === '' || val == null) delete n.style[key]; else n.style[key] = val;
    if (key === 'fill' && val && S.L.boxes.get(n.id) && ['underline', 'none'].includes(S.L.boxes.get(n.id).shape)) n.style.shape = 'rounded';
    if (!Object.keys(n.style).length) delete n.style;
  });
}
function setProp(key, val) {
  const n = getNode(S.sel); if (!n) return;
  commit(() => { if (val === '' || val == null) delete n[key]; else n[key] = val; });
}

/* ----- Mối nối ----- */
function startRelate() {
  if (!S.sel) { toast('Hãy chọn nút bắt đầu trước'); return; }
  S.relFrom = S.sel;
  canvas.classList.add('relating');
  showHint('Bấm vào nút đích để nối · Esc để hủy');
}
function endRelate() { S.relFrom = null; canvas.classList.remove('relating'); showHint(null); }
function finishRelate(toId) {
  const from = S.relFrom; endRelate();
  if (!from || from === toId) return;
  const rel = { id: uid(), from, to: toId, label: '' };
  commit(() => { S.map.relations.push(rel); S.selRel = rel.id; S.sel = null; S.panelTab = 'node'; });
}
function showHint(text) { const h = $('#hint'); h.hidden = !text; h.textContent = text || ''; }

/* ----- Sửa chữ trực tiếp trên nút ----- */
function startEdit(id, { fresh = false, initial = null, caretEnd = false } = {}) {
  if (S.editing) commitEdit();
  const n = getNode(id); if (!n) return;
  S.sel = id;
  S.editing = id; S.editFresh = fresh; S.editOrig = n.text; S.editSnap = fresh ? null : snap();
  if (initial !== null) n.text = initial;
  editorEl.value = n.text; editorEl.hidden = false;
  render();
  editorEl.focus({ preventScroll: true });
  if (initial !== null || caretEnd) editorEl.setSelectionRange(n.text.length, n.text.length); else editorEl.select();
  ensureVisible(id);
}
function positionEditor(L) {
  if (!S.editing) { editorEl.hidden = true; return; }
  const b = L.boxes.get(S.editing);
  if (!b) { S.editing = null; editorEl.hidden = true; return; }
  const innerH = b.h - b.padT - b.padB, th = b.textH;
  Object.assign(editorEl.style, {
    left: b.x + b.padL + b.iconW + 'px', top: b.y + b.padT + (innerH - th) / 2 + 'px',
    width: b.textW + 6 + 'px', height: th + 'px', font: b.font, lineHeight: b.lh + 'px', color: b.text, caretColor: b.text,
  });
}
function commitEdit() {
  const id = S.editing; if (!id) return;
  const n = getNode(id);
  S.editing = null; editorEl.hidden = true;
  if (!n) return;
  const t = n.text.replace(/\s+$/, '').replace(/^\s+/, '');
  n.text = t || S.editOrig || 'Ý tưởng mới';
  if (!S.editFresh && n.text !== S.editOrig) pushHist(S.editSnap);
  changed();
  canvas.focus({ preventScroll: true });
}
function cancelEdit() {
  const id = S.editing; if (!id) return;
  const n = getNode(id); if (n) n.text = S.editOrig;
  S.editing = null; editorEl.hidden = true;
  render(); canvas.focus({ preventScroll: true });
}
editorEl.addEventListener('input', () => {
  const n = getNode(S.editing); if (!n) return;
  n.text = editorEl.value; render();
});
editorEl.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  else if (e.key === 'Tab') { e.preventDefault(); const id = S.editing; commitEdit(); e.shiftKey ? addSibling(id) : addChild(id); }
});
editorEl.addEventListener('blur', () => { if (S.editing) commitEdit(); });
editorEl.addEventListener('pointerdown', e => e.stopPropagation());

/* ----- Điều hướng bằng phím mũi tên ----- */
function navigate(key) {
  const L = S.L;
  const b = L.boxes.get(S.sel);
  if (!b) { select(S.map.root.id); return; }
  const cy = x => x.y + x.h / 2, cx = x => x.x + x.w / 2;
  const nearest = (list, f) => list.slice().sort((p, q) => Math.abs(f(p) - f(b)) - Math.abs(f(q) - f(b)))[0];
  const sib = d => {
    if (!b.parent) return null;
    const list = b.parent.kids.filter(k => k.dir === b.dir);
    return list[list.indexOf(b) + d];
  };
  let t = null;
  if (L.mode === 'down') {
    if (key === 'ArrowDown') t = nearest(b.kids, cx);
    else if (key === 'ArrowUp') t = b.parent;
    else t = sib(key === 'ArrowLeft' ? -1 : 1);
  } else if (L.mode === 'tree') {
    if (key === 'ArrowRight') t = b.kids[0];
    else if (key === 'ArrowLeft') t = b.parent;
  } else if (L.mode === 'timeline' || L.mode === 'fishbone') {
    // Mốc thời gian đi theo trục; các ý trong khối thụt lề đi lên/xuống như cây thư mục
    const near = d => b.parent?.kids[b.parent.kids.indexOf(b) + d];
    if (L.mode === 'timeline' && b.depth <= 1 && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      t = b.depth === 0 ? (key === 'ArrowRight' ? b.kids[0] : null) : near(key === 'ArrowLeft' ? -1 : 1) || (key === 'ArrowLeft' ? b.parent : null);
    } else if (b.depth >= 2 && (key === 'ArrowUp' || key === 'ArrowDown')) t = near(key === 'ArrowUp' ? -1 : 1);
    else if (b.depth >= 2 && key === 'ArrowRight') t = b.kids[0];
  } else if (b.depth === 0 && (key === 'ArrowRight' || key === 'ArrowLeft')) {
    t = nearest(b.kids.filter(k => k.dir === (key === 'ArrowRight' ? 1 : -1)), cy);
  } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
    const fwd = (key === 'ArrowRight') === (b.dir > 0);
    t = fwd ? nearest(b.kids, cy) : b.parent;
  } else {
    t = sib(key === 'ArrowUp' ? -1 : 1);
  }
  if (!t) t = spatial(key, b);
  if (t) select(t.id, { reveal: true });
}
function spatial(key, b) {
  let best = null, bs = Infinity;
  const ox = b.x + b.w / 2, oy = b.y + b.h / 2;
  for (const c of S.L.boxes.values()) {
    if (c === b) continue;
    const dx = c.x + c.w / 2 - ox, dy = c.y + c.h / 2 - oy;
    const [p, s] = { ArrowRight: [dx, dy], ArrowLeft: [-dx, dy], ArrowDown: [dy, dx], ArrowUp: [-dy, dx] }[key];
    if (p <= 2) continue;
    const score = p + Math.abs(s) * 2.5;
    if (score < bs) { bs = score; best = c; }
  }
  return best;
}

/* =====================================================================
   CHUỘT / CẢM ỨNG TRÊN VÙNG VẼ
   ===================================================================== */
let gesture = null;
const pointers = new Map();

canvas.addEventListener('pointerdown', e => {
  if (e.target.closest('.zoombar, .floatbar, .present-bar, .hint, [data-act], #node-editor')) return;
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    gesture = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), k: S.view.k };
    return;
  }
  const relHit = e.target.closest('.rel-hit');
  const nodeEl = e.target.closest('.node');
  if (relHit) {
    if (S.editing) commitEdit();
    S.selRel = relHit.dataset.rel; S.sel = null; S.panelTab = 'node'; render();
    return;
  }
  if (nodeEl) {
    const id = nodeEl.dataset.id;
    if (S.relFrom) { finishRelate(id); return; }
    if (S.presenting) return;
    if (S.quiz) { quizFlip(id); return; }
    if (S.sel !== id || S.selRel) select(id);
    gesture = { type: 'node', id, sx: e.clientX, sy: e.clientY, started: false };
  } else {
    if (S.relFrom) { endRelate(); return; }
    gesture = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: S.view.x, vy: S.view.y, moved: false };
  }
  if (S.editing && !nodeEl) commitEdit();
  canvas.focus({ preventScroll: true });
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (gesture?.type === 'pinch' && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    zoomAt(gesture.k * Math.hypot(a.x - b.x, a.y - b.y) / gesture.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
});
const dropPointer = e => { pointers.delete(e.pointerId); if (gesture?.type === 'pinch' && pointers.size < 2) gesture = null; };
canvas.addEventListener('pointerup', dropPointer);
canvas.addEventListener('pointercancel', dropPointer);

function onMove(e) {
  const g = gesture; if (!g) return;
  if (g.type === 'pan') {
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) > 3) { g.moved = true; canvas.classList.add('panning'); }
    if (g.moved) { S.view.x = g.vx + dx; S.view.y = g.vy + dy; applyView(); }
  } else if (g.type === 'node') {
    if (!g.started) {
      if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 6 || isRoot(g.id) || S.editing) return;
      // Nút (cùng cả nhánh) đi theo con trỏ; đường nối và mối nối được vẽ lại liên tục
      g.started = true;
      g.skip = new Set(); walk(getNode(g.id), n => { g.skip.add(n.id); });
      g.base = { ...(getNode(g.id).offset || { x: 0, y: 0 }) };
      g.p0 = screenToWorld(g.sx, g.sy);
      canvas.classList.add('moving');
    }
    const p = screenToWorld(e.clientX, e.clientY), n = getNode(g.id);
    n.offset = g.last = { x: Math.round(g.base.x + p.x - g.p0.x), y: Math.round(g.base.y + p.y - g.p0.y) };
    drawMap();
    g.drop = findDrop(p, g.skip);
    showDrop(g.drop);
  }
}
function onUp() {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onUp);
  const g = gesture; gesture = null;
  canvas.classList.remove('panning');
  if (!g) return;
  if (g.type === 'pan' && !g.moved) {
    if (S.sel || S.selRel) { S.sel = null; S.selRel = null; S.panelTab = 'map'; render(); }
  } else if (g.type === 'pan') scheduleSave(false);
  if (g.type === 'node' && g.started) {
    showDrop(null); canvas.classList.remove('moving');
    const n = getNode(g.id);
    // Trả lại vị trí cũ trước khi ghi lịch sử, để Hoàn tác đưa nút về đúng chỗ
    if (g.base.x || g.base.y) n.offset = g.base; else delete n.offset;
    if (g.drop) moveNode(g.id, g.drop.id, g.drop.pos, g.drop.side);
    else commit(() => { if (g.last.x || g.last.y) n.offset = g.last; else delete n.offset; });
  }
}
/** Anh em xếp theo hàng ngang (chèn trước/sau theo trục x) thay vì theo cột. */
const rowSibs = (L, b) => L.mode === 'down' || (L.mode === 'timeline' && b.depth === 1);
function findDrop(p, skip) {
  const L = S.L;
  for (const b of L.boxes.values()) {
    if (skip.has(b.id)) continue;
    if (p.x < b.x - 8 || p.x > b.x + b.w + 8 || p.y < b.y - 8 || p.y > b.y + b.h + 8) continue;
    if (b.depth === 0) return { id: b.id, pos: 'child', side: p.x < b.x + b.w / 2 ? 'left' : 'right' };
    const r = rowSibs(L, b) ? (p.x - b.x) / b.w : (p.y - b.y) / b.h;
    return { id: b.id, pos: r < 0.28 ? 'before' : r > 0.72 ? 'after' : 'child' };
  }
  const root = L.root;
  if (L.mode === 'map' && Math.abs(p.y - (root.y + root.h / 2)) < 260) {
    const dx = p.x - (root.x + root.w / 2);
    if (Math.abs(dx) > root.w / 2 + 20 && Math.abs(dx) < root.w / 2 + 160) return { id: root.id, pos: 'child', side: dx < 0 ? 'left' : 'right' };
  }
  return null;
}
function showDrop(d) {
  $$('.drop-child', nodesEl).forEach(el => el.classList.remove('drop-child'));
  const mark = $('#drop-mark');
  if (!d) { mark.hidden = true; return; }
  const b = S.L.boxes.get(d.id);
  if (d.pos === 'child') { mark.hidden = true; nodesEl.querySelector(`.node[data-id="${d.id}"]`)?.classList.add('drop-child'); return; }
  mark.hidden = false;
  if (rowSibs(S.L, b)) Object.assign(mark.style, { left: (d.pos === 'before' ? b.x - 10 : b.x + b.w + 7) + 'px', top: b.y + 'px', width: '3px', height: b.h + 'px' });
  else Object.assign(mark.style, { left: b.x + 'px', top: (d.pos === 'before' ? b.y - 7 : b.y + b.h + 4) + 'px', width: b.w + 'px', height: '3px' });
}

canvas.addEventListener('dblclick', e => {
  const nodeEl = e.target.closest('.node');
  if (e.target.matches('.nimg')) { viewImage(getNode(nodeEl.dataset.id)); return; }
  if (nodeEl && !S.presenting && !S.quiz && !e.target.closest('[data-act]')) startEdit(nodeEl.dataset.id, { caretEnd: true });
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) zoomAt(S.view.k * Math.exp(-e.deltaY * 0.0085), e.clientX, e.clientY);
  else { S.view.x -= e.deltaX; S.view.y -= e.deltaY; applyView(); }
  clearTimeout(canvas._wt); canvas._wt = setTimeout(() => scheduleSave(false), 600);
}, { passive: false });
window.addEventListener('resize', () => { if (S.presenting) showSlide(); });

/* =====================================================================
   PHÍM TẮT
   ===================================================================== */
document.addEventListener('keydown', e => {
  if ($('#editor').hidden || modalOpen()) return;
  const t = e.target;
  if (t.matches?.('input, textarea, select, [contenteditable="true"]')) {
    if (e.key === 'Escape' && t === $('#search-input')) closeSearch();
    return;
  }
  const mod = e.metaKey || e.ctrlKey, k = e.key;

  if (S.presenting) {
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); stepSlide(1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); stepSlide(-1); }
    else if (k === 'Escape') stopPresent();
    return;
  }
  if (S.quiz) {
    if (k === 'Escape') stopQuiz();
    else if ((k === ' ' || k === 'Enter') && S.sel) { e.preventDefault(); quizFlip(S.sel); }
    else if (k.startsWith('Arrow')) { e.preventDefault(); navigate(k); }
    return;
  }
  if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
  if (mod && (k === 'f' || k === 'F')) { e.preventDefault(); openSearch(); return; }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomAt(S.view.k * 1.2); return; }
  if (mod && k === '-') { e.preventDefault(); zoomAt(S.view.k / 1.2); return; }
  if (mod && k === '0') { e.preventDefault(); fitAll(); return; }
  if (mod && k === '.') { e.preventDefault(); toggleCollapse(); return; }
  if (mod && (k === 'b' || k === 'B') && S.sel) { e.preventDefault(); ACTIONS.bold(); return; }
  if (mod && (k === 'i' || k === 'I') && S.sel) { e.preventDefault(); ACTIONS.italic(); return; }
  if (mod) return;

  if (k === 'Escape') {
    if (S.relFrom) endRelate();
    else if (!$('#searchbar').hidden) closeSearch();
    else if (S.sel || S.selRel) { S.sel = null; S.selRel = null; render(); }
    return;
  }
  if (S.selRel && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); ACTIONS['del-rel'](); return; }
  if (!S.sel) {
    if (k.startsWith('Arrow') || k === 'Tab' || k === 'Enter') { e.preventDefault(); select(S.map.root.id, { reveal: true }); }
    return;
  }
  if (k === 'Tab') { e.preventDefault(); e.shiftKey ? addSibling() : addChild(); }
  else if (k === 'Enter') { e.preventDefault(); e.shiftKey ? addSibling(S.sel, { before: true }) : addSibling(); }
  else if (k === 'Insert') { e.preventDefault(); addChild(); }
  else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteNode(); }
  else if (k === 'F2' || k === ' ') { e.preventDefault(); startEdit(S.sel, { caretEnd: true }); }
  else if (k.startsWith('Arrow')) {
    e.preventDefault();
    if (e.altKey) reorder(k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 1);
    else navigate(k);
  } else if (k === 'Home') { e.preventDefault(); select(S.map.root.id, { reveal: true }); }
  else if (k.length === 1 && !e.altKey) {
    // Gõ ký tự bất kỳ để thay chữ của nút đang chọn (giống Mindomo/XMind)
    startEdit(S.sel, { initial: '' });
  }
});

/* ----- Sao chép / cắt / dán nhánh ----- */
const canClip = e => !$('#editor').hidden && !modalOpen() && !e.target.matches?.('input, textarea') && S.sel;
document.addEventListener('copy', e => {
  if (!canClip(e)) return;
  const n = getNode(S.sel);
  S.clip = JSON.parse(JSON.stringify(n)); S.clipText = toPlainOutline(n);
  e.clipboardData.setData('text/plain', S.clipText); e.preventDefault();
  toast('Đã sao chép nhánh');
});
document.addEventListener('cut', e => {
  if (!canClip(e) || isRoot(S.sel)) return;
  const n = getNode(S.sel);
  S.clip = JSON.parse(JSON.stringify(n)); S.clipText = toPlainOutline(n);
  e.clipboardData.setData('text/plain', S.clipText); e.preventDefault();
  deleteNode();
});
document.addEventListener('paste', e => {
  if (!canClip(e)) return;
  const file = [...(e.clipboardData.files || [])].find(f => f.type.startsWith('image/'));
  if (file) { e.preventDefault(); insertImage(S.sel, file); return; }
  const text = e.clipboardData.getData('text/plain');
  let items;
  if (S.clip && text === S.clipText) items = [cloneFresh(S.clip)];
  else items = parseOutline(text);
  if (!items.length) return;
  e.preventDefault();
  commit(() => {
    const p = getNode(S.sel);
    items.forEach(it => { if (isRoot(p.id)) it.side = pickSide(); else delete it.side; p.children.push(it); });
    p.collapsed = false; S.sel = items[0].id;
  });
  toast(`Đã dán ${items.reduce((a, it) => a + countNodes(it), 0)} nút`);
});

/* =====================================================================
   BẢNG ĐỊNH DẠNG BÊN PHẢI
   ===================================================================== */
function renderPanel() {
  if (!S.panelOpen) return;
  const ae = document.activeElement;
  if (panelBody.contains(ae) && ae.matches('input, textarea')) return;
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.val === S.panelTab));
  panelBody.innerHTML = S.panelTab === 'map' ? mapPanel() : S.selRel ? relPanel() : getNode(S.sel) ? nodePanel() :
    '<div class="pn-empty">Chọn một nút trên sơ đồ để đổi màu, hình dạng, biểu tượng, ghi chú…</div>';
  hydrateIcons(panelBody);
}
const swatches = (key, list, cur, { none = false, custom = true } = {}) =>
  '<div class="swatches">' +
  (none ? `<button class="sw none ${!cur ? 'on' : ''}" data-act="set" data-key="${key}" data-val="" title="Mặc định"></button>` : '') +
  list.map(c => `<button class="sw ${cur === c ? 'on' : ''}" style="background:${c}" data-act="set" data-key="${key}" data-val="${c}" title="${c}"></button>`).join('') +
  (custom ? `<label class="sw custom" title="Màu khác"><input type="color" data-key="${key}" value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#4f46e5'}"></label>` : '') +
  '</div>';

function nodePanel() {
  const n = getNode(S.sel), b = S.L.boxes.get(S.sel), st = n.style || {};
  const shapes = [['', 'Mặc định'], ['rounded', 'Bo góc'], ['rect', 'Vuông'], ['pill', 'Viên thuốc'], ['ellipse', 'Bầu dục'], ['cloud', 'Đám mây'], ['hexagon', 'Lục giác'], ['underline', 'Gạch chân'], ['none', 'Chỉ chữ']];
  const bold = b ? /^(italic )?(\d+)/.exec(b.font)[2] >= 600 : false;
  return `
  <div class="pn-sec"><div class="pn-label">Ghi chú</div><textarea id="pn-note" class="field" rows="3" placeholder="Thêm ghi chú cho nút…">${esc(n.note || '')}</textarea></div>
  <div class="pn-sec" id="pn-links"><div class="pn-label">Liên kết web ${n.links?.length ? `(${n.links.length})` : ''}</div>
    ${(n.links || []).map((l, i) => `<div class="att-row"><span class="pi">🔗</span><a class="pt" href="${esc(l.url)}" target="_blank" rel="noopener" title="${esc(l.url)}">${esc(linkLabel(l))}${l.title ? `<small>${esc(l.url)}</small>` : ''}</a>
      <button class="xbtn" data-act="link-up" data-val="${i}" title="Đưa lên đầu" ${i ? '' : 'hidden'}>↑</button><button class="xbtn" data-act="link-del" data-val="${i}" title="Bỏ link">×</button></div>`).join('')}
    <input id="pn-link-url" class="field" placeholder="Dán địa chỉ web, link Google Drive, YouTube…" style="margin-top:6px">
    <div class="row" style="margin-top:6px"><input id="pn-link-title" class="field" placeholder="Tên hiển thị (không bắt buộc)" style="flex:1"><button class="btn small" data-act="link-add">Thêm</button></div></div>
  <div class="pn-sec" id="pn-files"><div class="pn-label">Tệp đính kèm ${n.files?.length ? `(${n.files.length})` : ''}</div>
    ${(n.files || []).map(f => `<div class="att-row"><span class="pi">${fileIcon(f.name, f.type)}</span><button class="pt" data-act="file-open" data-val="${f.id}" title="Mở">${esc(f.name)}<small>${fmtSize(f.size)}</small></button>
      <button class="xbtn" data-act="file-save" data-val="${f.id}" title="Tải về">⤓</button><button class="xbtn" data-act="file-del" data-val="${f.id}" title="Bỏ tệp">×</button></div>`).join('')}
    <button class="btn" style="width:100%;justify-content:center;margin-top:6px" data-act="file-pick" data-icon="upload">Đính kèm tệp…</button>
    <div class="muted" style="font-size:12px;margin-top:6px">PDF, Word, PowerPoint, Excel, video… (tối đa 100 MB/tệp). Có thể kéo thả tệp vào nút. Tệp chỉ lưu trên máy này.</div></div>
  <div class="pn-sec"><div class="pn-label">Hình ảnh</div>
    ${n.image ? `<div class="seg" style="margin-bottom:8px">${IMG_SIZES.map(([l, v]) => `<button class="${(n.image.dw || 200) === v ? 'on' : ''}" data-act="img-size" data-val="${v}">${l}</button>`).join('')}</div>
      <div class="acts-grid"><button class="btn" data-act="img-pick" data-icon="image">Đổi ảnh</button><button class="btn del" data-act="img-remove" data-icon="trash">Bỏ ảnh</button></div>`
    : `<button class="btn" style="width:100%;justify-content:center" data-act="img-pick" data-icon="image">Chèn ảnh…</button>
      <div class="muted" style="font-size:12px;margin-top:6px">Hoặc dán (Ctrl+V) / kéo thả ảnh vào nút.</div>`}</div>
  <div class="pn-sec"><div class="pn-label">Màu nhánh ${st.color ? '<button data-act="set" data-key="color" data-val="">Mặc định</button>' : ''}</div>${swatches('color', SWATCH, st.color)}</div>
  <div class="pn-sec"><div class="pn-label">Nền</div>${swatches('fill', FILLS, st.fill, { none: true })}</div>
  <div class="pn-sec"><div class="pn-label">Màu chữ</div>${swatches('textColor', TEXTS, st.textColor, { none: true })}</div>
  <div class="pn-sec"><div class="pn-label">Hình dạng</div><div class="seg">${shapes.map(([v, l]) => `<button class="${(st.shape || '') === v ? 'on' : ''}" data-act="set" data-key="shape" data-val="${v}">${l}</button>`).join('')}</div></div>
  <div class="pn-sec"><div class="pn-label">Chữ</div><div class="row">
    <button class="sq" data-act="font-dec" title="Nhỏ hơn">A−</button><span class="val">${b?.fs || ''}</span><button class="sq" data-act="font-inc" title="Lớn hơn">A+</button>
    <span style="flex:1"></span>
    <button class="sq ${bold ? 'on' : ''}" data-act="bold" title="Đậm (Ctrl+B)"><b>B</b></button>
    <button class="sq ${st.italic ? 'on' : ''}" data-act="italic" title="Nghiêng (Ctrl+I)"><i>I</i></button></div>
    <div class="muted" style="font-size:12px;margin-top:8px">Công thức: gõ giữa hai dấu $, ví dụ <code>$x^2+1$</code>, <code>$\\frac{a}{b}$</code>, <code>$\\sqrt{2}$</code>.</div></div>
  <div class="pn-sec"><div class="pn-label">Biểu tượng ${n.icon ? '<button data-act="set-icon" data-val="">Bỏ</button>' : ''}</div>
    <div class="emoji-grid">${EMOJIS.map(e => `<button class="${n.icon === e ? 'on' : ''}" data-act="set-icon" data-val="${e}">${e}</button>`).join('')}</div></div>
  <div class="pn-sec"><div class="acts-grid">
    <button class="btn" data-act="add-child" data-icon="child">Nút con</button>
    <button class="btn" data-act="add-sibling" data-icon="sibling">Cùng cấp</button>
    <button class="btn" data-act="relate" data-icon="relate">Mối nối</button>
    <button class="btn" data-act="ai-expand" data-icon="sparkle">AI gợi ý</button>
    ${n.children.length && !isRoot(n.id) ? `<button class="btn" data-act="toggle-collapse" data-icon="fold">${n.collapsed ? 'Mở rộng' : 'Thu gọn'}</button>` : ''}
    <button class="btn" data-act="reset-style" data-icon="reset">Xóa định dạng</button>
    ${n.offset ? '<button class="btn" data-act="reset-pos" data-icon="fit" title="Bỏ vị trí đã kéo, trả nút về chỗ tự động">Về chỗ cũ</button>' : ''}
    ${isRoot(n.id) ? '' : '<button class="btn del" data-act="delete-node" data-icon="trash">Xóa nút</button>'}
  </div></div>`;
}
function relPanel() {
  const r = S.map.relations.find(x => x.id === S.selRel);
  if (!r) return '';
  return `<div class="pn-sec"><div class="pn-label">Mối nối</div>
    <p class="muted" style="margin:0 0 10px;font-size:13px">${esc(getNode(r.from)?.text)} → ${esc(getNode(r.to)?.text)}</p>
    <input id="pn-rel-label" class="field" placeholder="Nhãn (ví dụ: dẫn đến, ảnh hưởng…)" value="${esc(r.label || '')}"></div>
    <div class="pn-sec"><div class="acts-grid"><button class="btn" data-act="flip-rel" data-icon="reset">Đổi chiều</button><button class="btn del" data-act="del-rel" data-icon="trash">Xóa mối nối</button></div></div>`;
}
const hasOffsets = () => { let f = false; walk(S.map.root, n => { if (n.offset) f = true; }); return f; };
function mapPanel() {
  let n = 0, depth = 0;
  walk(S.map.root, (x, p, d) => { n++; depth = Math.max(depth, d); });
  return `
  <div class="pn-sec"><div class="pn-label">Bố cục</div><div class="choice-grid">
    ${Object.entries(LAYOUTS).map(([k, l]) => `<button class="choice ${S.map.layout === k ? 'on' : ''}" data-act="layout" data-val="${k}"><svg viewBox="0 0 100 44">${l.svg}</svg>${l.name}</button>`).join('')}
  </div></div>
  <div class="pn-sec"><div class="pn-label">Chủ đề màu</div><div class="choice-grid">
    ${Object.entries(THEMES).map(([k, t]) => `<button class="choice ${S.map.theme === k ? 'on' : ''}" data-act="theme" data-val="${k}">
      <span class="theme-chip" style="background:${t.bg};box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)">
        <i style="left:38%;width:24%;height:12px;margin-top:-6px;border-radius:4px;background:${t.root.fill === 'transparent' ? 'none' : t.root.fill};box-shadow:inset 0 0 0 1.5px ${t.root.stroke || t.root.fill}"></i>
        ${t.palette.slice(0, 4).map((c, i) => `<i style="background:${c};left:${[10, 17, 72, 79][i]}%;top:${[30, 70, 30, 70][i]}%"></i>`).join('')}
      </span>${t.name}</button>`).join('')}
  </div></div>
  <div class="pn-sec"><div class="pn-label">Kiểu nét</div><div class="seg" style="grid-template-columns:1fr 1fr">
    <button class="${S.map.sketch ? '' : 'on'}" data-act="sketch" data-val="">Gọn gàng</button>
    <button class="${S.map.sketch ? 'on' : ''}" data-act="sketch" data-val="1" style="font-family:${SKETCH_FONT}">✏️ Vẽ tay</button>
  </div></div>
  <div class="pn-sec"><div class="pn-label">Giao diện ứng dụng</div><div class="seg" style="grid-template-columns:repeat(3,1fr)">
    ${[['light', 'Sáng'], ['dark', 'Tối'], ['', 'Theo máy']].map(([v, l]) => `<button class="${UI.mode() === v ? 'on' : ''}" data-act="ui-mode" data-val="${v}">${l}</button>`).join('')}
  </div></div>
  <div class="pn-sec"><div class="pn-label">Thống kê</div><div class="stats">
    <div><b>${n}</b><span>nút</span></div><div><b>${depth}</b><span>cấp sâu</span></div><div><b>${S.map.relations.length}</b><span>mối nối</span></div></div></div>
  <div class="pn-sec"><div class="acts-grid">
    <button class="btn" data-act="expand-all">Mở rộng hết</button>
    <button class="btn" data-act="collapse-all">Thu gọn hết</button>
    <button class="btn" data-act="zoom-fit" data-icon="fit">Vừa màn hình</button>
    <button class="btn" data-act="add-child" data-icon="plus">Nhánh mới</button>
    ${hasOffsets() ? '<button class="btn" data-act="reset-all-pos" data-icon="reset" title="Đưa mọi nút đã kéo tự do về vị trí tự động">Sắp xếp lại</button>' : ''}
  </div></div>`;
}

/* Ghi chú, liên kết, nhãn mối nối, màu tùy chọn: sửa trực tiếp trong bảng */
let panelSnap = null;
panelBody.addEventListener('focusin', e => { if (e.target.matches('input:not([type=color]), textarea')) panelSnap = snap(); });
panelBody.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'pn-note') { const n = getNode(S.sel); if (n) { if (t.value) n.note = t.value; else delete n.note; render(); } }
  if (t.id === 'pn-rel-label') { const r = S.map.relations.find(x => x.id === S.selRel); if (r) { r.label = t.value; render(); } }
});
panelBody.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.target.id === 'pn-link-url' || e.target.id === 'pn-link-title')) { e.preventDefault(); addLink(); }
});
panelBody.addEventListener('change', e => {
  const t = e.target;
  if (t.type === 'color') { setStyle(t.dataset.key, t.value); return; }
  if ((t.id === 'pn-note' || t.id === 'pn-rel-label') && panelSnap && panelSnap !== snap()) { pushHist(panelSnap); panelSnap = snap(); scheduleSave(); render(); }
});

/* =====================================================================
   DÀN Ý (OUTLINE) — sửa sơ đồ dưới dạng danh sách
   ===================================================================== */
function renderOutline(force = false) {
  if (!force && olList.contains(document.activeElement)) {
    $$('.ol-row', olList).forEach(r => r.classList.toggle('on', r.dataset.id === S.sel));
    return;
  }
  const theme = THEMES[S.map.theme] || THEMES.classic;
  const rows = [];
  const rec = (n, d, color) => {
    rows.push(`<div class="ol-row ${n.id === S.sel ? 'on' : ''}" data-id="${n.id}" style="--d:${d}"><span class="ol-dot" style="background:${color}"></span><input class="ol-in" data-id="${n.id}" value="${esc(n.text.replace(/\n/g, ' '))}"></div>`);
    n.children.forEach((c, i) => rec(c, d + 1, c.style?.color || (d === 0 ? theme.palette[i % theme.palette.length] : color)));
  };
  rec(S.map.root, 0, S.map.root.style?.color || theme.root.line);
  olList.innerHTML = rows.join('');
}
const focusOl = (id, end = true) => {
  const i = olList.querySelector(`.ol-in[data-id="${id}"]`);
  if (i) { i.focus(); end ? i.setSelectionRange(i.value.length, i.value.length) : i.select(); i.scrollIntoView({ block: 'nearest' }); }
};
let olSnap = null;
function olFlush() { if (olSnap && olSnap !== snap()) pushHist(olSnap); olSnap = null; }
olList.addEventListener('focusin', e => {
  const id = e.target.dataset?.id; if (!id) return;
  olSnap = snap(); S.sel = id; S.selRel = null; render(); ensureVisible(id);
});
olList.addEventListener('focusout', () => { olFlush(); scheduleSave(); });
olList.addEventListener('input', e => {
  const n = getNode(e.target.dataset.id); if (!n) return;
  n.text = e.target.value; render();
});
olList.addEventListener('keydown', e => {
  const inp = e.target, id = inp.dataset?.id; if (!id) return;
  const ins = $$('.ol-in', olList), idx = ins.indexOf(inp);
  const structural = fn => { e.preventDefault(); olFlush(); const focusId = fn(); renderOutline(true); if (focusId) focusOl(focusId); };
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') {
    structural(() => (isRoot(id) ? addChild(id, { edit: false }) : addSibling(id, { edit: false })));
    const i = olList.querySelector(`.ol-in[data-id="${S.sel}"]`); if (i) i.select();
  } else if (e.key === 'Tab' && !e.shiftKey && !isRoot(id)) {
    const p = parentOf(id), n = getNode(id), i = p.children.indexOf(n);
    if (i > 0) structural(() => { moveNode(id, p.children[i - 1].id, 'child'); return id; });
    else e.preventDefault();
  } else if (e.key === 'Tab' && e.shiftKey && !isRoot(id)) {
    const p = parentOf(id);
    if (!isRoot(p.id)) structural(() => { moveNode(id, p.id, 'after'); return id; });
    else e.preventDefault();
  } else if (e.key === 'Backspace' && !inp.value && !isRoot(id)) {
    const prev = ins[idx - 1]?.dataset.id;
    structural(() => { deleteNode(id); return prev; });
  } else if (e.key === 'ArrowUp' && ins[idx - 1]) { e.preventDefault(); ins[idx - 1].focus(); }
  else if (e.key === 'ArrowDown' && ins[idx + 1]) { e.preventDefault(); ins[idx + 1].focus(); }
  else if (e.key === 'Escape') inp.blur();
});

/* =====================================================================
   TÌM KIẾM
   ===================================================================== */
function openSearch() {
  $('#searchbar').hidden = false;
  const i = $('#search-input'); i.focus(); i.select();
  runSearch(i.value);
}
function closeSearch() {
  $('#searchbar').hidden = true; S.matches = null; S.matchList = []; render(); canvas.focus();
}
function runSearch(q) {
  const f = fold(q.trim());
  S.matches = new Set(); S.matchList = []; S.matchIdx = -1;
  const hay = n => [n.text, n.note, ...(n.links || []).map(l => l.title || l.url), ...(n.files || []).map(x => x.name)].map(fold).join('\n');
  if (f) walk(S.map.root, n => { if (hay(n).includes(f)) { S.matches.add(n.id); S.matchList.push(n.id); } });
  $('#search-count').textContent = f ? `${S.matchList.length} kết quả` : '';
  render();
}
function searchStep(d) {
  if (!S.matchList.length) return;
  S.matchIdx = (S.matchIdx + d + S.matchList.length) % S.matchList.length;
  const id = S.matchList[S.matchIdx];
  expandTo(id); S.sel = id; reindex(); render(); centerOn(id);
  $('#search-count').textContent = `${S.matchIdx + 1} / ${S.matchList.length}`;
}
$('#search-input').addEventListener('input', e => runSearch(e.target.value));
$('#search-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); searchStep(e.shiftKey ? -1 : 1); }
});

/* =====================================================================
   TRÌNH CHIẾU — đi lần lượt qua từng nút, phóng vào nhánh đang nói
   ===================================================================== */
function startPresent() {
  if (S.editing) commitEdit();
  const order = [];
  walk(S.map.root, n => { order.push(n.id); return !n.collapsed; });
  S.presenting = { order, i: Math.max(0, order.indexOf(S.sel)) };
  $('#editor').classList.add('presenting');
  $('#present-bar').hidden = false;
  document.documentElement.requestFullscreen?.().catch(() => {});
  setTimeout(showSlide, 120);
}
function stopPresent() {
  if (!S.presenting) return;
  S.presenting = null;
  $('#editor').classList.remove('presenting');
  $('#present-bar').hidden = true;
  if (document.fullscreenElement) document.exitFullscreen?.();
  render(); setTimeout(() => fitAll(), 120);
}
function presentFocus() {
  const id = S.presenting.order[S.presenting.i], set = new Set([id]);
  for (let p = parentOf(id); p; p = parentOf(p.id)) set.add(p.id);
  getNode(id)?.children.forEach(c => set.add(c.id));
  return set;
}
function showSlide() {
  const P = S.presenting; if (!P) return;
  S.sel = P.order[P.i];
  render();
  const b = S.L.boxes.get(S.sel);
  const group = [b, ...b.kids];
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const g of group) { x1 = Math.min(x1, g.x); y1 = Math.min(y1, g.y); x2 = Math.max(x2, g.x + g.w); y2 = Math.max(y2, g.y + g.h); }
  fitTo({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, { max: 2.2, pad: 90 });
  $('#present-count').textContent = `${P.i + 1} / ${P.order.length}`;
}
function stepSlide(d) {
  const P = S.presenting; if (!P) return;
  P.i = clamp(P.i + d, 0, P.order.length - 1); showSlide();
}
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && S.presenting) stopPresent(); });

/* =====================================================================
   ẢNH TRONG NÚT — dán, kéo thả hoặc chọn tệp; ảnh được thu nhỏ rồi lưu kèm sơ đồ
   ===================================================================== */
const IMG_SIZES = [['Nhỏ', 120], ['Vừa', 200], ['Lớn', 320]];
async function readImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * scale)), h = Math.max(1, Math.round(im.naturalHeight * scale));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    let src = '';
    if (/png|gif|webp/.test(file.type)) { ctx.drawImage(im, 0, 0, w, h); src = cv.toDataURL('image/png'); }
    if (!src || src.length > 450000) {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(im, 0, 0, w, h);
      src = cv.toDataURL('image/jpeg', 0.82);
    }
    return { src, w, h };
  } finally { URL.revokeObjectURL(url); }
}
async function insertImage(id, file) {
  if (!id || !file) return;
  if (!file.type.startsWith('image/')) { toast('Tệp này không phải ảnh'); return; }
  try {
    const img = await readImageFile(file);
    await preloadImages({ root: { image: img, children: [] } });
    const n = getNode(id); if (!n) return;
    commit(() => { n.image = { ...img, dw: n.image?.dw || 200 }; S.sel = id; });
  } catch (err) { console.error(err); toast('Không đọc được ảnh này'); }
}
function viewImage(n) {
  if (!n?.image) return;
  modal({ title: n.text || 'Hình ảnh', wide: true, body: `<img src="${n.image.src}" alt="" style="display:block;max-width:100%;max-height:70vh;margin:0 auto;border-radius:8px">` });
}
const imgInput = document.createElement('input');
imgInput.type = 'file'; imgInput.accept = 'image/*'; imgInput.hidden = true;
document.body.appendChild(imgInput);
imgInput.addEventListener('change', () => { const f = imgInput.files[0]; imgInput.value = ''; insertImage(S.sel, f); });

canvas.addEventListener('dragover', e => {
  if (![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault();
  $$('.drop-child', nodesEl).forEach(el => el.classList.remove('drop-child'));
  e.target.closest('.node')?.classList.add('drop-child');
});
canvas.addEventListener('dragleave', e => { if (!canvas.contains(e.relatedTarget)) showDrop(null); });
canvas.addEventListener('drop', e => {
  const all = [...e.dataTransfer.files];
  if (!all.length) return;
  e.preventDefault(); showDrop(null);
  const nodeEl = e.target.closest('.node');
  // Một ảnh duy nhất → chèn làm hình của nút; còn lại → đính kèm tệp
  if (!(all.length === 1 && all[0].type.startsWith('image/'))) { attachFiles(nodeEl?.dataset.id || S.sel || S.map.root.id, all); return; }
  const file = all[0];
  if (nodeEl) { insertImage(nodeEl.dataset.id, file); return; }
  // Thả ra khoảng trống: tạo nhánh mới chứa ảnh dưới nút đang chọn (hoặc chủ đề trung tâm)
  const id = addChild(S.sel || S.map.root.id, { edit: false });
  const n = getNode(id); n.text = file.name.replace(/\.[^.]+$/, '');
  insertImage(id, file);
});

/* =====================================================================
   LIÊN KẾT & TỆP ĐÍNH KÈM
   Tệp được lưu trong IndexedDB của trình duyệt (dung lượng lớn hơn nhiều so với
   localStorage); sơ đồ chỉ giữ thông tin mô tả { id, name, size, type }.
   ===================================================================== */
const FILE_MAX = 100 * 1024 * 1024;
const FileStore = {
  _db: null,
  open() {
    return (this._db ||= new Promise((res, rej) => {
      const r = indexedDB.open('sodo-files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('files', mode), req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req?.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Không lưu được tệp (bộ nhớ trình duyệt có thể đã đầy).'));
    });
  },
  put(id, rec) { return this.run('readwrite', st => st.put(rec, id)); },
  get(id) { return this.run('readonly', st => st.get(id)); },
  keys() { return this.run('readonly', st => st.getAllKeys()); },
  del(id) { return this.run('readwrite', st => st.delete(id)); },
};
/** Xóa các tệp không còn sơ đồ nào dùng tới (chạy lúc mở trang, khi không còn lịch sử hoàn tác). */
async function gcFiles() {
  try {
    const used = new Set();
    for (const e of Store.index()) { const m = Store.load(e.id); if (m) walk(m.root, n => { n.files?.forEach(f => used.add(f.id)); }); }
    for (const k of await FileStore.keys()) if (!used.has(k)) await FileStore.del(k);
  } catch (err) { console.warn('Dọn tệp đính kèm thất bại', err); }
}
const fmtSize = b => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(0) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB');
function fileIcon(name, type = '') {
  const ext = (/\.([a-z0-9]+)$/i.exec(name)?.[1] || '').toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return '📘';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return '📗';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return '📙';
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  return '📄';
}
async function attachFiles(id, files) {
  const n = getNode(id);
  if (!n || !files.length) return;
  const added = [];
  for (const f of files) {
    if (f.size > FILE_MAX) { toast(`“${f.name}” lớn hơn 100 MB — hãy gắn link Google Drive thay vì đính kèm.`, 4500); continue; }
    const meta = { id: uid(), name: f.name, size: f.size, type: f.type || '' };
    try { await FileStore.put(meta.id, { blob: f, name: f.name, type: f.type }); added.push(meta); }
    catch (err) { console.error(err); toast(err.message || `Không lưu được “${f.name}”`, 4000); }
  }
  if (!added.length) return;
  commit(() => { n.files = [...(n.files || []), ...added]; S.sel = id; S.panelTab = 'node'; });
  toast(added.length === 1 ? `Đã đính kèm “${added[0].name}”` : `Đã đính kèm ${added.length} tệp`);
}
const VIEWABLE = /^(application\/pdf|image\/|text\/|video\/|audio\/)/;
async function openFile(meta, { save = false } = {}) {
  // Mở cửa sổ ngay khi bấm để trình duyệt không chặn, rồi mới đọc tệp
  const win = !save && VIEWABLE.test(meta.type) ? window.open('', '_blank') : null;
  let rec;
  try { rec = await FileStore.get(meta.id); } catch (err) { console.error(err); }
  if (!rec) { try { rec = await Drive.fetchFile(meta); } catch (err) { console.warn(err); } }
  if (!rec) {
    win?.close();
    toast(Drive.connected() && !Drive.hasToken()
      ? 'Tệp này chưa có trên máy này. Bấm nút Google Drive để đăng nhập rồi mở lại.'
      : 'Tệp này không có trong trình duyệt này (sơ đồ được mở từ máy khác hoặc từ link chia sẻ). Hãy nhập tệp .json có kèm tệp.', 5000);
    return;
  }
  if (win) { win.location.href = URL.createObjectURL(rec.blob); return; }
  download(meta.name, rec.blob);
}
function findFile(fid) {
  let hit = null;
  walk(S.map.root, n => { const f = n.files?.find(x => x.id === fid); if (f) hit = { node: n, file: f }; });
  return hit;
}
function normUrl(v) {
  v = String(v || '').trim();
  if (!v) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : 'https://' + v;
}
const linkLabel = l => l.title || l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
function addLink() {
  const n = getNode(S.sel); if (!n) return;
  const url = normUrl($('#pn-link-url')?.value), title = $('#pn-link-title')?.value.trim() || '';
  if (!url) { toast('Hãy nhập địa chỉ web'); $('#pn-link-url')?.focus(); return; }
  document.activeElement?.blur();
  commit(() => { n.links = [...(n.links || []), title ? { url, title } : { url }]; });
}
/** Danh sách nhỏ bật ra cạnh biểu tượng 🔗/📎 trên nút. */
function showPopover(anchor, items) {
  closePopover();
  const pop = document.createElement('div');
  pop.className = 'popover';
  pop.innerHTML = items.map((it, i) => `<button data-i="${i}"><span class="pi">${it.icon}</span><span class="pt">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`).join('');
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = clamp(r.left, 8, innerWidth - pop.offsetWidth - 8) + 'px';
  pop.style.top = (r.bottom + 6 + pop.offsetHeight > innerHeight ? r.top - pop.offsetHeight - 6 : r.bottom + 6) + 'px';
  pop.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { closePopover(); items[+b.dataset.i].run(); } });
  setTimeout(() => document.addEventListener('pointerdown', closePopover, { once: true }), 0);
  pop.addEventListener('pointerdown', e => e.stopPropagation());
}
function closePopover() { $$('.popover').forEach(p => p.remove()); }
function linksPopover(el, n) {
  const links = n.links || [];
  if (links.length === 1) { window.open(links[0].url, '_blank', 'noopener'); return; }
  showPopover(el, links.map(l => ({ icon: '🔗', label: linkLabel(l), sub: l.title ? l.url : '', run: () => window.open(l.url, '_blank', 'noopener') })));
}
function filesPopover(el, n) {
  showPopover(el, (n.files || []).map(f => ({ icon: fileIcon(f.name, f.type), label: f.name, sub: fmtSize(f.size), run: () => openFile(f) })));
}
const fileInput = document.createElement('input');
fileInput.type = 'file'; fileInput.multiple = true; fileInput.hidden = true;
document.body.appendChild(fileInput);
fileInput.addEventListener('change', () => { const fs = [...fileInput.files]; fileInput.value = ''; attachFiles(S.sel, fs); });

/** Gói tệp đính kèm vào bản sao lưu .json để chuyển sang máy khác. */
async function exportWithFiles(map) {
  const attachments = {};
  const metas = [];
  walk(map.root, n => n.files?.forEach(f => metas.push(f)));
  for (const f of metas) {
    const rec = await FileStore.get(f.id).catch(() => null);
    if (!rec) continue;
    attachments[f.id] = { name: rec.name, type: rec.type, data: await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(rec.blob); }) };
  }
  const out = { ...map, view: undefined };
  if (Object.keys(attachments).length) out.attachments = attachments;
  download(safeName(map.title) + '.sodo.json', JSON.stringify(out, null, 2), 'application/json');
  if (metas.length > Object.keys(attachments).length) toast('Một số tệp đính kèm không có trên máy này nên không được kèm theo.', 4000);
}
async function importAttachments(att) {
  for (const [id, a] of Object.entries(att || {})) {
    try { const blob = await (await fetch(a.data)).blob(); await FileStore.put(id, { blob, name: a.name, type: a.type }); }
    catch (err) { console.warn('Không nhập được tệp', a?.name, err); }
  }
}

/* =====================================================================
   ĐỒNG BỘ GOOGLE DRIVE — lưu sơ đồ và tệp đính kèm vào thư mục “Sodo” trong
   Drive của người dùng (quyền drive.file: app chỉ thấy tệp do chính nó tạo).
   Mỗi sơ đồ là một tệp .sodo.json; ai sửa sau thì thắng, nếu cả hai máy cùng
   sửa từ lần đồng bộ trước thì giữ cả hai bản.
   ===================================================================== */
const GDRIVE_CLIENT_ID = '438577907252-ioehqa9bqcfdingjiaf0hj4mnv3mpscd.apps.googleusercontent.com';
const Drive = {
  api: 'https://www.googleapis.com/drive/v3',
  upload: 'https://www.googleapis.com/upload/drive/v3',
  token: null, tokenExp: 0, busy: false, timer: null, status: '',
  clientId() { try { return localStorage.getItem('sodo.gclient') || GDRIVE_CLIENT_ID; } catch { return GDRIVE_CLIENT_ID; } },
  state() { try { return JSON.parse(localStorage.getItem('sodo.drive') || 'null'); } catch { return null; } },
  setState(st) { try { st ? localStorage.setItem('sodo.drive', JSON.stringify(st)) : localStorage.removeItem('sodo.drive'); } catch {} },
  connected() { return !!this.state(); },
  hasToken() { return this.token && Date.now() < this.tokenExp - 60000; },

  /** Xin quyền (mở cửa sổ đăng nhập Google). Phải gọi từ một cú bấm của người dùng. */
  async login() {
    await loadScript('https://accounts.google.com/gsi/client');
    const st = this.state();
    const resp = await new Promise((res, rej) => {
      const tc = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId(),
        scope: 'https://www.googleapis.com/auth/drive.file email',
        callback: r => (r.error ? rej(new Error(r.error_description || r.error)) : res(r)),
        error_callback: e => rej(new Error(e.type === 'popup_closed' ? 'Bạn đã đóng cửa sổ đăng nhập.' : e.type === 'popup_failed_to_open' ? 'Trình duyệt chặn cửa sổ đăng nhập — hãy cho phép popup.' : (e.message || e.type))),
      });
      tc.requestAccessToken({ prompt: st ? '' : 'consent', login_hint: st?.email || '' });
    });
    if (!google.accounts.oauth2.hasGrantedAllScopes(resp, 'https://www.googleapis.com/auth/drive.file')) {
      throw new Error('Cần cho phép Sodo “xem, tạo và xóa tệp Google Drive do ứng dụng này tạo” thì mới đồng bộ được.');
    }
    this.token = resp.access_token; this.tokenExp = Date.now() + (+resp.expires_in || 3600) * 1000;
    if (!st) {
      const me = await this.req('https://www.googleapis.com/oauth2/v3/userinfo');
      this.setState({ email: me.email || '', maps: {}, files: {}, deleted: [], lastSync: 0 });
    }
  },
  logout() {
    if (this.token) { try { google.accounts.oauth2.revoke(this.token); } catch {} }
    this.token = null; this.setState(null); updateDriveUI();
  },
  async req(url, opts = {}, raw = false) {
    const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${this.token}`, ...(opts.headers || {}) } })
      .catch(() => { throw new Error('Không kết nối được Google Drive.'); });
    if (res.status === 401) { this.token = null; throw Object.assign(new Error('Phiên đăng nhập Google đã hết hạn.'), { relogin: true }); }
    if (!res.ok) {
      let msg = res.statusText; try { msg = (await res.json()).error?.message || msg; } catch {}
      if (res.status === 403 && /quota|storage/i.test(msg)) throw new Error('Google Drive đã đầy dung lượng.');
      throw new Error(`Google Drive báo lỗi (${res.status}): ${msg}`);
    }
    return raw ? res : res.status === 204 ? null : res.json();
  },
  async list(q, fields = 'id,name,appProperties') {
    const out = [];
    let page = '';
    do {
      const r = await this.req(`${this.api}/files?q=${encodeURIComponent(q)}&spaces=drive&pageSize=1000&fields=nextPageToken,files(${fields})${page ? '&pageToken=' + page : ''}`);
      out.push(...r.files); page = r.nextPageToken;
    } while (page);
    return out;
  },
  async folder(st, key, name, parent) {
    const slot = key + 'Folder';
    if (st[slot]) return st[slot];
    const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='sodo' and value='${key}' }` + (parent ? ` and '${parent}' in parents` : '');
    const found = (await this.list(q, 'id'))[0];
    st[slot] = found ? found.id : (await this.req(`${this.api}/files?fields=id`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', appProperties: { sodo: key }, ...(parent ? { parents: [parent] } : {}) }),
    })).id;
    return st[slot];
  },
  /** Tải lên (tạo mới hoặc ghi đè) một tệp kèm thông tin mô tả. */
  async put(driveId, meta, blob) {
    const b = 'sodo' + Math.random().toString(36).slice(2);
    const body = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`, blob, `\r\n--${b}--`]);
    const url = driveId ? `${this.upload}/files/${driveId}?uploadType=multipart&fields=id` : `${this.upload}/files?uploadType=multipart&fields=id`;
    return (await this.req(url, { method: driveId ? 'PATCH' : 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body })).id;
  },
  async putLarge(meta, blob) {
    const init = await this.req(`${this.upload}/files?uploadType=resumable&fields=id`, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': blob.type || 'application/octet-stream' },
      body: JSON.stringify(meta),
    }, true);
    const loc = init.headers.get('Location');
    if (!loc) throw new Error('Google Drive không nhận tải lên.');
    return (await this.req(loc, { method: 'PUT', body: blob })).id;
  },
  async download(driveId) { return (await this.req(`${this.api}/files/${driveId}?alt=media`, {}, true)).blob(); },
  async trash(driveId) {
    await this.req(`${this.api}/files/${driveId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });
  },

  scheduleSync(delay = 4000) {
    if (!this.connected() || !this.hasToken()) { updateDriveUI(); return; }
    clearTimeout(this.timer); this.timer = setTimeout(() => this.sync().catch(() => {}), delay);
  },
  /** Đồng bộ hai chiều toàn bộ sơ đồ. */
  async sync({ manual = false } = {}) {
    if (!this.connected()) return;
    if (this.busy) { this.again = true; return; }
    if (!this.hasToken()) { updateDriveUI(); if (manual) await this.login(); else return; }
    this.busy = true; this.status = 'syncing'; updateDriveUI();
    const st = this.state();
    let changedHere = false;
    try {
      if (S.map && !S.temp && S.dirty) saveNow();
      const root = await this.folder(st, 'root', 'Sodo');
      await this.folder(st, 'files', 'Tệp đính kèm', root);
      const remote = new Map();
      for (const f of await this.list(`'${root}' in parents and trashed=false and appProperties has { key='kind' and value='map' }`)) {
        remote.set(f.appProperties.sodoId, { driveId: f.id, updatedAt: +f.appProperties.updatedAt || 0 });
      }
      // 1) sơ đồ đã xóa ở máy này → bỏ vào thùng rác Drive
      for (const id of st.deleted || []) {
        const r = remote.get(id) || (st.maps[id] && { driveId: st.maps[id].driveId });
        if (r) await this.trash(r.driveId).catch(() => {});
        remote.delete(id); delete st.maps[id];
      }
      st.deleted = [];
      const upload = async m => {
        const meta = { name: `${safeName(m.title)}.sodo.json`, mimeType: 'application/json', appProperties: { kind: 'map', sodoId: m.id, updatedAt: String(m.updatedAt) } };
        if (!st.maps[m.id]?.driveId && !remote.has(m.id)) meta.parents = [root];
        const driveId = await this.put(remote.get(m.id)?.driveId || st.maps[m.id]?.driveId, meta, new Blob([JSON.stringify({ ...m, view: undefined })], { type: 'application/json' }));
        st.maps[m.id] = { driveId, syncedAt: m.updatedAt };
      };
      const fetchMap = async r => {
        const m = JSON.parse(await (await this.download(r.driveId)).text());
        m.root = normalizeNode(m.root); m.relations ||= [];
        return m;
      };
      const saveLocal = m => { let t = null; try { t = makeThumb(m); } catch {} Store.save(m, t); changedHere = true; };
      // 2) so từng sơ đồ trên máy với bản trên Drive
      for (const e of Store.index()) {
        const m = Store.load(e.id); if (!m) continue;
        const rec = st.maps[m.id], r = remote.get(m.id);
        remote.delete(m.id);
        if (!r) {
          if (rec && m.updatedAt <= rec.syncedAt && S.map?.id !== m.id) { Store.remove(m.id); delete st.maps[m.id]; changedHere = true; continue; } // đã xóa ở máy khác
          await upload(m); continue;
        }
        if (r.updatedAt === m.updatedAt) { st.maps[m.id] = { driveId: r.driveId, syncedAt: m.updatedAt }; continue; }
        // Sơ đồ hướng dẫn mặc định chưa ai sửa thì không tính là thay đổi
        const pristine = m.id === 'welcome' && m.updatedAt === m.createdAt;
        const localChanged = rec ? m.updatedAt > rec.syncedAt : !pristine, remoteChanged = !rec || r.updatedAt > rec.syncedAt;
        if (localChanged && !remoteChanged) { await upload(m); continue; }
        const rm = await fetchMap(r);
        if (remoteChanged && localChanged) {
          // cả hai nơi cùng sửa: giữ bản mới hơn, bản kia lưu thành sơ đồ riêng
          const [keep, other] = rm.updatedAt >= m.updatedAt ? [rm, m] : [m, rm];
          const copy = { ...other, id: uid(), title: `${other.title} (bản xung đột ${new Date(other.updatedAt).toLocaleString('vi-VN')})` };
          saveLocal(copy); await upload(copy);
          if (keep === rm) { saveLocal(rm); this.applyOpen(rm); st.maps[m.id] = { driveId: r.driveId, syncedAt: rm.updatedAt }; }
          else await upload(m);
          toast(`“${m.title}” được sửa ở hai nơi — đã giữ cả hai bản.`, 5000);
        } else { saveLocal(rm); this.applyOpen(rm); st.maps[m.id] = { driveId: r.driveId, syncedAt: rm.updatedAt }; }
      }
      // 3) sơ đồ chỉ có trên Drive → tải về
      for (const [id, r] of remote) {
        if (st.maps[id] && !Store.load(id)) { await this.trash(r.driveId).catch(() => {}); delete st.maps[id]; continue; }
        const m = await fetchMap(r); saveLocal(m); st.maps[id] = { driveId: r.driveId, syncedAt: m.updatedAt };
      }
      // 4) tải các tệp đính kèm chưa có trên Drive
      const need = new Map();
      for (const e of Store.index()) { const m = Store.load(e.id); if (m) walk(m.root, n => n.files?.forEach(f => { if (!st.files[f.id]) need.set(f.id, f); })); }
      for (const [fid, f] of need) {
        const rec = await FileStore.get(fid).catch(() => null);
        if (!rec) continue;
        const meta = { name: f.name, parents: [st.filesFolder], appProperties: { kind: 'file', sodoFile: fid } };
        st.files[fid] = rec.blob.size > 4 * 1024 * 1024 ? await this.putLarge(meta, rec.blob) : await this.put(null, meta, rec.blob);
        this.setState(st);
      }
      st.lastSync = Date.now();
      this.status = '';
    } catch (err) {
      this.status = err.relogin ? '' : 'error';
      if (manual || !err.relogin) toast(err.message || 'Đồng bộ Google Drive thất bại', 4500);
      console.warn(err);
      throw err;
    } finally {
      this.setState({ ...(this.state() || {}), ...st });
      this.busy = false; updateDriveUI();
      if (changedHere && !$('#home').hidden) renderMapGrid();
      if (this.again) { this.again = false; this.scheduleSync(500); }
    }
  },
  /** Nếu sơ đồ đang mở được cập nhật từ máy khác và ở đây chưa sửa gì → hiện bản mới. */
  applyOpen(m) {
    if (!S.map || S.map.id !== m.id || S.temp) return;
    if (S.dirty || S.editing) return;
    const view = { ...S.view };
    showMap(m); S.view = view; applyView();
    toast('Sơ đồ vừa được cập nhật từ máy khác');
  },
  /** Tệp đính kèm không có trên máy này → tìm trên Drive. */
  async fetchFile(meta) {
    if (!this.connected() || !this.hasToken()) return null;
    const st = this.state();
    let driveId = st.files?.[meta.id];
    if (!driveId) driveId = (await this.list(`trashed=false and appProperties has { key='sodoFile' and value='${meta.id}' }`, 'id'))[0]?.id;
    if (!driveId) return null;
    const blob = await this.download(driveId);
    const rec = { blob, name: meta.name, type: meta.type };
    await FileStore.put(meta.id, rec).catch(() => {});
    return rec;
  },
};
function updateDriveUI() {
  const st = Drive.state();
  const text = !st ? 'Google Drive'
    : Drive.status === 'syncing' ? 'Đang đồng bộ…'
    : !Drive.hasToken() ? 'Drive: bấm để đồng bộ'
    : Drive.status === 'error' ? 'Drive: lỗi đồng bộ'
    : st.lastSync ? `Đã đồng bộ ${timeAgo(st.lastSync)}` : 'Google Drive';
  $$('[data-act="drive"]').forEach(b => {
    b.hidden = !Drive.clientId();
    b.querySelector('.lbl').textContent = text;
    b.classList.toggle('warn', !!st && (!Drive.hasToken() || Drive.status === 'error'));
    b.classList.toggle('ok', !!st && Drive.hasToken() && !Drive.status);
    b.title = st ? `Google Drive: ${st.email}` : 'Đồng bộ sơ đồ qua Google Drive';
  });
}
async function driveDialog() {
  const st = Drive.state();
  if (!Drive.clientId()) {
    modal({ title: 'Đồng bộ Google Drive', body: '<p>Tính năng này chưa được bật cho trang web này (thiếu mã đăng nhập Google). Hãy liên hệ người quản trị trang.</p>' });
    return;
  }
  if (!st) {
    const ok = await modal({
      title: 'Đồng bộ qua Google Drive',
      body: `<p>Lưu tất cả sơ đồ và tệp đính kèm vào thư mục <b>Sodo</b> trong Google Drive của bạn. Mở Sodo trên máy khác, đăng nhập cùng tài khoản là có đủ sơ đồ.</p>
        <p class="muted" style="font-size:13px">Sodo chỉ xem được các tệp do chính nó tạo trong Drive của bạn, không đọc được tài liệu khác. Dữ liệu đi thẳng từ trình duyệt tới Google, không qua máy chủ nào khác.</p>`,
      actions: [{ label: 'Hủy', value: false }, { label: 'Đăng nhập Google', primary: true, value: true }],
    });
    if (!ok) return;
    try { await Drive.login(); toast('Đã kết nối ' + (Drive.state()?.email || 'Google Drive')); await Drive.sync({ manual: true }); }
    catch (err) { if (!Drive.state()?.lastSync) Drive.setState(null); updateDriveUI(); toast(err.message, 5000); }
    return;
  }
  if (!Drive.hasToken()) {
    try { await Drive.sync({ manual: true }); } catch {}
    return;
  }
  const act = await modal({
    title: 'Google Drive',
    body: `<p>Đang đồng bộ với <b>${esc(st.email)}</b>.</p><p class="muted">Lần đồng bộ gần nhất: ${st.lastSync ? timeAgo(st.lastSync) : 'chưa có'} · ${Object.keys(st.maps || {}).length} sơ đồ · ${Object.keys(st.files || {}).length} tệp.</p>
      <p class="muted" style="font-size:13px">Sơ đồ nằm trong thư mục “Sodo” trên Drive. Mỗi lần mở trang, bấm nút Drive một lần để tiếp tục tự động đồng bộ.</p>`,
    actions: [{ label: 'Ngắt kết nối', value: 'logout' }, { label: 'Đóng', value: null }, { label: 'Đồng bộ ngay', primary: true, value: 'sync' }],
  });
  if (act === 'sync') { try { await Drive.sync({ manual: true }); toast('Đã đồng bộ xong'); } catch {} }
  if (act === 'logout' && await confirmBox('Ngắt kết nối Google Drive?', 'Sơ đồ trên máy này và trên Drive vẫn giữ nguyên, chỉ ngừng đồng bộ.', 'Ngắt kết nối')) Drive.logout();
}

/* =====================================================================
   CHẾ ĐỘ ÔN TẬP — che chữ các nhánh, bấm vào để lật lên
   ===================================================================== */
function startQuiz(fromDepth = S.quizDepth || 1) {
  if (S.editing) commitEdit();
  if (S.presenting) stopPresent();
  S.quizDepth = fromDepth;
  const shown = new Set();
  walk(S.map.root, (n, p, d) => { if (d < fromDepth) shown.add(n.id); });
  S.quiz = { shown };
  $('#editor').classList.add('quizzing');
  $('#quiz-bar').hidden = false;
  $$('#quiz-bar [data-act="quiz-depth"]').forEach(b => b.classList.toggle('on', +b.dataset.val === fromDepth));
  render(); updateQuizCount();
}
function stopQuiz() {
  S.quiz = null;
  $('#editor').classList.remove('quizzing');
  $('#quiz-bar').hidden = true;
  render();
}
function quizFlip(id) {
  if (!S.quiz) return;
  if (S.quiz.shown.has(id) && !isRoot(id)) { if (S.sel === id) S.quiz.shown.delete(id); }
  else S.quiz.shown.add(id);
  S.sel = id; S.selRel = null;
  render(); updateQuizCount();
}
function quizAll(show) {
  if (!S.quiz) return;
  if (show) for (const id of S.L.boxes.keys()) S.quiz.shown.add(id);
  else return startQuiz(S.quizDepth);
  render(); updateQuizCount();
}
function updateQuizCount() {
  if (!S.quiz) return;
  const ids = [...S.L.boxes.keys()].filter(id => {
    const d = S.index.get(id)?.depth ?? 0;
    return d >= S.quizDepth;
  });
  const done = ids.filter(id => S.quiz.shown.has(id)).length;
  $('#quiz-count').textContent = `Đã lật ${done} / ${ids.length}`;
}

/* =====================================================================
   AI — tạo sơ đồ / gợi ý ý con. Người dùng chọn nhà cung cấp và dùng khóa API
   của chính mình; khóa lưu trong trình duyệt, gọi thẳng tới máy chủ của hãng.
   ===================================================================== */
const PROVIDERS = {
  gemini: { name: 'Gemini', org: 'Google', model: 'gemini-3.8-flash', keyUrl: 'https://aistudio.google.com/apikey', keyHint: 'AIza…', free: true, note: 'Có gói miễn phí, chỉ cần tài khoản Google.' },
  groq: { name: 'Groq', org: 'Groq', model: 'openai/gpt-oss-120b', keyUrl: 'https://console.groq.com/keys', keyHint: 'gsk_…', free: true, base: 'https://api.groq.com/openai/v1', note: 'Miễn phí (giới hạn số lượt), trả lời rất nhanh.' },
  openrouter: { name: 'OpenRouter', org: 'OpenRouter', model: 'openrouter/free', keyUrl: 'https://openrouter.ai/settings/keys', keyHint: 'sk-or-…', free: true, base: 'https://openrouter.ai/api/v1', note: 'Một khóa dùng hàng trăm mô hình, có loại miễn phí.' },
  mistral: { name: 'Mistral', org: 'Mistral AI', model: 'mistral-small-latest', keyUrl: 'https://console.mistral.ai/api-keys', keyHint: '', free: true, base: 'https://api.mistral.ai/v1', note: 'Có gói thử nghiệm miễn phí.' },
  claude: { name: 'Claude', org: 'Anthropic', model: 'claude-opus-5-5', models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'], keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…', note: 'Nội dung chính xác, mạch lạc nhất. Trả phí theo lượt.' },
  openai: { name: 'ChatGPT', org: 'OpenAI', model: 'gpt-5.4-mini', keyUrl: 'https://platform.openai.com/api-keys', keyHint: 'sk-…', base: 'https://api.openai.com/v1', note: 'Trả phí theo lượt dùng.' },
  deepseek: { name: 'DeepSeek', org: 'DeepSeek', model: 'deepseek-flash', keyUrl: 'https://platform.deepseek.com/api_keys', keyHint: 'sk-…', base: 'https://api.deepseek.com', note: 'Giá rất rẻ, cần nạp tiền trước.' },
};
const AI = {
  sdkUrl: 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.133.0/+esm',
  load() {
    let c = {};
    try { c = JSON.parse(localStorage.getItem('sodo.ai') || '{}'); } catch {}
    c.keys ||= {}; c.models ||= {};
    try { // chuyển khóa Claude từ phiên bản trước
      const old = localStorage.getItem('sodo.aikey');
      if (old) { c.keys.claude ||= old; c.provider ||= 'claude'; localStorage.removeItem('sodo.aikey'); localStorage.setItem('sodo.ai', JSON.stringify(c)); }
    } catch {}
    if (!PROVIDERS[c.provider]) c.provider = 'gemini';
    return c;
  },
  save(c) { try { localStorage.setItem('sodo.ai', JSON.stringify(c)); } catch {} },
  current() {
    const c = this.load(), p = c.provider;
    return { id: p, ...PROVIDERS[p], key: c.keys[p] || '', model: c.models[p] || PROVIDERS[p].model };
  },
  async sdk() { return (this._mod ||= import(this.sdkUrl)).then(m => m.default || m.Anthropic); },
  system: `Bạn là trợ lý soạn sơ đồ tư duy cho giáo viên và học sinh Việt Nam.
Trả lời bằng một dàn ý dạng văn bản thụt lề:
- Mỗi dòng là một ý ngắn gọn (thường không quá 8 từ), không dùng gạch đầu dòng, không đánh số, không Markdown.
- Thụt đúng 2 dấu cách cho mỗi cấp.
- Dòng đầu tiên, không thụt lề, là chủ đề trung tâm.
Khi cần công thức toán, lý, hóa, viết bằng LaTeX đặt giữa hai dấu $, ví dụ $v = \\frac{s}{t}$, $x^2 + y^2 = r^2$; không dùng $ cho chữ thường.
Viết bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác. Nội dung phải chính xác về kiến thức, phù hợp chương trình phổ thông khi chủ đề là bài học.`,
  get outlineSpec() {
    return {
      system: this.system,
      schema: { type: 'object', properties: { outline: { type: 'string', description: 'Dàn ý thụt lề, mỗi cấp 2 dấu cách' } }, required: ['outline'], additionalProperties: false },
      gschema: { type: 'OBJECT', properties: { outline: { type: 'STRING' } }, required: ['outline'] },
      plain: 'Chỉ trả về đúng dàn ý, không có lời dẫn hay lời kết, không đặt trong khối code.',
      tooLong: 'Dàn ý quá dài, hãy chọn mức chi tiết thấp hơn.',
    };
  },
  /** Gọi dịch vụ AI đang chọn; trả về chữ thô (JSON theo spec.schema, hoặc văn bản với dịch vụ không hỗ trợ schema). */
  ask(prompt, spec, cfg = this.current()) {
    return cfg.id === 'claude' ? this.claude(prompt, cfg, spec)
      : cfg.id === 'gemini' ? this.gemini(prompt, cfg, spec)
      : this.openaiCompat(prompt, cfg, spec);
  },
  /** Gọi AI và trả về dàn ý dạng văn bản thụt lề. */
  async outline(prompt, cfg = this.current()) {
    let text = await this.ask(prompt, this.outlineSpec, cfg);
    try { const o = JSON.parse(text); if (typeof o?.outline === 'string') text = o.outline; } catch {}
    const outline = cleanAIText(text);
    if (!outline.trim()) throw new Error('AI không trả về dàn ý.');
    return outline;
  },
  async claude(prompt, cfg, spec) {
    const Anthropic = await this.sdk();
    const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true });
    try {
      const res = await client.beta.messages.create({
        model: cfg.model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: spec.schema } },
        system: spec.system,
        messages: [{ role: 'user', content: prompt }],
      });
      if (res.stop_reason === 'refusal') throw new Error('AI đã từ chối yêu cầu này. Hãy thử diễn đạt chủ đề khác đi.');
      if (res.stop_reason === 'max_tokens') throw new Error(spec.tooLong);
      return res.content.find(b => b.type === 'text')?.text || '';
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new Error('Khóa API Claude không hợp lệ. Mở “Cài đặt AI” để nhập lại.');
      if (err instanceof Anthropic.PermissionDeniedError) throw new Error('Khóa API không có quyền dùng mô hình này.');
      if (err instanceof Anthropic.NotFoundError) throw new Error(`Không có mô hình “${cfg.model}”. Mở “Cài đặt AI” để chọn mô hình khác.`);
      if (err instanceof Anthropic.RateLimitError) throw new Error('Đã vượt giới hạn gọi API, hãy thử lại sau ít phút.');
      if (err instanceof Anthropic.APIConnectionError) throw new Error('Không kết nối được tới máy chủ AI. Kiểm tra mạng.');
      if (err instanceof Anthropic.APIError) throw new Error(`Lỗi từ Claude (${err.status ?? '?'}): ${err.message}`);
      throw err;
    }
  },
  async gemini(prompt, cfg, spec) {
    const data = await httpJSON(cfg, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: spec.system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: spec.gschema,
        },
      }),
    });
    const cand = data.candidates?.[0];
    if (!cand) throw new Error(data.promptFeedback?.blockReason ? 'Gemini đã chặn yêu cầu này. Hãy diễn đạt chủ đề khác đi.' : 'Gemini không trả lời.');
    if (cand.finishReason === 'MAX_TOKENS') throw new Error(spec.tooLong);
    if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST'].includes(cand.finishReason)) throw new Error('Gemini đã chặn yêu cầu này. Hãy diễn đạt chủ đề khác đi.');
    return (cand.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
  },
  async openaiCompat(prompt, cfg, spec) {
    const headers = { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' };
    if (cfg.id === 'openrouter') { headers['X-Title'] = 'Sodo'; headers['HTTP-Referer'] = location.origin; }
    const data = await httpJSON(cfg, `${cfg.base}/chat/completions`, {
      method: 'POST', headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: spec.system + '\n' + spec.plain },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const ch = data.choices?.[0];
    if (!ch) throw new Error(data.error?.message || 'AI không trả lời.');
    if (ch.finish_reason === 'length') throw new Error(spec.tooLong);
    if (ch.finish_reason === 'content_filter') throw new Error('AI đã chặn yêu cầu này. Hãy diễn đạt chủ đề khác đi.');
    return ch.message?.content || '';
  },

  /** Danh sách mô hình mà khóa này dùng được (cũng là cách kiểm tra khóa). */
  async listModels(cfg) {
    const skip = /embed|tts|whisper|dall-e|image|audio|realtime|transcri|moderation|guard|aqa|imagen|veo|sora|computer|ocr|search-preview/i;
    let ids = [];
    if (cfg.id === 'claude') {
      const Anthropic = await this.sdk();
      const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true });
      try { for await (const m of client.models.list()) ids.push(m.id); }
      catch (err) {
        if (err instanceof Anthropic.AuthenticationError) throw new Error('Khóa API không hợp lệ.');
        // Với khóa sai, máy chủ trả lỗi mà trình duyệt không đọc được nên trông như mất kết nối
        if (err instanceof Anthropic.APIConnectionError) throw new Error('Không kiểm tra được khóa Claude — thường là do khóa sai. Hãy kiểm tra lại khóa và mạng.');
        throw err;
      }
    } else if (cfg.id === 'gemini') {
      const data = await httpJSON(cfg, 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': cfg.key } });
      ids = (data.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''));
    } else {
      // Danh sách mô hình của OpenRouter là công khai, nên phải kiểm tra khóa riêng
      if (cfg.id === 'openrouter') await httpJSON(cfg, `${cfg.base}/key`, { headers: { Authorization: `Bearer ${cfg.key}` } });
      const data = await httpJSON(cfg, `${cfg.base}/models`, { headers: { Authorization: `Bearer ${cfg.key}` } });
      ids = (data.data || []).map(m => m.id);
      if (cfg.id === 'openrouter') ids.sort((a, b) => (b.endsWith(':free') || b === 'openrouter/free') - (a.endsWith(':free') || a === 'openrouter/free'));
    }
    return ids.filter(id => !skip.test(id));
  },
};
/** fetch + JSON, đổi lỗi HTTP thành câu tiếng Việt dễ hiểu. */
async function httpJSON(cfg, url, opts) {
  let res;
  try { res = await fetch(url, opts); }
  catch { throw new Error(`Không kết nối được tới ${cfg.name}. Kiểm tra mạng.`); }
  let data = {};
  try { data = await res.json(); } catch {}
  if (res.ok) return data;
  const msg = data.error?.message || data.message || data.detail || res.statusText;
  if (res.status === 401 || (res.status === 400 && /api.?key/i.test(msg))) throw new Error(`Khóa API ${cfg.name} không hợp lệ. Mở “Cài đặt AI” để nhập lại.`);
  if (res.status === 402) throw new Error(`Tài khoản ${cfg.name} đã hết tiền / hết hạn mức. Hãy nạp thêm hoặc chọn dịch vụ khác.`);
  if (res.status === 403) throw new Error(`Khóa ${cfg.name} không có quyền dùng mô hình này.`);
  if (res.status === 404 || /model.*(not|does not) exist|not found/i.test(msg)) throw new Error(`Không có mô hình “${cfg.model}” trên ${cfg.name}. Mở “Cài đặt AI” để chọn mô hình khác.`);
  if (res.status === 429) throw new Error(`${cfg.name} báo đã hết lượt dùng tạm thời. Đợi ít phút rồi thử lại, hoặc chọn dịch vụ khác.`);
  throw new Error(`Lỗi từ ${cfg.name} (${res.status}): ${msg}`);
}
/** Bỏ phần suy nghĩ, khối code và lời dẫn mà một số mô hình hay thêm vào. */
function cleanAIText(text) {
  let t = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  const fence = /```[a-z]*\n([\s\S]*?)```/i.exec(t);
  if (fence) t = fence[1];
  const lines = t.replace(/\r/g, '').split('\n');
  while (lines.length > 1 && /[:：]\s*$/.test(lines[0].trim()) && !/^\s/.test(lines[1])) lines.shift();
  return lines.join('\n').trim();
}

async function aiSettings() {
  const c = AI.load();
  let pick = c.provider;
  const keys = { ...c.keys }, models = { ...c.models };
  const res = await modal({
    title: 'Cài đặt AI', wide: true,
    body: `<p>Chọn dịch vụ AI và dán khóa API của bạn. Dịch vụ có nhãn <span class="free-tag">Miễn phí</span> cho dùng không mất tiền (có giới hạn số lượt).</p>
      <div class="prov-grid">${Object.entries(PROVIDERS).map(([id, p]) => `
        <button type="button" class="prov" data-prov="${id}"><b>${p.name}</b>${p.free ? '<span class="free-tag">Miễn phí</span>' : ''}<small>${esc(p.note)}</small></button>`).join('')}</div>
      <div class="prov-form">
        <label class="pn-label" for="ai-key">Khóa API <a id="ai-key-link" target="_blank" rel="noopener">Lấy khóa ↗</a></label>
        <input class="field" id="ai-key" type="password" autocomplete="off" style="width:100%">
        <label class="pn-label" for="ai-model" style="margin-top:12px">Mô hình
          <button type="button" id="ai-load">Kiểm tra khóa & tải danh sách</button></label>
        <input class="field" id="ai-model" list="ai-model-list" style="width:100%" spellcheck="false">
        <datalist id="ai-model-list"></datalist>
        <div id="ai-status" class="muted" style="font-size:13px;margin-top:8px;min-height:18px"></div>
        <p class="muted" style="font-size:12px;margin:6px 0 0">Khóa chỉ lưu trong trình duyệt này và chỉ gửi tới máy chủ của dịch vụ bạn chọn. Không nhập khóa trên máy dùng chung.</p>
      </div>`,
    actions: [{ label: 'Hủy', value: null }, { label: 'Lưu', primary: true, value: () => true }],
    onOpen: m => {
      const keyIn = $('#ai-key', m), modelIn = $('#ai-model', m), status = $('#ai-status', m), list = $('#ai-model-list', m);
      const show = id => {
        pick = id;
        const p = PROVIDERS[id];
        $$('.prov', m).forEach(b => b.classList.toggle('on', b.dataset.prov === id));
        keyIn.value = keys[id] || ''; keyIn.placeholder = p.keyHint || 'Dán khóa API vào đây';
        modelIn.value = models[id] || p.model; modelIn.placeholder = p.model;
        $('#ai-key-link', m).href = p.keyUrl;
        list.innerHTML = (p.models || [p.model]).map(x => `<option value="${esc(x)}">`).join('');
        status.textContent = '';
      };
      keyIn.oninput = () => { keys[pick] = keyIn.value.trim(); };
      modelIn.oninput = () => { models[pick] = modelIn.value.trim(); };
      $$('.prov', m).forEach(b => b.onclick = () => show(b.dataset.prov));
      $('#ai-load', m).onclick = async () => {
        const cfg = { id: pick, ...PROVIDERS[pick], key: keys[pick] || '', model: models[pick] || PROVIDERS[pick].model };
        if (!cfg.key) { status.textContent = 'Hãy dán khóa API trước.'; return; }
        status.textContent = 'Đang kiểm tra…';
        try {
          const ids = await AI.listModels(cfg);
          list.innerHTML = ids.map(id => `<option value="${esc(id)}">`).join('');
          const ok = ids.includes(modelIn.value || cfg.model);
          status.textContent = `✅ Khóa hợp lệ, có ${ids.length} mô hình. ` + (ok ? `Đang dùng “${modelIn.value || cfg.model}”.` : `⚠️ Không thấy “${modelIn.value || cfg.model}” — bấm vào ô Mô hình để chọn.`);
          if (!ok) { modelIn.value = ''; modelIn.focus(); }
        } catch (err) { status.textContent = '❌ ' + err.message; }
      };
      show(pick);
    },
  });
  if (!res) return false;
  for (const k of Object.keys(keys)) if (!keys[k]) delete keys[k];
  for (const k of Object.keys(models)) if (!models[k] || models[k] === PROVIDERS[k].model) delete models[k];
  AI.save({ provider: pick, keys, models });
  toast(`Đã chọn ${PROVIDERS[pick].name} · ${models[pick] || PROVIDERS[pick].model}`);
  return !!keys[pick];
}
async function ensureAI() {
  return AI.current().key ? true : aiSettings();
}
function busy(text) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal busy"><span class="spinner"></span>${esc(text)}</div>`;
  $('#modal-root').appendChild(back);
  return () => back.remove();
}
/* ----- Đọc chữ từ tệp tài liệu (PDF, Word, văn bản) ngay trong trình duyệt ----- */
const LIBS = {
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs',
  mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
  pptx: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
};
const loadScript = src => new Promise((res, rej) => {
  if ([...document.scripts].some(s => s.src === src)) return res();
  const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Không tải được thư viện, kiểm tra mạng.'));
  document.head.appendChild(s);
});
async function extractDocText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfjs = await import(LIBS.pdf);
    pdfjs.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const tc = await (await pdf.getPage(i)).getTextContent();
      let line = '', out = [];
      for (const it of tc.items) { line += it.str; if (it.hasEOL) { out.push(line); line = ''; } }
      if (line) out.push(line);
      pages.push(out.join('\n'));
    }
    const text = pages.join('\n\n').trim();
    if (!text) throw new Error('PDF này là ảnh chụp (không có chữ để đọc). Hãy dùng PDF có chữ, hoặc dán nội dung vào ô bên trên.');
    return text;
  }
  if (name.endsWith('.docx')) {
    await loadScript(LIBS.mammoth);
    const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return r.value.trim();
  }
  if (name.endsWith('.doc')) throw new Error('Tệp .doc (Word cũ) chưa hỗ trợ. Hãy lưu lại thành .docx hoặc PDF.');
  return (await file.text()).trim();
}

const AI_DEPTH = {
  2: 'có 2 cấp bên dưới chủ đề trung tâm, tổng cộng khoảng 15–25 ý',
  3: 'có 3 cấp bên dưới chủ đề trung tâm, tổng cộng khoảng 30–45 ý',
  4: 'có 4 cấp bên dưới chủ đề trung tâm, tổng cộng khoảng 50–70 ý',
};
const DOC_LIMIT = 120000;

async function aiCreateMap() {
  if (!(await ensureAI())) return;
  let mode = 'topic', docText = '', docName = '';
  const r = await modal({
    title: 'Tạo sơ đồ bằng AI', wide: true,
    body: `<div class="seg" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
        <button type="button" class="on" data-mode="topic">Từ chủ đề</button><button type="button" data-mode="doc">Từ tài liệu</button></div>
      <div data-pane="topic">
        <p>Mô tả chủ đề, bài học hoặc vấn đề bạn muốn vẽ sơ đồ.</p>
        <textarea class="field" rows="4" id="ai-topic" placeholder="Ví dụ: Quang hợp ở thực vật – Sinh học 11, dùng để ôn tập trước kiểm tra"></textarea>
      </div>
      <div data-pane="doc" hidden>
        <p>Dán nội dung bài học, hoặc chọn tệp <b>PDF, Word (.docx), .txt</b>. AI chỉ dùng thông tin có trong tài liệu.</p>
        <textarea class="field" rows="7" id="ai-doc" placeholder="Dán nội dung tài liệu vào đây…"></textarea>
        <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
          <label class="btn small" style="cursor:pointer">${icon('upload')} Chọn tệp…<input type="file" id="ai-file" accept=".pdf,.docx,.txt,.md,text/plain,application/pdf" hidden></label>
          <span id="ai-doc-info" class="muted" style="font-size:13px"></span>
        </div>
        <input class="field" id="ai-focus" style="width:100%;margin-top:10px" placeholder="Yêu cầu thêm (không bắt buộc), ví dụ: chỉ tập trung vào phần II, dùng để ôn thi">
      </div>
      <div class="row" style="margin-top:12px;gap:10px;flex-wrap:wrap">
        <label class="muted" for="ai-depth">Mức chi tiết</label>
        <select id="ai-depth" class="field" style="width:auto">
          <option value="2">Ngắn gọn (2 cấp)</option><option value="3" selected>Vừa (3 cấp)</option><option value="4">Chi tiết (4 cấp)</option>
        </select>
        <span style="flex:1"></span><span class="muted" id="ai-using" style="font-size:13px"></span><button class="btn small" type="button" id="ai-key-btn">Cài đặt AI</button>
      </div>`,
    actions: [{ label: 'Hủy', value: null }, {
      label: 'Tạo sơ đồ', primary: true,
      value: m => ({ mode, topic: $('#ai-topic', m).value.trim(), doc: $('#ai-doc', m).value.trim(), focus: $('#ai-focus', m).value.trim(), depth: +$('#ai-depth', m).value }),
    }],
    onOpen: m => {
      $('#ai-topic', m).focus();
      const using = () => { const c = AI.current(); $('#ai-using', m).textContent = `Dùng: ${c.name} · ${c.model}`; };
      using(); $('#ai-key-btn', m).onclick = async () => { await aiSettings(); using(); };
      $$('[data-mode]', m).forEach(b => b.onclick = () => {
        mode = b.dataset.mode;
        $$('[data-mode]', m).forEach(x => x.classList.toggle('on', x === b));
        $$('[data-pane]', m).forEach(p => { p.hidden = p.dataset.pane !== mode; });
        $(mode === 'topic' ? '#ai-topic' : '#ai-doc', m).focus();
      });
      const info = $('#ai-doc-info', m), docIn = $('#ai-doc', m);
      const showInfo = () => { const n = docIn.value.trim().length; info.textContent = n ? `${docName ? docName + ' · ' : ''}${n.toLocaleString('vi-VN')} ký tự` : ''; };
      docIn.oninput = () => { docName = ''; showInfo(); };
      $('#ai-file', m).onchange = async e => {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        info.textContent = `Đang đọc ${f.name}…`;
        try { docIn.value = await extractDocText(f); docName = f.name; showInfo(); }
        catch (err) { console.error(err); info.textContent = '❌ ' + (err.message || 'Không đọc được tệp này'); }
      };
    },
  });
  if (!r) return;
  let prompt;
  if (r.mode === 'doc') {
    if (!r.doc) { toast('Hãy dán nội dung hoặc chọn tệp tài liệu'); return; }
    let doc = r.doc;
    if (doc.length > DOC_LIMIT) {
      const ok = await modal({
        title: 'Tài liệu quá dài',
        body: `<p>Tài liệu có ${doc.length.toLocaleString('vi-VN')} ký tự. AI chỉ đọc được khoảng ${DOC_LIMIT.toLocaleString('vi-VN')} ký tự đầu (≈ ${Math.round(DOC_LIMIT / doc.length * 100)}% tài liệu).</p><p>Bạn có thể bấm Hủy và chỉ dán phần cần làm sơ đồ.</p>`,
        actions: [{ label: 'Hủy', value: false }, { label: 'Dùng phần đầu', primary: true, value: true }],
      });
      if (!ok) return;
      doc = doc.slice(0, DOC_LIMIT);
    }
    prompt = `Dưới đây là một tài liệu học tập.\n\n<tai_lieu>\n${doc}\n</tai_lieu>\n\n` +
      `Hãy lập sơ đồ tư duy tóm tắt tài liệu trên, ${AI_DEPTH[r.depth]} (ít hơn nếu tài liệu ngắn — không bịa thêm ý cho đủ số), thường 3–7 nhánh chính. ` +
      `Chỉ dùng thông tin có trong tài liệu, không thêm kiến thức bên ngoài. Giữ đúng thuật ngữ, số liệu, công thức của tài liệu. ` +
      `Chủ đề trung tâm là tên bài/chủ đề chính của tài liệu, viết ngắn gọn.` + (r.focus ? `\nYêu cầu thêm của người dùng: ${r.focus}` : '');
  } else {
    if (!r.topic) { toast('Hãy nhập chủ đề'); return; }
    prompt = `Chủ đề: ${r.topic}\n\nHãy lập sơ đồ tư duy ${AI_DEPTH[r.depth]}, khoảng 4–7 nhánh chính. Chủ đề trung tâm nên là một cụm từ ngắn.`;
  }
  const done = busy(`${AI.current().name} đang soạn sơ đồ… (thường mất 10–40 giây)`);
  try {
    const text = await AI.outline(prompt);
    const root = outlineToRoot(text);
    if (!root) throw new Error('Không đọc được dàn ý AI trả về.');
    assignSides(root);
    done(); createMap(newMap(root, root.text));
    toast(`AI đã tạo ${countNodes(root)} nút`);
  } catch (err) { done(); console.error(err); toast(err.message || 'Có lỗi khi gọi AI', 4500); }
}
async function aiExpand(id = S.sel) {
  if (!id) { toast('Hãy chọn một nút trước'); return; }
  if (S.editing) commitEdit();
  if (!(await ensureAI())) return;
  const n = getNode(id);
  const path = [];
  for (let cur = n; cur; cur = parentOf(cur.id)) path.unshift(cur.text.replace(/\n/g, ' '));
  const existing = n.children.map(c => c.text.replace(/\n/g, ' '));
  const done = busy(`AI đang gợi ý ý con cho “${n.text.slice(0, 40)}”…`);
  try {
    const text = await AI.outline(
      `Sơ đồ tư duy về: ${path[0]}\nNhánh đang mở rộng: ${path.join(' › ')}\n` +
      (existing.length ? `Các ý con đã có (không lặp lại): ${existing.join('; ')}\n` : '') +
      `\nHãy đề xuất 3–6 ý con MỚI cho “${n.text.replace(/\n/g, ' ')}”, có thể kèm tối đa 1 cấp con bên dưới mỗi ý nếu thực sự hữu ích. Dòng đầu tiên của dàn ý là chính “${n.text.replace(/\n/g, ' ')}”.`);
    const roots = parseOutline(text);
    const items = roots.length === 1 ? roots[0].children : roots;
    if (!items.length) throw new Error('AI không đưa ra được ý mới.');
    done();
    commit(() => {
      items.forEach(it => { if (isRoot(id)) it.side = pickSide(); n.children.push(it); });
      n.collapsed = false; S.sel = id;
    });
    toast(`Đã thêm ${items.length} ý từ AI`);
  } catch (err) { done(); console.error(err); toast(err.message || 'Có lỗi khi gọi AI', 4500); }
}

/* =====================================================================
   CÂU HỎI ÔN TẬP — AI soạn từ nội dung sơ đồ; học sinh làm bài, chấm điểm, in đề.
   Bộ câu hỏi lưu trong sơ đồ (map.quiz) nên đi kèm khi đồng bộ, xuất tệp và chia sẻ link.
   ===================================================================== */
const QUIZ_SPEC = {
  system: `Bạn là giáo viên Việt Nam giỏi ra đề kiểm tra. Bạn soạn câu hỏi ôn tập từ nội dung một sơ đồ tư duy.
Kiến thức phải chính xác, câu hỏi rõ ràng, một nghĩa, phù hợp học sinh phổ thông. Viết bằng tiếng Việt, trừ khi nội dung thuộc môn ngoại ngữ.
Khi cần công thức toán, lý, hóa, viết bằng LaTeX đặt giữa hai dấu $, ví dụ $x^2 + y^2 = r^2$.`,
  schema: {
    type: 'object', additionalProperties: false, required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['question', 'options', 'correct', 'answer', 'explain'],
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' }, description: '4 phương án với câu trắc nghiệm; [] với câu tự luận' },
            correct: { type: 'integer', description: 'Chỉ số phương án đúng (0–3); -1 với câu tự luận' },
            answer: { type: 'string', description: 'Đáp án (mẫu) ngắn gọn' },
            explain: { type: 'string', description: 'Giải thích 1–2 câu' },
          },
        },
      },
    },
  },
  gschema: {
    type: 'OBJECT', required: ['questions'],
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT', required: ['question', 'options', 'correct', 'answer', 'explain'],
          properties: { question: { type: 'STRING' }, options: { type: 'ARRAY', items: { type: 'STRING' } }, correct: { type: 'INTEGER' }, answer: { type: 'STRING' }, explain: { type: 'STRING' } },
        },
      },
    },
  },
  plain: 'Chỉ trả về một đối tượng JSON hợp lệ dạng {"questions":[{"question":"…","options":["…"],"correct":0,"answer":"…","explain":"…"}]}, không có lời dẫn, không đặt trong khối code.',
  tooLong: 'Bộ câu hỏi quá dài, hãy chọn ít câu hơn.',
};
/** Đọc JSON từ câu trả lời AI (bỏ khối code, lời dẫn) và giữ lại các câu hỏi hợp lệ. */
function parseQuiz(text) {
  let t = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  const fence = /```[a-z]*\n([\s\S]*?)```/i.exec(t);
  if (fence) t = fence[1];
  let o;
  try { o = JSON.parse(t); } catch {
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    try { o = JSON.parse(t.slice(a, b + 1)); } catch { throw new Error('AI trả về sai định dạng. Hãy thử lại hoặc chọn dịch vụ AI khác.'); }
  }
  const list = Array.isArray(o) ? o : o?.questions || [];
  return list.map(q => {
    const options = Array.isArray(q.options) ? q.options.map(x => String(x).trim()).filter(Boolean) : [];
    // Một số mô hình ghi đáp án là "1" hoặc "B" thay vì số
    const c = String(q.correct ?? '').trim();
    const correct = /^\d+$/.test(c) ? +c : c.length === 1 ? LETTERS.indexOf(c.toUpperCase()) : -1;
    const mcq = options.length >= 2 && correct >= 0 && correct < options.length;
    return {
      q: String(q.question || '').trim(), options: mcq ? options : [], correct: mcq ? correct : -1,
      answer: String(q.answer || (mcq ? options[correct] : '')).trim(), explain: String(q.explain || '').trim(),
    };
  }).filter(q => q.q && (q.options.length || q.answer));
}
/** Chữ có công thức $…$ → HTML (công thức vẽ bằng MathJax nếu đã sẵn sàng). */
function richText(str) {
  const s = String(str || '');
  let out = '', last = 0;
  MATH_RE.lastIndex = 0;
  for (let m; (m = MATH_RE.exec(s));) {
    out += esc(s.slice(last, m.index));
    let html = null;
    if (MJ.state === 'ready') { try { html = `<span class="qz-math">${MJ.get(m[1], 16).svg}</span>`; } catch {} }
    out += html || esc(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(s.slice(last));
}
async function mathReady(texts) {
  if (!texts.some(t => hasMath(t))) return;
  MJ.load();
  for (let i = 0; i < 60 && MJ.state === 'loading'; i++) await new Promise(r => setTimeout(r, 100));
}
const LETTERS = 'ABCDEFGH';

async function questionsAction() {
  if (S.editing) commitEdit();
  if (S.map.quiz?.questions?.length) return quizPlayer();
  if (S.temp) { toast('Sơ đồ này chưa có bộ câu hỏi'); return; }
  return quizSetup();
}
async function quizSetup() {
  if (!(await ensureAI())) return;
  const sel = S.sel && !isRoot(S.sel) ? getNode(S.sel) : null;
  let kind = 'mcq';
  const r = await modal({
    title: 'AI soạn câu hỏi ôn tập', wide: true,
    body: `<p>AI đọc nội dung sơ đồ (kể cả ghi chú) và soạn câu hỏi. Học sinh làm bài ngay trong Sodo, được chấm điểm; bạn cũng có thể in đề kèm đáp án.</p>
      ${sel ? `<div class="seg" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
        <button type="button" class="on" data-scope="all">Cả sơ đồ</button><button type="button" data-scope="sel">Nhánh “${esc(sel.text.slice(0, 30))}”</button></div>` : ''}
      <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px">
        <button type="button" class="on" data-kind="mcq">Trắc nghiệm</button><button type="button" data-kind="short">Tự luận ngắn</button><button type="button" data-kind="mix">Cả hai</button></div>
      <div class="row" style="gap:10px;flex-wrap:wrap">
        <label class="muted" for="qz-n">Số câu</label>
        <select id="qz-n" class="field" style="width:auto"><option>5</option><option selected>10</option><option>15</option><option>20</option></select>
        <label class="muted" for="qz-lv">Mức độ</label>
        <select id="qz-lv" class="field" style="width:auto">
          <option value="Nhận biết và thông hiểu">Nhận biết – thông hiểu</option>
          <option value="Trộn đủ các mức nhận biết, thông hiểu, vận dụng" selected>Trộn các mức</option>
          <option value="Chủ yếu vận dụng và vận dụng cao, cần suy luận, không hỏi thuộc lòng">Vận dụng – vận dụng cao</option>
        </select>
      </div>
      <input class="field" id="qz-focus" style="width:100%;margin-top:12px" placeholder="Yêu cầu thêm (không bắt buộc), ví dụ: dành cho học sinh lớp 7, tránh câu hỏi tính toán">
      <div class="row" style="margin-top:12px;gap:10px"><span style="flex:1"></span><span class="muted" id="ai-using" style="font-size:13px"></span><button class="btn small" type="button" id="ai-key-btn">Cài đặt AI</button></div>`,
    actions: [{ label: 'Hủy', value: null }, {
      label: 'Soạn câu hỏi', primary: true,
      value: m => ({ scope: $('[data-scope].on', m)?.dataset.scope || 'all', kind, n: +$('#qz-n', m).value, level: $('#qz-lv', m).value, focus: $('#qz-focus', m).value.trim() }),
    }],
    onOpen: m => {
      const using = () => { const c = AI.current(); $('#ai-using', m).textContent = `Dùng: ${c.name} · ${c.model}`; };
      using(); $('#ai-key-btn', m).onclick = async () => { await aiSettings(); using(); };
      $$('[data-scope]', m).forEach(b => b.onclick = () => $$('[data-scope]', m).forEach(x => x.classList.toggle('on', x === b)));
      $$('[data-kind]', m).forEach(b => b.onclick = () => { kind = b.dataset.kind; $$('[data-kind]', m).forEach(x => x.classList.toggle('on', x === b)); });
    },
  });
  if (!r) return;
  const node = r.scope === 'sel' && sel ? sel : S.map.root;
  const content = toMarkdown(node).slice(0, 60000);
  const kinds = {
    mcq: 'tất cả là câu trắc nghiệm',
    short: 'tất cả là câu tự luận ngắn (trả lời trong 1–3 câu)',
    mix: 'khoảng 2/3 trắc nghiệm, 1/3 tự luận ngắn',
  };
  const done = busy(`AI đang soạn ${r.n} câu hỏi…`);
  try {
    const raw = await AI.ask(`Nội dung sơ đồ tư duy (dạng Markdown, dòng bắt đầu bằng > là ghi chú):
"""
${content}
"""

Soạn đúng ${r.n} câu hỏi ôn tập dựa trên nội dung trên.
- Loại câu: ${kinds[r.kind]}.
- Mức độ: ${r.level}.
- Câu trắc nghiệm: đúng 4 phương án trong "options", chỉ 1 phương án đúng, "correct" là chỉ số 0–3 của phương án đúng; phương án nhiễu phải hợp lý; vị trí đáp án đúng thay đổi giữa các câu; không dùng "Tất cả đều đúng" hay "Cả A và B". "answer" nhắc lại phương án đúng.
- Câu tự luận ngắn: "options" là [], "correct" là -1, "answer" là đáp án mẫu ngắn gọn.
- "explain": giải thích 1–2 câu vì sao đáp án đúng.
- Chỉ hỏi kiến thức có trong nội dung trên (được dùng kiến thức phổ thông chuẩn để tạo phương án nhiễu); không hỏi về cách trình bày sơ đồ; các câu không trùng ý nhau.${r.focus ? `\n- Yêu cầu thêm: ${r.focus}` : ''}`, QUIZ_SPEC);
    const questions = parseQuiz(raw);
    if (!questions.length) throw new Error('AI không soạn được câu hỏi nào. Hãy thử lại.');
    done();
    S.map.quiz = { questions, scope: node === S.map.root ? '' : node.text, createdAt: Date.now() };
    scheduleSave();
    quizPlayer();
  } catch (err) { done(); console.error(err); toast(err.message || 'Có lỗi khi gọi AI', 4500); }
}
async function quizPlayer() {
  const quiz = S.map.quiz;
  await mathReady(quiz.questions.flatMap(q => [q.q, q.answer, q.explain, ...q.options]));
  // Mỗi lượt làm bài xáo thứ tự phương án để không học vẹt vị trí đáp án
  let order = [];
  const shuffle = () => {
    order = quiz.questions.map(q => {
      const idx = q.options.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      return idx;
    });
  };
  shuffle();
  const nMcq = quiz.questions.filter(q => q.options.length).length;
  const listHTML = () => quiz.questions.map((q, i) => `<li class="qz-q" data-i="${i}">
      <div class="qz-text"><b>Câu ${i + 1}.</b> ${richText(q.q)}</div>
      ${q.options.length
        ? `<div class="qz-opts">${order[i].map((o, k) => `<button type="button" class="qz-opt" data-o="${o}"><b>${LETTERS[k]}</b><span>${richText(q.options[o])}</span></button>`).join('')}</div>`
        : `<textarea class="field qz-write" rows="2" placeholder="Viết câu trả lời của em…"></textarea>`}
      <div class="qz-ans" hidden><b>Đáp án:</b> ${richText(q.options.length ? `${LETTERS[order[i].indexOf(q.correct)]}. ${q.options[q.correct]}` : q.answer)}${q.explain ? `<div class="muted">${richText(q.explain)}</div>` : ''}</div>
    </li>`).join('');
  let next = null;
  await modal({
    title: `Câu hỏi ôn tập${quiz.scope ? ` — ${quiz.scope}` : ''}`, wide: true,
    body: `<div class="qz">
        <div class="qz-score" hidden></div>
        <ol class="qz-list"></ol>
        <div class="row qz-tools">
          <button type="button" class="btn primary" data-qz="submit">Nộp bài</button>
          <button type="button" class="btn" data-qz="retry" hidden>Làm lại</button>
          <span style="flex:1"></span>
          <button type="button" class="btn small" data-qz="print">${icon('download')} In đề / đáp án</button>
          ${S.temp ? '' : `<button type="button" class="btn small" data-qz="new">${icon('sparkle')} Soạn bộ mới</button><button type="button" class="btn small" data-qz="del" title="Xóa bộ câu hỏi khỏi sơ đồ">${icon('trash')}</button>`}
        </div>
      </div>`,
    actions: [{ label: 'Đóng', value: null }],
    onOpen: m => {
      m.querySelector('.modal').style.width = 'min(760px,100%)';
      const list = $('.qz-list', m), score = $('.qz-score', m);
      const fill = () => { list.innerHTML = listHTML(); score.hidden = true; $('[data-qz="submit"]', m).hidden = false; $('[data-qz="retry"]', m).hidden = true; };
      fill();
      list.addEventListener('click', e => {
        const b = e.target.closest('.qz-opt');
        if (!b || list.classList.contains('done')) return;
        $$('.qz-opt', b.parentElement).forEach(x => x.classList.toggle('on', x === b));
      });
      const close = () => $('.foot button', m).click();
      m.addEventListener('click', async e => {
        const act = e.target.closest('[data-qz]')?.dataset.qz;
        if (act === 'submit') {
          let right = 0, blank = 0;
          $$('.qz-q', list).forEach(li => {
            const q = quiz.questions[+li.dataset.i];
            li.querySelector('.qz-ans').hidden = false;
            if (!q.options.length) return;
            const picked = li.querySelector('.qz-opt.on');
            if (!picked) blank++;
            else if (+picked.dataset.o === q.correct) right++;
            $$('.qz-opt', li).forEach(x => {
              if (+x.dataset.o === q.correct) x.classList.add('right');
              else if (x === picked) x.classList.add('wrong');
            });
            li.classList.add(picked && +picked.dataset.o === q.correct ? 'ok' : 'bad');
          });
          list.classList.add('done');
          const pct = nMcq ? Math.round(right / nMcq * 100) : 0;
          score.hidden = false;
          score.innerHTML = nMcq
            ? `<b>${right}/${nMcq}</b> câu trắc nghiệm đúng · <b>${(right / nMcq * 10).toFixed(1).replace('.', ',')}</b> điểm${blank ? ` · bỏ trống ${blank} câu` : ''}<span class="muted">${pct >= 80 ? ' — Rất tốt! 🎉' : pct >= 50 ? ' — Khá, xem lại các câu sai nhé.' : ' — Cần ôn thêm, đọc kỹ phần giải thích.'}</span>${nMcq < quiz.questions.length ? '<div class="muted" style="font-size:13px">Câu tự luận: em tự so với đáp án mẫu.</div>' : ''}`
            : 'Em hãy tự so câu trả lời với đáp án mẫu bên dưới mỗi câu.';
          score.classList.toggle('good', pct >= 50);
          $('[data-qz="submit"]', m).hidden = true; $('[data-qz="retry"]', m).hidden = false;
          score.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (act === 'retry') {
          list.classList.remove('done'); shuffle(); fill();
          list.scrollIntoView({ block: 'start' });
        } else if (act === 'print') printQuiz(quiz, order);
        else if (act === 'new') { next = 'new'; close(); }
        else if (act === 'del') {
          next = 'del'; close();
        }
      });
    },
  });
  if (next === 'new') quizSetup();
  if (next === 'del' && await confirmBox('Xóa bộ câu hỏi?', 'Bộ câu hỏi sẽ bị xóa khỏi sơ đồ này. Bạn có thể nhờ AI soạn bộ khác bất cứ lúc nào.')) {
    delete S.map.quiz; scheduleSave(); toast('Đã xóa bộ câu hỏi');
  }
}
/** In đề (phương án theo thứ tự đang hiển thị) và trang đáp án riêng. */
function printQuiz(quiz, order) {
  const w = window.open('', '_blank');
  if (!w) { toast('Trình duyệt đã chặn cửa sổ mới — hãy cho phép popup'); return; }
  const title = esc(S.map.title) + (quiz.scope ? ` — ${esc(quiz.scope)}` : '');
  const qs = quiz.questions.map((q, i) => `<li><div>${richText(q.q)}</div>${q.options.length
    ? `<ol class="opts">${order[i].map((o, k) => `<li><b>${LETTERS[k]}.</b> ${richText(q.options[o])}</li>`).join('')}</ol>`
    : '<div class="lines"></div><div class="lines"></div>'}</li>`).join('');
  const ans = quiz.questions.map((q, i) => `<li><b>${q.options.length ? LETTERS[order[i].indexOf(q.correct)] + '.' : ''}</b> ${richText(q.options.length ? q.options[q.correct] : q.answer)}${q.explain ? `<div class="ex">${richText(q.explain)}</div>` : ''}</li>`).join('');
  w.document.write(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>${title}</title>
<style>
  body{font:15px/1.55 'Be Vietnam Pro',Arial,sans-serif;color:#111;max-width:760px;margin:24px auto;padding:0 16px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:#555;margin:0 0 18px}
  ol.qs>li{margin:0 0 14px;break-inside:avoid}.opts{list-style:none;padding:0;margin:6px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
  .lines{border-bottom:1px dotted #999;height:26px}.ex{color:#555;font-size:13px}
  .ans{break-before:page}svg{vertical-align:middle}
  @media print{body{margin:0}}
</style>
<h1>${title}</h1><p class="sub">Họ và tên: ................................................ Lớp: .............</p>
<ol class="qs">${qs}</ol>
<div class="ans"><h1>Đáp án</h1><ol>${ans}</ol></div>
<script>setTimeout(()=>print(),300)<\/script>`);
  w.document.close();
}

/* =====================================================================
   CHIA SẺ BẰNG LINK — nén cả sơ đồ vào đường link, không cần máy chủ
   ===================================================================== */
const b64url = bytes => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function packMap(map) {
  let images = 0;
  let files = 0;
  const strip = n => {
    const { image, files: fl, ...rest } = n;
    if (image) images++;
    files += fl?.length || 0;
    return { ...rest, children: n.children.map(strip) };
  };
  const data = { v: 1, title: map.title, theme: map.theme, layout: map.layout, root: strip(map.root), relations: map.relations };
  if (map.quiz?.questions?.length) data.quiz = map.quiz;
  if (map.sketch) data.sketch = true;
  const stream = new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return { code: b64url(new Uint8Array(await new Response(stream).arrayBuffer())), images, files };
}
async function unpackMap(code) {
  const stream = new Blob([unb64url(code)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}
async function shareMap() {
  if (S.editing) commitEdit();
  let packed;
  try { packed = await packMap(S.map); } catch (err) { console.error(err); toast('Trình duyệt này chưa hỗ trợ tạo link chia sẻ'); return; }
  const base = location.href.split('#')[0];
  const link = q => `${base}#/s/${q}/${packed.code}`;
  const local = location.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
  const warn = [
    local ? '⚠️ Web đang chạy trên máy của bạn nên người khác chưa mở được link này. Hãy đưa web lên mạng trước.' : '',
    packed.images ? `Link không kèm ${packed.images} ảnh trong sơ đồ (ảnh quá nặng để chứa trong link).` : '',
    packed.files ? `Link không kèm ${packed.files} tệp đính kèm. Muốn người khác mở được tệp, hãy tải tệp lên Google Drive rồi gắn link Drive vào nút.` : '',
    packed.code.length > 12000 ? 'Sơ đồ khá lớn nên link dài; một số ứng dụng nhắn tin có thể cắt bớt link.' : '',
  ].filter(Boolean);
  await modal({
    title: 'Chia sẻ sơ đồ', wide: true,
    body: `<p>Ai có link sẽ xem được sơ đồ này. Họ có thể lưu một bản sao về máy mình; bản của bạn không bị ảnh hưởng.</p>
      <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">
        <button class="on" data-q="0">Xem bình thường</button><button data-q="1">Ôn tập: che hết</button><button data-q="2">Ôn tập: che ý con</button>
      </div>
      ${S.map.quiz?.questions?.length ? `<div class="seg" style="grid-template-columns:1fr;margin-bottom:10px"><button data-q="q">${icon('check')} Làm bài ${S.map.quiz.questions.length} câu hỏi ôn tập (mở link là vào làm bài)</button></div>` : ''}
      <div class="row"><input class="field" id="share-link" readonly style="flex:1"><button class="btn primary" id="share-copy">Sao chép</button></div>
      ${warn.map(w => `<p class="muted" style="font-size:13px;margin:10px 0 0">${esc(w)}</p>`).join('')}`,
    actions: [{ label: 'Đóng', value: null }],
    onOpen: m => {
      const inp = $('#share-link', m);
      let q = 0;
      inp.value = link(q);
      $$('[data-q]', m).forEach(b => b.onclick = () => {
        q = b.dataset.q; inp.value = link(q);
        $$('[data-q]', m).forEach(x => x.classList.toggle('on', x === b));
      });
      $('#share-copy', m).onclick = async () => {
        try { await navigator.clipboard.writeText(inp.value); } catch { inp.select(); document.execCommand('copy'); }
        toast('Đã sao chép link');
      };
      inp.onfocus = () => inp.select();
    },
  });
}
async function openShared(mode, code) {
  const quizDepth = /^\d$/.test(mode) ? +mode : 0;
  let data;
  try { data = await unpackMap(code); } catch (err) { console.error(err); toast('Link chia sẻ bị hỏng hoặc không đầy đủ'); location.hash = '#/'; return; }
  const root = normalizeNode(data.root);
  const ids = new Set(); walk(root, n => { ids.add(n.id); });
  const map = newMap(root, data.title || root.text, {
    id: 'shared', theme: THEMES[data.theme] ? data.theme : 'classic', layout: LAYOUTS[data.layout] ? data.layout : 'map',
    relations: (data.relations || []).filter(r => ids.has(r.from) && ids.has(r.to)).map(r => ({ id: r.id || uid(), from: r.from, to: r.to, label: r.label || '' })),
  });
  if (data.quiz?.questions?.length) map.quiz = data.quiz;
  if (data.sketch) map.sketch = true;
  showMap(map, { temp: true });
  saveNow();
  if (quizDepth) startQuiz(quizDepth);
  else if (mode === 'q' && map.quiz) quizPlayer();
}
function saveShared() {
  if (!S.temp) return;
  S.temp = false; $('#shared-bar').hidden = true;
  S.map.id = uid(); S.map.createdAt = Date.now();
  saveNow(true);
  history.replaceState(null, '', '#/map/' + S.map.id);
  toast('Đã lưu vào “Sơ đồ của tôi”');
}

/* =====================================================================
   XUẤT / IN
   ===================================================================== */
async function exportPNG() {
  await preloadImages(S.map);
  renderCanvas(S.map, { scale: 2 }).toBlob(b => download(safeName(S.map.title) + '.png', b), 'image/png');
}
async function printMap() {
  const w = window.open('', '_blank');
  if (!w) { toast('Trình duyệt đã chặn cửa sổ mới — hãy cho phép popup'); return; }
  await preloadImages(S.map);
  const url = renderCanvas(S.map, { scale: 2 }).toDataURL('image/png');
  w.document.write(`<!doctype html><title>${esc(S.map.title)}</title><style>@page{size:landscape;margin:10mm}body{margin:0;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="${url}" onload="setTimeout(()=>print(),200)">`);
  w.document.close();
}

/** Xuất PowerPoint: slide tiêu đề, slide toàn cảnh sơ đồ, rồi mỗi nhánh chính một slide (dài thì sang slide "tiếp"). */
async function exportPPTX() {
  const map = S.map, L = computeLayout(map), th = L.theme;
  toast('Đang tạo PowerPoint…');
  try { await loadScript(LIBS.pptx); } catch (e) { toast(e.message); return; }
  await preloadImages(map);
  const W = 13.333, H = 7.5, FONT_P = 'Arial';
  const hex = c => (/^#[0-9a-f]{6}$/i.test(c || '') ? c.slice(1) : null);
  const plain = t => String(t || '').replace(/\$([^$\n]+?)\$/g, '$1').replace(/\s*\n\s*/g, ' ').trim();
  const label = n => (n.icon ? n.icon + ' ' : '') + plain(n.text);
  const imgData = src => (src.startsWith('data:') ? { data: src.slice(5) } : { path: src });
  const bg = hex(th.bg) || 'FFFFFF', ink = hex(th.text) || '1F2937', muted = hex(th.rel) || '5B6478';
  const notesOf = nodes => nodes.filter(n => n.note).map(n => `${plain(n.text)}: ${n.note}`).join('\n\n');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = map.title;

  // Slide tiêu đề theo màu nút trung tâm
  const r = map.root, rootFill = hex(th.root.fill) || bg, rootInk = hex(th.root.text) || ink;
  const s1 = pptx.addSlide();
  s1.background = { color: rootFill };
  s1.addText(label(r), { x: 0.8, y: 2.3, w: W - 1.6, h: 1.8, fontFace: FONT_P, fontSize: 44, bold: true, color: rootInk, align: 'center', valign: 'middle', fit: 'shrink' });
  const sub = map.title && plain(map.title) !== plain(r.text) ? plain(map.title) : `${r.children.length} nội dung chính`;
  s1.addText(sub, { x: 0.8, y: 4.2, w: W - 1.6, h: 0.6, fontFace: FONT_P, fontSize: 20, color: rootInk, align: 'center', transparency: 20 });
  if (r.note) s1.addNotes(r.note);

  // Slide toàn cảnh: ảnh cả sơ đồ, căn giữa và giữ tỉ lệ
  const cv = renderCanvas(map, { scale: 2 });
  const k = Math.min((W - 0.6) / cv.width, (H - 0.6) / cv.height);
  const s2 = pptx.addSlide();
  s2.background = { color: bg };
  s2.addImage({ data: cv.toDataURL('image/png').slice(5), x: (W - cv.width * k) / 2, y: (H - cv.height * k) / 2, w: cv.width * k, h: cv.height * k });

  for (const br of r.children) {
    const color = hex(L.boxes.get(br.id)?.color) || hex(th.palette[0]) || '4F46E5';
    const rows = [];
    const rec = (n, d) => { rows.push({ n, d }); n.children.forEach(c => rec(c, d + 1)); };
    br.children.forEach(c => rec(c, 0));
    // Chia trang theo ước lượng số dòng (chữ cấp sâu nhỏ hơn và thụt vào)
    const paginate = bw => {
      const cpl = d => Math.max(24, Math.round(bw * (d === 0 ? 7.2 : d === 1 ? 8.4 : 9.4)) - d * 6);
      const pages = [[]];
      let used = 0;
      for (const row of rows) {
        const u = Math.ceil(Math.max(1, label(row.n).length) / cpl(row.d)) * (row.d === 0 ? 1.25 : 1);
        if (used + u > 12 && pages.at(-1).length) { pages.push([]); used = 0; }
        pages.at(-1).push(row); used += u;
      }
      return pages;
    };
    // Nhánh ngắn: chữ bên trái, bên phải là ảnh nhánh (ảnh của nút, nếu không có thì vẽ sơ đồ nhỏ của nhánh)
    let img = br.image, bodyW = W - 1.6, pages = paginate(bodyW);
    if (img || (rows.length && pages.length === 1)) {
      const half = paginate(6.4);
      if (half.length === 1) {
        bodyW = 6.4; pages = half;
        if (!img) {
          const sub = renderCanvas({ ...map, root: { ...br, side: undefined, style: undefined, children: br.children.map(c => ({ ...c, style: { color: '#' + color, ...c.style } })) }, relations: [], layout: map.layout === 'down' ? 'down' : 'right' }, { scale: 2, pad: 24 });
          img = { src: sub.toDataURL('image/png'), w: sub.width, h: sub.height };
        }
      } else img = null;
    }
    pages.forEach((page, pi) => {
      const sl = pptx.addSlide();
      sl.background = { color: bg };
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: H, fill: { color }, line: { color } });
      sl.addText(label(br) + (pi ? ' (tiếp)' : ''), { x: 0.8, y: 0.4, w: W - 1.6, h: 1, fontFace: FONT_P, fontSize: 32, bold: true, color, valign: 'middle', fit: 'shrink' });
      if (page.length) {
        sl.addText(page.map(({ n, d }) => {
          const o = { bullet: d === 0 ? true : { code: d === 1 ? '2013' : '25E6' }, indentLevel: d, fontSize: d === 0 ? 22 : d === 1 ? 18 : 16, bold: d === 0 && n.children.length > 0, color: d === 0 ? ink : muted, paraSpaceBefore: d === 0 ? 8 : 2 };
          const link = n.links?.[0];
          return link
            ? { text: label(n) + ' ↗', options: { ...o, hyperlink: { url: link.url, tooltip: linkLabel(link) }, breakLine: true } }
            : { text: label(n), options: { ...o, breakLine: true } };
        }), { x: 0.8, y: 1.6, w: bodyW, h: H - 2.1, fontFace: FONT_P, valign: 'top', fit: 'shrink' });
      } else if (br.note) {
        sl.addText(br.note, { x: 0.8, y: 1.6, w: bodyW, h: H - 2.1, fontFace: FONT_P, fontSize: 20, color: ink, valign: 'top', fit: 'shrink' });
      }
      if (img && pi === 0) {
        const kk = Math.min(5.3 / img.w, 5.2 / img.h);
        sl.addImage({ ...imgData(img.src), x: W - 0.5 - (5.3 + img.w * kk) / 2, y: 1.6 + (5.2 - img.h * kk) / 2, w: img.w * kk, h: img.h * kk });
      }
      const notes = notesOf(pi ? page.map(x => x.n) : [br, ...page.map(x => x.n)]);
      if (notes) sl.addNotes(notes);
    });
  }
  const blob = await pptx.write({ outputType: 'blob' });
  download(safeName(map.title) + '.pptx', blob);
  toast('Đã xuất PowerPoint');
}

/* =====================================================================
   ĐIỀU PHỐI SỰ KIỆN data-act
   ===================================================================== */
const ACTIONS = {
  home: () => { location.hash = '#/'; },
  undo, redo,
  'add-child': () => addChild(),
  'add-sibling': () => addSibling(),
  relate: () => (S.relFrom ? endRelate() : startRelate()),
  'delete-node': () => deleteNode(),
  'toggle-collapse': () => toggleCollapse(),
  tog: el => toggleCollapse(el.dataset.id),
  'tog-add': el => addChild(el.dataset.id),
  'ind-note': el => { select(el.dataset.id); S.panelOpen = true; syncPanel(); setTimeout(() => $('#pn-note')?.focus(), 30); },
  'ind-link': el => { const n = getNode(el.dataset.id); if (n?.links?.length) linksPopover(el, n); },
  'ind-files': el => { const n = getNode(el.dataset.id); if (n?.files?.length) filesPopover(el, n); },
  'link-add': addLink,
  'link-del': el => { const n = getNode(S.sel); if (n?.links) commit(() => { n.links.splice(+el.dataset.val, 1); if (!n.links.length) delete n.links; }); },
  'link-up': el => { const n = getNode(S.sel); if (n?.links) commit(() => { const [l] = n.links.splice(+el.dataset.val, 1); n.links.unshift(l); }); },
  'file-pick': () => { if (S.sel) fileInput.click(); },
  'file-open': el => { const h = findFile(el.dataset.val); if (h) openFile(h.file); },
  'file-save': el => { const h = findFile(el.dataset.val); if (h) openFile(h.file, { save: true }); },
  'file-del': el => { const h = findFile(el.dataset.val); if (h) commit(() => { h.node.files = h.node.files.filter(f => f !== h.file); if (!h.node.files.length) delete h.node.files; }); },
  'toggle-outline': () => { S.outlineOpen = !S.outlineOpen; $('#outline').hidden = !S.outlineOpen; $('[data-act="toggle-outline"].tbtn').classList.toggle('on', S.outlineOpen); if (S.outlineOpen) renderOutline(true); },
  'toggle-panel': () => { S.panelOpen = !S.panelOpen; syncPanel(); },
  'panel-tab': el => { S.panelTab = el.dataset.val; renderPanel(); },
  search: openSearch,
  'search-next': () => searchStep(1), 'search-prev': () => searchStep(-1), 'search-close': closeSearch,
  present: startPresent, 'present-next': () => stepSlide(1), 'present-prev': () => stepSlide(-1), 'present-exit': stopPresent,
  'zoom-in': () => zoomAt(S.view.k * 1.2), 'zoom-out': () => zoomAt(S.view.k / 1.2),
  'zoom-fit': () => fitAll(),
  'zoom-reset': () => { animateView(() => { S.view.k = 1; }); centerOn(S.sel || S.map.root.id); },
  set: el => setStyle(el.dataset.key, el.dataset.val),
  'set-icon': el => setProp('icon', el.dataset.val),
  'reset-style': () => { const n = getNode(S.sel); if (n?.style) commit(() => { delete n.style; }); },
  'font-inc': () => { const b = S.L.boxes.get(S.sel); if (b) setStyle('fontSize', Math.min(48, b.fs + 2)); },
  'font-dec': () => { const b = S.L.boxes.get(S.sel); if (b) setStyle('fontSize', Math.max(10, b.fs - 2)); },
  bold: () => { const b = S.L.boxes.get(S.sel); if (b) setStyle('bold', !(+/(\d+)/.exec(b.font)[1] >= 600)); },
  italic: () => { const n = getNode(S.sel); if (n) setStyle('italic', n.style?.italic ? '' : true); },
  layout: el => { commit(() => { S.map.layout = el.dataset.val; walk(S.map.root, n => { delete n.offset; }); if (el.dataset.val === 'map') assignSides(S.map.root); }); fitAll(); },
  'reset-pos': () => { const n = getNode(S.sel); if (n?.offset) commit(() => { delete n.offset; }); },
  'reset-all-pos': () => commit(() => { walk(S.map.root, n => { delete n.offset; }); }),
  theme: el => commit(() => { S.map.theme = el.dataset.val; }),
  sketch: el => { commit(() => { if (el.dataset.val) S.map.sketch = true; else delete S.map.sketch; }); fitAll(); },
  'ui-mode': el => { UI.set(el.dataset.val); if (S.map) render(); },
  'ui-toggle': () => { const next = UI.dark() ? 'light' : 'dark'; UI.set(next); toast(next === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'); },
  'expand-all': () => setCollapsedAll(false),
  'collapse-all': () => setCollapsedAll(true),
  'del-rel': () => commit(() => { S.map.relations = S.map.relations.filter(r => r.id !== S.selRel); S.selRel = null; }),
  'flip-rel': () => commit(() => { const r = S.map.relations.find(x => x.id === S.selRel); if (r) [r.from, r.to] = [r.to, r.from]; }),
  'export-png': exportPNG,
  'export-pptx': exportPPTX,
  'export-svg': () => download(safeName(S.map.title) + '.svg', renderSVG(S.map), 'image/svg+xml'),
  'export-md': () => download(safeName(S.map.title) + '.md', toMarkdown(S.map.root), 'text/markdown'),
  'export-mm': () => download(safeName(S.map.title) + '.mm', toFreeMind(S.map.root), 'application/xml'),
  'export-json': () => exportWithFiles(S.map),
  print: printMap,
  'img-pick': () => { if (S.sel) imgInput.click(); },
  'img-remove': () => setProp('image', null),
  'img-size': el => { const n = getNode(S.sel); if (n?.image) commit(() => { n.image = { ...n.image, dw: +el.dataset.val }; }); },
  share: shareMap,
  'save-shared': saveShared,
  'ai-expand': () => aiExpand(),
  'ai-create': aiCreateMap,
  'ai-settings': aiSettings,
  'install-app': installApp,
  drive: driveDialog,
  quiz: () => (S.quiz ? stopQuiz() : startQuiz()),
  questions: questionsAction,
  'quiz-exit': stopQuiz,
  'quiz-all': () => quizAll(true),
  'quiz-reset': () => quizAll(false),
  'quiz-depth': el => startQuiz(+el.dataset.val),
  help: showHelp,
  // Trang chủ
  'new-tpl': el => createMap(mapFromTemplate(TEMPLATES.find(t => t.id === el.dataset.tpl))),
  'import-file': () => $('#file-input').click(),
  'import-text': importFromText,
  'open-map': el => { location.hash = '#/map/' + el.dataset.id; },
  'rename-map': renameMap, 'dup-map': dupMap, 'del-map': delMap,
  'export-map': el => { const m = Store.load(el.dataset.id); if (m) exportWithFiles(m); },
};
document.addEventListener('click', e => {
  const dd = e.target.closest('[data-dd]');
  $$('.dd-menu').forEach(m => { if (!dd || m.id !== 'dd-' + dd.dataset.dd) m.hidden = true; });
  if (dd) { const m = $('#dd-' + dd.dataset.dd); m.hidden = !m.hidden; return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.closest('.modal-back')) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.stopPropagation(); fn(el, e); }
});
function syncPanel() {
  $('#panel').hidden = !S.panelOpen;
  $('[data-act="toggle-panel"]').classList.toggle('on', S.panelOpen);
  renderPanel();
}

function showHelp() {
  const rows = [
    ['<kbd>Tab</kbd>', 'Thêm nút con'], ['<kbd>Enter</kbd>', 'Thêm nút cùng cấp (Shift+Enter: phía trên)'],
    ['Gõ chữ / <kbd>F2</kbd> / <kbd>Space</kbd>', 'Sửa nội dung nút'], ['<kbd>Shift</kbd>+<kbd>Enter</kbd> khi đang sửa', 'Xuống dòng trong nút'],
    ['<kbd>Delete</kbd>', 'Xóa nút / mối nối'], ['<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd>', 'Di chuyển giữa các nút'],
    ['<kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd>', 'Đổi thứ tự nút'], ['<kbd>Ctrl</kbd>+<kbd>.</kbd>', 'Thu gọn / mở rộng nhánh'],
    ['<kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>X</kbd> / <kbd>V</kbd>', 'Sao chép, cắt, dán nhánh (dán được cả dàn ý văn bản)'],
    ['<kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd>', 'Hoàn tác / làm lại'],
    ['<kbd>Ctrl</kbd>+<kbd>B</kbd> / <kbd>I</kbd>', 'Chữ đậm / nghiêng'], ['<kbd>Ctrl</kbd>+<kbd>F</kbd>', 'Tìm kiếm'],
    ['<kbd>Ctrl</kbd>+cuộn chuột, <kbd>Ctrl</kbd>+<kbd>=</kbd>/<kbd>−</kbd>', 'Phóng to / thu nhỏ'], ['<kbd>Ctrl</kbd>+<kbd>0</kbd>', 'Vừa màn hình'],
    ['Kéo khoảng trống / cuộn chuột', 'Di chuyển vùng vẽ'], ['Kéo một nút', 'Thả ra chỗ trống → đặt nút (cả nhánh) ở đó, đường nối tự đi theo; thả giữa nút khác → làm nút con; thả mép trên/dưới → chèn trước/sau. Nút “Về chỗ cũ” / “Sắp xếp lại” để trả về vị trí tự động'],
    ['<code>$x^2$</code>, <code>$\\frac{a}{b}$</code>', 'Công thức toán: gõ LaTeX giữa hai dấu $ (ví dụ $\\sqrt{x}$, $H_2O$, $\\Delta = b^2 - 4ac$)'],
    ['<kbd>Home</kbd>', 'Chọn chủ đề trung tâm'], ['<kbd>Esc</kbd>', 'Bỏ chọn / hủy'],
  ];
  modal({ title: 'Phím tắt & thao tác', wide: true, body: `<table class="keys">${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>` });
}

/* =====================================================================
   TRANG CHỦ
   ===================================================================== */
let tplThumbs = null;
function renderHome() {
  if (!tplThumbs) tplThumbs = TEMPLATES.map(t => { try { return makeThumb(mapFromTemplate(t)); } catch { return null; } });
  $('#tpl-grid').innerHTML = TEMPLATES.map((t, i) => `<button class="tpl" data-act="new-tpl" data-tpl="${t.id}">
      ${t.id === 'blank' ? '<div class="ph">+</div>' : tplThumbs[i] ? `<img src="${tplThumbs[i]}" alt="">` : '<div class="ph"></div>'}<span>${esc(t.name)}</span></button>`).join('');
  renderMapGrid();
}
function renderMapGrid() {
  const q = fold($('#home-search').value.trim());
  const list = Store.index().filter(m => !q || fold(m.title).includes(q)).sort((a, b) => b.updatedAt - a.updatedAt);
  $('#map-grid').innerHTML = list.length ? list.map(m => `
    <div class="card" data-act="open-map" data-id="${m.id}" tabindex="0">
      ${m.thumb ? `<img src="${m.thumb}" alt="" loading="lazy">` : '<div class="ph"></div>'}
      <div class="meta"><div class="t">${esc(m.title)}</div><div class="s">${m.count} nút · ${timeAgo(m.updatedAt)}</div></div>
      <div class="acts">
        <button data-act="rename-map" data-id="${m.id}" title="Đổi tên">${icon('edit')}</button>
        <button data-act="dup-map" data-id="${m.id}" title="Nhân bản">${icon('copy')}</button>
        <button data-act="export-map" data-id="${m.id}" title="Tải tệp .json">${icon('download')}</button>
        <button class="del" data-act="del-map" data-id="${m.id}" title="Xóa">${icon('trash')}</button>
      </div>
    </div>`).join('') : `<div class="empty">${q ? 'Không tìm thấy sơ đồ phù hợp.' : 'Chưa có sơ đồ nào — hãy chọn một mẫu ở trên để bắt đầu.'}</div>`;
}
$('#home-search').addEventListener('input', renderMapGrid);
$('#map-grid').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.card')) e.target.click(); });

function createMap(map) {
  let thumb = null; try { thumb = makeThumb(map); } catch {}
  if (Store.save(map, thumb)) location.hash = '#/map/' + map.id;
}
async function renameMap(el) {
  const m = Store.load(el.dataset.id); if (!m) return;
  const t = await promptText('Đổi tên sơ đồ', m.title);
  if (t) { m.title = t; m.updatedAt = Date.now(); Store.save(m); renderMapGrid(); }
}
function dupMap(el) {
  const m = Store.load(el.dataset.id); if (!m) return;
  const idMap = new Map();
  const root = (function rec(n) { const c = { ...n, id: uid(), children: n.children.map(rec) }; idMap.set(n.id, c.id); return c; })(m.root);
  const copy = { ...m, id: uid(), title: m.title + ' (bản sao)', root, createdAt: Date.now(), updatedAt: Date.now(),
    relations: (m.relations || []).map(r => ({ ...r, id: uid(), from: idMap.get(r.from), to: idMap.get(r.to) })) };
  const old = Store.index().find(x => x.id === m.id);
  Store.save(copy, old?.thumb); renderMapGrid(); toast('Đã nhân bản');
}
async function delMap(el) {
  const m = Store.index().find(x => x.id === el.dataset.id); if (!m) return;
  const st = Drive.state();
  if (await confirmBox('Xóa sơ đồ?', st ? `“${m.title}” sẽ bị xóa khỏi trình duyệt này và chuyển vào thùng rác Google Drive.` : `“${m.title}” sẽ bị xóa vĩnh viễn khỏi trình duyệt này.`)) {
    Store.remove(m.id);
    if (st) { st.deleted = [...new Set([...(st.deleted || []), m.id])]; Drive.setState(st); Drive.scheduleSync(500); }
    renderMapGrid();
  }
}
async function importFromText() {
  const text = await modal({
    title: 'Tạo sơ đồ từ dàn ý', wide: true,
    body: `<p>Dán dàn ý dạng thụt lề, gạch đầu dòng hoặc Markdown. Dòng đầu tiên (hoặc tiêu đề #) là chủ đề trung tâm.</p>
      <textarea class="field" rows="12" placeholder="Hệ Mặt Trời\n  Hành tinh đá\n    Sao Thủy\n    Trái Đất\n  Hành tinh khí\n    Sao Mộc\n    Sao Thổ"></textarea>`,
    actions: [{ label: 'Hủy', value: null }, { label: 'Tạo sơ đồ', primary: true, value: m => $('textarea', m).value }],
    onOpen: m => $('textarea', m).focus(),
  });
  if (!text?.trim()) return;
  const root = outlineToRoot(text);
  if (!root) { toast('Không đọc được dàn ý'); return; }
  assignSides(root);
  createMap(newMap(root, root.text));
}
$('#file-input').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const text = await f.text();
  let map = null;
  try {
    if (/\.json$/i.test(f.name)) {
      const o = JSON.parse(text);
      if (o.attachments) await importAttachments(o.attachments);
      const root = normalizeNode(o.root || o);
      map = newMap(root, o.title || root.text, { theme: THEMES[o.theme] ? o.theme : 'classic', layout: LAYOUTS[o.layout] ? o.layout : 'map' });
      const ids = new Set(); walk(root, n => { ids.add(n.id); });
      map.relations = (o.relations || []).filter(r => ids.has(r.from) && ids.has(r.to)).map(r => ({ id: r.id || uid(), from: r.from, to: r.to, label: r.label || '' }));
      if (o.quiz?.questions?.length) map.quiz = o.quiz;
      if (o.sketch) map.sketch = true;
    } else if (/\.(mm|opml|xml)$/i.test(f.name)) {
      const root = parseXmlTree(text);
      if (root) map = newMap(root, root.text);
    } else {
      const root = outlineToRoot(text, f.name.replace(/\.[^.]+$/, ''));
      if (root) map = newMap(root, root.text);
    }
  } catch (err) { console.error(err); }
  if (!map) { toast('Không đọc được tệp này'); return; }
  assignSides(map.root);
  createMap(map);
  toast(`Đã nhập ${countNodes(map.root)} nút`);
});

/* =====================================================================
   ĐIỀU HƯỚNG GIỮA CÁC MÀN HÌNH
   ===================================================================== */
function leaveEditor() {
  if (!S.map) return;
  if (S.editing) commitEdit();
  if (S.presenting) stopPresent();
  if (S.quiz) stopQuiz();
  saveNow(true);
  S.map = null;
}
function openMap(id) {
  const map = Store.load(id);
  if (!map) { toast('Không tìm thấy sơ đồ'); location.hash = '#/'; return; }
  showMap(map);
}
function showMap(map, { temp = false } = {}) {
  S.temp = temp;
  walk(map.root, n => { if (n.link) { n.links = [{ url: n.link }, ...(n.links || [])]; delete n.link; } });
  $('#shared-bar').hidden = !temp;
  map.relations ||= []; map.layout ||= 'map'; map.theme ||= 'classic';
  Object.assign(S, { map, sel: map.root.id, selRel: null, editing: null, undo: [], redo: [], relFrom: null, matches: null, matchList: [], presenting: null, quiz: null, dirty: false, panelTab: 'map' });
  reindex();
  if (!temp) preloadImages(map).then(() => { if (S.map === map) saveNow(true); });
  $('#home').hidden = true; $('#editor').hidden = false;
  $('#map-title').value = map.title;
  document.title = map.title + ' — Sodo';
  $('#searchbar').hidden = true; showHint(null);
  syncPanel();
  if (S.outlineOpen) renderOutline(true);
  render();
  if (map.view) { S.view = { ...map.view }; applyView(); } else fitAll(false);
  canvas.focus({ preventScroll: true });
}
function showHome() {
  leaveEditor();
  $('#editor').hidden = true; $('#home').hidden = false;
  document.title = 'Sodo — Sơ đồ tư duy';
  renderHome();
}
function route() {
  const sh = /^#\/s\/(\d|q)\/([\w-]+)/.exec(location.hash);
  if (sh) { leaveEditor(); openShared(sh[1], sh[2]); return; }
  const m = /^#\/map\/([\w-]+)/.exec(location.hash);
  if (m) { if (S.map?.id !== m[1]) { leaveEditor(); openMap(m[1]); } }
  else showHome();
}
$('#map-title').addEventListener('input', e => { S.map.title = e.target.value; document.title = (S.map.title || 'Sơ đồ') + ' — Sodo'; scheduleSave(); });
$('#map-title').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.target.blur(); canvas.focus(); } });
$('#map-title').addEventListener('blur', e => { if (!e.target.value.trim()) { S.map.title = S.map.root.text; e.target.value = S.map.title; scheduleSave(); } });
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', () => { if (S.map) saveNow(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.map) saveNow(true); });

/* ---------------- Cài như ứng dụng (PWA) & dùng khi mất mạng ---------------- */
let installPrompt = null;
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(err => console.warn('Không đăng ký được service worker', err));
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); installPrompt = e;
  $('[data-act="install-app"]').hidden = false;
});
window.addEventListener('appinstalled', () => { installPrompt = null; $('[data-act="install-app"]').hidden = true; toast('Đã cài Sodo'); });
async function installApp() {
  if (!installPrompt) {
    modal({ title: 'Cài Sodo như ứng dụng', body: `<p><b>iPhone / iPad (Safari):</b> bấm nút Chia sẻ <span style="font-size:16px">⎋</span> → “Thêm vào MH chính”.</p>
      <p><b>Android (Chrome):</b> bấm ⋮ → “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”.</p>
      <p><b>Máy tính (Chrome / Edge):</b> bấm biểu tượng cài đặt ở cuối thanh địa chỉ.</p>` });
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null; $('[data-act="install-app"]').hidden = true;
}
window.addEventListener('offline', () => toast('Mất kết nối mạng — vẫn vẽ sơ đồ bình thường, riêng AI và chia sẻ cần mạng.', 4000));

/* ---------------- Giao diện sáng / tối của ứng dụng (sơ đồ giữ chủ đề màu riêng) ---------------- */
const UI = {
  mode() { try { return localStorage.getItem('sodo.ui') || ''; } catch { return ''; } },
  dark() { const m = this.mode(); return m ? m === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; },
  set(m) { try { if (m) localStorage.setItem('sodo.ui', m); else localStorage.removeItem('sodo.ui'); } catch {} this.apply(); },
  apply() {
    const m = this.mode();
    if (m) document.documentElement.dataset.ui = m; else delete document.documentElement.dataset.ui;
    $('meta[name="theme-color"]')?.setAttribute('content', this.dark() ? '#12151c' : '#ffffff');
    if (S.map && S.panelTab === 'map' && !$('#editor').hidden) renderPanel?.();
  },
};
UI.apply();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => UI.apply());

/* ---------------- Khởi động ---------------- */
(async function boot() {
  hydrateIcons();
  try {
    await Promise.race([
      Promise.all(['400', '600', '700', 'italic 400', 'italic 700'].map(w => document.fonts.load(`${w} 16px "Be Vietnam Pro"`, 'Tiếng Việt'))),
      new Promise(r => setTimeout(r, 2500)),
    ]);
  } catch {}
  wcache.clear();
  if (!localStorage.getItem('sodo.welcomed')) {
    localStorage.setItem('sodo.welcomed', '1');
    if (!Store.index().length) {
      const m = mapFromTemplate(GUIDE); m.title = 'Hướng dẫn sử dụng Sodo';
      m.id = 'welcome'; m.updatedAt = m.createdAt; // cùng id trên mọi máy để đồng bộ không bị trùng
      let thumb = null; try { thumb = makeThumb(m); } catch {}
      Store.save(m, thumb);
    }
  }
  route();
  setTimeout(gcFiles, 3000);
  updateDriveUI();
  setInterval(updateDriveUI, 60000);
  if (Drive.connected() && Drive.clientId()) loadScript('https://accounts.google.com/gsi/client').catch(() => {});
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Drive.scheduleSync(1000); });
})();
