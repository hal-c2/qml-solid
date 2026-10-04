// A SelectionRectangle that has no handles, on a table that is asked to
// select rows, columns, one cell or many, and that is asked what it
// cannot. The test drags over the cells as it does under Qt, and what
// `read()` answers there is what it expects.
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

    ItemSelectionModel {
        id: sel
        model: grid
    }

    Grid { id: grid }

    TableView {
        id: tv
        x: 20
        y: 10
        width: 250
        height: 150
        interactive: false
        columnSpacing: 2
        rowSpacing: 2
        selectionModel: sel
        model: grid
        delegate: Rectangle {
            implicitWidth: 50
            implicitHeight: 30
            required property bool selected
            color: selected ? "lightblue" : "white"
        }
    }

    Item {
        id: other
    }

    T.SelectionRectangle {
        id: sr
        target: tv
        onActiveChanged: root.said.push("active " + active)
        onDraggingChanged: root.said.push("dragging " + dragging)
    }

    function read() {
        const heard = said
        said = []
        return {
            active: [sr.active, sr.dragging],
            // In the order of the table: after cells are taken out of what is
            // selected, Qt has the rest in the order of the ranges it keeps.
            selected: sel.selectedIndexes.map((index) => [index.row, index.column])
                .sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((cell) => cell.join(",")).join(" "),
            current: [sel.currentIndex.row, sel.currentIndex.column],
            content: [tv.contentX, tv.contentY],
            // It has put nothing in the table but its handlers.
            handles: tv.contentItem.children.filter((item) => item.selected === undefined).length,
            said: heard,
        }
    }

    function step(i) {
        switch (i) {
        case 0:
            tv.selectionBehavior = TableView.SelectRows
            break
        case 1:
            tv.selectionBehavior = TableView.SelectColumns
            break
        case 2:
            tv.selectionBehavior = TableView.SelectCells
            tv.selectionMode = TableView.SingleSelection
            break
        case 3:
            tv.selectionMode = TableView.ContiguousSelection
            break
        case 4:
            tv.selectionMode = TableView.ExtendedSelection
            break
        case 5:
            tv.selectionBehavior = TableView.SelectionDisabled
            break
        case 6:
            tv.selectionBehavior = TableView.SelectCells
            tv.selectionModel = null
            break
        case 7:
            // A table that flicks is dragged, and selects when a press is held.
            tv.selectionModel = sel
            tv.interactive = true
            break
        case 8:
            tv.interactive = false
            sr.target = other
            break
        case 9:
            sr.target = tv
            break
        }
    }
}
