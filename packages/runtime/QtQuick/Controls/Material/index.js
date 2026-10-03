// `import QtQuick.Controls.Material`: what the Material style is in C++.
import { themed } from "../../Templates/theme.js";

const medium = { weight: 500 };
const large = { pixelSize: 16 };

themed("QtQuick.Controls.Material", {
  font: { pixelSize: 14 },
  fonts: {
    Button: medium,
    DelayButton: medium,
    ItemDelegate: medium,
    TabBar: medium,
    ToolBar: medium,
    ToolSeparator: medium,
    ToolTip: medium,
    CheckDelegate: large,
    RadioDelegate: large,
    SwipeDelegate: large,
    SwitchDelegate: large,
    ComboBox: large,
    Menu: large,
    MenuBar: large,
    MenuBarItem: large,
    MenuItem: large,
    MenuSeparator: large,
    SpinBox: large,
    TextArea: large,
    TextField: large,
  },
});
