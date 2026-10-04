// A SelectionRectangle of QtQuick.Templates on a table that does not flick,
// with the handles a style gives it. The test drags over the cells as it
// does under Qt, and what `read()` answers there is what it expects.
import QtQuick
import QtQuick.Templates as T
import Tables

Item {
    id: root
    width: 320
    height: 240
    property alias tv: tv
    property alias sr: sr
    property var said: []

    TableView {
        id: tv
        x: 20
        y: 10
        width: 250
        height: 150
        interactive: false
        columnSpacing: 2
        rowSpacing: 2
        selectionModel: ItemSelectionModel {
            id: sel
            onSelectionChanged: (selected, deselected) => root.said.push("selection " + (selected.length > 0) + " " + (deselected.length > 0))
        }
        model: Grid { id: grid }
        delegate: Rectangle {
            implicitWidth: 50
            implicitHeight: 30
            required property bool selected
            required property bool current
            color: selected ? "lightblue" : "white"
            border.width: current ? 2 : 0
        }
    }

    T.SelectionRectangle {
        id: sr
        target: tv
        topLeftHandle: Rectangle {
            objectName: "first"
            width: 12
            height: 12
            color: "red"
            visible: T.SelectionRectangle.control.active
            property bool held: T.SelectionRectangle.dragging
            property var owner: T.SelectionRectangle.control
        }
        bottomRightHandle: Rectangle {
            objectName: "second"
            width: 12
            height: 12
            color: "green"
            visible: T.SelectionRectangle.control.active
            property bool held: T.SelectionRectangle.dragging
            property var owner: T.SelectionRectangle.control
        }
        onActiveChanged: root.said.push("active " + active)
        onDraggingChanged: root.said.push("dragging " + dragging)
    }

    function handle(name) {
        const all = tv.contentItem.children
        for (let i = 0; i < all.length; i++) {
            const item = all[i]
            if (item.objectName === name)
                return [item.x, item.y, item.z, item.visible, item.held, item.owner === sr]
        }
        return null
    }

    function read() {
        const heard = said
        said = []
        return {
            active: [sr.active, sr.dragging, sr.selectionMode],
            selected: sel.selectedIndexes.map((index) => index.row + "," + index.column).join(" "),
            current: [sel.currentIndex.row, sel.currentIndex.column],
            first: handle("first"),
            second: handle("second"),
            content: [tv.contentX, tv.contentY],
            shown: [tv.itemAtCell(Qt.point(1, 1)).selected, tv.itemAtCell(Qt.point(1, 1)).current],
            said: heard,
        }
    }

    function step(i) {
        switch (i) {
        case 0:
            // What somebody else selects is no rectangle of its.
            sel.select(tv.index(3, 5), ItemSelectionModel.Select)
            break
        case 1:
            sr.selectionMode = T.SelectionRectangle.PressAndHold
            break
        case 2:
            sr.enabled = false
            break
        }
    }
}
