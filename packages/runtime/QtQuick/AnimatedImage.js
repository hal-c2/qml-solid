// AnimatedImage: a picture with several frames, shown one after the other.
//
// The browser plays an animated picture by itself and tells nobody which
// frame it is on, so the frames are decoded here and painted on a canvas,
// where the fill mode puts the picture.
import { flush, onCleanup } from "solid-js";
import { defineType, derived, effect, slot } from "../object.js";
import { geometry, Image, picture } from "./Image.js";

const READY = 1;
const ERROR = 3;

// What is playing, and the one clock that moves it all. A test holds the
// clock and moves it itself.
const playing = new Set();
let request = 0;
let last = 0;
let held = false;

function step(elapsed) {
  let moved = false;
  for (const film of playing) moved = film(elapsed) || moved;
  if (moved) flush();
}

function tick(now) {
  request = 0;
  step(now - last);
  last = now;
  schedule();
}

function schedule() {
  if (held || request || playing.size === 0) return;
  request = requestAnimationFrame(tick);
}

export const frames = {
  hold() {
    held = true;
    cancelAnimationFrame(request);
    request = 0;
  },
  release() {
    held = false;
    last = performance.now();
    schedule();
  },
  advance(milliseconds) {
    step(milliseconds);
  },
};

// Every frame, as Qt keeps them: a frame is shown the moment it is due.
async function decoded(response) {
  const type = (response.headers.get("content-type") ?? "").split(";")[0];
  if (!response.ok || !(await ImageDecoder.isTypeSupported(type))) throw new Error(type);
  const decoder = new ImageDecoder({ data: await response.arrayBuffer(), type });
  await decoder.tracks.ready;
  const count = decoder.tracks.selectedTrack.frameCount;
  const all = [];
  for (let index = 0; index < count; index++) {
    const { image } = await decoder.decode({ frameIndex: index });
    // A frame that says no time is given a tenth of a second, as browsers do.
    all.push({ bitmap: await createImageBitmap(image), duration: image.duration > 0 ? image.duration / 1000 : 100 });
    image.close();
  }
  decoder.close();
  return all;
}

function film(url) {
  const record = picture(url);
  fetch(url)
    .then(decoded)
    .then(
      (all) => {
        record.frames = all;
        record.width = all[0]?.bitmap.width ?? 0;
        record.height = all[0]?.bitmap.height ?? 0;
        record.settle(all.length ? READY : ERROR);
      },
      () => record.settle(ERROR),
    );
  return record;
}

const films = new Map();

const reel = (self) => {
  const record = self.$image.record();
  return record && record.status() === READY ? record.frames : null;
};

export const AnimatedImage = defineType("AnimatedImage", Image, {
  properties: {
    playing: true,
    paused: false,
    speed: 1,
    currentFrame: 0,
    frameCount: derived((self) => reel(self)?.length ?? 0),
  },
  setup(self) {
    // Without a decoder the picture is an Image's, which the browser
    // animates as it likes: there are no frames to count or to stop on.
    if (typeof ImageDecoder === "undefined") return;
    self.$load = film;
    self.$pictures = films;
    const canvas = document.createElement("canvas");
    self.$face.append(canvas);
    const context = canvas.getContext("2d");
    // How long the frame shown has been shown.
    let shown = 0;
    const play = (elapsed) => {
      const all = reel(self);
      if (!all) return false;
      let index = Math.min(Math.max(Math.trunc(self.currentFrame) || 0, 0), all.length - 1);
      shown += elapsed * self.speed;
      const before = index;
      while (shown >= all[index].duration) {
        shown -= all[index].duration;
        index = (index + 1) % all.length;
      }
      return index !== before && slot(self, "currentFrame").write(index);
    };
    onCleanup(() => {
      playing.delete(play);
      for (const each of self.cache ? [] : (reel(self) ?? [])) each.bitmap.close();
    });
    effect(
      () => Boolean(self.playing && !self.paused && self.speed > 0 && (reel(self)?.length ?? 0) > 1),
      (runs) => {
        if (!runs) return void playing.delete(play);
        if (playing.size === 0) last = performance.now();
        playing.add(play);
        schedule();
      },
    );
    // Stopped, it stays on its frame; played again, it starts over. Paused,
    // it goes on from where it was.
    let played;
    effect(
      () => Boolean(self.playing),
      (plays) => {
        if (plays && played === false) {
          shown = 0;
          slot(self, "currentFrame").write(0);
        }
        played = plays;
      },
    );
    effect(
      () => {
        const all = reel(self);
        if (!all) return null;
        const index = Math.min(Math.max(Math.trunc(self.currentFrame) || 0, 0), all.length - 1);
        return { bitmap: all[index].bitmap, inner: geometry(self).inner };
      },
      (next) => {
        canvas.style.display = next ? "" : "none";
        if (!next) return;
        const { bitmap, inner } = next;
        if (canvas.width !== bitmap.width) canvas.width = bitmap.width;
        if (canvas.height !== bitmap.height) canvas.height = bitmap.height;
        context.clearRect(0, 0, bitmap.width, bitmap.height);
        context.drawImage(bitmap, 0, 0);
        canvas.style.left = `${inner[0]}px`;
        canvas.style.top = `${inner[1]}px`;
        canvas.style.width = `${inner[2]}px`;
        canvas.style.height = `${inner[3]}px`;
      },
    );
  },
});
