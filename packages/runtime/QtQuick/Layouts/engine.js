// The arithmetic of RowLayout, ColumnLayout and GridLayout: Qt's
// QGridLayoutEngine as Qt Quick runs it, with every size on a whole pixel.
//
// Items sit in the cells of a grid. `measure` gives each column and each row
// a box, the least, the preferred and the most it can be, from the items in
// it; `arrange` shares a width among the columns and a height among the rows
// and puts each item in its cells. Nothing here reads a property: a layout
// hands in cells and gets numbers back, the same ones Qt computes, which is
// why the steps are Qt's even where they look roundabout.
//
// A cell is `{ item, first, span, alignment, box, stretch, limit, margins }`
// with `first`, `span`, `box`, `stretch` and `limit` given for the columns
// and then for the rows.

// What Qt uses for "no maximum": the largest float.
export const FLT_MAX = 3.4028234663852886e38;
// Qt's LAYOUTITEMSIZE_MAX.
const HUGE = 1 << 24;
const SIZES = ["min", "pref", "max"];

const AlignRight = 0x2;
const AlignHCenter = 0x4;
const AlignBottom = 0x40;
const AlignVCenter = 0x80;
const AlignBaseline = 0x100;
const HORIZONTAL = 0x1f;
const VERTICAL = 0x1e0;

export const box = () => ({ min: 0, pref: 0, max: FLT_MAX, ascent: -1, descent: -1 });

const round = (value) => Math.floor(value + 0.5);
const bound = (least, value, most) => Math.max(least, Math.min(most, value));

// The box of an item along one axis, from its size hints: one that does not
// fill is its preferred size and nothing else.
export function itemBox(hints, axis, fill, alignment) {
  const pref = hints.pref[axis];
  const result = box();
  result.pref = pref;
  result.min = Math.ceil(fill ? hints.min[axis] : pref);
  result.max = fill ? hints.max[axis] : pref;
  if (axis === 1 && alignment & AlignBaseline) {
    result.descent = hints.descent;
    if (result.descent !== -1) {
      result.descent -= hints.min[1] - result.min;
      result.ascent = result.min - result.descent;
    }
  }
  return result;
}

// A row takes the largest of what its items need.
function combine(row, other) {
  row.descent = Math.max(row.descent, other.descent);
  row.ascent = Math.max(row.ascent, other.ascent);
  row.min = Math.max(row.ascent + row.descent, row.min, other.min);
  let most;
  if (row.max === FLT_MAX && other.max !== FLT_MAX) most = other.max;
  else if (other.max === FLT_MAX && row.max !== FLT_MAX) most = row.max;
  else most = Math.max(row.max, other.max);
  row.max = Math.max(row.min, most);
  row.pref = bound(row.min, Math.max(row.pref, other.pref), row.max);
}

// The rows from `start` to `end` as one box, spacing included. A row that
// does not stretch counts as its preferred size at most.
function total(data, start, end) {
  const result = box();
  if (start >= end) return result;
  result.max = 0;
  let spacing = 0;
  for (let row = start; row < end; row++) {
    if (data.ignore[row]) continue;
    const other = data.boxes[row];
    result.min += other.min + spacing;
    result.pref += other.pref + spacing;
    result.max += (data.stretches[row] === 0 ? other.pref : other.max) + spacing;
    spacing = data.spacings[row];
  }
  return result;
}

// Every row at one of its three sizes, one after another.
function steal(data, start, end, which, positions, sizes) {
  let offset = 0;
  let spacing = 0;
  for (let row = start; row < end; row++) {
    let size = 0;
    if (!data.ignore[row]) {
      size = data.boxes[row][which];
      offset += spacing;
      spacing = data.spacings[row];
    }
    positions[row - start] = offset;
    sizes[row - start] = size;
    offset += size;
  }
}

// Shares `target` among the rows from `start` to `end`: Qt's
// `calculateGeometries`. Under the preferred size each row gives up in
// proportion to what it can; over it the rows that stretch take the rest, by
// their stretch factors or else by their sizes, none past its maximum.
function share(data, start, end, target, positions, sizes, descents, whole) {
  target = Math.max(whole.min, target);
  const count = end - start;
  const wanted = new Array(count);
  const factors = new Array(count);
  let sumFactors = 0;
  let sumStretches = 0;
  let available;
  for (let index = 0; index < count; index++) {
    const stretch = data.stretches[start + index];
    if (stretch > 0) sumStretches += stretch;
  }

  if (target < whole.pref) {
    steal(data, start, end, "min", positions, sizes);
    available = target - whole.min;
    if (available > 0) {
      const desired = Math.min(whole.pref, HUGE) - whole.min;
      for (let index = 0; index < count; index++) {
        if (data.ignore[start + index]) {
          factors[index] = 0;
          continue;
        }
        const row = data.boxes[start + index];
        const more = Math.min(row.pref, HUGE) - row.min;
        factors[index] = more * (available / desired) ** (more / desired);
        sumFactors += factors[index];
      }
      for (let index = 0; index < count; index++) {
        wanted[index] = sizes[index] + (available * factors[index]) / sumFactors;
      }
    }
  } else {
    const over = target > whole.max;
    steal(data, start, end, over ? "max" : "pref", positions, sizes);
    available = target - (over ? whole.max : whole.pref);
    if (available > 0) {
      let left = available;
      let limited = false;
      let sumSizes = 0;
      for (let index = 0; index < count; index++) sumSizes += sizes[index];

      for (let index = 0; index < count; index++) {
        if (data.ignore[start + index]) {
          wanted[index] = 0;
          factors[index] = 0;
          continue;
        }
        const row = data.boxes[start + index];
        const size = over ? row.max : row.pref;
        const more = (over ? FLT_MAX : row.max) - size;
        if (more === 0) {
          wanted[index] = sizes[index];
          factors[index] = 0;
          continue;
        }
        const stretch = data.stretches[start + index];
        if (sumStretches === 0) {
          if (data.hasIgnoreFlag || sizes[index] === 0) factors[index] = stretch < 0 ? 1 : 0;
          else factors[index] = stretch < 0 ? sizes[index] : 0;
        } else if (stretch === sumStretches) {
          factors[index] = 1;
        } else if (stretch <= 0) {
          factors[index] = 0;
        } else {
          // Where the stretch factors would hold exactly, and half as far
          // again, so that the sizes get there smoothly.
          let ultimate;
          let ultimateSum;
          const x = (stretch * sumSizes - sumStretches * size) / (sumStretches - stretch);
          if (x >= 0) {
            ultimate = size + x;
            ultimateSum = sumSizes + x;
          } else {
            ultimate = size;
            ultimateSum = (sumStretches * size) / stretch;
          }
          ultimate = (ultimate * 3) / 2;
          ultimateSum = (ultimateSum * 3) / 2;
          const beta = ultimateSum - sumSizes;
          // Qt's qFuzzyIsNull.
          if (Math.abs(beta) <= 0.000000000001) {
            factors[index] = 1;
          } else {
            const alpha = Math.min(left, beta);
            const ultimateFactor = (stretch * ultimateSum) / sumStretches - size;
            const transitional = (left * (ultimate - size)) / beta;
            factors[index] = (alpha * ultimateFactor + (beta - alpha) * transitional) / beta;
          }
        }
        sumFactors += factors[index];
        if (more < left) limited = true;
        wanted[index] = -1;
      }

      // What reaches its maximum stays there, and the others share again.
      while (limited) {
        limited = false;
        for (let index = 0; index < count; index++) {
          if (wanted[index] >= 0) continue;
          const row = data.boxes[start + index];
          const most = over ? FLT_MAX : Math.max(row.min, Math.floor(row.max));
          const extra = (left * factors[index]) / sumFactors;
          if (sizes[index] + extra >= most) {
            wanted[index] = most;
            left -= most - sizes[index];
            sumFactors -= factors[index];
            limited = left > 0;
            if (!limited) break;
          }
        }
      }
      for (let index = 0; index < count; index++) {
        if (wanted[index] >= 0) continue;
        wanted[index] = sizes[index] + (sumFactors === 0 ? 0 : (left * factors[index]) / sumFactors);
      }
    }
  }

  if (available > 0) {
    let offset = 0;
    for (let index = 0; index < count; index++) {
      const delta = wanted[index] - sizes[index];
      positions[index] += offset;
      sizes[index] += delta;
      offset += delta;
    }
  }

  // Onto whole pixels: each position is rounded, and what that takes from a
  // row goes to the one before it.
  for (let index = 0; index < count; index++) {
    const position = positions[index];
    positions[index] = round(position);
    const delta = positions[index] - position;
    sizes[index] -= delta;
    if (index > 0) sizes[index - 1] += delta;
  }
  sizes[count - 1] = target - positions[count - 1];
  for (let index = 0; index < count; index++) {
    sizes[index] = Math.max(data.boxes[start + index].min, round(sizes[index]));
  }

  if (!descents) return;
  for (let index = 0; index < count; index++) {
    if (data.ignore[start + index]) continue;
    const row = data.boxes[start + index];
    // The space a row has over its ascent and descent goes half below.
    descents[index] = row.descent < 0 ? -1 : row.descent + (sizes[index] - (row.ascent + row.descent)) / 2;
  }
}

// An item over several rows needs them to add up to its sizes: what they
// lack is shared among them as a size would be.
function distribute(data) {
  const multi = [...data.multi.values()].sort((a, b) => a.start - b.start || a.span - b.span);
  for (const { start, span, box: wanted, stretch } of multi) {
    const end = start + span;
    const whole = total(data, start, end);
    const extras = Array.from({ length: span }, box);
    const positions = new Array(span);
    const sizes = new Array(span);
    for (const which of SIZES) {
      const extra = which === "max" ? whole.max - wanted.max : wanted[which] - whole[which];
      // Not `extra <= 0`: with no maximum on either side it is not a number.
      if (!(extra > 0)) continue;
      share(data, start, end, wanted[which], positions, sizes, null, whole);
      for (let index = 0; index < span; index++) extras[index][which] = sizes[index];
    }
    for (let index = 0; index < span; index++) {
      combine(data.boxes[start + index], extras[index]);
      if (stretch !== 0) data.stretches[start + index] = Math.max(data.stretches[start + index], stretch);
    }
  }
}

// The boxes of the columns (`axis` 0) or of the rows (1). "Row" below is
// whichever is being measured, as in Qt.
function fill(grid, columns, rows, axis, spacing, uniform) {
  const count = axis ? rows : columns;
  const across = axis ? columns : rows;
  const at = axis ? (row, column) => grid[row * columns + column] : (row, column) => grid[column * columns + row];
  const data = {
    ignore: new Array(count).fill(false),
    boxes: Array.from({ length: count }, box),
    stretches: new Array(count).fill(-1),
    spacings: new Array(count).fill(spacing),
    multi: new Map(),
    hasIgnoreFlag: false,
  };

  // A row with nothing in it, or with only what the row before has, is not
  // there.
  for (let row = 0; row < count; row++) {
    let empty = true;
    let repeated = row > 0;
    for (let column = 0; column < across; column++) {
      const cell = at(row, column);
      if (repeated && cell !== at(row - 1, column)) repeated = false;
      if (cell) empty = false;
    }
    if (empty || repeated) data.ignore[row] = true;
  }

  for (let row = 0; row < count; row++) {
    if (data.ignore[row]) continue;
    let starts = false;
    for (let column = 0; column < across; column++) {
      const cell = at(row, column);
      if (!cell || cell.first[axis] !== row || cell.first[1 - axis] !== column) continue;
      starts = true;
      const stretch = cell.stretch[axis];
      const span = cell.span[axis];
      let effective = 1;
      for (let index = 1; index < span; index++) if (!data.ignore[row + index]) effective++;
      if (effective === 1) {
        combine(data.boxes[row], cell.box[axis]);
        if (stretch !== 0) data.stretches[row] = Math.max(data.stretches[row], stretch);
      } else {
        const key = row * 65536 + span;
        let entry = data.multi.get(key);
        if (!entry) data.multi.set(key, (entry = { start: row, span, box: box(), stretch }));
        combine(entry.box, cell.box[axis]);
        entry.stretch = stretch;
      }
    }
    // A row no item starts in takes space as one of unknown size does.
    if (!starts) data.hasIgnoreFlag = true;
  }

  if (uniform && count > 1) {
    let pref = 0;
    let most = Number.MAX_VALUE;
    let least = 0;
    for (const row of data.boxes) {
      pref += row.pref;
      most = Math.min(most, row.max);
      least = Math.max(least, row.min);
    }
    most = Math.max(most, least);
    pref = bound(least, pref / count, most);
    for (const row of data.boxes) {
      row.pref = pref;
      row.min = least;
      row.max = most;
    }
  }
  return data;
}

// The grid the cells make and what its columns and rows need. `spacing` and
// `uniform` are given for the columns and then for the rows.
export function measure(cells, spacing, uniform) {
  let columns = 0;
  let rows = 0;
  for (const cell of cells) {
    columns = Math.max(columns, cell.first[0] + cell.span[0]);
    rows = Math.max(rows, cell.first[1] + cell.span[1]);
  }
  // Which cell is where: the last one put in a place has it.
  const grid = new Array(columns * rows);
  for (const cell of cells) {
    for (let row = cell.first[1]; row < cell.first[1] + cell.span[1]; row++) {
      for (let column = cell.first[0]; column < cell.first[0] + cell.span[0]; column++) {
        grid[row * columns + column] = cell;
      }
    }
  }
  const data = [fill(grid, columns, rows, 0, spacing[0], uniform[0]), fill(grid, columns, rows, 1, spacing[1], uniform[1])];
  distribute(data[0]);
  distribute(data[1]);
  return { cells, columns, rows, data, total: [total(data[0], 0, columns), total(data[1], 0, rows)] };
}

// Where each cell's item goes in a layout of that size: `x`, `y`, `width`
// and `height`, in the order of the cells.
export function arrange(measured, width, height, mirrored) {
  const { cells, columns, rows, data } = measured;
  const placed = {
    cells,
    x: new Array(cells.length),
    y: new Array(cells.length),
    width: new Array(cells.length),
    height: new Array(cells.length),
  };
  if (rows < 1 || columns < 1) return placed;
  const xx = new Array(columns);
  const widths = new Array(columns);
  const yy = new Array(rows);
  const heights = new Array(rows);
  const descents = new Array(rows);
  share(data[0], 0, columns, width, xx, widths, null, measured.total[0]);
  share(data[1], 0, rows, height, yy, heights, descents, measured.total[1]);

  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    const lastColumn = cell.first[0] + cell.span[0] - 1;
    const lastRow = cell.first[1] + cell.span[1] - 1;
    let x = xx[cell.first[0]];
    let y = yy[cell.first[1]];
    let cellWidth = widths[lastColumn];
    let cellHeight = heights[lastRow];
    if (cell.span[0] !== 1) cellWidth += xx[lastColumn] - x;
    if (cell.span[1] !== 1) cellHeight += yy[lastRow] - y;

    // In the middle of its row and at the left of its column, unless it says.
    let alignment = cell.alignment;
    if (!(alignment & VERTICAL)) alignment |= AlignVCenter;
    // An item is as big as its cell, up to what it can be.
    let itemWidth = Math.min(cell.limit[0], cellWidth);
    let itemHeight = Math.min(cell.limit[1], cellHeight);
    const horizontal = alignment & HORIZONTAL;
    if (horizontal === AlignHCenter) x += (cellWidth - itemWidth) / 2;
    else if (horizontal === AlignRight) x += cellWidth - itemWidth;
    const vertical = alignment & VERTICAL;
    if (vertical === AlignVCenter) {
      y += (cellHeight - itemHeight) / 2;
    } else if (vertical === AlignBottom) {
      y += cellHeight - itemHeight;
    } else if (vertical === AlignBaseline) {
      const descent = cell.box[1].descent;
      const ascent = cell.box[1].min - descent;
      y += cellHeight - descents[lastRow] - ascent;
      itemHeight = ascent + descent;
    }
    x = round(x);
    // A baseline is where it is: rounding it would take it off the others'.
    if (alignment !== AlignBaseline) y = round(y);
    if (mirrored) x = width - x - itemWidth;

    // The margins keep their sides from right to left: Qt swaps them under
    // LayoutMirroring only.
    const [left, top, right, bottom] = cell.margins;
    placed.x[index] = x + left;
    placed.y[index] = y + top;
    placed.width[index] = itemWidth - left - right;
    placed.height[index] = itemHeight - top - bottom;
  }
  return placed;
}
