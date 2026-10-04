import QtQuick
import QtQuick.Layouts

// A Repeater in a layout has no cell; an item with no size has one.
Item {
    id: root
    width: 400
    height: 300

    GridLayout {
        id: grid
        columns: 2
        width: 300
        height: 200
        columnSpacing: 10
        rowSpacing: 10

        Repeater {
            id: cells
            model: 3
            Rectangle {
                implicitWidth: 50
                implicitHeight: 40
                Layout.alignment: Qt.AlignHCenter
            }
        }
    }

    RowLayout {
        id: row
        y: 220
        spacing: 10

        Rectangle { id: first; implicitWidth: 50; implicitHeight: 40 }
        Repeater {
            id: more
            model: 1
            Rectangle { implicitWidth: 50; implicitHeight: 40 }
        }
        Item { id: empty }
        Rectangle { id: last; implicitWidth: 50; implicitHeight: 40 }
    }

    function place(item) {
        return [item.x, item.y, item.width, item.height]
    }

    function read() {
        return [
            [0, 1, 2].map(index => place(cells.itemAt(index))),
            place(cells),
            [grid.implicitWidth, grid.implicitHeight],
            [first, more.itemAt(0), more, empty, last].map(place),
            [row.implicitWidth, row.implicitHeight],
            row.children.map(child => [first, more.itemAt(0), more, empty, last].indexOf(child))
        ]
    }
}
