import QtQuick
import QtQuick.Templates as T

// Popups shown over what is in another popup: in no window until that one
// is shown, they wait for it, go with it and come back with it.
Item {
    id: root
    width: 400
    height: 300
    property var log: []

    component Sheet: T.Popup {
        id: sheet
        property string name
        width: 80
        height: 60
        contentItem: Item {}
        background: Rectangle { color: "white"; border.color: "black" }
        onAboutToShow: root.log.push(name + " aboutToShow")
        onAboutToHide: root.log.push(name + " aboutToHide")
        onOpened: root.log.push(name + " opened")
        onClosed: root.log.push(name + " closed")
    }

    Sheet {
        id: outer
        name: "outer"
        x: 10
        y: 10
        // Qt says nothing of the others' when they go with this one, and
        // here they say it: only this one's is told.
        onVisibleChanged: root.log.push("outer visible " + visible)
        Item {
            id: inner
            x: 5
            y: 5
            width: 10
            height: 10
            Sheet {
                id: nested
                name: "nested"
                y: 70
                Item {
                    Sheet { id: deep; name: "deep"; x: 90; visible: true }
                }
            }
            Sheet { id: early; name: "early"; x: 100; visible: true }
        }
    }

    function tell(p) { return [p.visible, p.opened] }
    function answers() {
        const l = log
        log = []
        return [l, tell(outer), tell(nested), tell(deep), tell(early)]
    }
    property int steps: 12
    function step(i) {
        switch (i) {
        case 0: nested.open(); break
        case 1: outer.open(); break
        case 2: outer.close(); break
        case 3: outer.open(); break
        case 4: nested.close(); break
        case 5: outer.close(); break
        case 6: nested.open(); nested.close(); break
        case 7: outer.open(); break
        case 8: early.close(); outer.close(); break
        case 9: nested.visible = true; early.visible = true; break
        case 10: outer.open(); break
        case 11: deep.close(); nested.close(); nested.open(); break
        }
    }
}
