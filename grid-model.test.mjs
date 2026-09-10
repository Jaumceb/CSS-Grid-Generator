import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlace, exportGrid } from './grid-model.mjs';

test('blocks cannot overlap or leave the grid', () => {
  const items = [{ id: 1, col: 1, row: 1, width: 2, height: 2 }];
  assert.equal(canPlace(items, { id: 2, col: 2, row: 2, width: 1, height: 1 }, 5, 5), false);
  assert.equal(canPlace(items, { id: 2, col: 3, row: 1, width: 1, height: 1 }, 5, 5), true);
  assert.equal(canPlace(items, { id: 1, col: 5, row: 1, width: 2, height: 2 }, 5, 5), false);
  assert.equal(canPlace(items, { ...items[0], width: 0 }, 5, 5), false);
  assert.equal(canPlace(items, { ...items[0], col: NaN }, 5, 5), false);
});

test('moves and resizes ignore the same block but respect new dimensions', () => {
  const item = { id: 1, col: 2, row: 2, width: 2, height: 2 };
  assert.equal(canPlace([item], { ...item, width: 3 }, 5, 5), true);
  assert.equal(canPlace([item], item, 2, 2), false);
});

test('exports exact positions and drops deleted blocks from both outputs', () => {
  const item = { id: 3, col: 2, row: 1, width: 3, height: 2 };
  const result = exportGrid([item], 5, 5, 12);
  assert.match(result.css, /grid-column: 2 \/ span 3/);
  assert.match(result.css, /grid-row: 1 \/ span 2/);
  assert.match(result.css, /gap: 12px/);
  assert.match(result.html, /<div id="div3">3<\/div>/);
  const empty = exportGrid([], 5, 5, 12);
  assert.doesNotMatch(empty.css + empty.html, /div3/);
});
