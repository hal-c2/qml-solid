import QtQuick
import QtGraphs

// A mapper over a table: what the rows are compared with is Qt's mapper
// over a TableModel of the same cells, which numbers its headers as this
// table does.
Item {
    id: root
    width: 400
    height: 300

    QtObject {
        id: table

        signal modelReset()
        signal dataChanged(var topLeft, var bottomRight)
        signal rowsInserted(var parent, int first, int last)
        signal rowsRemoved(var parent, int first, int last)

        // Held where a change of it tells nobody: the signals are what the
        // mapper is to hear.
        readonly property var d: ({ cells: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] })

        function rowCount() { return d.cells.length }
        function columnCount() { return d.cells.length ? d.cells[0].length : 0 }
        function index(row, column) {
            const valid = row >= 0 && column >= 0 && row < rowCount() && column < columnCount()
            return { row: valid ? row : -1, column: valid ? column : -1, valid: valid, model: valid ? table : null }
        }
        function data(index, role) { return role === 0 ? d.cells[index.row][index.column] : undefined }
        function headerData(section, orientation, role) { return section + 1 }

        function setCell(row, column, value) {
            d.cells[row][column] = value
            dataChanged(index(row, column), index(row, column))
        }
        function appendRow(row) {
            d.cells.push(row)
            rowsInserted(null, d.cells.length - 1, d.cells.length - 1)
        }
        function removeRow(row) {
            d.cells.splice(row, 1)
            rowsRemoved(null, row, row)
        }
        function setRows(rows) {
            d.cells = rows
            modelReset()
        }
    }

    GraphsView {
        id: view
        anchors.fill: parent
        axisX: BarCategoryAxis { categories: ["a", "b", "c", "d"] }
        axisY: ValueAxis { max: 60 }

        BarSeries { id: series }
    }

    BarModelMapper {
        id: mapper
        model: table
        series: series
        firstBarSetSection: 0
        lastBarSetSection: 1
    }

    function read() {
        let said = [mapper.first, mapper.count, mapper.orientation, mapper.firstBarSetSection, mapper.lastBarSetSection, series.count]
        for (let i = 0; i < series.count; i++) {
            const set = series.at(i)
            said.push(set.label, set.count)
            for (let k = 0; k < set.count; k++)
                said.push(set.at(k))
        }
        for (let i = 0; i < series.legendData.length; i++)
            said.push(String(series.legendData[i].color), series.legendData[i].label)
        return said
    }

    function step(i) {
        if (i === 0) {
            table.setCell(1, 1, 50)
            table.setCell(0, 2, 30)
        } else if (i === 1) {
            table.appendRow([10, 11, 12])
        } else if (i === 2) {
            mapper.orientation = Qt.Horizontal
            mapper.first = 1
        } else if (i === 3) {
            table.removeRow(0)
        } else if (i === 4) {
            table.setRows([[1, 2, 3], [3, 4, 5]])
        } else if (i === 5) {
            mapper.lastBarSetSection = 5
        } else if (i === 6) {
            mapper.count = 0
        } else if (i === 7) {
            mapper.count = 1
            mapper.first = 0
            mapper.model = null
            table.setCell(0, 0, 40)
        }
    }
}
