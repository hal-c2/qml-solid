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
// What `Qt.binding(f)` marks its function with: assigning one binds.
const BINDING = Symbol.for("qml-solid.binding");

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

// An effect's callback runs while Solid settles what changed, and what it
// assigns is settled by the same flush: it must not ask for another.
let settling = 0;
function settled(work, ...args) {
  settling++;
  try {
    return work(...args);
  } finally {
    settling--;
  }
}

// What a type's method does once it has changed something, so that what
// depends on the change is up to date when it returns, as it is in QML.
export function settle() {
  if (!settling) flush();
}

// A binding that cannot be evaluated, as `game.over` before there is a
// game, is told of and leaves the property what it was: QML's rule, which
// programs written for it lean on. Only what asking too much of a value
// throws is taken so: any other error is the runtime's, or of a type it does
// not have.
function guarded(key, compute) {
  let last;
  return () => {
    try {
      return (last = compute());
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      console.warn(`${key.replaceAll("$", ".")}: ${error}`);
      return last;
    }
  };
}

class Slot {
  constructor(self, key, initial, resolve, whole, member) {
    this.self = self;
    this.key = key;
    this.initial = initial;
    this.resolve = resolve;
    // For a property of a group, the group and its name in it: `font` and
    // `bold` for `font.bold`, which `font: other.font` gives too.
    this.whole = whole;
    this.member = member;
    this.bound = null;
    this.given = undefined;
    this.take(self.$props, key);
    this.assigned = false;
    this.value = undefined;
    // Set by whatever lays the object out: a positioner, a layout, a view.
    // An assignment is over it until it is laid out somewhere else.
    this.placed = undefined;
    this.over = false;
    // Set by a Behavior: what is shown while the value it follows moves.
    this.shown = null;
    // Most properties are never written, so a slot has no signal of its own
    // until it is: before that its readers share the object's.
    this.version = null;
    this.bump = null;
    this.given$ = resolve ? () => this.own() : null;
  }

  // What the object's creator gave the property: `props[key]`.
  take(props, key) {
    const self = this.self;
    const descriptor = Object.getOwnPropertyDescriptor(props, key);
    // A binding: evaluated when first read and again when what it read
    // changes, however many readers there are. An item it makes
    // (`background: Rectangle {}`) is made as a child of this one, or of
    // the content item of a window.
    this.bound = descriptor?.get
      ? runWithOwner(self.$owner, () =>
          createMemo(
            guarded(key, () => complete(() => inside(self.$contentItem ?? (self.$node ? self : null), () => props[key]))),
            SYNC,
          ),
        )
      : null;
    this.given = descriptor && !descriptor.get ? descriptor.value : undefined;
  }

  // The same from somewhere else: what an instance binds to an alias is a
  // binding of the property the alias names.
  bind(props, key) {
    this.take(props, key);
    this.assigned = false;
    this.value = undefined;
    this.changed();
  }

  get() {
    if (this.version) this.version();
    else this.self.$track();
    return this.shown ? this.shown() : this.target();
  }

  // What the property was given, before its type has its say.
  asked() {
    if (this.version) this.version();
    else this.self.$track();
    return this.own();
  }

  // The value the property has, whatever is animating towards it.
  target() {
    return this.resolve ? this.resolve(this.self, this.given$) : this.own();
  }

  own() {
    if (this.placed !== undefined && !this.over) return this.placed;
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
    if (this.write(value) && !settling) flush();
  }

  // The same without settling what depends on it: for a type's own writes,
  // which an animation makes every frame.
  write(value) {
    if (typeof value === "function" && value[BINDING]) return this.rebind(value);
    // Where an object was put, it is until what laid it out puts it
    // somewhere else: a row that is dragged stays where it was dragged to
    // until its view lays its rows out again, as in Qt. (Qt puts every row
    // back then, and this only those that are to be elsewhere.) How big it
    // is is not its own to say: a layout that sized it sizes it again.
    if (this.placed !== undefined && !this.over && (this.key === "x" || this.key === "y")) this.over = true;
    else if (this.assigned && Object.is(this.value, value)) return false;
    this.assigned = true;
    this.value = value;
    this.changed();
    return true;
  }

  // `x = Qt.binding(f)`: bound again, by an assignment. `this` in `f` is
  // the object.
  rebind(compute) {
    const self = this.self;
    this.bound = runWithOwner(self.$owner, () => createMemo(guarded(this.key, () => compute.call(self)), SYNC));
    this.assigned = false;
    this.value = undefined;
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
    this.over = false;
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
  whenComplete(() => createRenderEffect(compute, (...args) => settled(apply, ...args)));
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

// A component's root is two things at once: the object its file describes
// and the instance somebody wrote (`Clock { city: "Oslo" }`). `own` is what
// the file binds, `given` what the instance does, which wins; a handler both
// have is run for both, the file's first.
function inherit(own, given) {
  if (given.$given) given = inherit(given, given.$given);
  const props = {};
  for (const key of Object.keys(own)) {
    if (key !== "$given") Object.defineProperty(props, key, Object.getOwnPropertyDescriptor(own, key));
  }
  for (const key of Object.keys(given)) {
    // Its children are put where the component says, and the object itself
    // is the one the component made.
    // What it finds names in is its own context, not the one it was made in.
    if (key === "children" || key === "$self" || key === "$given" || key === "$context") continue;
    const descriptor = Object.getOwnPropertyDescriptor(given, key);
    if (!(key in own)) Object.defineProperty(props, key, descriptor);
    else if (key === "$declare") props.$declare = [own.$declare, given.$declare].flat();
    else if (key === "$attach") props.$attach = [...new Set([...own.$attach, ...given.$attach])];
    else if (key === "$functions" || key === "$aliases") props[key] = { ...own[key], ...given[key] };
    else if (HANDLER.test(key)) {
      props[key] = (...args) => {
        own[key]?.(...args);
        return given[key]?.(...args);
      };
    } else Object.defineProperty(props, key, descriptor);
  }
  return props;
}

// `onClicked`, `Keys$onPressed`, `Component$onCompleted`.
const HANDLER = /^(\w+\$)?on[A-Z_]/;

// The type of an object that declares properties and signals of its own:
// `Item { property int hours; signal ticked }`. One per declaration, however
// many objects are made from it.
const derivations = new WeakMap();
function derive(Type, declared) {
  if (Array.isArray(declared)) return declared.reduce(derive, Type);
  let derivedTypes = derivations.get(Type);
  if (!derivedTypes) derivations.set(Type, (derivedTypes = new WeakMap()));
  let Derived = derivedTypes.get(declared);
  if (!Derived) {
    Derived = defineType(Type.typeName, Type, { properties: declared.properties, signals: declared.signals });
    if (Type.attached) Derived.attached = Type.attached;
    derivedTypes.set(declared, Derived);
  }
  return Derived;
}

// `property alias text: label.text`: the property is another object's.
function defineAlias(self, name, [target, ...path]) {
  const last = path.at(-1);
  const holder = () => path.slice(0, -1).reduce((object, member) => object?.[member], target);
  // What the instance gives the alias is the target's once everything is
  // made. A binding read before that reads what was given, as in Qt, where
  // none is read until then.
  const given = path.length > 0 && name in self.$props;
  const [early, setEarly] = given ? createSignal(true, { ownedWrite: true }) : [];
  Object.defineProperty(self, name, {
    get: path.length
      ? () => (early?.() ? self.$props[name] : holder()?.[last])
      : () => (target.$type ? target : (target.$track(), null)),
    set(value) {
      const object = holder();
      if (path.length && object) object[last] = value;
    },
    enumerable: true,
    configurable: true,
  });
  if (!given) return;
  // What the instance binds to the alias is the target's binding.
  const key = path.join("$");
  whenComplete(() => {
    setEarly(false);
    const aliased = target.$type && slot(target, key);
    if (aliased) return aliased.bind(self.$props, name);
    // An alias of an alias, or of an object made later: assigned instead.
    createRenderEffect(
      () => self.$props[name],
      (value) =>
        settled(() => {
          const object = holder();
          if (object) object[last] = value;
        }),
    );
  });
}

function create(Type, props) {
  if (props.$given) props = inherit(props, props.$given);
  if (props.$declare) Type = derive(Type, props.$declare);
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
    // `function tick() { }`: what the object's QML declares it can do.
    if (props.$functions) {
      for (const [name, declared] of Object.entries(props.$functions)) hidden(self, name, declared);
    }
    for (const type of Type.chain) type.spec.setup?.(self, props);
    if (props.$aliases) {
      for (const [name, path] of Object.entries(props.$aliases)) defineAlias(self, name, path);
    }
    if (Type.adopt && "children" in props) Type.adopt(self, props);
    for (const key of Object.keys(props)) {
      // `onWidthChanged`: a handler of a property's changes, not of a signal.
      const property = /^on([A-Z]\w*)Changed$/.exec(key)?.[1];
      if (!property) continue;
      const name = property[0].toLowerCase() + property.slice(1);
      if (name in Type.slots || props.$aliases?.[name]) onChange(self, name, () => untrack(() => props[key])?.());
    }
    // `Keys.onPressed`, `Layout.fillWidth`: the attached object is what does
    // something about them, so it has to exist.
    if (props.$attach) {
      whenComplete(() => {
        for (const type of props.$attach) type.attached?.(self);
      });
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
  const made = untrack(() => (item ? inside(item, () => flatten(props.children, [])) : flatten(props.children, [])));
  return made;
}

// A component puts its instance's children among its own
// (`{$props.children}`), which Solid hands over as a function.
function flatten(made, into) {
  if (made == null) return into;
  if (Array.isArray(made)) for (const child of made) flatten(child, into);
  else if (typeof made === "function" && !made.$component && !made.proto) flatten(made(), into);
  else into.push(made);
  return into;
}

// Runs `handler` when the property changes, not when it is first read.
export function onChange(self, name, handler) {
  let seen = false;
  let last;
  whenComplete(() =>
    createEffect(
      () => self[name],
      (value) => {
        // Reading it again is not a change: what it was computed from may
        // have changed and left it as it was.
        const changed = seen && !Object.is(value, last);
        seen = true;
        last = value;
        // A handler reads what it likes: it is run, not kept up to date.
        if (changed) settled(untrack, handler);
      },
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
  make.$component = true;
  // `Component.Ready`: it was compiled before the program ran, so there is
  // nothing to wait for and nothing to tell of.
  make.status = 1;
  make.progress = 1;
  make.errorString = () => "";
  make.statusChanged = make.progressChanged = silent;
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

// A signal nothing ever emits.
const silent = Object.assign(() => {}, { connect() {}, disconnect() {} });

// A QML file as a `Component`: what `Qt.createComponent("Block.qml")` and
// `source: "Block.qml"` are, the compiler having imported the file. `File` is
// what the file's module exports.
// What it makes finds names in `context`, the one of the object that named
// the file, when the compiler gives one.
const files = new WeakMap();
const nowhere = {};
export function $file(File, context) {
  let made = files.get(File);
  if (!made) files.set(File, (made = new WeakMap()));
  let component = made.get(context ?? nowhere);
  if (!component) {
    const make = context ? (properties) => File(within(properties, context)) : (properties) => File(properties);
    made.set(context ?? nowhere, (component = $component(make)));
  }
  return component;
}

// What a component is given, and the context it is made in.
function within(properties, context) {
  const props = { $context: context };
  for (const key of Object.keys(properties ?? {})) {
    if (key !== "$context") Object.defineProperty(props, key, Object.getOwnPropertyDescriptor(properties, key));
  }
  return props;
}

// A path that is only known when the program runs, looked up among the files
// the compiler found it could name: `table` has, for each path from the
// directory of the module at `base`, a function that gives what the file
// exports. The result is `find(path, required)`: the file's component, and
// for a path that names none of them the path as it is, or with `required`
// (`Qt.createComponent`) a component that says so. `context` as for `$file`.
export function $files(table, base) {
  const directory = new URL(".", base).href;
  return (path, required, context) => {
    // A component already: a path the compiler knew.
    if (typeof path !== "string") return path;
    let key = path.startsWith(directory) ? path.slice(directory.length) : path;
    while (key.startsWith("./")) key = key.slice(2);
    if (Object.hasOwn(table, key)) return $file(table[key](), context);
    return required ? missing($url(path, base)) : path;
  };
}

// `Component.Error`: what Qt makes of a file that is not there.
function missing(url) {
  const component = $component(() => null);
  component.status = 3;
  component.progress = 0;
  component.errorString = () => `${url}: No such file or directory`;
  component.createObject = () => {
    console.warn(`QQmlComponent: Component is not ready: ${component.errorString()}`);
    return null;
  };
  return component;
}

// QML finds a name by walking contexts: a component's own, then the one of
// whatever made it. The compiler does the first part; where a project uses
// an id of another component, the rest is done here. A context is a
// component's ids and its root, and the context it was made in.
export function $context(outer, root, ids) {
  return { outer, root, ids };
}

// What `name` is to an object made in `context`: an id or a property of the
// root of the nearest component around it that has one, or something the
// program was given for every context.
export function $lookup(context, name) {
  for (let around = context.outer; around; around = around.outer) {
    const ids = around.ids?.();
    if (ids && name in ids) return ids[name];
    if (name in around.root) return around.root[name];
  }
  return globals[name];
}

// What every context has: the context properties a host sets.
export const globals = Object.create(null);

// `pragma Singleton`: the one object of a file, made the first time anything
// asks for it and kept for as long as the page. It is nobody's child, and
// nothing that ends takes it along. `keys` are the enums the file declares.
export function $singleton(Component, keys) {
  let object;
  const get = () => {
    if (object) return object;
    // There before it is filled in: what is in the file may name it.
    object = $object();
    runWithOwner(null, () =>
      createRoot(() => untrack(() => complete(() => inside(null, () => Component({ $self: object }))))),
    );
    return object;
  };
  return Object.assign(get, keys);
}

// `source: path`, where the path is not known until the program runs: taken
// from the file it is written in, as a literal is when it is compiled.
export function $url(value, base) {
  if (typeof value !== "string" || value === "") return value;
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

// A type of Qt's that this runtime does not have yet. It is there to be
// named, since a style of Qt's names every control there is, and says what
// it is when something is made of it or read off it.
export function absent(module, name) {
  const fail = () => {
    throw new Error(`${module}: ${name} is not in qml-solid yet`);
  };
  return new Proxy(fail, {
    // What is asked of any function, and what the runtime asks of any value
    // to learn what it is, is answered as a function answers.
    get: (target, key) =>
      typeof key === "symbol" || key in Function.prototype || key === "then" || key[0] === "$" ? Reflect.get(target, key) : fail(),
  });
}

// Which of the modules a module of Qt's can be the build chose: for
// `QtQuick.Controls` the style, `QtQuick.Controls.Material`. The build says.
export const chosen = new Map();

// `qrc:/…`: a file Qt keeps inside a program or one of its plugins, as the
// pictures of a style of Qt Quick Controls are. A build says which there are
// and where the browser has them; `located` is what a type loads a source by.
export const resources = new Map();

export function located(url) {
  if (!/^(qrc)?:\//.test(url)) return url;
  return resources.get(url.replace(/^(qrc)?:\/+/, "qrc:/")) ?? url;
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

// Puts a component's object in the page. A Window is told what it was put
// in and with what `options`: it fills the element, or with
// `{ fill: false }` gives it the size its QML says.
export function mount(Component, element, props = {}, options = {}) {
  return createRoot((dispose) => {
    const object = untrack(() => complete(() => Component(props)));
    element.classList.add("q-scene");
    if (object.$node) element.append(object.$node);
    object.$mounted?.(element, options);
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
    if (typeof given === "function" && given[BINDING]) {
      // `count = Qt.binding(f)`: the binding is replaced, not the value.
      bound = runWithOwner(owner, () => createMemo(() => given(), SYNC));
      assigned = false;
      value = undefined;
    } else {
      assigned = true;
      value = given;
    }
    bump(next);
    if (!settling) flush();
    return given;
  };
  return [get, set];
}

export const QtObject = defineType("QtObject", null, {
  properties: { objectName: "" },
});
