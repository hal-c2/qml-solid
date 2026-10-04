import QtQuick

Item {
    property alias bar: bar
    property alias box: box
    ThroughBar { id: bar }
    Rectangle { id: box; width: 20; height: 20 }
}
