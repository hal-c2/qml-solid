import QtQuick

Item {
    id: root
    property alias first: first
    property alias second: second
    property int mode: Theme.Dense
    property var theme: Theme
    property int raised: Panel.Kind.Raised
    property int plain: Panel.Plain
    width: 400; height: 300

    Rectangle {
        id: first
        width: Theme.grid * 4; height: Theme.grid
        color: "red"
    }
    Rectangle {
        id: second
        x: first.width
        width: root.mode === Theme.Density.Dense ? Theme.grid : Theme.twice
        height: Theme.twice
        color: "blue"
    }
}
