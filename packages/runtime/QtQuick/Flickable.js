// Flickable: a window onto content bigger than itself.
//
// The moving is the browser's: the content item sits in an element that
// scrolls, so touch, wheel, momentum and overscroll are native and nothing
// here runs per frame but the scroll event. `contentX` and `contentY` are
// what that element is scrolled to, measured as Qt measures them: from the
// content's origin, which margins and a view's header put before zero.
import { onCleanup, runWithOwner, untrack } from "solid-js";
import { contents, defineType, derived, effect, inside, QtObject, slot } from "../object.js";
import { Item } from "./Item.js";
import { settle } from "./settle.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
qq-flick { position: absolute; inset: 0; display: block; overflow: hidden; scrollbar-width: none; }
qq-flick::-webkit-scrollbar { display: none; }
.qq-extent { position: absolute; left: 0; top: 0; overflow: clip; }
qq-flick.qq-snap > .qq-extent > .qq > .qq { scroll-snap-align: start; }
qq-flick.qq-snap-one > .qq-extent > .qq > .qq { scroll-snap-stop: always; }
`);
document.adoptedStyleSheets.push(sheet);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const INSTANT = { left: 0, top: 0, behavior: "instant" };
const SMOOTH = { left: 0, top: 0, behavior: "smooth" };

// Puts the element where the properties say, when it may have forgotten: an
// element scrolls only while it is in the page and shown.
function restore(self) {
  if (!self.$left && !self.$top) return;
  self.$set = true;
  INSTANT.left = self.$left;
  INSTANT.top = self.$top;
  self.$viewport.scrollTo(INSTANT);
}

// The element that scrolls. It is told when it is put in the page: until
// then it could not be scrolled to where the Flickable starts.
class Viewport extends HTMLElement {
  connectedCallback() {
    if (this.$flickable) restore(this.$flickable);
  }
}
if (!customElements.get("qq-flick")) customElements.define("qq-flick", Viewport);

// A Flickable shown again after being hidden.
const shown = new ResizeObserver((entries) => {
  for (const { target } of entries) {
    const self = target.$flickable;
    if (self.$set && (target.scrollLeft !== self.$left || target.scrollTop !== self.$top)) restore(self);
  }
});

// What the element is told: how much there is to scroll over, and where to.
function show(self, [minX, minY, extentWidth, extentHeight, contentX, contentY, width, height]) {
  const resized = extentWidth !== self.$extentWidth || extentHeight !== self.$extentHeight;
  if (resized) {
    self.$extentWidth = extentWidth;
    self.$extentHeight = extentHeight;
    self.$extent.style.width = `${extentWidth}px`;
    self.$extent.style.height = `${extentHeight}px`;
  }
  self.$minXShown = minX;
  self.$minYShown = minY;
  // An element scrolls no further than there is content. A position beyond
  // that is still the content's, as in Qt: it shows what is there, nothing.
  const left = clamp(contentX - minX, 0, extentWidth - width);
  const top = clamp(contentY - minY, 0, extentHeight - height);
  // The content item is at minus the content position; scrolling is what
  // moves it there, so the element takes that much back.
  self.$contentItem.$node.style.translate = `${left}px ${top}px`;
  if (left === self.$left && top === self.$top && !(resized && self.$set)) return;
  self.$left = left;
  self.$top = top;
  self.$set = true;
  INSTANT.left = left;
  INSTANT.top = top;
  self.$viewport.scrollTo(INSTANT);
}

const SCROLLEND = "onscrollend" in window;
// Without `scrollend`, a movement is over when no scroll has come for a
// while. One timer watches every Flickable that is moving.
const watched = new Set();
let timer = 0;

function poll() {
  const now = performance.now();
  for (const self of watched) if (now - self.$scrolledAt >= 150) stopped(self);
  if (!watched.size) timer = clearInterval(timer);
}

function write(self, name, value) {
  return slot(self, name).write(value);
}

// The browser has scrolled the element: by the user, or to where it was
// told to go.
function scrolled(event) {
  const viewport = event.currentTarget;
  const self = viewport.$flickable;
  const left = viewport.scrollLeft;
  const top = viewport.scrollTop;
  const set = self.$set;
  self.$set = false;
  const dx = left - self.$left;
  const dy = top - self.$top;
  // Where it was told to go, give or take the rounding of a device pixel.
  if (set ? Math.abs(dx) < 1 && Math.abs(dy) < 1 : !dx && !dy) return;
  self.$left = left;
  self.$top = top;
  if (dx) write(self, "contentX", left + self.$minXShown);
  if (dy) write(self, "contentY", top + self.$minYShown);
  const started = !self.$moving;
  self.$moving = true;
  if (dx) write(self, "movingHorizontally", true);
  if (dy) write(self, "movingVertically", true);
  const dragged = self.$touching && !self.$dragging;
  if (self.$touching) {
    self.$dragging = true;
    if (dx) write(self, "draggingHorizontally", true);
    if (dy) write(self, "draggingVertically", true);
  } else if (self.$flicking) {
    if (dx) write(self, "flickingHorizontally", true);
    if (dy) write(self, "flickingVertically", true);
  }
  settle();
  if (started) self.movementStarted();
  if (dragged) self.dragStarted();
  self.$scrolledAt = performance.now();
  if (!SCROLLEND) watch(self);
}

function watch(self) {
  watched.add(self);
  timer ||= setInterval(poll, 100);
}

// The browser says a scroll is over. It says so of the one that put the
// content where `flick()` threw it from, too: that movement has only begun.
function ended(event) {
  const viewport = event.currentTarget;
  const self = viewport.$flickable;
  const to = self.$thrown;
  if (to && (Math.abs(viewport.scrollLeft - to.left) >= 1 || Math.abs(viewport.scrollTop - to.top) >= 1)) {
    self.$scrolledAt = performance.now();
    return watch(self);
  }
  stopped(self);
}

function released(self) {
  if (!self.$dragging) return;
  self.$dragging = false;
  write(self, "draggingHorizontally", false);
  write(self, "draggingVertically", false);
  settle();
  self.dragEnded();
}

function stopped(self) {
  if (self.$touching || !self.$moving) return;
  self.$thrown = null;
  watched.delete(self);
  const flicked = self.$flicking;
  self.$moving = self.$flicking = false;
  for (const name of ["movingHorizontally", "movingVertically", "flickingHorizontally", "flickingVertically"]) {
    write(self, name, false);
  }
  settle();
  if (flicked) self.flickEnded();
  self.movementEnded();
}

function touched(event) {
  event.currentTarget.$flickable.$touching = true;
}

// A finger lifted from content that goes on moving has flicked it.
function lifted(event) {
  const self = event.currentTarget.$flickable;
  if (event.touches.length) return;
  self.$touching = false;
  const dragged = self.$dragging;
  released(self);
  if (!dragged || !self.$moving) return;
  self.$flicking = true;
  self.flickStarted();
}

// A wheel that only turns one way moves content that only goes the other.
function wheeled(event) {
  const viewport = event.currentTarget;
  if (event.deltaX || !event.deltaY || event.ctrlKey) return;
  if (viewport.scrollHeight > viewport.clientHeight || viewport.scrollWidth <= viewport.clientWidth) return;
  if (getComputedStyle(viewport).overflowX !== "hidden") viewport.scrollLeft += event.deltaY;
}

const PASSIVE = { passive: true };

const ratio = (part, whole) => (whole > 0 ? part / whole : 0);

// `visibleArea`: what a scroll bar shows, as fractions of the content.
const VisibleArea = defineType("VisibleArea", QtObject, {
  properties: {
    xPosition: derived(({ $of }) => ratio($of.contentX - $of.$minX(), $of.$maxX() - $of.$minX() + $of.width)),
    yPosition: derived(({ $of }) => ratio($of.contentY - $of.$minY(), $of.$maxY() - $of.$minY() + $of.height)),
    widthRatio: derived(({ $of }) => ratio($of.width, $of.$maxX() - $of.$minX() + $of.width)),
    heightRatio: derived(({ $of }) => ratio($of.height, $of.$maxY() - $of.$minY() + $of.height)),
  },
  setup(self, props) {
    self.$of = props.$of;
  },
});

const HorizontalFlick = 1;
const VerticalFlick = 2;
const StopAtBounds = 0;

// How far content thrown at `velocity` goes before it stops: Qt decelerates
// it evenly. A positive velocity is a finger moving down: the content
// position goes back.
function thrown(self, velocity) {
  const limit = self.maximumFlickVelocity;
  if (limit >= 0) velocity = clamp(velocity, -limit, limit);
  return (-Math.sign(velocity) * velocity * velocity) / (2 * (self.flickDeceleration || 1500));
}

export const Flickable = defineType("Flickable", Item, {
  properties: {
    // Less than nothing: as wide, as high as the Flickable.
    contentWidth: -1,
    contentHeight: -1,
    contentX: derived((self) => self.$minX()),
    contentY: derived((self) => self.$minY()),
    originX: 0,
    originY: 0,
    leftMargin: 0,
    rightMargin: 0,
    topMargin: 0,
    bottomMargin: 0,
    flickableDirection: 0,
    interactive: true,
    boundsBehavior: 3,
    flickDeceleration: 1500,
    maximumFlickVelocity: 2500,
    atXBeginning: derived((self) => self.contentX <= self.$minX()),
    atXEnd: derived((self) => self.contentX >= self.$maxX() - 0.5),
    atYBeginning: derived((self) => self.contentY <= self.$minY()),
    atYEnd: derived((self) => self.contentY >= self.$maxY() - 0.5),
    movingHorizontally: false,
    movingVertically: false,
    moving: derived((self) => self.movingHorizontally || self.movingVertically),
    flickingHorizontally: false,
    flickingVertically: false,
    flicking: derived((self) => self.flickingHorizontally || self.flickingVertically),
    draggingHorizontally: false,
    draggingVertically: false,
    dragging: derived((self) => self.draggingHorizontally || self.draggingVertically),
  },
  signals: ["movementStarted", "movementEnded", "flickStarted", "flickEnded", "dragStarted", "dragEnded"],
  enums: {
    AutoFlickDirection: 0,
    HorizontalFlick,
    VerticalFlick,
    HorizontalAndVerticalFlick: 3,
    AutoFlickIfNeeded: 12,
    StopAtBounds,
    DragOverBounds: 1,
    OvershootBounds: 2,
    DragAndOvershootBounds: 3,
  },
  methods: {
    get contentItem() {
      return this.$contentItem;
    },
    get visibleArea() {
      return (this.$visibleArea ??= runWithOwner(this.$owner, () => untrack(() => VisibleArea({ $of: this }))));
    },
    // The content item comes first, then what was added to the Flickable
    // itself, which does not move.
    get children() {
      return [this.$contentItem, ...Object.getOwnPropertyDescriptor(Item.proto, "children").get.call(this)];
    },
    // The positions the content can be at: from the origin less the margin
    // before it to where its end, and the margin after, meet the far edge.
    $minX() {
      return this.originX - this.leftMargin;
    },
    $maxX() {
      const width = this.contentWidth;
      const end = this.originX + (width < 0 ? this.width : width) + this.rightMargin - this.width;
      return Math.max(end, this.$minX());
    },
    $minY() {
      return this.originY - this.topMargin;
    },
    $maxY() {
      const height = this.contentHeight;
      const end = this.originY + (height < 0 ? this.height : height) + this.bottomMargin - this.height;
      return Math.max(end, this.$minY());
    },
    flick(xVelocity, yVelocity) {
      untrack(() => {
        const x = clamp(this.contentX + thrown(this, xVelocity), this.$minX(), this.$maxX());
        const y = clamp(this.contentY + thrown(this, yVelocity), this.$minY(), this.$maxY());
        const dx = x - this.contentX;
        const dy = y - this.contentY;
        if (!dx && !dy) return;
        // An element that is not shown cannot be seen moving.
        if (!this.$viewport.clientWidth && !this.$viewport.clientHeight) {
          write(this, "contentX", x);
          write(this, "contentY", y);
          return settle();
        }
        const started = !this.$moving;
        this.$moving = this.$flicking = true;
        if (dx) {
          write(this, "movingHorizontally", true);
          write(this, "flickingHorizontally", true);
        }
        if (dy) {
          write(this, "movingVertically", true);
          write(this, "flickingVertically", true);
        }
        settle();
        if (started) this.movementStarted();
        this.flickStarted();
        this.$thrown = { left: x - this.$minXShown, top: y - this.$minYShown };
        SMOOTH.left = this.$thrown.left;
        SMOOTH.top = this.$thrown.top;
        this.$viewport.scrollTo(SMOOTH);
      });
    },
    cancelFlick() {
      const viewport = this.$viewport;
      INSTANT.left = viewport.scrollLeft;
      INSTANT.top = viewport.scrollTop;
      viewport.scrollTo(INSTANT);
      stopped(this);
    },
    returnToBounds() {
      untrack(() => {
        write(this, "contentX", clamp(this.contentX, this.$minX(), this.$maxX()));
        write(this, "contentY", clamp(this.contentY, this.$minY(), this.$maxY()));
      });
      settle();
    },
    // A new size for the content, with `center` (a point of it) staying
    // where it is in the Flickable.
    resizeContent(width, height, center) {
      untrack(() => {
        const was = this.$contentItem;
        const x = this.contentX + (was.width > 0 ? (center.x * width) / was.width - center.x : 0);
        const y = this.contentY + (was.height > 0 ? (center.y * height) / was.height - center.y : 0);
        write(this, "contentWidth", width);
        write(this, "contentHeight", height);
        write(this, "contentX", x);
        write(this, "contentY", y);
      });
      settle();
    },
  },
  setup(self) {
    const viewport = document.createElement("qq-flick");
    const extent = document.createElement("div");
    extent.className = "qq-extent";
    viewport.$flickable = self;
    self.$viewport = viewport;
    self.$extent = extent;
    self.$left = self.$top = 0;
    self.$minXShown = self.$minYShown = 0;
    self.$contentItem = inside(self, () =>
      untrack(() =>
        Item({
          get x() {
            return 0 - self.contentX;
          },
          get y() {
            return 0 - self.contentY;
          },
          get width() {
            const width = self.contentWidth;
            return width < 0 ? self.width : width;
          },
          get height() {
            const height = self.contentHeight;
            return height < 0 ? self.height : height;
          },
        }),
      ),
    );
    extent.append(self.$contentItem.$node);
    viewport.append(extent);
    self.$node.append(viewport);
    viewport.addEventListener("scroll", scrolled, PASSIVE);
    viewport.addEventListener("scrollend", ended, PASSIVE);
    viewport.addEventListener("wheel", wheeled, PASSIVE);
    viewport.addEventListener("touchstart", touched, PASSIVE);
    viewport.addEventListener("touchend", lifted, PASSIVE);
    viewport.addEventListener("touchcancel", lifted, PASSIVE);
    shown.observe(viewport);
    onCleanup(() => {
      shown.unobserve(viewport);
      watched.delete(self);
    });
    effect(
      () => {
        const minX = self.$minX();
        const minY = self.$minY();
        return [
          minX,
          minY,
          self.$maxX() - minX + self.width,
          self.$maxY() - minY + self.height,
          self.contentX,
          self.contentY,
          self.width,
          self.height,
        ];
      },
      (state) => show(self, state),
    );
    effect(
      () => [self.interactive, self.flickableDirection, self.boundsBehavior],
      ([interactive, direction, bounds]) => {
        const style = viewport.style;
        // Along a direction it may be flicked in, the element scrolls as far
        // as there is content, which may be no way at all.
        const x = interactive && direction !== VerticalFlick ? "auto" : "hidden";
        const y = interactive && direction !== HorizontalFlick ? "auto" : "hidden";
        const changed = viewport.isConnected && (x !== style.overflowX || y !== style.overflowY);
        style.overflowX = x;
        style.overflowY = y;
        style.overscrollBehavior = bounds === StopAtBounds ? "none" : "contain";
        if (!changed) return;
        // Chromium goes on scrolling, with a wheel, an element that was
        // scrollable when it was last laid out: lay it out again.
        style.display = "none";
        void viewport.offsetHeight;
        style.display = "";
        restore(self);
      },
    );
  },
  // What is declared in a Flickable is in its content.
  adopt(self, props) {
    const content = self.$contentItem;
    for (const child of contents(props, content)) content.$add(child);
  },
});
