import QtQuick
import Tables

Item {
    id: root
    width: 200
    height: 150
    property alias tv: tv
    property var said: []
    property int pooled: 0
    property int reused: 0

    TableView {
        id: tv
        anchors.fill: parent
        rowSpacing: 2
        columnSpacing: 3
        selectionModel: ItemSelectionModel { id: sel }
        model: Grid { id: grid }
        delegate: Rectangle {
            implicitWidth: 40 + column * 10
            implicitHeight: 20 + (row % 3) * 5
            required property int row
            required property int column
            required property int index
            required property var model
            required property var display
            required property bool selected
            required property bool current
            required property bool editing
            property var view: TableView.view
            TableView.onPooled: root.pooled++
            TableView.onReused: root.reused++
        }
    }

    function at(column, row) {
        return tv.itemAtCell(Qt.point(column, row))
    }

    function cell(item) {
        return item ? [item.row, item.column, item.index, item.display] : null
    }

    function point(p) {
        return [p.x, p.y]
    }

    function read() {
        const columns = []
        const rows = []
        let cells = 0
        let first = null
        let last = null
        for (let c = tv.leftColumn; c >= 0 && c <= tv.rightColumn; c++) {
            const item = at(c, tv.topRow)
            if (item)
                columns.push([c, item.x, item.width])
        }
        for (let r = tv.topRow; r >= 0 && r <= tv.bottomRow; r++) {
            const item = at(tv.leftColumn, r)
            if (item)
                rows.push([r, item.y, item.height])
        }
        for (let r = 0; r < tv.rows; r++) {
            for (let c = 0; c < tv.columns; c++) {
                const item = at(c, r)
                if (!item)
                    continue
                cells++
                first = first || item
                last = item
            }
        }
        const told = said
        said = []
        return {
            size: [tv.rows, tv.columns, tv.contentWidth, tv.contentHeight],
            place: [tv.contentX, tv.contentY, tv.originX, tv.originY],
            edges: [tv.leftColumn, tv.rightColumn, tv.topRow, tv.bottomRow],
            columns: columns,
            rows: rows,
            cells: [cells, cell(first), cell(last)],
            current: [tv.currentRow, tv.currentColumn],
            selected: sel.selectedIndexes.map(index => [index.row, index.column]),
            reuse: [pooled, reused],
            said: told
        }
    }

    function sizes(column, row) {
        return [tv.columnWidth(column), tv.implicitColumnWidth(column), tv.explicitColumnWidth(column),
                tv.rowHeight(row), tv.implicitRowHeight(row), tv.explicitRowHeight(row)]
    }

    function step(i) {
        switch (i) {
        case 0:
            said = [at(0, 0) !== null, at(5, 19), tv.itemAtIndex(tv.index(1, 1)) === at(1, 1), at(0, 0).view === tv,
                    at(1, 2).model.display, at(1, 2).model.row, at(1, 2).model.column, at(1, 2).model.index,
                    tv.itemAtCell(1, 2) === at(1, 2), sel.model === tv.model, at(0, 0).editing,
                    tv.selectionBehavior, tv.selectionMode, tv.keyNavigationEnabled, tv.pointerNavigationEnabled,
                    tv.reuseItems, tv.alternatingRows, tv.syncDirection, tv.interactive]
            break
        case 1: tv.contentX = 60; break
        case 2: tv.contentY = 100; break
        case 3: tv.contentY = 400; break
        case 4: tv.contentX = 0; tv.contentY = 0; break
        case 5: tv.setColumnWidth(1, 80); said = sizes(1, 0); break
        case 6: tv.setRowHeight(0, 40); said = sizes(1, 0); break
        // What a provider says is asked for when the table is next laid out.
        case 7: tv.columnWidthProvider = c => c === 1 ? 0 : c === 2 ? -1 : c === 3 ? undefined : 30; break
        case 8: said = [sizes(0, 0), sizes(1, 0), sizes(2, 0), sizes(3, 0), sizes(4, 0)]; break
        case 9: tv.rowHeightProvider = r => r === 0 ? 0 : r === 1 ? -5 : r === 2 ? undefined : r === 3 ? 12.5 : NaN; break
        case 10: said = [sizes(0, 0), sizes(0, 1), sizes(0, 2), sizes(0, 3), sizes(0, 4)]; break
        case 11: tv.columnWidthProvider = undefined; tv.rowHeightProvider = undefined; break
        case 12: tv.clearColumnWidths(); tv.clearRowHeights(); break
        case 13:
            said = [point(tv.cellAtPosition(50, 30)), point(tv.cellAtPosition(Qt.point(42, 21))),
                    point(tv.cellAtPosition(42, 21, true)), point(tv.cellAtPosition(1000, 30)),
                    point(tv.cellAtPosition(-5, -5)), point(tv.cellAtPosition(41, 5, true)),
                    point(tv.cellAtPosition(Qt.point(41, 5), true)),
                    tv.index(2, 3).valid, tv.index(2, 3).row, tv.index(2, 3).column,
                    tv.modelIndex(Qt.point(3, 2)) === tv.index(2, 3),
                    point(tv.cellAtIndex(tv.index(2, 3))), tv.rowAtIndex(tv.index(2, 3)), tv.columnAtIndex(tv.index(2, 3)),
                    tv.index(99, 99).valid, point(tv.cellAtIndex(tv.index(99, 99))),
                    tv.isColumnLoaded(0), tv.isColumnLoaded(5), tv.isRowLoaded(0), tv.isRowLoaded(1)]
            break
        case 14: tv.positionViewAtCell(Qt.point(5, 15), TableView.AlignCenter); break
        case 15: tv.positionViewAtRow(10, TableView.AlignTop); break
        case 16: tv.positionViewAtColumn(3, TableView.AlignRight); break
        case 17: tv.positionViewAtCell(Qt.point(0, 0), TableView.AlignLeft | TableView.AlignTop); break
        case 18: tv.positionViewAtRow(19, TableView.AlignBottom); tv.positionViewAtColumn(5, TableView.AlignRight); break
        case 19: tv.positionViewAtRow(5, TableView.Contain); tv.positionViewAtColumn(1, TableView.Visible); break
        case 20: tv.positionViewAtCell(0, 0, TableView.AlignLeft | TableView.AlignTop); break
        case 21: tv.positionViewAtColumn(3, TableView.AlignRight); break
        case 22: tv.positionViewAtRow(5, TableView.AlignVCenter, 7); break
        case 23: tv.positionViewAtColumn(1, TableView.AlignLeft, -4, Qt.rect(5, 0, 10, 10)); break
        case 24: tv.positionViewAtRow(8, TableView.AlignTop, 0, Qt.rect(0, 5, 10, 10)); break
        case 25: tv.positionViewAtCell(Qt.point(2, 3), TableView.Visible); break
        case 26: tv.positionViewAtCell(Qt.point(5, 12), TableView.Visible); break
        case 27: tv.positionViewAtCell(Qt.point(0, 2), TableView.Contain); break
        case 28: tv.positionViewAtCell(Qt.point(4, 9), TableView.Contain); break
        case 29:
            said = [point(tv.cellAtPosition(50, 30)), point(tv.cellAtPosition(tv.contentX + 50, tv.contentY + 30))]
            tv.positionViewAtIndex(tv.index(1, 1), TableView.AlignLeft | TableView.AlignTop)
            break
        case 30: sel.setCurrentIndex(tv.index(2, 1), ItemSelectionModel.NoUpdate); break
        case 31:
            sel.select(tv.index(3, 2), ItemSelectionModel.Select)
            sel.select(tv.index(1, 2), ItemSelectionModel.Select)
            sel.select(tv.index(1, 1), ItemSelectionModel.Select)
            said = [at(2, 3).selected, at(1, 2).current, at(2, 2).selected, at(2, 2).current, at(1, 1).selected]
            break
        case 32: grid.removeRow(0, 2); break
        case 33: grid.insertRow(0, { a: "x", b: "x", c: "x", d: "x", e: "x", f: "x" }); break
        case 34:
            grid.setData(grid.index(1, 1), "changed", "display")
            said = [grid.data(grid.index(1, 1), "display"), at(1, 1).display]
            break
        case 35: grid.clear(); break
        case 36: tv.positionViewAtCell(Qt.point(0, 0), TableView.AlignLeft | TableView.AlignTop); break
        case 37: grid.appendRow({ a: "x", b: "x", c: "x", d: "x", e: "x", f: "x" }); break
        case 38: grid.fill(4); break
        case 39: tv.contentX = 0; tv.contentY = 0; break
        case 40: tv.rowSpacing = 10; tv.columnSpacing = 0; break
        // One at a time: Qt lays out for both at the next frame, and here
        // each is laid out for as it is assigned.
        case 41: root.width = 320; break
        case 42: root.height = 60; break
        }
    }
}
