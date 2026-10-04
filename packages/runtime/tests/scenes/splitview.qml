// SplitView: what its items say of their sizes, which of them fills, the
// handles between them, and its state saved and restored. `answers` is asked
// of Qt too, before and after each `step`, and what Qt says is what the test
// expects.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T
import QtQuick.Controls.Basic as Basic

Item {
    id: root
    width: 400
    height: 300

    property int steps: 26
    property var saved
    property var restored: []
    property alias row: row
    property alias col: col
    property alias bare: bare
    property alias wide: wide
    property alias a: a
    property alias b: b
    property alias c: c
    property alias d: d
    property alias e: e
    property alias f: f
    property alias p: p
    property alias q: q
    property alias r: r

    SplitPane {
        id: row
        width: 300
        height: 100

        Rectangle { id: a; color: "#fdd"; implicitWidth: 50; SplitView.minimumWidth: 30 }
        Rectangle { id: b; color: "#dfd"; SplitView.preferredWidth: 80; SplitView.maximumWidth: 120 }
        Rectangle { id: c; color: "#ddf"; implicitWidth: 40; implicitHeight: 25 }
    }

    SplitPane {
        id: col
        y: 110
        width: 120
        height: 180
        padding: 4
        orientation: Qt.Vertical

        Rectangle { id: d; color: "#fdd"; SplitView.preferredHeight: 40 }
        Rectangle { id: e; color: "#dfd"; SplitView.fillHeight: true; SplitView.minimumHeight: 20 }
        Rectangle { id: f; color: "#ddf"; implicitHeight: 30; SplitView.maximumHeight: 50 }
    }

    // One with no handle can have no more than one item in Qt, which
    // would make a handle for the second of nothing.
    T.SplitView {
        id: bare
        x: 310
        width: 80
        height: 60

        Item { id: g; implicitWidth: 20 }
    }

    // The fill item is in the middle: a handle after it sizes what follows.
    T.SplitView {
        id: wide
        x: 130
        y: 110
        width: 180
        height: 50
        hoverEnabled: true

        // As a program that imports the controls names what a handle says.
        handle: Rectangle {
            property bool held: Basic.SplitHandle.pressed
            implicitWidth: 10
            implicitHeight: 3
            color: "gray"
        }

        Rectangle { id: p; color: "#fdd"; SplitView.preferredWidth: 60; SplitView.minimumWidth: 40 }
        Rectangle { id: q; color: "#dfd"; SplitView.fillWidth: true; SplitView.minimumWidth: 15 }
        Rectangle { id: r; color: "#ddf"; SplitView.preferredWidth: 50; SplitView.maximumWidth: 90 }
    }

    Rectangle { id: extra; x: 320; y: 200; color: "#ffd"; implicitWidth: 25; implicitHeight: 15 }
    Item { id: h; implicitWidth: 10 }

    Component {
        id: thin
        Rectangle { implicitWidth: 2; implicitHeight: 3; color: "black" }
    }

    function round(value) {
        return value === Infinity ? "inf" : Math.round(value * 10000) / 10000
    }

    function box(item) {
        return [round(item.x), round(item.y), round(item.width), round(item.height)]
    }

    function pane(view) {
        return [view.orientation, view.resizing, view.count, view.currentIndex,
                round(view.contentWidth), round(view.contentHeight),
                round(view.implicitContentWidth), round(view.implicitContentHeight),
                round(view.implicitWidth), round(view.implicitHeight),
                view.contentChildren.length, view.children.length].concat(box(view.contentItem))
    }

    function sizes(view) {
        const all = []
        for (let index = 0; index < view.count; index++) {
            const item = view.itemAt(index)
            all.push(box(item).concat([item.visible, item.parent === view.contentItem]))
        }
        return all
    }

    function grips(view) {
        const all = []
        for (const child of view.children) {
            if (child === view.contentItem)
                continue
            all.push(box(child).concat([child.visible, child.SplitHandle.hovered, child.SplitHandle.pressed, child.held === true]))
        }
        return all
    }

    function says(item) {
        const view = item.SplitView.view
        return [view === row ? "row" : view === col ? "col" : view === wide ? "wide" : view,
                round(item.SplitView.minimumWidth), round(item.SplitView.preferredWidth), round(item.SplitView.maximumWidth),
                round(item.SplitView.minimumHeight), round(item.SplitView.preferredHeight), round(item.SplitView.maximumHeight),
                item.SplitView.fillWidth, item.SplitView.fillHeight]
    }

    function step(index) {
        switch (index) {
        case 0: row.width = 360; break
        case 1: b.SplitView.preferredWidth = 200; break
        case 2: a.SplitView.minimumWidth = 70; break
        case 3: a.implicitWidth = 90; break
        case 4: c.visible = false; break
        case 5: c.visible = true; a.SplitView.fillWidth = true; break
        case 6: row.width = 150; break
        // The item that filled still does: which fills is not looked for
        // again when the view is turned.
        case 7: row.orientation = Qt.Vertical; break
        case 8: row.orientation = Qt.Horizontal; a.SplitView.fillWidth = false; row.width = 300; break
        case 9:
            b.SplitView.preferredWidth = undefined
            b.SplitView.maximumWidth = undefined
            a.SplitView.minimumWidth = undefined
            break
        case 10:
            root.saved = row.saveState()
            b.SplitView.preferredWidth = 33
            a.SplitView.preferredWidth = 44
            break
        case 11: root.restored = [row.restoreState(root.saved), row.restoreState(""), bare.restoreState(root.saved)]; break
        case 12: row.addItem(extra); break
        case 13: row.moveItem(0, 2); break
        case 14: row.takeItem(1); break
        case 15: e.SplitView.minimumHeight = 150; break
        case 16: col.height = 100; break
        case 17: d.visible = false; break
        case 18: col.orientation = Qt.Horizontal; d.visible = true; break
        case 19: p.SplitView.preferredWidth = 500; break
        case 20: wide.handle = thin; break
        case 21: bare.handle = thin; wide.handle = null; break
        case 22: bare.addItem(h); break
        case 23: h.visible = false; break
        // Turned back, the last still fills, until one says it does.
        case 24: col.orientation = Qt.Vertical; break
        case 25: d.SplitView.fillHeight = true; break
        }
    }

    function answers() {
        return [
            pane(row), sizes(row), grips(row), says(a), says(b),
            pane(col), sizes(col), grips(col), says(e), says(f),
            pane(bare), sizes(bare), grips(bare),
            pane(wide), sizes(wide), grips(wide), says(p), says(q),
            box(a), box(b), box(c), box(extra), root.restored,
        ]
    }
}
