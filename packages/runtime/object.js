// The QML object model, on Solid's signals.
//
// A QML object is a plain JavaScript object whose properties are accessors.
// Behind each is a slot: what the object was assigned, else what its creator
// bound (the Solid prop of the same name), else the type's default. Reading
// one tracks it like any signal, so a binding that reads `other.width` is
// re-evaluated when that width changes, whatever made it change.
//
// A type is a Solid component: called with props, it returns the object. The
// compiler emits `<Rectangle color="red"/>`, Solid turns that into
// `createComponent(Rectangle, { color: "red" })`, and nothing here interprets
// QML: names and scopes were settled when the file was compiled.
import {
  createEffect,
  createMemo,
  createRenderEffect,
  createRoot,
  createSignal,
  flush,
  getOwner,
  onCleanup,
  runWithOwner,
  untrack,
} from "solid-js";

// Solid refuses a write from a component's body or a computation; an object
// is assigned to from wherever its QML says.
const WRITABLE = { ownedWrite: true };
// A binding gives a value, never a promise of one.
const SYNC = { sync: true };

const hidden = (object, key, value) =>
  Object.defineProperty(object, key, { value, writable: true, configurable: true });

// What an object is before its type has run: every property reads as
// undefined, and whoever read it is told when the object exists. Ids are
// declared before anything is created, so a binding may meet one early.
const pending = new Proxy(Object.create(null), {
  get(_, key, self) {
    if (typeof key === "string" && key[0] !== "$") self.$track();
    return undefined;
  },
  has: () => false,
});

// The object an `id` names, made before the type that fills it in runs.
export function $object() {
  const self = Object.create(pending);
  const [track, touch] = createSignal(0, WRITABLE);
  hidden(self, "$track", track);
  hidden(self, "$touch", touch);
  return self;
}

// A property whose default is computed from the object: `width` is
// `implicitWidth` until something says otherwise.
const DERIVED = Symbol("derived");
export const derived = (compute) => ({ [DERIVED]: compute });

// `anchors`, `font`, `border`: properties under one name. `anchors.fill` is
// bound as the prop `anchors$fill`.
const GROUP = Symbol("group");
export const group = (properties) => ({ [GROUP]: properties });

const next = (version) => version + 1;

class Slot {
  constructor(self, key, initial, resolve, whole, member) {
    this.self = self;
    this.initial = initial;
    this.resolve = resolve;
    // For a property of a group, the group and its name in it: `font` and
    // `bold` for `font.bold`, which `font: other.font` gives too.
    this.whole = whole;
    this.member = member;
    const props = self.$props;
    const descriptor = Object.getOwnPropertyDescriptor(props, key);
    // A binding: evaluated when first read and again when what it read
    // changes, however many readers there are.
    this.bound = descriptor?.get
      ? runWithOwner(self.$owner, () => createMemo(() => props[key], SYNC))
      : null;
    this.given = descriptor && !descriptor.get ? descriptor.value : undefined;
    this.assigned = false;
    this.value = undefined;
    // Set by whatever lays the object out: a positioner, a layout, a view.
    this.placed = undefined;
    // Set by a Behavior: what is shown while the value it follows moves.
    this.shown = null;
    // Most properties are never written, so a slot has no signal of its own
    // until it is: before that its readers share the object's.
    this.version = null;
    this.bump = null;
    this.given$ = resolve ? () => this.own() : null;
  }

  get() {
    if (this.version) this.version();
    else this.self.$track();
    return this.shown ? this.shown() : this.target();
  }

  // The value the property has, whatever is animating towards it.
  target() {
    return this.resolve ? this.resolve(this.self, this.given$) : this.own();
  }

  own() {
    if (this.placed !== undefined) return this.placed;
    if (this.assigned) return this.value;
    let value = this.bound ? this.bound() : this.given;
    if (value === undefined && this.whole) value = slot(this.self, this.whole).get()?.[this.member];
    if (value === undefined) {
      const initial = this.initial;
      value = initial?.[DERIVED] ? initial[DERIVED](this.self) : initial;
    }
    return value;
  }

  // Whether something gave the property a value: a border is drawn only
  // when its width or colour was set.
  explicit() {
    if (this.version) this.version();
    else this.self.$track();
    return this.assigned || (this.bound ? this.bound() : this.given) !== undefined;
  }

  changed() {
    if (this.version) return this.bump(next);
    [this.version, this.bump] = createSignal(0, WRITABLE);
    this.self.$touch(next);
  }

  // An assignment: it replaces the binding, as in QML, and what depends on
  // the property is up to date when it returns.
  set(value) {
    if (this.write(value)) flush();
  }

  // The same without settling what depends on it: for a type's own writes,
  // which an animation makes every frame.
  write(value) {
    if (this.assigned && Object.is(this.value, value)) return false;
    this.assigned = true;
    this.value = value;
    this.changed();
    return true;
  }

  // What a parent or a view gives the object: a default, not an assignment.
  provide(value) {
    if (Object.is(this.given, value)) return;
    this.given = value;
    this.changed();
  }

  place(value) {
    if (Object.is(this.placed, value)) return;
    this.placed = value;
    this.changed();
  }

  // Back to the binding, or to the default.
  reset() {
    if (!this.assigned) return;
    this.assigned = false;
    this.value = undefined;
    this.changed();
  }
}

// The slot of a property (`slot(item, "x")`, `slot(item, "anchors$fill")`):
// for types that animate, place or provide it.
export function slot(self, key) {
  return self.$slots[key] ?? self.$type.slots[key]?.(self);
}

function defineProperty(Type, proto, name, initial) {
  const resolve = Type.spec.resolve?.[name];
  const make = (self) => (self.$slots[name] = new Slot(self, name, initial, resolve));
  Type.slots[name] = make;
  Object.defineProperty(proto, name, {
    get() {
      return (this.$slots[name] ?? make(this)).get();
    },
    set(value) {
      (this.$slots[name] ?? make(this)).set(value);
    },
    enumerable: true,
    configurable: true,
  });
}

function defineGroup(Type, proto, name, properties) {
  const view = {};
  for (const [property, initial] of Object.entries(properties)) {
    const key = `${name}$${property}`;
    const resolve = Type.spec.resolve?.[key];
    const make = (self) => (self.$slots[key] = new Slot(self, key, initial, resolve, name, property));
    Type.slots[key] = make;
    Object.defineProperty(view, property, {
      get() {
        return (this.$self.$slots[key] ?? make(this.$self)).get();
      },
      set(value) {
        (this.$self.$slots[key] ?? make(this.$self)).set(value);
      },
      enumerable: true,
    });
  }
  // The group as one value: what `font: other.font` binds, and what
  // assigning to `font` sets.
  const make = (self) => (self.$slots[name] = new Slot(self, name));
  Type.slots[name] = make;
  Object.defineProperty(proto, name, {
    get() {
      return (this.$groups[name] ??= Object.create(view, { $self: { value: this } }));
    },
    set(value) {
      (this.$slots[name] ?? make(this)).set(value);
    },
    enumerable: true,
    configurable: true,
  });
}

const handlerName = (name) => `on${name[0].toUpperCase()}${name.slice(1)}`;

// A signal is the function that emits it: `clicked(mouse)` runs the handler
// the object was given (`onClicked`) and whatever was connected since.
export function signal(given) {
  const listeners = new Set();
  const emit = (...args) => {
    given?.()?.(...args);
    for (const listener of [...listeners]) listener(...args);
  };
  emit.connect = (listener) => void listeners.add(listener);
  emit.disconnect = (listener) => void listeners.delete(listener);
  return emit;
}

function defineSignal(proto, name) {
  const handler = handlerName(name);
  Object.defineProperty(proto, name, {
    get() {
      return (this.$signals[name] ??= signal(() => untrack(() => this.$props[handler])));
    },
    enumerable: true,
    configurable: true,
  });
}

// `defineType("Rectangle", Item, { properties, signals, methods, enums,
// resolve, setup, adopt, attached })`.
//
// - `properties`: defaults by name; `derived(self => ...)` for one computed
//   from the object, `group({ ... })` for `anchors`, `font` and the like.
// - `signals`: names. `methods`: functions and accessors, `this` the object.
// - `enums`: `Text.Raised` and friends, set on the type itself.
// - `resolve`: `{ x: (self, own) => ... }` decides a property's value over
//   what it was given, which `own()` returns: anchors over `x`.
// - `setup(self, props)`: runs once per object, base type first, before the
//   object has children. This is where a visual type makes its DOM node
//   (`self.$node`) and its effects, with `effect`. It reads no property: the
//   objects a binding names may not exist yet.
// - `adopt(self, props)`: takes the objects declared inside this one,
//   `contents(props)`. The most derived type's is the one that runs.
// - `attached`: the type of `Type.attached(object)`, for `ListView.view` or
//   `Layout.fillWidth`. Its props are the object's `Type$name` ones.
export function defineType(name, base, spec = {}) {
  const Type = (props) => create(Type, props ?? {});
  const proto = Object.create(base ? base.proto : Object.prototype);
  Type.enums = { ...base?.enums, ...spec.enums };
  Object.assign(Type, Type.enums);
  Type.typeName = name;
  Type.base = base;
  Type.spec = spec;
  Type.proto = proto;
  Type.slots = Object.create(base ? base.slots : null);
  Type.chain = base ? [...base.chain, Type] : [Type];
  Type.adopt = spec.adopt ?? base?.adopt;
  for (const [property, initial] of Object.entries(spec.properties ?? {})) {
    if (initial?.[GROUP]) defineGroup(Type, proto, property, initial[GROUP]);
    else defineProperty(Type, proto, property, initial);
  }
  for (const signalName of spec.signals ?? []) defineSignal(proto, signalName);
  if (spec.methods) Object.defineProperties(proto, Object.getOwnPropertyDescriptors(spec.methods));
  if (spec.attached) Type.attached = (self) => attach(name, spec.attached, self);
  return Type;
}

// What waits for the tree being created: QML makes every object of a
// component before it evaluates a binding, so that one may name any other.
// `Component.onCompleted` handlers wait for the bindings too.
let waiting = null;
let completions = null;
// The item whose children are being created.
let parent = null;

// Runs `work` once the objects being created all exist; now, if none are.
export function whenComplete(work) {
  if (!waiting) return work();
  const owner = getOwner();
  waiting.push(() => runWithOwner(owner, work));
}

// A render effect that waits likewise: `compute` reads properties, `apply`
// writes what it returned to the DOM.
export function effect(compute, apply) {
  whenComplete(() => createRenderEffect(compute, apply));
}

function complete(make) {
  if (waiting) return make();
  const works = (waiting = []);
  const handlers = (completions = []);
  let made;
  try {
    made = make();
  } finally {
    waiting = completions = null;
  }
  for (const work of works) work();
  for (const handler of handlers) handler();
  return made;
}

// Creates objects as children of `item`: `parent` is theirs from the start.
export function inside(item, make) {
  const outer = parent;
  parent = item;
  try {
    return make();
  } finally {
    parent = outer;
  }
}

function create(Type, props) {
  const self = props.$self ?? $object();
  return complete(() => {
    Object.setPrototypeOf(self, Type.proto);
    hidden(self, "$type", Type);
    hidden(self, "$props", props);
    hidden(self, "$owner", getOwner());
    hidden(self, "$parent", parent);
    hidden(self, "$slots", Object.create(null));
    hidden(self, "$groups", Object.create(null));
    hidden(self, "$signals", Object.create(null));
    for (const type of Type.chain) type.spec.setup?.(self, props);
    if (Type.adopt && "children" in props) Type.adopt(self, props);
    for (const key of Object.keys(props)) {
      // `onWidthChanged`: a handler of a property's changes, not of a signal.
      const property = /^on([A-Z]\w*)Changed$/.exec(key)?.[1];
      if (!property) continue;
      const name = property[0].toLowerCase() + property.slice(1);
      if (name in Type.slots) onChange(self, name, () => untrack(() => props[key])?.());
    }
    const completed = props.Component$onCompleted;
    if (completed) completions.push(() => untrack(completed));
    const destruction = props.Component$onDestruction;
    if (destruction) onCleanup(() => destruction());
    // Whoever read the object before it existed reads it again.
    if (props.$self) self.$touch(next);
    return self;
  });
}

// The objects declared inside one, created now: its `children` prop,
// flattened. With `item`, they are created as its children.
export function contents(props, item) {
  const made = untrack(() => (item ? inside(item, () => props.children) : props.children));
  if (made == null) return [];
  return Array.isArray(made) ? made.flat(Infinity).filter((child) => child != null) : [made];
}

// Runs `handler` when the property changes, not when it is first read.
export function onChange(self, name, handler) {
  whenComplete(() =>
    createEffect(
      () => self[name],
      // A handler reads what it likes: it is run, not kept up to date.
      () => void untrack(handler),
      { defer: true },
    ),
  );
}

// `target.onSignal` from outside the object: a signal it emits, or the change
// of one of its properties (`widthChanged`).
export function connect(target, name, listener) {
  const emitted = target[name];
  if (typeof emitted?.connect === "function") {
    emitted.connect(listener);
    onCleanup(() => emitted.disconnect(listener));
    return;
  }
  const property = /^(\w+)Changed$/.exec(name)?.[1];
  if (property && property in target) onChange(target, property, listener);
}

function attach(name, Attached, self) {
  if (!self?.$props) return undefined;
  if (!self.$attached) hidden(self, "$attached", Object.create(null));
  const all = self.$attached;
  if (all[name]) return all[name];
  // The object's `ListView$onAdd` is the attached object's `onAdd`.
  const prefix = `${name}$`;
  const props = {};
  for (const key of Object.keys(self.$props)) {
    if (!key.startsWith(prefix)) continue;
    Object.defineProperty(props, key.slice(prefix.length), Object.getOwnPropertyDescriptor(self.$props, key));
  }
  hidden(props, "$attachee", self);
  return (all[name] = runWithOwner(self.$owner, () => untrack(() => Attached(props))));
}

// What a `Component` is at run time: a function from what its object is
// given (a delegate's `index` and roles) to the object.
export function $component(make) {
  make.createObject = (item, properties) => {
    const { object } = instantiate(make, properties ?? {}, item);
    for (const [name, value] of Object.entries(properties ?? {})) {
      if (name in object) object[name] = value;
    }
    item?.$add?.(object);
    return object;
  };
  return make;
}

// Creates a component's object apart from the tree that asked for it: a
// delegate, a loaded item. `dispose` destroys it; so does the end of `owner`.
export function instantiate(component, data, item, owner = item?.$owner ?? getOwner()) {
  return runWithOwner(owner, () =>
    createRoot((dispose) => {
      const object = untrack(() => complete(() => inside(item ?? null, () => component(data))));
      return { object, dispose };
    }),
  );
}

// Puts a component's object in the page.
export function mount(Component, element, props = {}) {
  return createRoot((dispose) => {
    const object = untrack(() => complete(() => Component(props)));
    element.classList.add("q-scene");
    if (object.$node) element.append(object.$node);
    return { object, dispose };
  });
}

// What a component declares, put on its root object so that it can be
// reached through it: `{ name: [get, set] }` for a property, a function for
// a function or a signal.
export function $define(self, members) {
  for (const [name, member] of Object.entries(members)) {
    const descriptor = Array.isArray(member)
      ? { get: member[0], set: member[1], enumerable: true, configurable: true }
      : { value: member, enumerable: true, configurable: true };
    Object.defineProperty(self, name, descriptor);
  }
  return self;
}

// A declared property that something assigns to. Like a slot: the assignment
// replaces the binding, a read right after it sees the new value, and so
// does everything that depends on it.
export function $signal(initial) {
  const binding = typeof initial === "function";
  const owner = getOwner();
  const [version, bump] = createSignal(0, WRITABLE);
  let assigned = !binding;
  let value = binding ? undefined : initial;
  // Made when first read: by then what the binding names exists.
  let bound;
  const get = () => {
    version();
    if (assigned) return value;
    bound ??= runWithOwner(owner, () => createMemo(initial, SYNC));
    return bound();
  };
  const set = (given) => {
    if (assigned && Object.is(value, given)) return given;
    assigned = true;
    value = given;
    bump(next);
    flush();
    return given;
  };
  return [get, set];
}

export const QtObject = defineType("QtObject", null, {
  properties: { objectName: "" },
});
