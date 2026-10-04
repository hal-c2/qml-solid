// The header views of QtQuick.Templates, given what a style gives them: a
// size, and a delegate that shows the header's text. What `read()` answers
// is asked of Qt too, and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import Tables

Item {
    id: root
    width: 320
    height: 260
    property alias tv: tv
    property alias hh: hh
    property alias vh: vh

    // Before the views of it: a TableModel has to be complete for a header
    // to be told its roles.
    Grid { id: grid }

    // The two that follow the table, as a style writes them.
    T.HorizontalHeaderView {
        id: hh
        x: 40
        width: 200
        implicitWidth: syncView ? syncView.width : 0
        implicitHeight: Math.max(1, contentHeight)
        syncView: tv
        clip: true
        delegate: T.HeaderViewDelegate {
            id: across
            implicitWidth: 30
            implicitHeight: 18
            highlighted: selected
            contentItem: Text { text: across.model[across.headerView.textRole] }
        }
    }
    T.VerticalHeaderView {
        id: vh
        y: 30
        height: 120
        implicitWidth: Math.max(1, contentWidth)
        implicitHeight: syncView ? syncView.height : 0
        syncView: tv
        clip: true
        delegate: T.HeaderViewDelegate {
            id: down
            implicitWidth: 34
            implicitHeight: 12
            contentItem: Text { text: down.model[down.headerView.textRole] }
        }
    }
    TableView {
        id: tv
        x: 40
        y: 30
        width: 200
        height: 120
        columnSpacing: 2
        rowSpacing: 1
        selectionModel: ItemSelectionModel {}
        model: grid
        delegate: Rectangle {
            implicitWidth: 50 + column * 10
            implicitHeight: 20 + (row % 2) * 4
            required property int row
            required property int column
        }
    }

    // A header that follows nothing: a list is laid out along it.
    T.HorizontalHeaderView {
        id: listed
        y: 160
        width: 200
        height: 15
        model: ListModel {
            id: names
            ListElement { display: "one" }
            ListElement { display: "two" }
            ListElement { display: "three" }
        }
        delegate: Rectangle {
            implicitWidth: 40
            implicitHeight: 15
            required property string display
            required property int row
            required property int column
            required property int index
        }
    }
    T.VerticalHeaderView {
        id: values
        x: 250
        y: 30
        width: 20
        height: 100
        model: ["x", "y"]
        delegate: Rectangle {
            implicitWidth: 20
            implicitHeight: 15
            required property string modelData
            required property int row
            required property int column
            required property int index
        }
    }
    T.VerticalHeaderView {
        id: counted
        x: 280
        y: 30
        width: 20
        height: 100
        model: 3
        delegate: Rectangle {
            implicitWidth: 20
            implicitHeight: 15
            required property int modelData
            required property int row
        }
    }

    function items(view, tell) {
        const all = []
        for (let r = view.topRow; r >= 0 && r <= view.bottomRow; r++) {
            for (let c = view.leftColumn; c >= 0 && c <= view.rightColumn; c++) {
                const item = view.itemAtCell(Qt.point(c, r))
                if (item)
                    all.push(tell(item, c, r))
            }
        }
        return all
    }

    function of(view) {
        return [view.rows, view.columns, view.syncDirection, view.flickableDirection, view.textRole,
                view.contentX, view.contentY, view.selectionModel === null]
    }

    function read() {
        return {
            hh: of(hh),
            hhCells: items(hh, (item, c) => [c, item.x, item.width, item.height, String(item.contentItem.text), item.model.display,
                                              item.headerView === hh, item.tableView === hh, item.orientation,
                                              item.selected, item.current, item.highlighted]),
            hhSize: [hh.implicitWidth, hh.contentWidth, hh.height, hh.contentHeight],
            vh: of(vh),
            vhCells: items(vh, (item, c, r) => [r, item.y, item.height, item.width, String(item.contentItem.text), item.model.display,
                                                 item.headerView === vh, item.orientation]),
            vhSize: [vh.implicitHeight, vh.contentHeight, vh.width, vh.contentWidth],
            tv: [tv.contentX, tv.contentY, tv.leftColumn, tv.rightColumn, tv.topRow, tv.bottomRow],
            listed: of(listed),
            listedCells: items(listed, (item, c, r) => [c, r, item.x, item.width, item.display, item.row, item.column, item.index]),
            values: of(values),
            valuesCells: items(values, (item, c, r) => [c, r, item.y, item.height, item.modelData, item.row, item.column, item.index]),
            counted: of(counted),
            countedCells: items(counted, (item, c, r) => [c, r, item.y, item.modelData, item.row]),
        }
    }

    function step(i) {
        switch (i) {
        case 0:
            // The headers go where the table goes.
            tv.contentX = 90
            break
        case 1:
            tv.contentY = 70
            break
        case 2:
            // And the table where a header goes.
            hh.contentX = 30
            break
        case 3:
            vh.contentY = 10
            break
        case 4:
            tv.setColumnWidth(1, 80)
            break
        case 5:
            grid.removeRow(0, 17)
            break
        case 6:
            names.append({ display: "four" })
            break
        case 7:
            names.remove(0)
            break
        case 8:
            tv.contentX = 0
            break
        case 9:
            // A header's own selection model is not the table's.
            tv.selectionModel.select(tv.index(0, 1), ItemSelectionModel.Select)
            break
        case 10:
            grid.appendRow(grid.made(30))
            break
        case 11:
            values.model = ["p", "q", "r"]
            break
        case 12:
            counted.model = 5
            break
        case 13:
            // As an application fills a header of its own.
            names.clear()
            break
        case 14:
            names.append({ display: "z" })
            break
        }
    }
}
