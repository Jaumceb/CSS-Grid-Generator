export function canPlace(items, candidate, columns, rows) {
  if (![candidate.col, candidate.row, candidate.width, candidate.height].every(Number.isInteger)) return false;
  if (candidate.col < 1 || candidate.row < 1 || candidate.width < 1 || candidate.height < 1 || candidate.col + candidate.width - 1 > columns || candidate.row + candidate.height - 1 > rows) return false;
  return !items.some(item => item.id !== candidate.id && candidate.col < item.col + item.width && candidate.col + candidate.width > item.col && candidate.row < item.row + item.height && candidate.row + candidate.height > item.row);
}

export function exportGrid(items, columns, rows, gap) {
  const css = `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(${columns}, minmax(0, 1fr));\n  grid-template-rows: repeat(${rows}, minmax(64px, auto));\n  gap: ${gap}px;\n}\n`;
  return {
    css: css + items.map(item => `\n#div${item.id} {\n  grid-column: ${item.col} / span ${item.width};\n  grid-row: ${item.row} / span ${item.height};\n}`).join('\n'),
    html: `<div class="grid-container">\n${items.map(item => `  <div id="div${item.id}">${item.id}</div>`).join('\n')}\n</div>`,
  };
}
