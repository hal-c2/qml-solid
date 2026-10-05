// A value of an array that is no number is a row like any other: one item
// for it, and the same one when the array is given again with it in it.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    property var values: [1, NaN, 3]

    Column {
        id: column
        Repeater {
            id: repeater
            model: root.values
            Text {
                required property var modelData
                required property int index
                text: index + ":" + modelData
            }
        }
    }
    Column {
        id: other
        x: 100
        Repeater {
            id: mixed
            model: [NaN, NaN, undefined, null, 0, "", "a", "a"]
            Text {
                required property var modelData
                required property int index
                text: index + ":" + modelData
            }
        }
    }

    readonly property int steps: 2
    function step(index) {
        if (index === 0) root.values = [NaN, 2, NaN]
        else root.values = [NaN]
    }

    function texts(column) {
        const all = []
        for (let i = 0; i < column.children.length; i++) {
            if (column.children[i].text !== undefined) all.push(column.children[i].text)
        }
        return all
    }
    function answers() {
        return [repeater.count, texts(column), mixed.count, texts(other)]
    }
}
