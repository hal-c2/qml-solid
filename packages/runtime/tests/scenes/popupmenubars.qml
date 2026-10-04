import QtQuick
import QtQuick.Templates as T

// A menu bar: the item whose menu is open, the one the mouse and the arrow
// keys make current, the item its delegate makes for a menu, and the menus
// it is given and loses.
Item {
    id: root
    objectName: "root"
    width: 400
    height: 300
    property var log: []
    property string seen

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }

    component Entry: T.MenuItem {
        id: entry
        implicitWidth: 90
        implicitHeight: 20
        hoverEnabled: true
        background: Rectangle { color: entry.highlighted ? "silver" : "white" }
        onTriggered: root.note(text + " triggered")
    }

    component Sheet: T.Menu {
        id: sheet
        implicitWidth: 100
        implicitHeight: contentHeight
        delegate: Entry {}
        contentItem: ListView {
            implicitHeight: contentHeight
            model: sheet.contentModel
            interactive: false
            currentIndex: sheet.currentIndex
        }
        background: Rectangle { color: "white"; border.color: "black" }
        onAboutToShow: root.note(title + " aboutToShow")
        onAboutToHide: root.note(title + " aboutToHide")
        onCurrentIndexChanged: root.note(title + " current " + currentIndex)
    }

    component Head: T.MenuBarItem {
        id: head
        implicitWidth: 50
        implicitHeight: 24
        hoverEnabled: true
        background: Rectangle { color: head.highlighted ? "silver" : "white" }
        onTriggered: root.note(text + " head triggered")
        onClicked: root.note(text + " head clicked")
        onHighlightedChanged: root.note(text + " highlighted " + highlighted)
    }

    Component {
        id: wide
        Head { implicitWidth: 60 }
    }

    MouseArea {
        anchors.fill: parent
        onPressed: root.note("under pressed")
    }

    T.MenuBar {
        id: bar
        objectName: "bar"
        x: 10
        y: 10
        padding: 1
        spacing: 2
        hoverEnabled: true
        implicitWidth: contentWidth + leftPadding + rightPadding + 40
        implicitHeight: contentHeight + topPadding + bottomPadding
        delegate: Head {}
        contentItem: Row {
            spacing: bar.spacing
            Repeater { model: bar.contentModel }
        }
        background: Rectangle { color: "gainsboro" }
        // Qt says so again for every item its Repeater puts in order: the
        // menus are told once here.
        onMenusChanged: {
            const now = root.titles(bar).join(" ")
            if (now !== root.seen) root.note("menus " + now)
            root.seen = now
        }

        Sheet {
            id: file
            objectName: "file"
            title: "&File"
            Entry { text: "&New" }
            Entry { text: "Open" }
            Sheet {
                id: recent
                objectName: "recent"
                title: "Recent"
                Entry { text: "One" }
            }
        }
        Sheet {
            id: edit
            objectName: "edit"
            title: "&Edit"
            Entry { text: "Cut"; enabled: false }
            Entry { text: "Copy" }
        }
        Head {
            id: own
            implicitWidth: 40
            menu: Sheet {
                id: view
                objectName: "view"
                title: "View"
                Entry { text: "Zoom" }
            }
        }
        Head { id: bare; text: "Bare" }
    }

    // One with no delegate: its menus have items that are not seen.
    T.MenuBar {
        id: plain
        objectName: "plain"
        y: 250
        width: 200
        height: 24
        contentItem: Row { Repeater { model: plain.contentModel } }
        Sheet {
            id: hidden
            objectName: "hidden"
            title: "Hidden"
            Entry { text: "Never" }
        }
        Head { id: shown; text: "Shown" }
    }

    Sheet {
        id: spare
        objectName: "spare"
        title: "&Spare"
        Entry { text: "Else" }
    }
    Head { id: loose; y: 280; text: "Loose" }

    function named(item) { return item ? (item.objectName || item.text || "?") : null }
    function head(item) {
        // The mouse is over an item that is not enabled in Qt, and over
        // none here: only what an enabled one says of it is told.
        return [item.text, item.x, item.y, item.width, item.height, item.visible, item.highlighted, item.down,
                item.enabled ? item.hovered : null, item.activeFocus, named(item.menuBar), named(item.menu), named(item.parent && item.parent.parent)]
    }
    function tell(m) {
        return [m.title, m.visible, m.x, m.y, m.count, m.currentIndex, m.closePolicy, m.activeFocus, named(m.parent)]
    }
    function heads(b) {
        const all = []
        for (let i = 0; i < b.count; i++) all.push(head(b.itemAt(i)))
        return all
    }
    function titles(b) {
        const all = []
        for (let i = 0; i < b.menus.length; i++) all.push(named(b.menus[i]))
        return all
    }
    function state() {
        return [[bar.width, bar.height, bar.contentWidth, bar.contentHeight, bar.count, bar.currentIndex, bar.activeFocus,
                 bar.hovered, titles(bar), heads(bar)],
                [plain.contentWidth, plain.contentHeight, plain.count, titles(plain), heads(plain)],
                tell(file), tell(recent), tell(edit), tell(view), tell(spare), tell(hidden)]
    }

    function step(i) {
        switch (i) {
        case 0: bar.addMenu(spare); break
        case 1: bar.insertMenu(1, spare); break
        case 2: bar.removeMenu(spare); break
        case 3: note("menu at 2 " + named(bar.menuAt(2)) + ", took " + named(bar.takeMenu(2))); break
        case 4: bar.insertMenu(1, edit); break
        case 5: file.title = "F&ile"; break
        case 6: bar.delegate = wide; break
        case 7: edit.open(); break
        case 8: edit.close(); break
        case 9: bar.forceActiveFocus(); break
        case 10: bar.addItem(loose); break
        case 11: bar.removeItem(loose); break
        case 12: bar.moveItem(0, 2); break
        case 13: plain.itemAt(0).visible = true; break
        case 14: bar.itemAt(1).enabled = false; break
        case 15: bar.itemAt(1).enabled = true; break
        }
    }
}
