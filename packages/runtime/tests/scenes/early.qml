import QtQuick

Item {
    id: root
    width: 400; height: 300

    property var current: null
    // Read before the object it asks is made.
    property int wide: sizes.wide(true)
    property QtObject sizes: QtObject {
        id: sizes
        function wide(big: bool): int { return big ? 300 : 100 }
    }

    // What it is given cannot be evaluated until there is something current.
    Titled {
        id: titled
        title: root.current.title ?? ""
    }

    // Beside one that is below it.
    Rectangle {
        id: beside
        y: 10; width: 40; height: 30
        anchors.left: below.right; anchors.leftMargin: 5
    }
    Rectangle {
        id: below
        x: 7; width: 20; height: 20
        anchors.top: beside.bottom; anchors.topMargin: 3
    }

    function read() {
        return [wide, titled.title, beside.x, beside.y, below.x, below.y]
    }

    function step(index) {
        current = index === 0 ? { title: "first" } : null
    }
}
