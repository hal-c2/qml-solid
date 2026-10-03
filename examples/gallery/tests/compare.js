// How alike two pictures of the same size are, as two fractions:
//
// - `pixels`: of all pixels, how many are the same (pixelmatch: a perceptual
//   colour difference, anti-aliasing not counted).
// - `content`: the same, counting only the pixels that are not background in
//   either picture, the background being the reference's commonest colour.
//   An empty window of the right colour scores high on `pixels` and nothing
//   here.
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const threshold = 0.1;

function background({ data }) {
  const counts = new Map();
  let most = 0;
  let colour = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    const key = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    if (count > most) [most, colour] = [count, key];
  }
  return [colour >> 16, (colour >> 8) & 255, colour & 255];
}

/// `web` and `reference` are PNG files as buffers. The result has `diff`, a
/// PNG of where they differ, or `mismatch`, why they cannot be compared.
export function compare(web, reference) {
  const [a, b] = [PNG.sync.read(web), PNG.sync.read(reference)];
  if (a.width !== b.width || a.height !== b.height) {
    return { mismatch: `the web picture is ${a.width}x${a.height}, the reference ${b.width}x${b.height}` };
  }
  const { width, height } = a;
  const total = width * height;

  const mask = new PNG({ width, height });
  const different = pixelmatch(a.data, b.data, mask.data, width, height, { threshold, diffMask: true });

  const [red, green, blue] = background(b);
  const isBackground = ({ data }, offset) =>
    Math.abs(data[offset] - red) + Math.abs(data[offset + 1] - green) + Math.abs(data[offset + 2] - blue) <= 24;
  let content = 0;
  let contentDifferent = 0;
  for (let offset = 0; offset < mask.data.length; offset += 4) {
    if (isBackground(a, offset) && isBackground(b, offset)) continue;
    content += 1;
    // In the mask a pixel that differs is red; an anti-aliased one is yellow.
    if (mask.data[offset + 3] !== 0 && mask.data[offset + 1] === 0) contentDifferent += 1;
  }

  const diff = new PNG({ width, height });
  pixelmatch(a.data, b.data, diff.data, width, height, { threshold, alpha: 0.3 });
  return {
    pixels: 1 - different / total,
    content: content === 0 ? 1 : 1 - contentDifferent / content,
    diff: PNG.sync.write(diff),
  };
}
