// A Connections whose handler it calls itself once it is made, as a program
// does to have at the start what the handler does at each change. `heard` is
// what `count` was each time the handler ran.
import QtQuick

Item {
    id: root
    width: 100
    height: 100

    property int count: 0
    property var heard: []

    Connections {
        target: root
        Component.onCompleted: onCountChanged()

        function onCountChanged() {
            root.heard.push(root.count);
        }
    }
}
