import QtQuick
import QtQuick.Templates as T

// Popups under the mouse and the keys: what closes them, what a press gets
// through to, and where focus goes.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    property alias a: a
    property alias b: b
    property alias m: m

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }

    MouseArea {
        id: under
        anchors.fill: parent
        hoverEnabled: true
        onPressed: root.note("under pressed")
        onReleased: root.note("under released")
        onClicked: root.note("under clicked")
        onContainsMouseChanged: root.note("under hover " + containsMouse)
    }
    Item {
        id: field
        width: 20; height: 20
        activeFocusOnTab: true
        onActiveFocusChanged: root.note("field active " + activeFocus)
        Keys.onPressed: (event) => root.note("field key " + event.key)
    }

    T.Overlay.onPressed: root.note("overlay pressed")
    T.Overlay.onReleased: root.note("overlay released")

    Item {
        id: anchor
        x: 50; y: 40; width: 100; height: 60
        T.Popup {
            id: a
            x: 10; y: 20
            width: 100; height: 80
            background: Rectangle { color: "yellow" }
            T.Overlay.modal: Rectangle { color: "#80ff0000"; objectName: "modalDimmer" }
            T.Overlay.modeless: Rectangle { color: "#8000ff00"; objectName: "modelessDimmer" }
            onAboutToShow: root.note("a aboutToShow")
            onOpened: root.note("a opened")
            onAboutToHide: root.note("a aboutToHide")
            onClosed: root.note("a closed")
            onActiveFocusChanged: root.note("a active " + activeFocus)
            MouseArea {
                id: inner
                width: 30; height: 30
                onPressed: root.note("inner pressed")
                onClicked: root.note("inner clicked")
            }
        }
        T.Popup {
            id: b
            x: 60; y: 60
            width: 100; height: 80
            focus: true
            background: Rectangle { color: "cyan" }
            onAboutToShow: root.note("b aboutToShow")
            onOpened: root.note("b opened")
            onAboutToHide: root.note("b aboutToHide")
            onClosed: root.note("b closed")
            onActiveFocusChanged: root.note("b active " + activeFocus)
            Item {
                id: first
                width: 10; height: 10
                focus: true
                activeFocusOnTab: true
                onActiveFocusChanged: root.note("first active " + activeFocus)
                Keys.onPressed: (event) => root.note("first key " + event.key)
            }
            Item {
                id: second
                y: 20; width: 10; height: 10
                activeFocusOnTab: true
                onActiveFocusChanged: root.note("second active " + activeFocus)
            }
        }
    }
    T.Popup {
        id: m
        x: 200; y: 150; width: 100; height: 100
        modal: true
        T.Overlay.modal: Rectangle { color: "#80ff0000"; objectName: "modalDimmer" }
        onAboutToShow: root.note("m aboutToShow")
        onOpened: root.note("m opened")
        onAboutToHide: root.note("m aboutToHide")
        onClosed: root.note("m closed")
    }

    function step(i) {
        switch (i) {
        case 0: field.forceActiveFocus(); break
        case 1: a.open(); break
        case 2: a.closePolicy = T.Popup.CloseOnReleaseOutside; a.open(); break
        case 3: a.closePolicy = T.Popup.CloseOnPressOutsideParent; a.open(); break
        case 4: a.closePolicy = T.Popup.NoAutoClose; a.open(); break
        case 5: a.close(); a.closePolicy = T.Popup.CloseOnEscape | T.Popup.CloseOnPressOutside; break
        case 6: a.focus = true; a.open(); break
        case 7: b.open(); break
        case 8: a.focus = false; a.close(); b.close(); break
        case 9: m.open(); break
        case 10: m.closePolicy = T.Popup.NoAutoClose; m.open(); break
        case 11: m.close(); a.close(); m.dim = false; m.open(); break
        case 12: m.close(); a.dim = true; a.closePolicy = T.Popup.NoAutoClose; a.open(); break
        case 13: a.modal = true; break
        case 14: a.modal = false; a.dim = false; break
        case 15: a.closePolicy = T.Popup.CloseOnReleaseOutsideParent; a.open(); break
        }
    }
    // Which popups are open, who has active focus, whether the mouse is over
    // what is under them, and what is in the overlay.
    function state() {
        const overlay = T.Overlay.overlay
        const kids = []
        for (let i = 0; i < overlay.children.length; i++) {
            const kid = overlay.children[i]
            kids.push([kid.objectName, kid.x, kid.y, kid.width, kid.height, kid.z, kid.opacity])
        }
        return [a.visible, b.visible, m.visible, a.activeFocus, b.activeFocus, m.activeFocus, field.activeFocus, first.activeFocus, second.activeFocus,
                under.containsMouse, a.dim, m.dim, kids]
    }
}
