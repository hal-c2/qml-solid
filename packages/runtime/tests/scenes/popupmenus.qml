import QtQuick
import QtQuick.Templates as T

// Menus: which item is the current one under the mouse and the arrow keys,
// the sub-menu that opens beside its item or in the menu's place, what
// triggering an item closes, and the items a menu is given and loses.
Item {
    id: root
    objectName: "root"
    width: 400
    height: 300
    property var log: []
    property alias menu: menu
    property alias more: more
    property alias flat: flat

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }

    component Entry: T.MenuItem {
        id: entry
        implicitWidth: 90
        implicitHeight: 20
        implicitTextPadding: text.length
        hoverEnabled: true
        arrow: Rectangle { x: entry.width - 8; y: 7; width: 6; height: 6; color: "black"; visible: entry.subMenu !== null }
        background: Rectangle { color: entry.highlighted ? "silver" : "white" }
        onTriggered: root.note(text + " triggered")
    }

    component Sheet: T.Menu {
        id: sheet
        padding: 2
        overlap: 3
        implicitWidth: 100
        implicitHeight: contentHeight + topPadding + bottomPadding
        delegate: Entry {}
        contentItem: ListView {
            implicitHeight: contentHeight
            model: sheet.contentModel
            interactive: false
            currentIndex: sheet.currentIndex
        }
        background: Rectangle { color: "white"; border.color: "black" }
        onAboutToShow: root.note(title + " aboutToShow")
        onClosed: root.note(title + " closed")
        onCurrentIndexChanged: root.note(title + " current " + currentIndex)
    }

    MouseArea {
        anchors.fill: parent
        onPressed: root.note("under pressed")
    }

    Item {
        id: anchor
        objectName: "anchor"
        x: 30
        y: 20
        width: 60
        height: 20

        Sheet {
            id: menu
            objectName: "menu"
            title: "Main"
            y: anchor.height
            Entry { text: "&New" }
            Entry { text: "Open"; enabled: false }
            T.MenuSeparator { implicitHeight: 4 }
            T.Action {
                id: act
                text: "Act"
                onTriggered: root.note("act triggered")
            }
            Sheet {
                id: more
                objectName: "more"
                title: "More"
                Entry { text: "Check"; checkable: true }
                Sheet {
                    id: lastMenu
                    objectName: "last"
                    title: "Last"
                    Entry { text: "End" }
                }
                Entry { text: "&Zed" }
            }
            Entry { text: "Quit" }
        }
    }

    // One whose sub-menu takes its place.
    Sheet {
        id: flat
        objectName: "flat"
        title: "Flat"
        x: 250
        y: 150
        cascade: false
        Sheet {
            id: sub
            objectName: "sub"
            title: "Sub"
            Entry { text: "Under" }
        }
        Repeater {
            id: rows
            model: 2
            Entry { text: "Row " + index }
        }
    }

    Entry { id: spare; y: 280; text: "Spare"; width: 70 }
    Sheet {
        id: extra
        objectName: "extra"
        title: "Extra"
        Entry { text: "Else" }
    }
    T.Action { id: other; text: "Other" }

    function named(item) { return item ? (item.objectName || item.text || "?") : null }
    function entry(item) {
        if (!(item instanceof T.MenuItem)) return [item.x, item.y, item.width, item.height]
        // The mouse is over an item that is not enabled in Qt, and over
        // none here: only what an enabled one says of it is told.
        return [item.text, item.x, item.y, item.width, item.height, item.enabled, item.highlighted, item.activeFocus,
                item.enabled ? item.hovered : null,
                item.textPadding, item.menu ? item.menu.title : null, item.subMenu ? item.subMenu.title : null, item.checked,
                item.arrow ? item.arrow.visible : null]
    }
    function tell(m) {
        const entries = []
        for (let i = 0; i < m.count; i++) entries.push(entry(m.itemAt(i)))
        return [m.title, m.visible, m.opened, m.x, m.y, m.width, m.height, m.count, m.currentIndex, m.cascade, m.closePolicy,
                m.activeFocus, named(m.parent), entries]
    }
    function state() { return [tell(menu), tell(more), tell(lastMenu), tell(flat), tell(sub), tell(extra)] }

    function step(i) {
        switch (i) {
        case 0: menu.open(); break
        case 1: menu.close(); break
        case 2: menu.popup(); break
        case 3: menu.popup(50, 60); break
        case 4: menu.popup(Qt.point(10, 110), menu.itemAt(5)); break
        case 5: menu.popup(root, 290, 100); break
        case 6: menu.popup(anchor); break
        case 7: menu.popup(menu.itemAt(0)); break
        case 8: menu.currentIndex = 3; break
        case 9: more.dismiss(); break
        case 10: flat.open(); break
        case 11: sub.open(); break
        case 12: menu.addItem(spare); break
        case 13: menu.insertItem(0, spare); break
        case 14: menu.moveItem(0, 3); break
        case 15: note("took " + named(menu.takeItem(3))); break
        case 16: menu.addMenu(extra); break
        case 17: note("menu at 6 " + menu.menuAt(6).title + ", took " + menu.takeMenu(6).title); break
        case 18: menu.insertAction(1, other); break
        case 19: note("action at 1 " + menu.actionAt(1).text + ", took " + menu.takeAction(1).text); break
        case 20: menu.removeItem(menu.itemAt(3)); break
        case 21: menu.cascade = false; break
        case 22: more.title = "Less"; more.enabled = false; break
        case 23: menu.open(); menu.currentIndex = 4; more.open(); break
        case 24: rows.model = 3; break
        case 25: more.enabled = true; menu.cascade = true; break
        case 26: extra.popup(); break
        }
    }
}
