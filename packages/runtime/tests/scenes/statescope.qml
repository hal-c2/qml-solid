// What a state changes is a binding of its target's: a name in it is the
// target's before it is the root's, so `parent` is the target's parent.
import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property int size: 7
    property bool on: true

    Item {
        id: box
        x: 10
        y: 10
        width: 200
        height: 100
        property int size: 9
        Item { id: a; width: 20; height: 20 }
        Item { id: b; width: 20; height: 20 }
        Item { id: c; width: 20; height: 20 }
    }
    Item { id: other; x: 50; width: 80; height: 60 }

    states: State {
        name: "on"
        when: root.on
        PropertyChanges { target: a; width: parent.width / 2; height: width + 1; x: size }
        AnchorChanges { target: b; anchors.right: parent.right; anchors.bottom: parent.bottom }
        ParentChange { target: c; parent: other; width: parent.width; x: size }
    }

    function read() {
        return [a.width, a.height, a.x, b.x, b.y, c.width, c.x]
    }

    function step(index) {
        if (index === 0)
            box.width = 300
        else
            root.on = false
    }
}
