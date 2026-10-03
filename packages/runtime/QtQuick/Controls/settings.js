// What an application's `qtquickcontrols2.conf` says of the styles, by its
// groups: `{ Material: { Theme: "Dark", Accent: "Red" } }`. The build tells,
// as it tells which style it chose; a style takes its group when it is
// there, which may be before or after the style itself is loaded.
const groups = new Map();
const styles = new Map();

export function configure(all) {
  for (const [group, values] of Object.entries(all ?? {})) {
    groups.set(group, values);
    styles.get(group)?.(values);
  }
}

// `take` is given the group now if the build has told of one, and whenever
// it tells.
export function configured(group, take) {
  styles.set(group, take);
  if (groups.has(group)) take(groups.get(group));
}
