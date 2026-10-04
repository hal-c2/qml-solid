// Repeater: an item for every row of a model, as children of its own parent.
import { createSignal, untrack } from "solid-js";
import { defineType, effect, slot } from "../object.js";
import { Item } from "./Item.js";
import { delegateOf, modelOf, Rows, size } from "./model.js";

const WRITABLE = { ownedWrite: true };
const next = (version) => version + 1;

// The items in the order of their rows: what `Item` puts in the parent's
// `children` after the Repeater.
function ordered(self) {
  const { rows } = self.$repeat;
  const items = [];
  for (let index = 0; index < rows.count; index++) {
    const item = rows.live.get(index)?.$item;
    if (item?.$node) items.push(item);
  }
  return items;
}

export const Repeater = defineType("Repeater", Item, {
  properties: { model: undefined, delegate: undefined, count: 0 },
  signals: ["itemAdded", "itemRemoved"],
  methods: {
    itemAt(index) {
      return this.$repeat.rows.live.get(index)?.$item ?? null;
    },
    $siblings() {
      const state = this.$repeat;
      state.version();
      return (state.items ??= ordered(this));
    },
  },
  setup(self) {
    const [version, bump] = createSignal(0, WRITABLE);
    const changed = () => {
      state.items = null;
      slot(self, "count").write(rows.count);
      bump(next);
    };
    const rows = new Rows({
      self,
      owner: self.$owner,
      parent: () => self.$parent,
      // Every row has its item, whether or not it can be seen.
      inserted(index, count) {
        if (rows.ready) for (let at = index; at < index + count; at++) rows.row(at);
        changed();
      },
      removed(index, count, gone) {
        changed();
        for (const row of gone) self.itemRemoved(row.$index, row.$item);
      },
      moved: changed,
      created: (row) => self.itemAdded(row.$index, row.$item),
    });
    const state = (self.$repeat = { rows, version, items: null });
    effect(
      () => {
        const model = modelOf(self.model);
        return [model, delegateOf(self.model, self.delegate), size(model)];
      },
      ([model, delegate]) => void untrack(() => rows.set(model, delegate)),
    );
  },
});
