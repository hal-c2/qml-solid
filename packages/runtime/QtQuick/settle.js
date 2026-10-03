// What a method does once it has changed something: what depends on the
// change is up to date when the method returns, as it is in QML.
//
// The one place that says how, for the types here: a method that a change
// handler calls is already inside a flush, where asking for another is
// refused with a warning, and only the kernel knows when that is.
export { flush as settle } from "solid-js";
