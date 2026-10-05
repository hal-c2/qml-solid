// What `createObject` gives an object, the object has before it is complete.
import QtQuick

Item {
    id: root
    width: 200
    height: 200
    property var made: null

    Component {
        id: maker
        Item {
            property int kind: 0
            property int first: -1
            Behavior on y { NumberAnimation { duration: 200 } }
            Component.onCompleted: first = kind
        }
    }

    function make() {
        made = maker.createObject(root, { kind: 3, y: -40, width: 40 })
        const at = made.y
        made.y = 80
        return [at, made.y, made.first, made.width]
    }
    function where() { return made.y }
}
