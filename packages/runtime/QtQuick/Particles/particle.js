// What `onEmitParticles` and `onAffectParticles` are given: a particle as an
// object, for JavaScript to read and change. It is made only for a handler;
// nothing else looks at a particle this way.
import { accelerate, END, LIFE, move, position, propel, SIZE, STRIDE, T, velocity, X, Y } from "./system.js";

export class Particle {
  constructor(sim, group, index) {
    this.$sim = sim;
    this.$group = group;
    this.$index = index;
    // Qt repaints the particle when a handler sets this; every frame does here.
    this.update = false;
  }

  get lifeLeft() {
    const data = this.$group.data;
    const at = this.$index * STRIDE;
    return data[at + T] + data[at + LIFE] - this.$sim.now / 1000;
  }

  // Between its two sizes by how much of its life is gone.
  get currentSize() {
    const data = this.$group.data;
    const at = this.$index * STRIDE;
    const life = data[at + LIFE];
    if (!life) return 0;
    return data[at + SIZE] + (data[at + END] - data[at + SIZE]) * (1 - this.lifeLeft / life);
  }

  // It is gone at the next frame.
  discard() {
    this.$group.data[this.$index * STRIDE + LIFE] = 0;
  }
}

const define = (name, get, set) =>
  Object.defineProperty(Particle.prototype, name, { get, set, enumerable: true, configurable: true });

const age = (particle) => particle.$sim.now / 1000 - particle.$group.data[particle.$index * STRIDE + T];

// A number of the row as it is.
function field(name, offset) {
  define(
    name,
    function () {
      return this.$group.data[this.$index * STRIDE + offset];
    },
    function (value) {
      this.$group.data[this.$index * STRIDE + offset] = value;
    },
  );
}

// What the particle was emitted with, and what it has now: assigning to the
// second changes its course from here on and leaves the rest as it is.
function axis(initial, current, offset) {
  field(`initial${initial}`, offset);
  field(`initialV${initial}`, offset + 2);
  field(`initialA${initial}`, offset + 4);
  const now = (name, read, write) =>
    define(
      name,
      function () {
        return read(this.$group.data, this.$index * STRIDE + offset, age(this));
      },
      function (value) {
        write(this.$group.data, this.$index * STRIDE + offset, age(this), value);
      },
    );
  now(current, position, move);
  now(`v${current}`, velocity, propel);
  now(`a${current}`, (data, at) => data[at + 4], accelerate);
}

axis("X", "x", X);
axis("Y", "y", Y);
field("t", T);
field("lifeSpan", LIFE);
field("startSize", SIZE);
field("endSize", END);

// A channel of its colour, from 0 to 1.
["red", "green", "blue", "alpha"].forEach((name, channel) =>
  define(
    name,
    function () {
      return this.$group.color[this.$index * 4 + channel] / 255;
    },
    function (value) {
      this.$group.color[this.$index * 4 + channel] = Math.min(Math.max(value, 0), 1) * 255;
    },
  ),
);

// Radians, and radians a second.
["rotation", "rotationVelocity"].forEach((name, which) =>
  define(
    name,
    function () {
      return this.$group.spin[this.$index * 2 + which];
    },
    function (value) {
      this.$group.spin[this.$index * 2 + which] = value;
    },
  ),
);

define(
  "autoRotate",
  function () {
    return this.$group.facing[this.$index] !== 0;
  },
  function (value) {
    this.$group.facing[this.$index] = value ? 1 : 0;
  },
);
