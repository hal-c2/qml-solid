// A header view that is given a table model shows what the model says of
// its header, not its cells. What is expected of the first two is what Qt
// answers with a TableModel of its own: the model these scenes have under
// Qt is a QML type, which a header there takes for a list.
import QtQuick
import QtQuick.Templates as T
import Tables

Item {
    id: root
    width: 320
    height: 200

    Grid { id: grid; count: 2 }
    // A model that names its columns and its rows.
    Grid { id: named; count: 2; titled: true }

    T.HorizontalHeaderView {
        id: across
        width: 200
        height: 15
        model: grid
        delegate: Rectangle {
            implicitWidth: 30
            implicitHeight: 15
            required property var display
            required property var model
            required property int row
            required property int column
        }
    }
    T.VerticalHeaderView {
        id: down
        y: 20
        width: 30
        height: 100
        model: grid
        delegate: Rectangle {
            implicitWidth: 30
            implicitHeight: 15
            required property var display
            required property int row
            required property int column
        }
    }
    T.HorizontalHeaderView {
        id: titles
        x: 40
        y: 20
        width: 200
        height: 15
        model: named
        delegate: T.HeaderViewDelegate {
            id: title
            implicitWidth: 30
            implicitHeight: 15
            contentItem: Text { text: title.model[title.headerView.textRole] }
        }
    }
    T.VerticalHeaderView {
        id: rows
        x: 40
        y: 40
        width: 30
        height: 100
        model: named
        delegate: T.HeaderViewDelegate {
            id: name
            implicitWidth: 30
            implicitHeight: 15
            contentItem: Text { text: name.model[name.headerView.textRole] }
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

    function read() {
        return {
            across: [across.rows, across.columns, across.textRole],
            acrossCells: items(across, (item, c, r) => [c, r, item.x, item.display, item.model.display, item.row, item.column]),
            down: [down.rows, down.columns, down.textRole],
            downCells: items(down, (item, c, r) => [c, r, item.y, item.display, item.row, item.column]),
            titles: items(titles, (item) => item.contentItem.text),
            rows: items(rows, (item) => item.contentItem.text),
        }
    }

    function step(i) {
        switch (i) {
        case 0:
            grid.appendRow(grid.made(2))
            named.appendRow(named.made(2))
            break
        }
    }
}
