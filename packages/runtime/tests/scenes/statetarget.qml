// A state's target that is not named by its id is known only to the running
// program, and what is changed of it is a binding of its all the same: a
// name is the target's before it is the root's.
import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property string tag: "root"
    property int amount: 7
    property var chosen: other

    function pick() { return box.children[0] }

    Rectangle {
        id: box
        property string tag: "box"
        width: 10; height: 11
        Rectangle {
            id: kid
            property string tag: "kid"
            property string said
            property string heard
            width: 20; height: 21
        }
    }
    Rectangle { id: other; property string tag: "other"; property string said; width: 30; height: 31 }
    Text { id: label; text: "label"; property string tag: "label"; property string said; width: 40 }

    states: [
        State {
            name: "expression"
            PropertyChanges {
                target: box.children[0]
                said: tag + ":" + width + ":" + amount
                heard: parent.tag
                height: width * 2
            }
            PropertyChanges { target: root.chosen; said: tag + ":" + width + ":" + amount }
        },
        State {
            name: "call"
            PropertyChanges { target: pick(); said: { const mine = tag; return mine + "/" + Math.round(width) } }
            // `text` is nothing the root has.
            PropertyChanges { target: root.amount > 5 ? label : other; said: tag + "/" + text }
        },
        State {
            name: "property"
            PropertyChanges { target: chosen; said: tag + "#" + width + "#" + amount }
        }
    ]

    function step(index) {
        if (index === 0)
            state = "expression"
        else if (index === 1)
            kid.width = 25
        else if (index === 2)
            chosen = label
        else if (index === 3)
            state = "call"
        else if (index === 4)
            kid.width = 26
        else if (index === 5)
            state = "property"
        else if (index === 6)
            state = "expression"
        else
            state = ""
    }

    function read() {
        return [state, kid.said, kid.heard, kid.height, other.said, label.said]
    }
}
