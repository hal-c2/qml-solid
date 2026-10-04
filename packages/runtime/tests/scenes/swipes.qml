// SwipeDelegate: a row that is dragged aside to show what is under it. What
// it says is noted, and compared with what Qt's says of the same.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }

    property alias sd: sd
    property alias sb: sb
    property alias sx: sx
    property alias se: se
    property alias sn: sn
    property Component other: Rectangle { width: 30; height: 40 }

    // Something to the left and something to the right, there at once.
    T.SwipeDelegate {
        id: sd
        x: 10; y: 10; width: 200; height: 40
        text: "sd"
        leftPadding: 5
        swipe.left: Rectangle { width: 60; height: 40; color: "green" }
        swipe.right: Rectangle {
            width: 80; height: 40; color: "red"
            anchors.right: parent.right
            T.SwipeDelegate.onClicked: root.note("sdr.clicked")
            T.SwipeDelegate.onPressedChanged: root.note("sdr.down " + T.SwipeDelegate.pressed)
        }
        swipe.onPositionChanged: root.note("sd.position " + sd.swipe.position.toFixed(3))
        swipe.onCompleteChanged: root.note("sd.complete " + sd.swipe.complete)
        swipe.onOpened: root.note("sd.opened")
        swipe.onClosed: root.note("sd.closed")
        swipe.onCompleted: root.note("sd.completed")
        onPressed: root.note("sd.pressed")
        onReleased: root.note("sd.released")
        onClicked: root.note("sd.clicked")
        onCanceled: root.note("sd.canceled")
        onDownChanged: root.note("sd.down " + down)
        contentItem: Text { text: sd.text }
        background: Rectangle { color: "white" }
    }
    // One thing behind all of it, and the way there takes time.
    T.SwipeDelegate {
        id: sb
        x: 10; y: 60; width: 200; height: 40
        text: "sb"
        swipe.behind: Rectangle { width: sb.width; height: sb.height; color: "blue" }
        swipe.transition: Transition { NumberAnimation { duration: 100 } }
        swipe.onCompleteChanged: root.note("sb.complete " + sb.swipe.complete)
        swipe.onOpened: root.note("sb.opened")
        swipe.onClosed: root.note("sb.closed")
        swipe.onCompleted: root.note("sb.completed")
        onClicked: root.note("sb.clicked")
        onCanceled: root.note("sb.canceled")
        contentItem: Text { text: sb.text }
        background: Rectangle { color: "white" }
    }
    // A button under it.
    T.SwipeDelegate {
        id: sx
        x: 10; y: 110; width: 200; height: 40
        text: "sx"
        swipe.right: Item {
            width: 80; height: 40
            anchors.right: parent.right
            T.Button {
                width: 80; height: 40
                onPressed: root.note("sxb.pressed")
                onClicked: root.note("sxb.clicked")
                onCanceled: root.note("sxb.canceled")
                background: Rectangle { color: "orange" }
            }
        }
        swipe.onPositionChanged: root.note("sx.position " + sx.swipe.position.toFixed(3))
        swipe.onOpened: root.note("sx.opened")
        swipe.onClosed: root.note("sx.closed")
        onPressed: root.note("sx.pressed")
        onClicked: root.note("sx.clicked")
        onCanceled: root.note("sx.canceled")
        onDownChanged: root.note("sx.down " + down)
        contentItem: Text { text: sx.text }
        background: Rectangle { color: "white" }
    }
    // Not to be swiped.
    T.SwipeDelegate {
        id: se
        x: 10; y: 160; width: 200; height: 40
        text: "se"
        swipe.enabled: false
        swipe.left: Rectangle { width: 60; height: 40; color: "green" }
        swipe.onPositionChanged: root.note("se.position " + se.swipe.position.toFixed(3))
        onPressed: root.note("se.pressed")
        onClicked: root.note("se.clicked")
        onCanceled: root.note("se.canceled")
        onDownChanged: root.note("se.down " + down)
        contentItem: Text { text: se.text }
        background: Rectangle { color: "white" }
    }
    // Nothing under it: a row like any other.
    T.SwipeDelegate {
        id: sn
        x: 10; y: 210; width: 200; height: 40
        text: "sn"
        swipe.onPositionChanged: root.note("sn.position " + sn.swipe.position.toFixed(3))
        onPressed: root.note("sn.pressed")
        onClicked: root.note("sn.clicked")
        onCanceled: root.note("sn.canceled")
        onDownChanged: root.note("sn.down " + down)
        contentItem: Text { text: sn.text }
        background: Rectangle { color: "white" }
    }

    function answers() {
        return [
            [sd.swipe.position, sd.swipe.complete, sd.swipe.enabled, sd.swipe.leftItem, sd.swipe.rightItem,
             sd.swipe.behindItem, sd.swipe.behind, sn.swipe.left, sn.swipe.transition],
            [T.SwipeDelegate.Left, T.SwipeDelegate.Right, sd.focusPolicy, sd.highlighted, sd.checkable],
            [sd.contentItem.x, sd.contentItem.width, sd.background.x, sd.background.width, sd.background.z],
            [se.swipe.enabled, sb.swipe.transition !== null, sd.swipe.left !== null, sb.swipe.behind !== null],
        ]
    }
}
