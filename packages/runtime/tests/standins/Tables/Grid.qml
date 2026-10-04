import QtQml

// A table of six columns, written as an application writes a model that Qt
// has in C++: an object that answers what a QAbstractItemModel is asked.
// Under Qt the same scenes run with a `TableModel` of the same functions.
QtObject {
    id: grid

    signal modelAboutToBeReset()
    signal modelReset()
    signal rowsInserted(var parent, int first, int last)
    signal rowsRemoved(var parent, int first, int last)
    signal dataChanged(var topLeft, var bottomRight, var roles)

    readonly property var names: ["a", "b", "c", "d", "e", "f"]
    readonly property var d: ({ rows: [], indexes: {} })
    readonly property var invalidIndex: ({ row: -1, column: -1, valid: false, model: null })
    property int count: 20

    Component.onCompleted: fill(count)

    function made(row) {
        const made = {}
        for (const name of names)
            made[name] = name + row
        return made
    }

    function fill(count) {
        modelAboutToBeReset()
        d.rows.length = 0
        for (let row = 0; row < count; row++)
            d.rows.push(made(row))
        modelReset()
    }

    function rowCount(parent) {
        return d.rows.length
    }

    function columnCount(parent) {
        return names.length
    }

    function index(row, column = 0, parent) {
        if (row < 0 || column < 0 || row >= rowCount() || column >= columnCount())
            return invalidIndex
        const key = row + "," + column
        if (!d.indexes[key])
            d.indexes[key] = { row: row, column: column, valid: true, model: grid }
        return d.indexes[key]
    }

    function data(index, role = Qt.DisplayRole) {
        if (!index || !index.valid || (role !== Qt.DisplayRole && role !== "display"))
            return undefined
        return d.rows[index.row][names[index.column]]
    }

    function setData(index, value, role = Qt.EditRole) {
        if (!index || !index.valid)
            return false
        d.rows[index.row][names[index.column]] = value
        dataChanged(index, index, [Qt.DisplayRole])
        return true
    }

    function headerData(section, orientation, role = Qt.DisplayRole) {
        if (role !== Qt.DisplayRole)
            return undefined
        return orientation === Qt.Horizontal ? names[section].toUpperCase() : "r" + section
    }

    function flags(index) {
        return Qt.ItemIsSelectable | Qt.ItemIsEnabled
    }

    function roleNames() {
        return { 0: "display", 1: "decoration", 2: "edit", 3: "toolTip", 4: "statusTip", 5: "whatsThis" }
    }

    function appendRow(row) {
        insertRow(d.rows.length, row)
    }

    function insertRow(at, row) {
        d.rows.splice(at, 0, row)
        rowsInserted(invalidIndex, at, at)
    }

    function removeRow(at, rows = 1) {
        d.rows.splice(at, rows)
        rowsRemoved(invalidIndex, at, at + rows - 1)
    }

    // A reset, as TableModel's is.
    function clear() {
        modelAboutToBeReset()
        d.rows.length = 0
        modelReset()
    }
}
