import QtQuick

// A component of a component: the enums of what its root is are its own too.
Swatch {
    enum Finish { Matt = 20, Gloss }

    property int finish: Chart.Gloss
    property int inherited: Chart.Mid
}
