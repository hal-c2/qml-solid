// What a table sets on a delegate that requires it, wherever that is said:
// in the delegate, in Qt's type of it, or in the component it is. What
// `read()` answers is asked of Qt too, and what Qt says is what the test
// expects.
import QtQuick
import QtQuick.Templates as T
import Qt.labs.qmlmodels

Item {
    id: root
    width: 320; height: 240

    TableModel {
        id: pets
        TableModelColumn { display: "name" }
        TableModelColumn { display: "color" }
        rows: [{ name: "cat", color: "black" }, { name: "dog", color: "brown" }]
    }
    // The delegate says what it requires.
    TableView {
        id: said
        width: 320; height: 50
        selectionModel: ItemSelectionModel {}
        model: pets
        delegate: Rectangle {
            implicitWidth: 60; implicitHeight: 20
            required property int row
            required property int column
            required property bool current
            required property bool selected
            required property bool editing
            required property TableView tableView
            required property string display
            property string shown: display
        }
    }
    // Qt's type says it: a TableViewDelegate requires the table, and what
    // the table's selection says of its cell.
    TableView {
        id: typed
        y: 60; width: 320; height: 50
        selectionModel: ItemSelectionModel {}
        model: pets
        delegate: T.TableViewDelegate {
            implicitWidth: 60; implicitHeight: 20
            property string shown: current ? "current" : "not"
        }
    }
    // The component says the rest.
    TableView {
        id: styled
        y: 120; width: 320; height: 50
        selectionModel: ItemSelectionModel {}
        model: pets
        delegate: PetCell {
            property string shown: row + "," + column + " " + model.display
        }
    }
    // A header's delegate requires the header, and the cell's data.
    T.HorizontalHeaderView {
        id: header
        y: 180; width: 320; height: 20
        model: ["first", "second"]
        delegate: T.HeaderViewDelegate {
            implicitWidth: 60; implicitHeight: 20
            property string shown: model.modelData
        }
    }

    function cells(view) {
        const all = []
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                const item = view.itemAtCell(Qt.point(c, r))
                all.push([item.shown, item.current, item.selected, item.editing, item.tableView === view])
            }
        }
        return all
    }

    function read() {
        const heads = []
        for (let c = 0; c < 2; c++) {
            const item = header.itemAtCell(Qt.point(c, 0))
            heads.push([item.shown, item.headerView === header, item.tableView === header])
        }
        return { said: cells(said), typed: cells(typed), styled: cells(styled), heads: heads }
    }

    function step(i) {
        switch (i) {
        case 0:
            said.selectionModel.setCurrentIndex(said.index(1, 0), ItemSelectionModel.Select)
            break
        case 1:
            typed.selectionModel.setCurrentIndex(typed.index(0, 1), ItemSelectionModel.Select)
            break
        case 2:
            styled.selectionModel.select(styled.index(1, 1), ItemSelectionModel.Select)
            break
        }
    }
}
