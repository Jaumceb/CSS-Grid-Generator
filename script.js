import { canPlace, exportGrid } from './grid-model.mjs';

const grid = document.getElementById('gridContainer');
const status = document.getElementById('status');
const controls = Object.fromEntries(['columns', 'rows', 'gap'].map(id => [id, document.getElementById(id)]));
const editor = document.getElementById('itemEditor');
let columns = 5, rows = 5, gap = 8, nextId = 1, selected = null;
let items = [];

function announce(message) { status.textContent = message; }
function select(id) {
  selected = id;
  grid.querySelectorAll('.draggable-element').forEach(node => node.classList.toggle('selected', Number(node.dataset.id) === id));
  const item = items.find(item => item.id === id);
  editor.hidden = !item;
  if (!item) return;
  document.getElementById('itemTitle').textContent = `Block ${id}`;
  for (const key of ['col', 'row', 'width', 'height']) {
    const input = editor.elements[key];
    input.value = item[key];
    input.max = ['col', 'width'].includes(key) ? columns : rows;
  }
}

function output() {
  const result = exportGrid(items, columns, rows, gap);
  document.getElementById('cssOutput').value = result.css;
  document.getElementById('htmlOutput').value = result.html;
}

function placeStyle(node, item) {
  node.style.gridColumn = `${item.col} / span ${item.width}`;
  node.style.gridRow = `${item.row} / span ${item.height}`;
}

function updateItem(candidate) {
  if (!canPlace(items, candidate, columns, rows)) {
    announce('That position overlaps another block or goes outside the grid.');
    return false;
  }
  items = items.map(item => item.id === candidate.id ? candidate : item);
  render();
  return true;
}

function startPointer(event, item, mode, handle) {
  if (event.button !== 0) return;
  event.preventDefault();
  select(item.id);
  handle.setPointerCapture(event.pointerId);
  const startX = event.clientX, startY = event.clientY;
  const stepX = (grid.clientWidth + gap) / columns;
  const stepY = 64 + gap;
  const block = handle.closest('.draggable-element');
  let candidate = { ...item };
  function move(event) {
    const x = Math.round((event.clientX - startX) / stepX);
    const y = Math.round((event.clientY - startY) / stepY);
    const next = mode === 'move' ? { ...item, col: item.col + x, row: item.row + y } : { ...item, width: item.width + x, height: item.height + y };
    if (canPlace(items, next, columns, rows)) { candidate = next; placeStyle(block, candidate); }
  }
  function finish(event) {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', finish);
    handle.removeEventListener('pointercancel', finish);
    if (event.type === 'pointercancel') { render(); return; }
    updateItem(candidate);
    grid.querySelector(`[data-id="${item.id}"] .${mode}-handle`)?.focus({ preventScroll: true });
    announce(`Block ${item.id}: column ${candidate.col}, row ${candidate.row}, width ${candidate.width}, height ${candidate.height}.`);
  }
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
}

function render() {
  grid.replaceChildren();
  grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  grid.style.gridTemplateRows = `repeat(${rows}, minmax(64px, auto))`;
  grid.style.gap = `${gap}px`;
  grid.style.minWidth = `${columns * 48 + (columns - 1) * gap}px`;
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= columns; col++) {
      const cell = document.createElement('button');
      cell.className = 'grid-cell';
      cell.style.gridColumn = col;
      cell.style.gridRow = row;
      cell.textContent = '+';
      cell.setAttribute('aria-label', `Add block at column ${col}, row ${row}`);
      cell.disabled = !canPlace(items, { id: -1, col, row, width: 1, height: 1 }, columns, rows);
      cell.addEventListener('click', () => {
        const id = nextId++;
        items.push({ id, col, row, width: 1, height: 1 });
        selected = id;
        render();
        grid.querySelector(`[data-id="${id}"] .move-handle`).focus({ preventScroll: true });
        announce(`Block ${id} added.`);
      });
      grid.append(cell);
    }
  }
  for (const item of items) {
    const block = document.createElement('div');
    block.className = 'draggable-element';
    block.dataset.id = item.id;
    placeStyle(block, item);
    for (const mode of ['move', 'resize']) {
      const handle = document.createElement('button');
      handle.className = `${mode}-handle`;
      handle.textContent = mode === 'move' ? item.id : '↘';
      handle.setAttribute('aria-label', `${mode === 'move' ? 'Move' : 'Resize'} block ${item.id}`);
      handle.title = mode === 'move' ? 'Drag to move; arrow keys also work' : 'Drag to resize; arrow keys also work';
      handle.addEventListener('focus', () => select(item.id));
      handle.addEventListener('click', () => select(item.id));
      handle.addEventListener('pointerdown', event => startPointer(event, item, mode, handle));
      handle.addEventListener('keydown', event => {
        const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (!delta) return;
        event.preventDefault();
        const candidate = mode === 'move' ? { ...item, col: item.col + delta[0], row: item.row + delta[1] } : { ...item, width: item.width + delta[0], height: item.height + delta[1] };
        if (updateItem(candidate)) {
          grid.querySelector(`[data-id="${item.id}"] .${mode}-handle`).focus({ preventScroll: true });
          announce(`Block ${item.id} updated.`);
        }
      });
      block.append(handle);
    }
    grid.append(block);
  }
  select(selected);
  output();
}

for (const [name, input] of Object.entries(controls)) {
  input.addEventListener('change', () => {
    const value = Number(input.value);
    const min = Number(input.min), max = Number(input.max);
    if (!input.value || !Number.isInteger(value) || value < min || value > max) {
      input.value = { columns, rows, gap }[name];
      announce(`Use a whole number between ${min} and ${max}.`);
      return;
    }
    const newColumns = name === 'columns' ? value : columns;
    const newRows = name === 'rows' ? value : rows;
    if (items.some(item => !canPlace(items, item, newColumns, newRows))) {
      input.value = { columns, rows, gap }[name];
      announce('Move or resize the blocks before making the grid smaller.');
      return;
    }
    if (name === 'columns') columns = value;
    if (name === 'rows') rows = value;
    if (name === 'gap') gap = value;
    render();
    announce('Grid updated. Your blocks were kept.');
  });
}

editor.addEventListener('submit', event => {
  event.preventDefault();
  const candidate = { id: selected };
  for (const key of ['col', 'row', 'width', 'height']) candidate[key] = Number(editor.elements[key].value);
  if (updateItem(candidate)) announce(`Block ${selected} updated.`);
});
document.getElementById('removeItem').addEventListener('click', () => {
  const id = selected;
  items = items.filter(item => item.id !== id);
  selected = null;
  render();
  grid.querySelector('.grid-cell:not(:disabled)')?.focus({ preventScroll: true });
  announce(`Block ${id} removed.`);
});
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const field = document.getElementById(button.dataset.copy);
  try {
    await navigator.clipboard.writeText(field.value);
    announce(`${button.dataset.copy === 'cssOutput' ? 'CSS' : 'HTML'} copied.`);
  } catch {
    field.focus();
    field.select();
    announce('Copy unavailable. The code is selected; use your device’s Copy command.');
  }
}));
render();
