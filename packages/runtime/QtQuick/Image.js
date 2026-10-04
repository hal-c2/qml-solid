// Image, BorderImage: a picture, and how it fills the item.
//
// The browser loads and paints it. What QML reads of it is computed here as
// Qt computes it: the size it would have been loaded at, which is the item's
// implicit size, and the rectangle it is painted in.
import { createSignal } from "solid-js";
import { defineType, derived, effect, flush, group, located } from "../object.js";
import { given, lazy, rules, sized } from "./compute.js";
import { Item } from "./Item.js";

rules(`
.qq-image { position: absolute; left: 0; top: 0; box-sizing: border-box; overflow: hidden; background-repeat: no-repeat; }
.qq-image > canvas { position: absolute; left: 0; top: 0; }
`);

const WRITABLE = { ownedWrite: true };
const NULL = 0;
const READY = 1;
const LOADING = 2;
const ERROR = 3;
const NONE = Object.freeze({ width: 0, height: 0 });

// What Qt scales to any size asked for; other pictures it only scales down.
const SCALABLE = /\.svgz?(?:[?#]|$)|^data:image\/svg\+xml/i;

// A picture being loaded: how far it is, and its size once it is there.
export function picture(url) {
  const [status, setStatus] = createSignal(LOADING, WRITABLE);
  const record = { url, status, width: 0, height: 0, scalable: SCALABLE.test(url), frames: null };
  record.settle = (state) => {
    setStatus(state);
    flush();
  };
  return record;
}

function fetched(url) {
  const record = picture(url);
  const element = document.createElement("img");
  element.onload = () => {
    record.width = element.naturalWidth;
    record.height = element.naturalHeight;
    record.settle(READY);
  };
  element.onerror = () => record.settle(ERROR);
  element.src = url;
  return record;
}

// One load for every item that shows the same picture. `load` is how: an
// animation is decoded, a picture is not.
export function shared(known, url, load) {
  let record = known.get(url);
  if (!record) {
    known.set(url, (record = load(url)));
    // Not kept when it failed: the next item to ask tries again.
    const forget = () => known.get(url) === record && record.status() === ERROR && known.delete(url);
    record.settle = ((settle) => (state) => {
      settle(state);
      forget();
    })(record.settle);
  }
  return record;
}

const pictures = new Map();

// The picture once it is there, with its size; before that, no size.
function arrived(self) {
  const record = self.$image.record();
  return record && record.status() === READY ? record : NONE;
}

// The size Qt would load the picture at: its own, or the one `sourceSize`
// asks for, which keeps the picture's shape unless it is a drawing and both
// sides were given.
function loaded(self) {
  const record = arrived(self);
  const { width, height, scalable } = record;
  const wide = given(self, "sourceSize", "width") ? Number(self.sourceSize.width) || 0 : 0;
  const tall = given(self, "sourceSize", "height") ? Number(self.sourceSize.height) || 0 : 0;
  if ((wide <= 0 && tall <= 0) || !width || !height) return record;
  if (scalable && wide > 0 && tall > 0) return { width: wide, height: tall };
  let ratio = 0;
  if (wide > 0 && (scalable || wide < width)) ratio = wide / width;
  if (tall > 0 && (scalable || tall < height) && (ratio === 0 || tall / height < ratio)) ratio = tall / height;
  return ratio > 0 ? { width: Math.round(width * ratio), height: Math.round(height * ratio) } : record;
}

// What Image, BorderImage and AnimatedImage share: a source and its loading.
export const ImageBase = defineType("ImageBase", Item, {
  properties: {
    source: "",
    // The browser loads every picture off the main thread: there is nothing
    // for this one to choose.
    asynchronous: false,
    cache: true,
    mirror: false,
    mirrorVertically: false,
    // Reads as the picture's own size until one is asked for.
    sourceSize: group({
      width: derived((self) => (given(self, "sourceSize", "height") ? 0 : arrived(self).width)),
      height: derived((self) => (given(self, "sourceSize", "width") ? 0 : arrived(self).height)),
    }),
    status: derived((self) => self.$image.record()?.status() ?? NULL),
    progress: derived((self) => (self.status === READY ? 1 : 0)),
    implicitWidth: derived((self) => self.$image.size().width),
    implicitHeight: derived((self) => self.$image.size().height),
  },
  enums: { Null: NULL, Ready: READY, Loading: LOADING, Error: ERROR },
  setup(self) {
    self.$load = fetched;
    self.$pictures = pictures;
    self.$image = {
      record: lazy(self, () => {
        const url = located(String(self.source ?? ""));
        if (!url) return null;
        // `cache: false`: a load of its own, whatever the others have.
        return self.cache ? shared(self.$pictures, url, self.$load) : self.$load(url);
      }),
      size: lazy(self, () => loaded(self)),
    };
  },
});

const FIT = 1;
const CROP = 2;
const TILE = 3;
const TILE_VERTICALLY = 4;
const TILE_HORIZONTALLY = 5;
const PAD = 6;

// The size the picture is painted at, which for the modes that keep its
// shape is not the item's.
function painted(self) {
  const { width, height } = self.$image.size();
  const mode = self.fillMode;
  if (mode === PAD) return { width, height };
  if (mode !== FIT && mode !== CROP) return { width: self.width, height: self.height };
  if (!width || !height) return NONE;
  if (mode === CROP) {
    const scale = Math.max(self.width / width, self.height / height);
    return { width: width * scale, height: height * scale };
  }
  // A side nothing decides is the picture's, not the item's: the item's is
  // computed from this.
  const wide = sized(self, "width") ? self.width : width;
  const tall = sized(self, "height") ? self.height : height;
  return wide / width <= tall / height
    ? { width: wide, height: (wide / width) * height }
    : { width: (tall / height) * width, height: tall };
}

// Where in the room left over something starts: `Image.AlignLeft` and the
// like. Qt places on whole pixels.
function along(alignment, room, centre, far) {
  return alignment === centre ? Math.trunc(room / 2) : alignment === far ? Math.ceil(room) : 0;
}

// Where the picture goes: the part of the item it is painted in (`box`),
// and in that the rectangle one copy of it takes (`inner`).
export function geometry(self) {
  const pix = self.$image.size();
  const width = self.width;
  const height = self.height;
  const mode = self.fillMode;
  const shown = self.$image.painted();
  const wide = mode === FIT ? shown.width : pix.width;
  const tall = mode === FIT ? shown.height : pix.height;
  const x = along(self.horizontalAlignment, width - wide, 4, 2);
  const y = along(self.verticalAlignment, height - tall, 128, 64);
  switch (mode) {
    case FIT:
      return { box: [x, y, wide, tall], inner: [0, 0, wide, tall], repeat: "no-repeat" };
    case CROP:
      return {
        box: [0, 0, width, height],
        inner: [
          along(self.horizontalAlignment, width - shown.width, 4, 2),
          along(self.verticalAlignment, height - shown.height, 128, 64),
          shown.width,
          shown.height,
        ],
        repeat: "no-repeat",
      };
    case TILE:
      return { box: [0, 0, width, height], inner: [x, y, wide, tall], repeat: "repeat" };
    case TILE_VERTICALLY:
      return { box: [0, 0, width, height], inner: [0, y, width, tall], repeat: "repeat-y" };
    case TILE_HORIZONTALLY:
      return { box: [0, 0, width, height], inner: [x, 0, wide, height], repeat: "repeat-x" };
    case PAD:
      return {
        box: [Math.max(x, 0), Math.max(y, 0), Math.min(wide, width), Math.min(tall, height)],
        inner: [Math.min(x, 0), Math.min(y, 0), wide, tall],
        repeat: "no-repeat",
      };
    default:
      return { box: [0, 0, width, height], inner: [0, 0, width, height], repeat: "no-repeat" };
  }
}

const address = (url) => `url(${JSON.stringify(url)})`;
// A mirrored picture is turned over where it is.
const flipped = (self) =>
  self.mirror || self.mirrorVertically ? `scale(${self.mirror ? -1 : 1}, ${self.mirrorVertically ? -1 : 1})` : "";
const rendering = (self) => (self.smooth ? "" : "pixelated");

function face(self) {
  const element = document.createElement("div");
  element.className = "qq-image";
  self.$node.append(element);
  return (self.$face = element);
}

export const Image = defineType("Image", ImageBase, {
  properties: {
    fillMode: 0,
    horizontalAlignment: 4,
    verticalAlignment: 128,
    paintedWidth: derived((self) => self.$image.painted().width),
    paintedHeight: derived((self) => self.$image.painted().height),
    // With `Image.PreserveAspectFit` and one side given, the other follows
    // from the picture's shape.
    implicitWidth: derived((self) =>
      self.fillMode === FIT && sized(self, "height") && !sized(self, "width")
        ? self.$image.painted().width
        : self.$image.size().width,
    ),
    implicitHeight: derived((self) =>
      self.fillMode === FIT && sized(self, "width") && !sized(self, "height")
        ? self.$image.painted().height
        : self.$image.size().height,
    ),
  },
  enums: {
    Stretch: 0,
    PreserveAspectFit: FIT,
    PreserveAspectCrop: CROP,
    Tile: TILE,
    TileVertically: TILE_VERTICALLY,
    TileHorizontally: TILE_HORIZONTALLY,
    Pad: PAD,
    AlignLeft: 1,
    AlignRight: 2,
    AlignHCenter: 4,
    AlignTop: 32,
    AlignBottom: 64,
    AlignVCenter: 128,
  },
  setup(self) {
    const style = face(self).style;
    self.$image.painted = lazy(self, () => painted(self));
    effect(
      () => {
        const record = self.$image.record();
        if (!record || record.status() !== READY) return null;
        // An animation paints its frames itself, in the same place.
        return { ...geometry(self), url: record.frames ? "" : record.url, flip: flipped(self), rendering: rendering(self) };
      },
      (next) => {
        style.display = next ? "" : "none";
        if (!next) return void (style.backgroundImage = "");
        const [left, top, width, height] = next.box;
        const [x, y, wide, tall] = next.inner;
        style.left = `${left}px`;
        style.top = `${top}px`;
        style.width = `${width}px`;
        style.height = `${height}px`;
        style.backgroundImage = next.url ? address(next.url) : "";
        style.backgroundSize = `${wide}px ${tall}px`;
        style.backgroundPosition = `${x}px ${y}px`;
        style.backgroundRepeat = next.repeat;
        style.transform = next.flip;
        style.imageRendering = next.rendering;
      },
    );
  },
});

const REPEATS = ["stretch", "repeat", "round"];

// BorderImage: a picture cut in nine, the corners kept as they are and the
// rest stretched or repeated. CSS has the same thing.
export const BorderImage = defineType("BorderImage", ImageBase, {
  properties: {
    border: group({ left: 0, top: 0, right: 0, bottom: 0 }),
    horizontalTileMode: 0,
    verticalTileMode: 0,
  },
  enums: { Stretch: 0, Repeat: 1, Round: 2 },
  setup(self) {
    const style = face(self).style;
    style.borderStyle = "solid";
    style.borderColor = "transparent";
    effect(
      () => {
        const record = self.$image.record();
        if (!record || record.status() !== READY) return null;
        const { left, top, right, bottom } = self.border;
        return {
          url: record.url,
          width: self.width,
          height: self.height,
          edges: [top, right, bottom, left].map((edge) => Math.max(Number(edge) || 0, 0)),
          repeat: `${REPEATS[self.horizontalTileMode] ?? "stretch"} ${REPEATS[self.verticalTileMode] ?? "stretch"}`,
          flip: flipped(self),
          rendering: rendering(self),
        };
      },
      (next) => {
        style.display = next ? "" : "none";
        if (!next) return void (style.borderImageSource = "");
        style.width = `${next.width}px`;
        style.height = `${next.height}px`;
        style.borderWidth = next.edges.map((edge) => `${edge}px`).join(" ");
        style.borderImageSource = address(next.url);
        style.borderImageSlice = `${next.edges.join(" ")} fill`;
        style.borderImageRepeat = next.repeat;
        style.transform = next.flip;
        style.imageRendering = next.rendering;
      },
    );
  },
});
