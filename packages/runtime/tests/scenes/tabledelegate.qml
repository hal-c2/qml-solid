// The delegate a style has for the cells of a table, under the pointer: a
// button that leaves the press to the table, which makes its cell the
// current one, and to a SelectionRectangle. The test presses as it does
// under Qt, and what `read()` answers there is what it expects.
import QtQuick
import QtQuick.Templates as T
import Tables

Item {
    id: root
    width: 320
    height: 240
    property alias tv: tv
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
        selectionModel: ItemSelectionModel { id: sel }
        model: Grid { id: grid }
        delegate: T.TableViewDelegate {
            id: cell
            required property int row
            required property int column
            implicitWidth: 50
            implicitHeight: 30
            onPressedChanged: root.said.push("pressed " + row + "," + column + " " + pressed)
            onClicked: root.said.push("clicked " + row + "," + column)
            onCanceled: root.said.push("canceled " + row + "," + column)
        }
    }

    T.SelectionRectangle {
        id: sr
        target: tv
    }

    function cell(row, column) {
        const item = tv.itemAtCell(Qt.point(column, row))
        return [item.current, item.selected, item.editing, item.pressed, item.down, item.tableView === tv]
    }

    function read() {
        const heard = said
        said = []
        return {
            first: cell(0, 0),
            second: cell(1, 1),
            selected: sel.selectedIndexes.map((index) => index.row + "," + index.column).join(" "),
            current: [sel.currentIndex.row, sel.currentIndex.column],
            active: [sr.active, sr.dragging],
            said: heard,
        }
    }

    function step(i) {
        switch (i) {
        case 0:
            // The table no longer follows the pointer: the delegate is a button.
            tv.pointerNavigationEnabled = false
            break
        }
    }
}
