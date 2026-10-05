// `Component.onCompleted` is told as Qt tells it: when every object has
// made of the others what it makes of them as it is completed (a Loader its
// item, a Repeater its items, a Row its width), and of the object made last
// first, so of an object before those in it, and of those the last first.
import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property var log: []
    component Part: Item {
        id: part
        property string name
        Component.onCompleted: root.log.push(name + " inner")
        Item { Component.onCompleted: root.log.push(part.name + " child") }
    }
    Component.onCompleted: log.push("root " + [rows.count, row.width, column.height, list.count, loader.item !== null])
    Item {
        Component.onCompleted: root.log.push("a")
        Item { Component.onCompleted: root.log.push("a1") }
        Item { Component.onCompleted: root.log.push("a2") }
    }
    Part { name: "p"; Component.onCompleted: root.log.push("p outer") }
    Row {
        id: row
        Repeater {
            id: rows
            model: 2
            Component.onCompleted: root.log.push("repeater")
            Item {
                required property int index
                width: 15; height: 10
                Component.onCompleted: root.log.push("row " + index)
                Item { Component.onCompleted: root.log.push("row child " + parent.index) }
            }
        }
    }
    Column {
        id: column
        Repeater {
            model: ["a", "b"]
            Rectangle { width: 10; height: 12 }
        }
    }
    ListView {
        id: list
        width: 100; height: 100
        model: 4
        delegate: Item { width: 10; height: 10 }
    }
    Loader {
        id: loader
        Component.onCompleted: root.log.push("loader")
        sourceComponent: Item {
            Component.onCompleted: root.log.push("loaded")
            Part { name: "q" }
        }
    }
    Item {
        Item { Component.onCompleted: root.log.push("b1") }
        Component.onCompleted: root.log.push("b")
    }
    function answers() {
        return log
    }
}
