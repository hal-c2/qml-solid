// A `state` named from the start whose own `when` does not hold is not the
// state: there is none. One with no `when` stays.
import QtQuick

Item {
    id: root
    width: 200
    height: 100
    property bool narrow: false
    property var heard: []

    Rectangle {
        id: box
        width: 50
        height: 50
        state: "narrow"
        onStateChanged: root.heard.push("box " + state)
        states: [
            State {
                name: "narrow"
                when: root.narrow
                PropertyChanges {
                    target: box
                    width: 20
                }
            },
            State {
                name: "wide"
                PropertyChanges {
                    target: box
                    width: 120
                }
            }
        ]
    }

    Rectangle {
        id: other
        width: 50
        height: 50
        state: "wide"
        onStateChanged: root.heard.push("other " + state)
        states: [
            State {
                name: "narrow"
                when: root.narrow
                PropertyChanges {
                    target: other
                    width: 20
                }
            },
            State {
                name: "wide"
                PropertyChanges {
                    target: other
                    width: 120
                }
            }
        ]
    }

    function read() {
        return [box.state, box.width, other.state, other.width, root.heard.splice(0).sort().join(", ")]
    }

    function step(index) {
        root.narrow = index === 1
    }
}
