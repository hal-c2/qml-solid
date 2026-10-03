// What the compiler would emit for an object, written by hand: the props are
// given as they are (a getter is a binding), the children as a function that
// makes them, so that they are made inside their parent.
import { createComponent } from "solid-js";

export function make(Type, props = {}, children) {
  if (children) Object.defineProperty(props, "children", { get: children, enumerable: true });
  return createComponent(Type, props);
}

// The rectangle a test finds an item by.
export const box = (item) => item.$node.getBoundingClientRect();
