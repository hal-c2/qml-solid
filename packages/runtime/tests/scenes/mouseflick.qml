// A Flickable under a mouse: one with something in it that takes presses,
// one that is a ScrollView's, and something behind them both.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    property alias flickable: f
    property alias scrolled: s
    property alias plain: p
    property alias list: l

    function said() {
        return log.splice(0);
    }

    MouseArea {
        anchors.fill: parent
        onPressed: root.log.push("under pressed")
    }

    Flickable {
        id: f
        width: 100
        height: 300
        contentWidth: 100
        contentHeight: 1000
        onMovementStarted: root.log.push("movementStarted")
        onMovementEnded: root.log.push("movementEnded")
        onDragStarted: root.log.push("dragStarted " + contentY)
        onDragEnded: root.log.push("dragEnded " + contentY)
        onFlickStarted: root.log.push("flickStarted")
        onFlickEnded: root.log.push("flickEnded")

        MouseArea {
            width: 100
            height: 1000
            onPressed: root.log.push("m pressed")
            onReleased: root.log.push("m released")
            onCanceled: root.log.push("m canceled")
            onClicked: root.log.push("m clicked")
        }
    }

    T.ScrollView {
        id: s
        x: 100
        width: 100
        height: 300
        contentWidth: 100
        contentHeight: 1000

        Rectangle {
            width: 100
            height: 1000
            color: "red"
        }
    }

    // Nothing in it takes a press: the press is its own.
    Flickable {
        id: p
        x: 200
        width: 100
        height: 300
        contentWidth: 100
        contentHeight: 1000

        Text {
            text: "plain"
        }
    }

    ListView {
        id: l
        x: 300
        width: 100
        height: 100
        orientation: ListView.Horizontal
        snapMode: ListView.SnapOneItem
        model: 8
        onMovementStarted: root.log.push("movementStarted")
        onMovementEnded: root.log.push("movementEnded")
        onDragStarted: root.log.push("dragStarted " + contentX)
        onDragEnded: root.log.push("dragEnded " + contentX)
        onFlickStarted: root.log.push("flickStarted")
        onFlickEnded: root.log.push("flickEnded")
        delegate: Rectangle {
            width: 100
            height: 100
            color: index % 2 ? "silver" : "gray"

            Text {
                text: index
            }
        }
    }
}
