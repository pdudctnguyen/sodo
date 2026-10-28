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
  for (const k of ['icon', 'note', 'link', 'collapsed', 'side', 'style']) if (n[k] != null && n[k] !== '') out[k] = n[k];
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
    if (link) node.link = link;
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
    const t = n.link ? `[${n.text}](${n.link})` : n.text;
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
  const rec = n => `<node TEXT="${esc(n.text)}"${n.link ? ` LINK="${esc(n.link)}"` : ''}${n.side ? ` POSITION="${n.side}"` : ''}${n.collapsed ? ' FOLDED="true"' : ''}>` +
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
      if (el.getAttribute('LINK')) n.link = el.getAttribute('LINK');
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
];
const GUIDE = {
  name: 'Hướng dẫn sử dụng', icons: ['👋', '🧭', '🎨', '📤'], text: `Chào mừng đến với Sodo
  Bắt đầu
    Nhấp đúp một nút để sửa chữ
    Tab: thêm nút con
    Enter: thêm nút cùng cấp
    Delete: xóa nút
  Sắp xếp
    Kéo thả nút để di chuyển
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
const anchorY = b => (b.shape === 'underline' ? b.y + b.h - b.ul / 2 : b.y + b.h / 2);
const radiusOf = b => ({ rounded: b.depth === 0 ? 16 : 10, rect: 3, pill: b.h / 2 }[b.shape] || 0);

function computeLayout(map) {
  const theme = THEMES[map.theme] || THEMES.classic;
  const mode = map.layout || 'map';
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
    const font = `${st.italic ? 'italic ' : ''}${weight} ${fs}px ${FONT}`;
    const lh = Math.round(fs * 1.35);
    const [padX0, padT, padB] = boxed ? (depth === 0 ? [24, 14, 14] : depth === 1 ? [16, 9, 9] : [12, 6, 6]) : [4, 3, 7];
    const padX = shape === 'pill' ? padX0 + 6 : padX0;
    const lines = wrapText(n.text || '', font, depth === 0 ? 300 : 240);
    const textW = Math.ceil(Math.max(depth === 0 ? 40 : 16, ...lines.map(l => tw(l, font)))) + 2;
    const iconW = n.icon ? Math.round(fs * 1.25) + 4 : 0;
    const nInd = (n.note ? 1 : 0) + (n.link ? 1 : 0);
    const indW = nInd ? nInd * 18 + 4 : 0;
    // Ảnh (nếu có) nằm phía trên dòng chữ; hàng chữ được căn giữa theo bề rộng ảnh
    const contentW = iconW + textW + indW;
    const imgW = n.image ? Math.min(n.image.dw || 200, n.image.w) : 0;
    const imgH = n.image ? Math.round(imgW * n.image.h / n.image.w) : 0;
    const innerW = Math.max(contentW, imgW);
    const padL = padX + (innerW - contentW) / 2;
    const padTop = padT + (imgH ? imgH + 8 : 0);
    const w = Math.ceil(padX * 2 + innerW);
    const h = Math.ceil(padTop + padB + Math.max(lines.length * lh, iconW ? fs * 1.3 : 0));
    const b = {
      id: n.id, node: n, depth, x: 0, y: 0, w, h, color, fill, stroke, text, shape, fs, font, lh, lines,
      padX, padL, padT: padTop, padB, textW, iconW, indW, dir: 1, kids: [],
      imgX: padX + (innerW - imgW) / 2, imgY: padT, imgW, imgH,
      ew: depth === 1 ? 3.5 : depth === 2 ? 2.2 : 1.6, ul: depth <= 1 ? 3 : 2,
    };
    boxes.set(n.id, b);
    if (!n.collapsed) n.children.forEach((c, i) => { const k = prep(c, depth + 1, color, i); k.parent = b; b.kids.push(k); });
    return b;
  }
  const root = prep(map.root, 0, null, 0);
  const edge = (p, c, d) => edges.push({ from: p.id, to: c.id, d, color: c.color, w: c.ew });

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
    const place = (b, left, top) => {
      b.dir = 'tree'; b.x = left; b.y = top;
      let cy = top + b.h + 12;
      const x0 = b.x + Math.min(18, b.w / 2), y0 = b.y + b.h;
      for (const k of b.kids) {
        const hk = place(k, left + (b.depth === 0 ? 40 : 32), cy);
        const ky = anchorY(k), r = Math.min(8, ky - y0);
        edge(b, k, `M${x0},${y0} V${ky - r} Q${x0},${ky} ${x0 + r},${ky} H${k.x}`);
        cy += hk + 10;
      }
      return Math.max(b.h, cy - 10 - top);
    };
    place(root, -root.w / 2, -root.h / 2);
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

  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const b of boxes.values()) {
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.w); y2 = Math.max(y2, b.y + b.h);
  }
  return { boxes, edges, root, theme, mode, bounds: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } };
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
  if (b.fill && b.fill !== 'transparent') { ctx.fillStyle = b.fill; roundRectPath(ctx, b.x, b.y, b.w, b.h, r); ctx.fill(); }
  if (b.shape === 'underline') { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y + b.h - b.ul, b.w, b.ul); }
  else if (b.stroke) { ctx.strokeStyle = b.stroke; ctx.lineWidth = 2; roundRectPath(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, Math.max(0, r - 1)); ctx.stroke(); }
  const innerH = b.h - b.padT - b.padB, midY = b.y + b.padT + innerH / 2;
  const top = midY - (b.lines.length * b.lh) / 2;
  let x = b.x + b.padL;
  const im = b.node.image && imageFor(b.node.image.src);
  if (im?.complete && im.naturalWidth) {
    ctx.save(); roundRectPath(ctx, b.x + b.imgX, b.y + b.imgY, b.imgW, b.imgH, 6); ctx.clip();
    ctx.drawImage(im, b.x + b.imgX, b.y + b.imgY, b.imgW, b.imgH); ctx.restore();
  }
  ctx.textBaseline = 'middle';
  if (b.node.icon) { ctx.font = `${b.fs}px ${EMOJI_FONT}`; ctx.fillStyle = b.text; ctx.fillText(b.node.icon, x, midY); x += b.iconW; }
  ctx.font = b.font; ctx.fillStyle = b.text;
  b.lines.forEach((l, i) => ctx.fillText(l, x, top + b.lh * (i + 0.5)));
  if (b.indW) {
    ctx.font = `12px ${EMOJI_FONT}`;
    let ix = x + b.textW + 6;
    if (b.node.note) { ctx.fillText('📝', ix, midY); ix += 18; }
    if (b.node.link) ctx.fillText('🔗', ix, midY);
  }
}
function renderSVG(map) {
  const L = computeLayout(map), bb = L.bounds, pad = 48;
  const W = Math.ceil(bb.w + pad * 2), H = Math.ceil(bb.h + pad * 2);
  const o = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${bb.x - pad} ${bb.y - pad} ${W} ${H}" font-family="${FONT}">`,
    `<rect x="${bb.x - pad}" y="${bb.y - pad}" width="${W}" height="${H}" fill="${L.theme.bg}"/>`];
  for (const e of L.edges) o.push(`<path d="${e.d}" fill="none" stroke="${e.color}" stroke-width="${e.w}" stroke-linecap="round"/>`);
  for (const b of L.boxes.values()) {
    const r = radiusOf(b);
    if (b.fill !== 'transparent') o.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${r}" fill="${b.fill}"/>`);
    if (b.shape === 'underline') o.push(`<rect x="${b.x}" y="${b.y + b.h - b.ul}" width="${b.w}" height="${b.ul}" fill="${b.color}"/>`);
    else if (b.stroke) o.push(`<rect x="${b.x + 1}" y="${b.y + 1}" width="${b.w - 2}" height="${b.h - 2}" rx="${Math.max(0, r - 1)}" fill="none" stroke="${b.stroke}" stroke-width="2"/>`);
    const midY = b.y + b.padT + (b.h - b.padT - b.padB) / 2, top = midY - (b.lines.length * b.lh) / 2;
    let x = b.x + b.padL;
    if (b.node.image) o.push(`<image href="${b.node.image.src}" x="${b.x + b.imgX}" y="${b.y + b.imgY}" width="${b.imgW}" height="${b.imgH}" preserveAspectRatio="none"/>`);
    const [, ital, weight] = /^(italic )?(\d+)/.exec(b.font);
    if (b.node.icon) { o.push(`<text x="${x}" y="${midY}" font-size="${b.fs}" dominant-baseline="central">${esc(b.node.icon)}</text>`); x += b.iconW; }
    b.lines.forEach((l, i) => o.push(`<text x="${x}" y="${top + b.lh * (i + 0.5)}" font-size="${b.fs}" font-weight="${weight}"${ital ? ' font-style="italic"' : ''} fill="${b.text}" dominant-baseline="central" xml:space="preserve">${esc(l)}</text>`));
    if (b.indW) o.push(`<text x="${x + b.textW + 6}" y="${midY}" font-size="12" dominant-baseline="central">${b.node.note ? '📝' : ''}${b.node.link ? '🔗' : ''}</text>`);
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
const snap = () => JSON.stringify({ root: S.map.root, relations: S.map.relations, layout: S.map.layout, theme: S.map.theme });
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
function scheduleSave() {
  $('#save-state').textContent = 'Đang lưu…';
  clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 450);
  clearTimeout(thumbTimer); thumbTimer = setTimeout(() => saveNow(true), 2500);
}
function saveNow(withThumb = false) {
  if (!S.map) return;
  clearTimeout(saveTimer);
  if (S.temp) { clearTimeout(thumbTimer); $('#save-state').textContent = 'Bản chia sẻ · chưa lưu'; return; }
  if (withThumb) clearTimeout(thumbTimer);
  S.map.updatedAt = Date.now(); S.map.view = { ...S.view };
  let thumb;
  if (withThumb) { try { thumb = makeThumb(S.map); } catch (e) { console.warn(e); } }
  if (Store.save(S.map, thumb)) $('#save-state').textContent = 'Đã lưu';
}

/* =====================================================================
   VẼ LÊN MÀN HÌNH
   ===================================================================== */
function render() {
  if (!S.map) return;
  const L = (S.L = computeLayout(S.map));
  const pf = S.presenting ? presentFocus() : null;
  edgesEl.innerHTML = L.edges.map(e => `<path d="${e.d}" stroke="${e.color}" stroke-width="${e.w}" fill="none" stroke-linecap="round"${pf && pf.has(e.to) && pf.has(e.from) ? ' class="pf"' : ''}/>`).join('');
  renderNodes(L, pf);
  renderRels(L);
  positionEditor(L);
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
  return b.dir > 0 ? [b.w + 11, ay] : [-11, ay];
}
function countDesc(n) { return countNodes(n) - 1; }

function renderNodes(L, pf) {
  const out = [];
  for (const b of L.boxes.values()) {
    const n = b.node;
    const cls = ['node', 's-' + b.shape];
    if (b.id === S.sel) cls.push('sel');
    if (b.id === S.editing) cls.push('editing');
    if (S.matches?.has(b.id)) cls.push('match');
    if (pf?.has(b.id)) cls.push('pf');
    if (S.quiz && !S.quiz.shown.has(b.id)) cls.push('hid');
    const shadow = b.shape === 'underline' ? `inset 0 -${b.ul}px 0 ${b.color}` : b.stroke ? `inset 0 0 0 2px ${b.stroke}` : 'none';
    const style = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;padding:${b.padT}px ${b.padX}px ${b.padB}px ${b.padL}px;` +
      `background:${b.fill};color:${b.text};font:${b.font};line-height:${b.lh}px;border-radius:${radiusOf(b)}px;box-shadow:${shadow};--c:${b.color}`;
    let inner = '';
    if (n.image) inner += `<img class="nimg" src="${n.image.src}" alt="" draggable="false" style="left:${b.imgX}px;top:${b.imgY}px;width:${b.imgW}px;height:${b.imgH}px">`;
    if (n.icon) inner += `<span class="ic" style="width:${b.iconW}px;font-size:${b.fs}px">${esc(n.icon)}</span>`;
    inner += `<span class="tx">${esc(b.lines.join('\n'))}</span>`;
    if (b.indW) {
      inner += '<span class="inds">' +
        (n.note ? `<span class="ind" data-act="ind-note" data-id="${b.id}" title="${esc(n.note)}">📝</span>` : '') +
        (n.link ? `<span class="ind" data-act="ind-link" data-id="${b.id}" title="${esc(n.link)}">🔗</span>` : '') + '</span>';
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
  const innerH = b.h - b.padT - b.padB, th = b.lines.length * b.lh;
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
      g.started = true;
      g.skip = new Set(); walk(getNode(g.id), n => { g.skip.add(n.id); });
      g.ghost = nodesEl.querySelector(`.node[data-id="${g.id}"]`).cloneNode(true);
      Object.assign(g.ghost.style, { opacity: .85, pointerEvents: 'none', zIndex: 5, boxShadow: '0 8px 24px rgba(0,0,0,.18)' });
      g.ghost.classList.remove('sel');
      world.appendChild(g.ghost);
      g.skip.forEach(id => nodesEl.querySelector(`.node[data-id="${id}"]`)?.classList.add('dragging'));
    }
    const p = screenToWorld(e.clientX, e.clientY);
    const b = S.L.boxes.get(g.id);
    g.ghost.style.left = p.x - b.w / 2 + 'px'; g.ghost.style.top = p.y - b.h / 2 + 'px';
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
  } else if (g.type === 'pan') scheduleSave();
  if (g.type === 'node' && g.started) {
    g.ghost.remove(); showDrop(null);
    if (g.drop) moveNode(g.id, g.drop.id, g.drop.pos, g.drop.side);
    else render();
  }
}
function findDrop(p, skip) {
  const L = S.L;
  for (const b of L.boxes.values()) {
    if (skip.has(b.id)) continue;
    if (p.x < b.x - 8 || p.x > b.x + b.w + 8 || p.y < b.y - 8 || p.y > b.y + b.h + 8) continue;
    if (b.depth === 0) return { id: b.id, pos: 'child', side: p.x < b.x + b.w / 2 ? 'left' : 'right' };
    const r = L.mode === 'down' ? (p.x - b.x) / b.w : (p.y - b.y) / b.h;
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
  if (S.L.mode === 'down') Object.assign(mark.style, { left: (d.pos === 'before' ? b.x - 10 : b.x + b.w + 7) + 'px', top: b.y + 'px', width: '3px', height: b.h + 'px' });
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
  clearTimeout(canvas._wt); canvas._wt = setTimeout(scheduleSave, 600);
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
  const shapes = [['', 'Mặc định'], ['rounded', 'Bo góc'], ['rect', 'Vuông'], ['pill', 'Viên thuốc'], ['underline', 'Gạch chân'], ['none', 'Chỉ chữ']];
  const bold = b ? /^(italic )?(\d+)/.exec(b.font)[2] >= 600 : false;
  return `
  <div class="pn-sec"><div class="pn-label">Màu nhánh ${st.color ? '<button data-act="set" data-key="color" data-val="">Mặc định</button>' : ''}</div>${swatches('color', SWATCH, st.color)}</div>
  <div class="pn-sec"><div class="pn-label">Nền</div>${swatches('fill', FILLS, st.fill, { none: true })}</div>
  <div class="pn-sec"><div class="pn-label">Màu chữ</div>${swatches('textColor', TEXTS, st.textColor, { none: true })}</div>
  <div class="pn-sec"><div class="pn-label">Hình dạng</div><div class="seg">${shapes.map(([v, l]) => `<button class="${(st.shape || '') === v ? 'on' : ''}" data-act="set" data-key="shape" data-val="${v}">${l}</button>`).join('')}</div></div>
  <div class="pn-sec"><div class="pn-label">Chữ</div><div class="row">
    <button class="sq" data-act="font-dec" title="Nhỏ hơn">A−</button><span class="val">${b?.fs || ''}</span><button class="sq" data-act="font-inc" title="Lớn hơn">A+</button>
    <span style="flex:1"></span>
    <button class="sq ${bold ? 'on' : ''}" data-act="bold" title="Đậm (Ctrl+B)"><b>B</b></button>
    <button class="sq ${st.italic ? 'on' : ''}" data-act="italic" title="Nghiêng (Ctrl+I)"><i>I</i></button></div></div>
  <div class="pn-sec"><div class="pn-label">Biểu tượng ${n.icon ? '<button data-act="set-icon" data-val="">Bỏ</button>' : ''}</div>
    <div class="emoji-grid">${EMOJIS.map(e => `<button class="${n.icon === e ? 'on' : ''}" data-act="set-icon" data-val="${e}">${e}</button>`).join('')}</div></div>
  <div class="pn-sec"><div class="pn-label">Hình ảnh</div>
    ${n.image ? `<div class="seg" style="margin-bottom:8px">${IMG_SIZES.map(([l, v]) => `<button class="${(n.image.dw || 200) === v ? 'on' : ''}" data-act="img-size" data-val="${v}">${l}</button>`).join('')}</div>
      <div class="acts-grid"><button class="btn" data-act="img-pick" data-icon="image">Đổi ảnh</button><button class="btn del" data-act="img-remove" data-icon="trash">Bỏ ảnh</button></div>`
    : `<button class="btn" style="width:100%;justify-content:center" data-act="img-pick" data-icon="image">Chèn ảnh…</button>
      <div class="muted" style="font-size:12px;margin-top:6px">Hoặc dán (Ctrl+V) / kéo thả ảnh vào nút.</div>`}</div>
  <div class="pn-sec"><div class="pn-label">Ghi chú</div><textarea id="pn-note" class="field" rows="3" placeholder="Thêm ghi chú cho nút…">${esc(n.note || '')}</textarea></div>
  <div class="pn-sec"><div class="pn-label">Liên kết web</div><input id="pn-link" class="field" placeholder="https://…" value="${esc(n.link || '')}"></div>
  <div class="pn-sec"><div class="acts-grid">
    <button class="btn" data-act="add-child" data-icon="child">Nút con</button>
    <button class="btn" data-act="add-sibling" data-icon="sibling">Cùng cấp</button>
    <button class="btn" data-act="relate" data-icon="relate">Mối nối</button>
    <button class="btn" data-act="ai-expand" data-icon="sparkle">AI gợi ý</button>
    ${n.children.length && !isRoot(n.id) ? `<button class="btn" data-act="toggle-collapse" data-icon="fold">${n.collapsed ? 'Mở rộng' : 'Thu gọn'}</button>` : ''}
    <button class="btn" data-act="reset-style" data-icon="reset">Xóa định dạng</button>
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
  <div class="pn-sec"><div class="pn-label">Thống kê</div><div class="stats">
    <div><b>${n}</b><span>nút</span></div><div><b>${depth}</b><span>cấp sâu</span></div><div><b>${S.map.relations.length}</b><span>mối nối</span></div></div></div>
  <div class="pn-sec"><div class="acts-grid">
    <button class="btn" data-act="expand-all">Mở rộng hết</button>
    <button class="btn" data-act="collapse-all">Thu gọn hết</button>
    <button class="btn" data-act="zoom-fit" data-icon="fit">Vừa màn hình</button>
    <button class="btn" data-act="add-child" data-icon="plus">Nhánh mới</button>
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
panelBody.addEventListener('change', e => {
  const t = e.target;
  if (t.type === 'color') { setStyle(t.dataset.key, t.value); return; }
  if (t.id === 'pn-link') {
    const n = getNode(S.sel); let v = t.value.trim();
    if (v && !/^[a-z]+:/i.test(v)) v = 'https://' + v;
    if (n && (n.link || '') !== v) { pushHist(panelSnap || snap()); if (v) n.link = v; else delete n.link; changed(); }
    return;
  }
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
  if (f) walk(S.map.root, n => { if (fold(n.text).includes(f) || fold(n.note).includes(f)) { S.matches.add(n.id); S.matchList.push(n.id); } });
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
  const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
  if (!file) return;
  e.preventDefault(); showDrop(null);
  const nodeEl = e.target.closest('.node');
  if (nodeEl) { insertImage(nodeEl.dataset.id, file); return; }
  // Thả ra khoảng trống: tạo nhánh mới chứa ảnh dưới nút đang chọn (hoặc chủ đề trung tâm)
  const id = addChild(S.sel || S.map.root.id, { edit: false });
  const n = getNode(id); n.text = file.name.replace(/\.[^.]+$/, '');
  insertImage(id, file);
});

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
   AI — tạo sơ đồ / gợi ý ý con bằng Claude (khóa API của người dùng)
   ===================================================================== */
const AI = {
  model: 'claude-opus-5-5',
  sdkUrl: 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.133.0/+esm',
  key() { try { return localStorage.getItem('sodo.aikey') || ''; } catch { return ''; } },
  setKey(k) { try { k ? localStorage.setItem('sodo.aikey', k) : localStorage.removeItem('sodo.aikey'); } catch {} },
  async sdk() { return (this._mod ||= import(this.sdkUrl)).then(m => m.default || m.Anthropic); },
  system: `Bạn là trợ lý soạn sơ đồ tư duy cho giáo viên và học sinh Việt Nam.
Trả lời bằng một dàn ý dạng văn bản thụt lề trong trường "outline":
- Mỗi dòng là một ý ngắn gọn (thường không quá 8 từ), không dùng gạch đầu dòng, không đánh số, không Markdown.
- Thụt đúng 2 dấu cách cho mỗi cấp.
- Dòng đầu tiên, không thụt lề, là chủ đề trung tâm.
Viết bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác. Nội dung phải chính xác về kiến thức, phù hợp chương trình phổ thông khi chủ đề là bài học.`,
  schema: {
    type: 'object',
    properties: { outline: { type: 'string', description: 'Dàn ý thụt lề, mỗi cấp 2 dấu cách' } },
    required: ['outline'], additionalProperties: false,
  },
  async outline(prompt) {
    const Anthropic = await this.sdk();
    const client = new Anthropic({ apiKey: this.key(), dangerouslyAllowBrowser: true });
    try {
      const res = await client.beta.messages.create({
        model: this.model,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: this.schema } },
        system: this.system,
        messages: [{ role: 'user', content: prompt }],
      });
      if (res.stop_reason === 'refusal') throw new Error('AI đã từ chối yêu cầu này. Hãy thử diễn đạt chủ đề khác đi.');
      if (res.stop_reason === 'max_tokens') throw new Error('Dàn ý quá dài, hãy chọn mức chi tiết thấp hơn.');
      const text = res.content.find(b => b.type === 'text')?.text;
      const outline = text && JSON.parse(text).outline;
      if (!outline?.trim()) throw new Error('AI không trả về dàn ý.');
      return outline;
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) { this.setKey(''); throw new Error('Khóa API không hợp lệ. Hãy nhập lại khóa.'); }
      if (err instanceof Anthropic.PermissionDeniedError) throw new Error('Khóa API không có quyền dùng mô hình này.');
      if (err instanceof Anthropic.RateLimitError) throw new Error('Đã vượt giới hạn gọi API, hãy thử lại sau ít phút.');
      if (err instanceof Anthropic.APIConnectionError) throw new Error('Không kết nối được tới máy chủ AI. Kiểm tra mạng.');
      if (err instanceof Anthropic.APIError) throw new Error(`Lỗi từ máy chủ AI (${err.status ?? '?'}): ${err.message}`);
      throw err;
    }
  },
};
async function ensureAIKey(force = false) {
  if (AI.key() && !force) return true;
  const k = await modal({
    title: 'Khóa API Claude',
    body: `<p>Tính năng AI dùng khóa API Anthropic của bạn. Lấy khóa tại <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>.</p>
      <p style="font-size:13px">Khóa chỉ được lưu trong trình duyệt này và chỉ gửi tới <b>api.anthropic.com</b>. Không nhập khóa trên máy dùng chung.</p>
      <input class="field" type="password" style="width:100%" placeholder="sk-ant-…" value="${esc(AI.key())}" autocomplete="off">`,
    actions: [
      ...(AI.key() ? [{ label: 'Xóa khóa', value: '__clear' }] : []),
      { label: 'Hủy', value: null }, { label: 'Lưu', primary: true, value: m => $('input', m).value.trim() },
    ],
    onOpen: m => $('input', m).focus(),
  });
  if (k === '__clear') { AI.setKey(''); toast('Đã xóa khóa API'); return false; }
  if (!k) return !!AI.key() && !force;
  AI.setKey(k); return true;
}
function busy(text) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal busy"><span class="spinner"></span>${esc(text)}</div>`;
  $('#modal-root').appendChild(back);
  return () => back.remove();
}
async function aiCreateMap() {
  if (!(await ensureAIKey())) return;
  const r = await modal({
    title: 'Tạo sơ đồ bằng AI', wide: true,
    body: `<p>Mô tả chủ đề, bài học hoặc vấn đề bạn muốn vẽ sơ đồ.</p>
      <textarea class="field" rows="4" id="ai-topic" placeholder="Ví dụ: Quang hợp ở thực vật – Sinh học 11, dùng để ôn tập trước kiểm tra"></textarea>
      <div class="row" style="margin-top:12px;gap:10px;flex-wrap:wrap">
        <label class="muted" for="ai-depth">Mức chi tiết</label>
        <select id="ai-depth" class="field" style="width:auto">
          <option value="2">Ngắn gọn (2 cấp)</option><option value="3" selected>Vừa (3 cấp)</option><option value="4">Chi tiết (4 cấp)</option>
        </select>
        <span style="flex:1"></span><button class="btn small" type="button" id="ai-key-btn">Đổi khóa API</button>
      </div>`,
    actions: [{ label: 'Hủy', value: null }, { label: 'Tạo sơ đồ', primary: true, value: m => ({ topic: $('#ai-topic', m).value.trim(), depth: +$('#ai-depth', m).value }) }],
    onOpen: m => { $('#ai-topic', m).focus(); $('#ai-key-btn', m).onclick = () => ensureAIKey(true); },
  });
  if (!r?.topic) return;
  const done = busy('AI đang soạn sơ đồ… (thường mất 10–40 giây)');
  try {
    const text = await AI.outline(`Chủ đề: ${r.topic}\n\nHãy lập sơ đồ tư duy có ${r.depth} cấp bên dưới chủ đề trung tâm, khoảng 4–7 nhánh chính. Chủ đề trung tâm nên là một cụm từ ngắn.`);
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
  if (!(await ensureAIKey())) return;
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
  const strip = n => {
    const { image, ...rest } = n;
    if (image) images++;
    return { ...rest, children: n.children.map(strip) };
  };
  const data = { v: 1, title: map.title, theme: map.theme, layout: map.layout, root: strip(map.root), relations: map.relations };
  const stream = new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return { code: b64url(new Uint8Array(await new Response(stream).arrayBuffer())), images };
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
    packed.code.length > 12000 ? 'Sơ đồ khá lớn nên link dài; một số ứng dụng nhắn tin có thể cắt bớt link.' : '',
  ].filter(Boolean);
  await modal({
    title: 'Chia sẻ sơ đồ', wide: true,
    body: `<p>Ai có link sẽ xem được sơ đồ này. Họ có thể lưu một bản sao về máy mình; bản của bạn không bị ảnh hưởng.</p>
      <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-bottom:10px">
        <button class="on" data-q="0">Xem bình thường</button><button data-q="1">Ôn tập: che hết</button><button data-q="2">Ôn tập: che ý con</button>
      </div>
      <div class="row"><input class="field" id="share-link" readonly style="flex:1"><button class="btn primary" id="share-copy">Sao chép</button></div>
      ${warn.map(w => `<p class="muted" style="font-size:13px;margin:10px 0 0">${esc(w)}</p>`).join('')}`,
    actions: [{ label: 'Đóng', value: null }],
    onOpen: m => {
      const inp = $('#share-link', m);
      let q = 0;
      inp.value = link(q);
      $$('[data-q]', m).forEach(b => b.onclick = () => {
        q = +b.dataset.q; inp.value = link(q);
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
async function openShared(quizDepth, code) {
  let data;
  try { data = await unpackMap(code); } catch (err) { console.error(err); toast('Link chia sẻ bị hỏng hoặc không đầy đủ'); location.hash = '#/'; return; }
  const root = normalizeNode(data.root);
  const ids = new Set(); walk(root, n => { ids.add(n.id); });
  const map = newMap(root, data.title || root.text, {
    id: 'shared', theme: THEMES[data.theme] ? data.theme : 'classic', layout: LAYOUTS[data.layout] ? data.layout : 'map',
    relations: (data.relations || []).filter(r => ids.has(r.from) && ids.has(r.to)).map(r => ({ id: r.id || uid(), from: r.from, to: r.to, label: r.label || '' })),
  });
  showMap(map, { temp: true });
  saveNow();
  if (quizDepth) startQuiz(quizDepth);
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
  'ind-link': el => { const n = getNode(el.dataset.id); if (n?.link) window.open(n.link, '_blank', 'noopener'); },
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
  layout: el => { commit(() => { S.map.layout = el.dataset.val; if (el.dataset.val === 'map') assignSides(S.map.root); }); fitAll(); },
  theme: el => commit(() => { S.map.theme = el.dataset.val; }),
  'expand-all': () => setCollapsedAll(false),
  'collapse-all': () => setCollapsedAll(true),
  'del-rel': () => commit(() => { S.map.relations = S.map.relations.filter(r => r.id !== S.selRel); S.selRel = null; }),
  'flip-rel': () => commit(() => { const r = S.map.relations.find(x => x.id === S.selRel); if (r) [r.from, r.to] = [r.to, r.from]; }),
  'export-png': exportPNG,
  'export-svg': () => download(safeName(S.map.title) + '.svg', renderSVG(S.map), 'image/svg+xml'),
  'export-md': () => download(safeName(S.map.title) + '.md', toMarkdown(S.map.root), 'text/markdown'),
  'export-mm': () => download(safeName(S.map.title) + '.mm', toFreeMind(S.map.root), 'application/xml'),
  'export-json': () => download(safeName(S.map.title) + '.sodo.json', JSON.stringify({ ...S.map, view: undefined }, null, 2), 'application/json'),
  print: printMap,
  'img-pick': () => { if (S.sel) imgInput.click(); },
  'img-remove': () => setProp('image', null),
  'img-size': el => { const n = getNode(S.sel); if (n?.image) commit(() => { n.image = { ...n.image, dw: +el.dataset.val }; }); },
  share: shareMap,
  'save-shared': saveShared,
  'ai-expand': () => aiExpand(),
  'ai-create': aiCreateMap,
  quiz: () => (S.quiz ? stopQuiz() : startQuiz()),
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
  'export-map': el => { const m = Store.load(el.dataset.id); if (m) download(safeName(m.title) + '.sodo.json', JSON.stringify(m, null, 2), 'application/json'); },
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
    ['Kéo khoảng trống / cuộn chuột', 'Di chuyển vùng vẽ'], ['Kéo một nút', 'Đổi vị trí: thả giữa nút → làm nút con; thả mép trên/dưới → chèn trước/sau'],
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
  if (await confirmBox('Xóa sơ đồ?', `“${m.title}” sẽ bị xóa vĩnh viễn khỏi trình duyệt này.`)) { Store.remove(m.id); renderMapGrid(); }
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
      const root = normalizeNode(o.root || o);
      map = newMap(root, o.title || root.text, { theme: THEMES[o.theme] ? o.theme : 'classic', layout: LAYOUTS[o.layout] ? o.layout : 'map' });
      const ids = new Set(); walk(root, n => { ids.add(n.id); });
      map.relations = (o.relations || []).filter(r => ids.has(r.from) && ids.has(r.to)).map(r => ({ id: r.id || uid(), from: r.from, to: r.to, label: r.label || '' }));
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
  $('#shared-bar').hidden = !temp;
  map.relations ||= []; map.layout ||= 'map'; map.theme ||= 'classic';
  Object.assign(S, { map, sel: map.root.id, selRel: null, editing: null, undo: [], redo: [], relFrom: null, matches: null, matchList: [], presenting: null, quiz: null, panelTab: 'map' });
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
  const sh = /^#\/s\/(\d)\/([\w-]+)/.exec(location.hash);
  if (sh) { leaveEditor(); openShared(+sh[1], sh[2]); return; }
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
      let thumb = null; try { thumb = makeThumb(m); } catch {}
      Store.save(m, thumb);
    }
  }
  route();
})();
