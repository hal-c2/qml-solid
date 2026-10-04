// Accessible: what an item is to someone who does not see it. A page says
// that with ARIA attributes on the item's element, and so does this: what
// reads the page aloud reads a QML program as it reads any other.
import { defineType, effect, QtObject, slot } from "../object.js";

// prettier-ignore
const Role = {
  NoRole: 0, TitleBar: 1, MenuBar: 2, ScrollBar: 3, Grip: 4, Sound: 5, Cursor: 6, Caret: 7, AlertMessage: 8,
  Window: 9, Client: 10, PopupMenu: 11, MenuItem: 12, ToolTip: 13, Application: 14, Document: 15, Pane: 16,
  Chart: 17, Dialog: 18, Border: 19, Grouping: 20, Separator: 21, ToolBar: 22, StatusBar: 23, Table: 24,
  ColumnHeader: 25, RowHeader: 26, Column: 27, Row: 28, Cell: 29, Link: 30, HelpBalloon: 31, Assistant: 32,
  List: 33, ListItem: 34, Tree: 35, TreeItem: 36, PageTab: 37, PropertyPage: 38, Indicator: 39, Graphic: 40,
  StaticText: 41, EditableText: 42, Button: 43, PushButton: 43, CheckBox: 44, RadioButton: 45, ComboBox: 46,
  ProgressBar: 48, Dial: 49, HotkeyField: 50, Slider: 51, SpinBox: 52, Canvas: 53, Animation: 54, Equation: 55,
  ButtonDropDown: 56, ButtonMenu: 57, ButtonDropGrid: 58, Whitespace: 59, PageTabList: 60, Clock: 61,
  Splitter: 62, LayeredPane: 128, Terminal: 129, Desktop: 130, Paragraph: 131, WebDocument: 132, Section: 133,
  Notification: 134, Switch: 135, ColorChooser: 1028, Footer: 1038, Form: 1040, Heading: 1044, Note: 1051,
  ComplementaryContent: 1068, BlockQuote: 1073, UserRole: 65535,
};

// The roles ARIA has a word for. One it has none for is left unsaid: what
// the element holds is read as it is.
// prettier-ignore
const ARIA = {
  [Role.MenuBar]: "menubar", [Role.ScrollBar]: "scrollbar", [Role.AlertMessage]: "alert", [Role.PopupMenu]: "menu",
  [Role.MenuItem]: "menuitem", [Role.ToolTip]: "tooltip", [Role.Application]: "application",
  [Role.Document]: "document", [Role.Dialog]: "dialog", [Role.Grouping]: "group", [Role.Separator]: "separator",
  [Role.ToolBar]: "toolbar", [Role.StatusBar]: "status", [Role.Table]: "table", [Role.ColumnHeader]: "columnheader",
  [Role.RowHeader]: "rowheader", [Role.Row]: "row", [Role.Cell]: "cell", [Role.Link]: "link", [Role.List]: "list",
  [Role.ListItem]: "listitem", [Role.Tree]: "tree", [Role.TreeItem]: "treeitem", [Role.PageTab]: "tab",
  [Role.PropertyPage]: "tabpanel", [Role.Graphic]: "img", [Role.EditableText]: "textbox", [Role.Button]: "button",
  [Role.CheckBox]: "checkbox", [Role.RadioButton]: "radio", [Role.ComboBox]: "combobox",
  [Role.ProgressBar]: "progressbar", [Role.Dial]: "slider", [Role.Slider]: "slider", [Role.SpinBox]: "spinbutton",
  [Role.Equation]: "math", [Role.ButtonDropDown]: "button", [Role.ButtonMenu]: "button", [Role.PageTabList]: "tablist",
  [Role.Paragraph]: "paragraph", [Role.WebDocument]: "document", [Role.Notification]: "status", [Role.Switch]: "switch",
  [Role.Footer]: "contentinfo", [Role.Form]: "form", [Role.Heading]: "heading", [Role.Note]: "note",
  [Role.ComplementaryContent]: "complementary", [Role.BlockQuote]: "blockquote",
};

const Polite = 0;
const Assertive = 1;

// What is announced is put where a reader listens: one place for all.
let live;
function announce(message, politeness) {
  if (!live) {
    live = document.createElement("div");
    live.style.cssText = "position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);";
    document.body.append(live);
  }
  live.setAttribute("aria-live", politeness === Assertive ? "assertive" : "polite");
  live.textContent = String(message);
}

// The item's element says where it is found by another's `labelledBy`.
let count = 0;
const named = (item) => (item?.$node ? (item.$node.id ||= `qq-accessible-${++count}`) : null);

// An attribute a state has only when the item says it has that state.
const states = [
  ["checked", "aria-checked", (self) => self.checkable || self.checked],
  ["pressed", "aria-pressed", (self) => self.pressed],
  ["selected", "aria-selected", (self) => self.selectable || self.selected],
  ["readOnly", "aria-readonly", (self) => self.readOnly],
  ["multiLine", "aria-multiline", (self) => self.multiLine],
];

const AccessibleAttached = defineType("AccessibleAttached", QtObject, {
  properties: {
    role: Role.NoRole,
    name: "",
    description: "",
    id: "",
    ignored: false,
    labelledBy: null,
    labelFor: null,
    checkable: false,
    checked: false,
    editable: false,
    focusable: false,
    focused: false,
    multiLine: false,
    readOnly: false,
    selected: false,
    selectable: false,
    pressed: false,
    checkStateMixed: false,
    defaultButton: false,
    passwordEdit: false,
    selectableText: false,
    searchEdit: false,
  },
  // The actions are asked for by what reads the page; a browser asks for
  // them by clicking, which the item hears as it hears any click.
  signals: [
    "pressAction",
    "toggleAction",
    "increaseAction",
    "decreaseAction",
    "scrollUpAction",
    "scrollDownAction",
    "scrollLeftAction",
    "scrollRightAction",
    "previousPageAction",
    "nextPageAction",
  ],
  enums: { ...Role, Polite, Assertive },
  methods: {
    announce,
    setIgnored(ignored) {
      slot(this, "ignored").write(Boolean(ignored));
    },
    // The text of what is marked up, as it is read.
    stripHtml(html) {
      return new DOMParser().parseFromString(String(html), "text/html").body.textContent ?? "";
    },
    // The browser tells of an element's changes itself.
    valueChanged() {},
    cursorPositionChanged() {},
  },
  setup(self, props) {
    const node = props.$attachee?.$node;
    if (!node) return;
    const set = (name, value) => (value === null || value === "" ? node.removeAttribute(name) : node.setAttribute(name, value));
    effect(
      () => [
        self.searchEdit ? "searchbox" : (ARIA[self.role] ?? null),
        self.name,
        self.description,
        self.ignored,
        named(self.labelledBy),
        ...states.map(([name, , has]) => (has(self) ? (name === "checked" && self.checkStateMixed ? "mixed" : String(self[name])) : null)),
      ],
      ([role, name, description, ignored, labelledBy, ...said]) => {
        set("role", role);
        set("aria-label", name);
        set("aria-description", description);
        set("aria-hidden", ignored ? "true" : null);
        set("aria-labelledby", labelledBy);
        states.forEach(([, attribute], index) => set(attribute, said[index]));
      },
    );
    // What an item is the label for is labelled by it.
    effect(
      () => self.labelFor?.$node ?? null,
      (labelled) => labelled?.setAttribute("aria-labelledby", named(props.$attachee)),
    );
  },
});

export const Accessible = defineType("Accessible", QtObject, {
  enums: { ...Role, Polite, Assertive },
  attached: AccessibleAttached,
});
// `Accessible.announce(...)` is said of the type as well as of an item.
Accessible.announce = announce;
