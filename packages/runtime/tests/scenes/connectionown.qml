// `target: Component` is the attached object of the Connections itself: its
// handlers are told of its own completion.
import QtQuick

Item {
    id: root
    width: 100
    height: 100

    property var said: []

    Component.onCompleted: said.push("root")

    Connections {
        target: Component
        function onCompleted() { root.said.push("own") }
    }
    Connections {
        target: Component
        enabled: false
        function onCompleted() { root.said.push("off") }
    }
}
