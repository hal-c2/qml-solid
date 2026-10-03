// `import QtQuick.Controls.Universal`: what the Universal style is in C++.
import { themed } from "../../Templates/theme.js";

const header = { pixelSize: 24, weight: 300 };

themed("QtQuick.Controls.Universal", {
  font: { pixelSize: 15 },
  fonts: { GroupBox: { weight: 600 }, TabBar: header, TabButton: header },
});
