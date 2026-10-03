// A stand-in for the app behind the UI: the `Shell` and `Theme` singletons the
// bricks bind to. In hal-c2 this state comes from the server; the C++ side of
// a Qt front end would arrive here through Qt for WebAssembly.
import { createStore } from "solid-js";

const themes = {
  dark: {
    bg: "#16161e", text: "#c0caf5", dim: "#7982a9", faint: "#3b4261",
    accent: "#7aa2f7", error: "#f7768e", success: "#9ece6a", warning: "#e0af68",
  },
  light: {
    bg: "#f5f5f0", text: "#343b58", dim: "#6c6e75", faint: "#c4c6cd",
    accent: "#2959aa", error: "#8c4351", success: "#385f0d", warning: "#8f5e15",
  },
};

const [theme, updateTheme] = createStore({ colors: { ...themes.dark } });
export const Theme = theme;
export const setTheme = (name) =>
  updateTheme((draft) => {
    Object.assign(draft.colors, themes[name]);
  });

const [state, setState] = createStore({
  timeline: { working: { text: "● Working… 12s" }, width: 60 },
  composer: { answering: true },
  userInput: {
    headerLine: "Question 1/1",
    questionLine: "Which renderer should we target first?",
    options: [{ line: "▸ 1. Web" }, { line: "  2. OpenTUI" }, { line: "  3. Both" }],
    hint: "↑↓ choose · Enter answer · Esc set aside",
  },
  notifications: {
    items: [
      { id: "n1", type: "success", title: "Compiled", description: "10 bricks", actions: [{ id: "open", label: "Open" }] },
      { id: "n2", type: "error", title: "Build failed", description: "", actions: [] },
    ],
  },
  approvals: {
    count: 2,
    countText: "1 of 2",
    hint: "y approve · n deny",
    items: [
      { requestId: "a1", active: true, label: "Run `cargo test`" },
      { requestId: "a2", active: false, label: "Write Cargo.toml" },
    ],
  },
  revert: { open: false, title: "Revert to…", rows: [], emptyText: "Nothing to revert", hint: "Esc close" },
  overlay: null,
});

const actions = {
  "notification.dismiss": ({ id }) =>
    setState((draft) => {
      draft.notifications.items = draft.notifications.items.filter((item) => item.id !== id);
    }),
  "project.add": () =>
    setState((draft) => {
      draft.notifications.items.push({
        id: "n" + Date.now(), type: "warning", title: "Project added", description: "", actions: [],
      });
    }),
};

export const Shell = {
  state,
  setState,
  log: [],
  dispatch(action, payload) {
    this.log.push([action, payload]);
    actions[action]?.(payload ?? {});
    return true;
  },
};
