import QtQuick
import QtQuick.Templates as T

// Drawers: where each edge puts one at a position, what is behind it, the
// transitions that move it, and the mouse that drags it open and shut.
Item {
    id: root
    objectName: "root"
    width: 400
    height: 300
    property var log: []
    // How long a drawer takes to come and to go.
    property int time: 200
    readonly property int steps: 21

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }
    function near(value) { return Math.round(value * 1000) / 1000 }

    component Side: T.Drawer {
        id: side
        property string name
        background: Rectangle { color: "white"; border.color: "black" }
        T.Overlay.modal: Rectangle { objectName: side.name + " behind"; color: "#40000000" }
        T.Overlay.modeless: Rectangle { objectName: side.name + " behind"; color: "#20000000" }
        onAboutToShow: root.note(name + " aboutToShow at " + root.near(position))
        onOpened: root.note(name + " opened at " + root.near(position))
        onAboutToHide: root.note(name + " aboutToHide at " + root.near(position))
        onClosed: root.note(name + " closed at " + root.near(position))
    }

    MouseArea {
        anchors.fill: parent
        onPressed: root.note("under pressed")
        onReleased: root.note("under released")
        onCanceled: root.note("under canceled")
    }

    Side {
        id: left
        name: "left"
        width: 100
        height: root.height
        enter: Transition { NumberAnimation { duration: root.time } }
        exit: Transition { NumberAnimation { duration: root.time } }
        T.Button {
            x: 10
            y: 10
            width: 60
            height: 30
            onClicked: root.note("inside clicked")
            onCanceled: root.note("inside canceled")
        }
    }
    // One that is not modal, and comes at a speed, as a style's does.
    Side {
        id: right
        name: "right"
        edge: Qt.RightEdge
        y: 20
        width: 120
        height: 200
        dragMargin: 30
        modal: false
        dim: true
        enter: Transition { SmoothedAnimation { velocity: 5 } }
        exit: Transition { SmoothedAnimation { velocity: 5 } }
    }
    // One with no transition: nothing moves it.
    Side {
        id: top
        name: "top"
        edge: Qt.TopEdge
        x: 50
        width: 300
        height: 80
        dim: false
    }
    // One whose transition is of something else, and that the mouse does
    // not drag.
    Side {
        id: bottom
        name: "bottom"
        edge: Qt.BottomEdge
        implicitWidth: 500
        implicitHeight: 60
        interactive: false
        enter: Transition { NumberAnimation { property: "opacity"; from: 0; to: 1; duration: root.time } }
    }
    Item {
        id: holder
        x: 30
        y: 40
        width: 200
        height: 100
        Side {
            id: held
            name: "held"
            x: 5
            y: 10
            width: 80
            height: 50
            dragMargin: 0
            enter: Transition { NumberAnimation { duration: root.time } }
            exit: Transition { NumberAnimation { duration: root.time } }
        }
    }

    function behind(name) {
        const all = T.Overlay.overlay.children
        for (let i = 0; i < all.length; i++) {
            if (all[i].objectName === name + " behind") return [all[i].x, all[i].y, all[i].width, all[i].height, near(all[i].opacity)]
        }
        return null
    }
    function moving(d) { return (d.enter !== null && d.enter.running) || (d.exit !== null && d.exit.running) }
    function tell(d) {
        // Where it is on its way is a matter of when it is asked.
        if (moving(d)) return [d.name, "moving"]
        // Where its item is, is told of one that is seen.
        const item = d.visible ? d.background.parent : null
        return [d.name, d.visible, d.opened, near(d.position), near(d.x), near(d.y), d.width, d.height,
                item ? near(item.x) : null, item ? near(item.y) : null, d.activeFocus, behind(d.name)]
    }
    function facts(d) {
        return [d.name, d.edge, d.dragMargin, d.interactive, d.modal, d.dim, d.focus, d.closePolicy].join(" ")
    }
    function state() { return [T.Overlay.overlay.visible, tell(left), tell(right), tell(top), tell(bottom), tell(held)] }
    function answers() { return [take(), state()] }

    function step(i) {
        switch (i) {
        case 0: note(facts(left)); note(facts(right)); note(facts(top)); note(facts(bottom)); left.open(); break
        case 1: left.position = 0.5; break
        case 2: left.close(); break
        case 3: right.open(); break
        case 4: right.close(); break
        case 5: top.open(); break
        case 6: top.position = 1; break
        case 7: top.close(); break
        case 8: bottom.open(); break
        case 9: bottom.close(); break
        case 10: held.open(); break
        case 11: held.close(); break
        case 12: left.edge = Qt.BottomEdge; left.open(); break
        case 13: left.close(); break
        case 14: left.edge = Qt.LeftEdge; left.position = 0.25; break
        case 15: left.position = 2; left.open(); break
        case 16: left.modal = false; left.dragMargin = 0; left.interactive = false; note(facts(left)); break
        case 17: left.close(); left.modal = true; left.dragMargin = 10; left.interactive = true; break
        case 18: top.visible = true; top.position = 0.5; break
        case 19: top.edge = Qt.RightEdge; break
        case 20: top.edge = Qt.TopEdge; top.close(); break
        // For the mouse: a drawer is on its way for longer than a release takes.
        case 30: time = 1000; break
        // An edge that is none: Qt says so, and keeps the one it had.
        case 40: left.edge = 3; note("edge " + left.edge); break
        }
    }
}
