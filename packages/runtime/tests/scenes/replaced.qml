// A signal handler among a state's changes is the signal's handler for as
// long as the state is the item's.
import QtQuick

Item {
    id: root
    width: 200
    height: 200

    property var log: []

    MouseArea {
        id: area
        signal poked(int count)
        signal prodded()
        onPoked: (count) => root.log.push("plain " + count)
        onProdded: root.log.push("plain prod")
    }
    Item {
        id: other
        signal called(string name)
        onWidthChanged: root.log.push("own width " + width)
    }

    states: [
        State {
            name: "on"
            PropertyChanges { target: area; onPoked: (count) => root.log.push("on " + count) }
            PropertyChanges {
                area.onProdded: root.log.push("on prod")
                other.onCalled: (name) => { root.log.push("called " + name) }
                other.onWidthChanged: root.log.push("on width " + other.width)
            }
        },
        State {
            name: "further"
            extend: "on"
            PropertyChanges { target: area; onPoked: (count) => root.log.push("further " + count) }
        }
    ]

    function tell(state) {
        root.state = state
        area.poked(log.length)
        area.prodded()
        other.called("you")
        other.width += 1
    }

    function read() {
        log = []
        tell("")
        tell("on")
        tell("further")
        tell("on")
        tell("")
        return log
    }
}
