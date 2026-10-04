import QtQuick
import QtQuick.Templates as T

// A popup that comes and goes with transitions, and what dims the window
// behind a modal one.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    function note(what) { log.push(what) }
    function now(p) { note("now " + p.visible + " " + p.opened + " " + p.opacity + " " + p.scale) }

    T.Popup {
        id: p
        x: 20; y: 20; width: 100; height: 80
        enter: Transition {
            NumberAnimation { property: "opacity"; from: 0; to: 1; duration: 100 }
            NumberAnimation { property: "scale"; from: 0.5; to: 1; duration: 100 }
        }
        exit: Transition {
            NumberAnimation { property: "opacity"; from: 1; to: 0; duration: 100 }
            NumberAnimation { property: "scale"; from: 1; to: 0.5; duration: 100 }
        }
        onAboutToShow: root.note("aboutToShow")
        onOpened: root.note("opened")
        onAboutToHide: root.note("aboutToHide")
        onClosed: root.note("closed")
        onVisibleChanged: root.note("visible " + visible)
        onOpenedChanged: root.note("openedChanged " + opened)
    }
    T.Popup {
        id: m
        x: 200; y: 150; width: 100; height: 100
        modal: true
        opacity: 0.8
        T.Overlay.modal: Rectangle {
            objectName: "dimmer"
            color: "#80000000"
            opacity: 0.6
            Behavior on opacity { NumberAnimation { duration: 100 } }
        }
        exit: Transition { NumberAnimation { property: "opacity"; to: 0; duration: 100 } }
    }

    function step(i) {
        switch (i) {
        case 0: p.open(); now(p); break
        case 1: p.close(); now(p); break
        case 2: p.open(); p.close(); now(p); break
        case 3: p.open(); break
        case 4: p.close(); p.open(); now(p); break
        case 5: p.close(); break
        case 6: m.open(); break
        case 7: m.close(); break
        case 8: m.open(); break
        }
    }
    property int steps: 9
    function answers() {
        const l = log
        log = []
        const overlay = T.Overlay.overlay
        const kids = []
        for (let i = 0; i < overlay.children.length; i++) {
            const kid = overlay.children[i]
            kids.push([kid.objectName, kid.visible, kid.opacity, kid.scale])
        }
        return [[p.visible, p.opened, p.opacity, p.scale], [m.visible, m.opened, m.opacity], l, kids]
    }
}
