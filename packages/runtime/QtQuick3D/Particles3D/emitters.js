// What makes particles: an emitter gives each one it emits a start, a life,
// a place, a speed, a turn, a size and a colour, and the particle's kind
// keeps them. So many a second, and in bursts.
//
// How many and when is Qt's own arithmetic, found by asking Qt 6.11 for the
// particles there are after the time was moved in steps: what was emitted
// since the last time is spread evenly over the time since, an emitter that
// has not a whole particle to emit waits where it was, and no more of the
// past is made up for than a particle's longest life.
//
// Not here: `emitMode` and `depthBias` are kept and do nothing: a particle
// sets off as `velocity` says whatever surface it starts on. A
// TrailEmitter3D's bursts on a particle's start and end are told once for
// each particle followed, as Qt's documentation has them; Qt 6.11 itself
// tells an end again every time the system moves on.
import { untrack } from "solid-js";
import { defineType, derived, group, QtObject } from "../../object.js";
import { color } from "../../QtQuick/color.js";
import * as math from "../math.js";
import { Node } from "../Node.js";
import { AMOUNT, COLOR, END_SCALE, enrol, LIFE, list, random, SCALE, seenFrom, SPIN, spread, three, TURN, vectors, within } from "./core.js";
import { evaluate, moved } from "./particles.js";

const HERE = Object.freeze([0, 0, 0]);
const UNTURNED = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);

const TriggerTime = 0;
const TriggerStart = 1;
const TriggerEnd = 2;

// So many particles at a time: there from the start of the system, the
// first at `time` and the rest spread over `duration`.
export const EmitBurst3D = defineType("EmitBurst3D", QtObject, {
  properties: {
    time: 0,
    amount: 0,
    duration: 0,
  },
  setup(self) {
    self.$burst = true;
  },
});

// The same, emitted when the system's time comes past `time`: again when
// it comes past it again, and not at all while it is not `enabled`.
export const DynamicBurst3D = defineType("DynamicBurst3D", EmitBurst3D, {
  properties: {
    enabled: true,
    amountVariation: 0,
    triggerMode: TriggerTime,
  },
  enums: { TriggerTime, TriggerStart, TriggerEnd },
  setup(self) {
    self.$dynamic = true;
  },
});

// An emitter's bursts: those `emitBursts` names and those declared in it.
// The last comes first, as in Qt, where each tells its emitter of itself
// when it is complete and the last made is complete first: of two bursts
// that are there from the start, the later one's particles are before the
// earlier one's in the table.
function bursts(emitter) {
  const found = new Set(list(emitter.emitBursts));
  for (const child of emitter.$static ?? []) if (child?.$burst) found.add(child);
  return [...found].filter((burst) => burst?.$burst).reverse();
}

// A whole number out of 255.
const byte = (value) => Math.min(255, Math.max(0, Math.trunc(value)));

// When one of several starts that are spread over a time: `share` of the
// way through `span` from `from`. In seconds, and summed as Qt sums it, in
// numbers of 32 bits: one that is to start at the very time it is emitted
// may so come out a hair after it, and is then not there until the time
// has moved on, as in Qt.
const { fround } = Math;
const when = (from, share, span) => fround(fround(from / 1000) + fround(fround(share) * fround(span / 1000)));

// One particle, to start at `begin` seconds. `placed` is the emitter as
// the system sees it and `turned` its turn alone; with `around`, the
// particle starts that far from where they put it.
function emit(system, emitter, particle, begin, placed, turned, around, kept) {
  const place = particle.$take(kept);
  if (place < 0) return;
  const seed = system.$seed();
  const index = system.$numbered++;
  const inside = emitter.shape?.$position?.(seed, index) ?? HERE;
  const at = placed ? math.point(placed, inside[0], inside[1], inside[2]) : [...inside];
  if (around) for (let axis = 0; axis < 3; axis++) at[axis] += around[axis];
  const speed = emitter.velocity?.$sample?.(seed, index, at) ?? HERE;
  const [vx, vy, vz] = math.turned(turned, speed[0], speed[1], speed[2]);
  // A turn is kept as a whole number of 127ths of a full one, and how fast
  // it turns as the whole root of the degrees a second.
  const turn = three(emitter.particleRotation);
  const turnVariation = three(emitter.particleRotationVariation);
  const spin = three(emitter.particleRotationVelocity);
  const spinVariation = three(emitter.particleRotationVelocityVariation);
  const angles = [0, 1, 2].map((axis) => (Math.trunc(((turn[axis] + turnVariation[axis] * spread(seed, index, TURN + axis)) * 127) / 360) * 360) / 127);
  const spins = [0, 1, 2].map((axis) => {
    const wanted = spin[axis] + spinVariation[axis] * spread(seed, index, SPIN + axis);
    const root = Math.max(-127, Math.min(127, Math.trunc(Math.sign(wanted) * Math.sqrt(Math.abs(wanted)))));
    return Math.abs(root) * root;
  });
  // Each channel of the colour is drawn towards chance by as much as its
  // variation says: all by the same chance when the variation is unified.
  const tint = color(particle.color);
  const variation = particle.colorVariation;
  const together = random(seed, index, COLOR + 3);
  const chance = (channel) => (particle.unifiedColorVariation ? together : random(seed, index, COLOR + channel)) * 256;
  const mixed = (value, by, channel) => byte(value * 255 * (1 - by) + chance(channel) * by);
  const by = emitter.particleScaleVariation * spread(seed, index, SCALE);
  const end = emitter.particleEndScale < 0 ? emitter.particleScale : emitter.particleEndScale;
  const endBy = emitter.particleEndScaleVariation < 0 ? by : emitter.particleEndScaleVariation * spread(seed, index, END_SCALE);
  const life = Math.max(0, emitter.lifeSpan + emitter.lifeSpanVariation * spread(seed, index, LIFE));
  particle.$data[place] = {
    index,
    begin,
    end: fround(begin + fround(life / 1000)),
    start: begin * 1000,
    life,
    x: at[0],
    y: at[1],
    z: at[2],
    vx,
    vy,
    vz,
    rx: angles[0],
    ry: angles[1],
    rz: angles[2],
    sx: spins[0],
    sy: spins[1],
    sz: spins[2],
    r: mixed(tint.r, Number(variation.x) || 0, 0),
    g: mixed(tint.g, Number(variation.y) || 0, 1),
    b: mixed(tint.b, Number(variation.z) || 0, 2),
    a: mixed(tint.a, Number(variation.w) || 0, 3),
    from: Math.max(0, emitter.particleScale + by),
    to: Math.max(0, end + endBy),
    reversed: Boolean(emitter.reversed),
  };
}

// How an emitter lies in its system: where it puts a place of its own, and
// which way it turns a direction, which no scale makes longer.
function lie(system, emitter) {
  const placed = seenFrom(system, emitter);
  const turn = math.unscaled(placed);
  return { placed, turned: [turn[0], turn[1], turn[2], turn[4], turn[5], turn[6], turn[8], turn[9], turn[10]] };
}

// How many a burst is of, give or take its variation.
function amountOf(system, burst) {
  const amount = Math.max(0, Math.floor(burst.amount));
  if (!burst.amountVariation) return amount;
  return Math.max(0, Math.round(amount + burst.amountVariation * spread(system.$seed(), system.$numbered, AMOUNT)));
}

// What an emitter keeps from one time to the next.
export const fresh = (from) => ({ previous: from, owed: 0, spreading: [], idle: false });

// How many the emitter's rate gives for the time since it last emitted,
// with what was left over of the times before.
function due(emitter, state, now) {
  // Time gone back is begun from again; and of time that jumped ahead, no
  // more is made up for than a particle lives.
  if (now < state.previous) state.previous = now;
  state.previous = Math.max(state.previous, now - (emitter.lifeSpan + emitter.lifeSpanVariation));
  const rate = Number(emitter.emitRate) || 0;
  if (!(rate > 0)) return 0;
  const exact = ((now - state.previous) * rate) / 1000;
  let amount = Math.floor(exact);
  if (amount > 0) state.owed += exact - amount;
  if (state.owed >= 1) {
    amount++;
    state.owed -= 1;
  }
  return amount;
}

// The bursts whose time came since the system was last at a time, the time
// then and the time now both included, as Qt includes them: all at once,
// or a share with each step until their `duration` is over.
function burst(system, emitter, state, now, since) {
  let amount = 0;
  for (const each of bursts(emitter)) {
    if (!each.$dynamic || !each.enabled || each.triggerMode !== TriggerTime) continue;
    if (!(since <= each.time && each.time <= now)) continue;
    const many = amountOf(system, each);
    if (each.duration > 0) state.spreading.push({ end: now + each.duration, duration: each.duration, amount: many, emitted: 0, previous: since });
    else amount += many;
  }
  for (let index = 0; index < state.spreading.length; index++) {
    const spreading = state.spreading[index];
    if (now >= spreading.end) {
      amount += spreading.amount - spreading.emitted;
      // The one after it in the list is passed over this once, as in Qt.
      state.spreading.splice(index, 1);
      continue;
    }
    // Its share for the time since, and no more than is left of it.
    const share = Math.max(0, Math.min(spreading.amount - spreading.emitted, Math.trunc((spreading.amount * (now - spreading.previous)) / spreading.duration)));
    spreading.emitted += share;
    spreading.previous = now;
    amount += share;
  }
  return amount;
}

const turns = vectors(["particleRotation", "particleRotationVariation", "particleRotationVelocity", "particleRotationVelocityVariation"]);

export const ParticleEmitter3D = defineType("ParticleEmitter3D", Node, {
  properties: {
    system: derived(within),
    emitBursts: undefined,
    velocity: null,
    particle: null,
    enabled: true,
    shape: null,
    emitRate: 0,
    lifeSpan: 1000,
    lifeSpanVariation: 0,
    particleScale: 1,
    particleEndScale: -1,
    particleScaleVariation: 0,
    particleEndScaleVariation: -1,
    particleRotation: group({ x: 0, y: 0, z: 0 }),
    particleRotationVariation: group({ x: 0, y: 0, z: 0 }),
    particleRotationVelocity: group({ x: 0, y: 0, z: 0 }),
    particleRotationVelocityVariation: group({ x: 0, y: 0, z: 0 }),
    depthBias: 0,
    reversed: false,
    emitMode: 0,
  },
  enums: { Default: 0, SurfaceNormal: 1, SurfaceReflected: 2 },
  methods: {
    // So many particles now, or spread over `duration` from now, and with
    // `position` that far from where the emitter would start them. They
    // are there to see when the time next moves, as in Qt.
    burst(count, duration = 0, position = null) {
      const system = this.system;
      const particle = this.particle;
      if (!system || !particle || !this.enabled) return;
      const now = untrack(() => system.$sync());
      const many = Math.min(Math.max(0, Math.floor(count)), particle.maxAmount);
      const { placed, turned } = lie(system, this);
      const around = position ? three(position) : null;
      for (let index = 0; index < many; index++) emit(system, this, particle, when(now, (1 + index) / many, Math.max(0, duration)), placed, turned, around);
    },
    // The bursts that are there from the start: when the emitter comes
    // into a system.
    $begin(system) {
      const particle = this.particle;
      if (!particle) return;
      const { placed, turned } = lie(system, this);
      for (const each of bursts(this)) {
        if (each.$dynamic) continue;
        const many = Math.min(Math.max(0, Math.floor(each.amount)), particle.maxAmount);
        for (let index = 0; index < many; index++) emit(system, this, particle, when(each.time, index / many, each.duration), placed, turned, null, true);
      }
    },
    // What the time from `since` to `now` has it emit.
    $emit(system, state, now, since) {
      const particle = this.particle;
      if (!particle) return;
      const amount = Math.min(due(this, state, now) + burst(system, this, state, now, since), particle.maxAmount);
      if (amount <= 0) return;
      const { placed, turned } = lie(system, this);
      const span = now - state.previous;
      for (let index = 0; index < amount; index++) emit(system, this, particle, when(state.previous, (1 + index) / amount, span), placed, turned);
      state.previous = now;
    },
  },
  setup(self) {
    self.$emitter = true;
    turns(self);
    enrol(self);
  },
});

// Emits where the particles of another kind are: its rate for each of them
// there is, and its bursts when one of them starts or ends.
export const TrailEmitter3D = defineType("TrailEmitter3D", ParticleEmitter3D, {
  properties: {
    follow: null,
  },
  methods: {
    // So many now, for each of the particles followed.
    burst(count) {
      const system = this.system;
      if (!system || !this.enabled) return;
      (this.$asked ??= []).push(Math.max(0, Math.floor(count)));
    },
    $begin() {},
    $emit(system, state, now, since) {
      const particle = this.particle;
      const followed = this.follow;
      if (!particle || !followed?.$particle) return;
      let steady = due(this, state, now);
      for (const asked of this.$asked ?? []) steady += asked;
      this.$asked = null;
      const own = bursts(this).filter((each) => each.$dynamic && each.enabled);
      for (const each of own) if (each.triggerMode === TriggerTime && since <= each.time && each.time <= now) steady += amountOf(system, each);
      const starting = own.filter((each) => each.triggerMode === TriggerStart);
      const ending = own.filter((each) => each.triggerMode === TriggerEnd);
      const most = particle.maxAmount;
      const span = now - state.previous;
      let first = true;
      const give = (amount, at, spreadOut) => {
        amount = Math.min(amount, most);
        for (let index = 0; index < amount; index++) emit(system, this, particle, spreadOut ? when(state.previous, index / amount, span) : fround(now / 1000), null, UNTURNED, at);
      };
      const affecting = ending.length ? system.$affecting(followed) : null;
      for (const one of evaluate(followed, system, now)) {
        let amount = steady;
        if (one.datum.start > since || (since === 0 && one.datum.start === 0)) for (const each of starting) amount += amountOf(system, each);
        if (amount <= 0) continue;
        // What is owed for the time since is spread over it for the first
        // of them; the rest have theirs now.
        give(amount, [one.x, one.y, one.z], first);
        first = false;
      }
      if (ending.length) {
        // Those whose life ended since the last time: where it ended.
        for (const datum of followed.$data) {
          if (!datum) continue;
          const end = datum.start + datum.life;
          if (!(end >= since && end < now)) continue;
          const last = moved(datum, datum.reversed ? 0 : datum.life / 1000, affecting, {});
          let amount = 0;
          for (const each of ending) amount += amountOf(system, each);
          give(amount, [last.x, last.y, last.z], false);
        }
      }
      state.previous = now;
    },
  },
  setup(self) {
    self.$trail = true;
  },
});
