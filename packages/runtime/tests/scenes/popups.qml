import QtQuick
import QtQuick.Templates as T

// Popups as a style writes them: where each is shown, how big it is, and
// what it tells of as it opens and closes.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    property alias plain: plain
    property alias big: big
    property alias mid: mid
    property alias over: over
    property alias shown: shown

    function geo(p) {
        const c = p.contentItem
        const b = p.background
        const at = c.parent ? c.parent.mapToItem(root, 0, 0) : null
        return [p.x, p.y, p.width, p.height, p.implicitWidth, p.implicitHeight, p.contentWidth, p.contentHeight,
                p.availableWidth, p.availableHeight, p.implicitContentWidth, p.implicitBackgroundWidth,
                p.visible, p.opened, p.opacity, p.scale, p.z,
                at ? [at.x, at.y] : null, [c.x, c.y, c.width, c.height, c.visible], b ? [b.x, b.y, b.width, b.height, b.z] : null,
                c.parent.parent === T.Overlay.overlay, c.parent.visible, p.activeFocus, p.focus, p.modal, p.dim, p.closePolicy,
                p.margins, p.topMargin, p.parent === anchor]
    }
    function place(p) {
        const at = p.contentItem.parent.mapToItem(root, 0, 0)
        return [p.x, p.y, p.width, p.height, at.x, at.y, p.visible]
    }

    Item {
        id: anchor
        x: 50; y: 40; width: 100; height: 60
        T.Popup {
            id: plain
            x: 10; y: 20
            padding: 5
            background: Rectangle { implicitWidth: 80; implicitHeight: 50; color: "yellow" }
            Item { implicitWidth: 60; implicitHeight: 30 }
            onAboutToShow: root.log.push("aboutToShow " + visible + " " + opened)
            onOpened: root.log.push("opened " + visible + " " + opened)
            onAboutToHide: root.log.push("aboutToHide " + visible + " " + opened)
            onClosed: root.log.push("closed " + visible + " " + opened)
            onVisibleChanged: root.log.push("visible " + visible)
            onOpenedChanged: root.log.push("openedChanged " + opened)
            onXChanged: root.log.push("x " + x)
        }
        T.Popup {
            id: big
            x: 300; y: 200
            implicitWidth: 120; implicitHeight: 90
            contentItem: Rectangle { color: "green" }
        }
        T.Popup {
            id: mid
            anchors.centerIn: parent
            width: 31; height: 21
        }
        T.Popup {
            id: over
            anchors.centerIn: T.Overlay.overlay
            width: 101; height: 51
        }
    }
    T.Popup {
        id: shown
        x: 5; y: 250
        width: 40; height: 30
        visible: true
        onOpened: root.log.push("shown opened")
    }
    function step(i) {
        switch (i) {
        case 0: plain.open(); break
        case 1: plain.x = 30; break
        case 2: plain.close(); break
        case 3: plain.padding = 8; plain.visible = true; break
        case 4: plain.visible = false; big.open(); break
        case 5: big.margins = 10; break
        case 6: big.x = -100; big.y = -100; break
        case 7: big.margins = -1; big.leftMargin = 4; break
        case 8: big.width = 500; break
        case 9: big.close(); mid.open(); over.open(); break
        case 10: anchor.x = 200; anchor.width = 150; break
        case 11: over.margins = 160; mid.margins = 0; break
        }
    }
    property int steps: 12
    function answers() {
        const l = log
        log = []
        const o = T.Overlay.overlay
        return [geo(plain), geo(big), l, [o.x, o.y, o.width, o.height, o.z, o.visible, o.children.length], place(mid), place(over), place(shown)]
    }
}
