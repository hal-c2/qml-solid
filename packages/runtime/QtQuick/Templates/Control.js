// Control: what every control of Qt Quick Controls is. An item with a
// `background` behind it and a `contentItem` inside its padding, which a
// style gives it in QML, and the font and colours it inherits.
//
// The control says how big its two items are, and they say how big it would
// like to be (`implicitContentWidth`, `implicitBackgroundWidth`): a style
// computes `implicitWidth` from those.
import { untrack } from "solid-js";
import { defineType, derived, effect, slot } from "../../object.js";
import { locale } from "../../QtQml/locale.js";
import { styleHints } from "../../QtQml/application.js";
import { sized } from "../compute.js";
import { Item } from "../Item.js";
import { font } from "./font.js";
import { palette } from "./theme.js";

// Makes the items a control is given its children: `background`, `label`,
// `header`. `read` is run with what is tracked and returns them; one that
// is replaced is the control's no longer.
export function keeps(self, read) {
  let before = [];
  effect(read, (items) => {
    for (const item of before) if (item && !items.includes(item)) self.$keep(item, false);
    for (const item of items) if (item && !before.includes(item)) self.$keep(item, true);
    before = items;
  });
}

// A background is as big as what it is behind, less the insets, unless it
// says how big it is or where it is itself. Qt leaves one that does alone
// until the control is given an inset. What it said is asked once: what is
// given here would count as said.
function behind(self, item) {
  if (!item) return null;
  item.$own ??= untrack(() => ({
    across: !sized(item, "width") && item.x === 0,
    down: !sized(item, "height") && item.y === 0,
    z: slot(item, "z").explicit(),
  }));
  const inset = (name) => slot(self, name).explicit();
  return [
    item,
    item.$own.across || inset("leftInset") || inset("rightInset"),
    item.$own.down || inset("topInset") || inset("bottomInset"),
    self.leftInset,
    self.topInset,
    self.width - self.leftInset - self.rightInset,
    self.height - self.topInset - self.bottomInset,
  ];
}

function spread(box) {
  if (!box) return;
  const [item, across, down, x, y, width, height] = box;
  if (!item.$own.z) slot(item, "z").provide(-1);
  if (across) {
    slot(item, "x").provide(x);
    slot(item, "width").provide(width);
  }
  if (down) {
    slot(item, "y").provide(y);
    slot(item, "height").provide(height);
  }
}

// What a type with a `background` does about it: Control, and Label, which
// is no control.
export function backed(self) {
  keeps(self, () => [self.background]);
  effect(() => behind(self, self.background), spread);
}

// Where what is inside the padding is put.
export function fitted(item, x, y, width, height) {
  slot(item, "x").place(x);
  slot(item, "y").place(y);
  slot(item, "width").place(width);
  slot(item, "height").place(height);
}

// What a control, a label and an application's window have in common.
export const methods = {
  // A style's colours are what the palette answers with.
  $colours: palette,
  // The font is that of what is inside, where that has none of its own.
  $fonted: true,
  // An item made by a binding of this object is its child already; one
  // made elsewhere becomes it. A window's are its content item's.
  $keep(item, keep) {
    const into = this.$contentItem ?? this;
    if (!keep) return into.$remove(item);
    if (item.$parent !== into) slot(item, "parent").write(into);
    into.$add(item);
  },
};

export const insets = { topInset: 0, leftInset: 0, rightInset: 0, bottomInset: 0 };

export const Control = defineType("Control", Item, {
  properties: {
    font,
    padding: 0,
    horizontalPadding: derived((self) => self.padding),
    verticalPadding: derived((self) => self.padding),
    topPadding: derived((self) => self.verticalPadding),
    leftPadding: derived((self) => self.horizontalPadding),
    rightPadding: derived((self) => self.horizontalPadding),
    bottomPadding: derived((self) => self.verticalPadding),
    ...insets,
    spacing: 0,
    availableWidth: derived((self) => Math.max(0, self.width - self.leftPadding - self.rightPadding)),
    availableHeight: derived((self) => Math.max(0, self.height - self.topPadding - self.bottomPadding)),
    locale: derived(() => locale()),
    mirrored: false,
    focusPolicy: 0,
    focusReason: 7,
    visualFocus: false,
    hovered: false,
    hoverEnabled: derived(() => styleHints().useHoverEffects),
    wheelEnabled: false,
    background: null,
    contentItem: null,
    implicitContentWidth: derived((self) => self.contentItem?.implicitWidth ?? 0),
    implicitContentHeight: derived((self) => self.contentItem?.implicitHeight ?? 0),
    implicitBackgroundWidth: derived((self) => self.background?.implicitWidth ?? 0),
    implicitBackgroundHeight: derived((self) => self.background?.implicitHeight ?? 0),
    baselineOffset: derived((self) => self.topPadding + (self.contentItem?.baselineOffset ?? 0)),
  },
  methods,
  setup(self) {
    backed(self);
    keeps(self, () => [self.contentItem]);
    effect(
      () => [self.contentItem, ...self.$inside()],
      ([item, x, y, width, height]) => {
        if (item) fitted(item, x, y, width, height);
      },
    );
  },
});

// Where the content item goes: inside the padding. A page puts a header
// over it and a footer under it.
Control.proto.$inside = function () {
  return [this.leftPadding, this.topPadding, this.availableWidth, this.availableHeight];
};
