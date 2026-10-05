// What a state binds a property to may come of the property itself, as any
// binding may: an item as high as it is made wide, in a layout whose own
// size comes of its items'.
import QtQuick
import QtQuick.Layouts

Item {
    id: root
    width: 200
    height: 100

    RowLayout {
        id: row
        spacing: 0

        Rectangle {
            id: first
            implicitWidth: 40
            implicitHeight: 20
            color: "red"
        }
        Rectangle {
            id: second
            implicitWidth: 30
            implicitHeight: 10
            color: "blue"
        }
    }

    states: State {
        name: "tall"
        PropertyChanges { target: first; implicitHeight: first.width / 2 + 4 }
        PropertyChanges { target: second; implicitWidth: row.implicitHeight + 5 }
    }

    function sizes() {
        return [row.implicitWidth, row.implicitHeight, first.width, first.height, second.width, second.height]
    }
}
