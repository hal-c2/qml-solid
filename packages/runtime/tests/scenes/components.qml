import QtQuick

Item {
    id: root
    property int grown: 0
    property int narrowed: 0
    property alias first: first
    property alias second: second
    property alias inner: inner
    width: 400; height: 300

    Panel {
        id: first
        title: "first"
        padding: 20
        width: root.width / 2
        bodyColor: "red"
        onResized: (width) => root.grown = width
        Rectangle { id: inner; width: 10; height: parent.height / 2; color: "blue" }
    }
    Panel {
        id: second
        x: first.width
        onWidthChanged: { root.narrowed = width }
    }
}
