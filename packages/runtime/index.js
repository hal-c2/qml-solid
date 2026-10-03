// What compiled QML needs at run time on the web target. Deliberately tiny:
// names, scopes and bindings are resolved by the compiler, so nothing here
// interprets QML.

// Cell counts become CSS lengths: a cell is 1ch wide and 1lh tall. The compiler
// converts literals itself; these only run for values computed at run time.
const unit = (suffix) => (value) => (typeof value === "number" ? value + suffix : value);
export const $ch = unit("ch");
export const $lh = unit("lh");
export const $px = unit("px");

// A Repeater's model is a list or a count; a count stands for its indices.
export const $model = (value) =>
  typeof value === "number" ? Array.from({ length: value }, (_, index) => index) : (value ?? []);

export const Qt = {
  callLater(fn, ...args) {
    queueMicrotask(() => fn(...args));
  },
};

// Translation is the host's business; until it says otherwise a string is
// its own translation.
export const qsTr = (text) => text;
