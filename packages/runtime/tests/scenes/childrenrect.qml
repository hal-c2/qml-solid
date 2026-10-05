// `childrenRect`: the rectangle the children of an item take together, seen
// or not, which is where it is given no children of its own.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    Item { id: none }
    Item {
        id: some
        Rectangle { id: first; x: 10; y: 20; width: 30; height: 40 }
        Rectangle { id: hidden; x: -5; y: 30; width: 10; height: 80; visible: false }
        Repeater {
            id: many
            model: 2
            Rectangle { required property int index; x: 50 + index * 20; y: 5; width: 15; height: 10 }
        }
    }
    Row {
        id: row
        y: 150
        height: childrenRect.height
        spacing: 4
        Rectangle { width: 20; height: 30; color: "red" }
        Rectangle { id: tall; width: 20; height: 50; color: "blue" }
    }
    Item {
        id: fitted
        y: 220
        width: childrenRect.width
        height: childrenRect.height
        Text { id: label; text: "fitted" }
    }

    readonly property int steps: 3
    function step(index) {
        if (index === 0) { first.width = 5; tall.height = 10 }
        else if (index === 1) { hidden.x = 100; many.model = 0 }
        else { first.destroy(); hidden.destroy() }
    }
    function read(rect) {
        return [rect.x, rect.y, rect.width, rect.height]
    }
    function answers() {
        return [read(none.childrenRect), read(some.childrenRect), read(row.childrenRect), row.height, read(fitted.childrenRect), fitted.width, fitted.height]
    }
}
