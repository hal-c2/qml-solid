// Stands in for DataModel (datamodel.cpp), which QML knows as CsvDataModel:
// the table a CSV file of medals is, its first row the names of the columns
// and every other row a team and its four counts.
//
// In C++ it is a QAbstractTableModel, which nothing written in QML can be.
// This is an object with what QML calls of one: rowCount, columnCount,
// index, data, headerData, flags, roleNames and the signals of a reset. A
// cell is told by anything with a row and a column, as a QModelIndex has.
//
// The file is read as the C++ reads it, at once, and split as its parser
// splits a file whose fields are separated by commas (the parser also takes
// other separators, by guessing; this does not). "qrc:/data/medals.csv" is a
// resource of the program there and the example's own data/medals.csv here.
import QtQml

QtObject {
    id: model

    // Qt::UserRole + 1.
    enum CustomRoles { Background = 257 }

    signal modelAboutToBeReset()
    signal modelReset()

    // Private in C++: the rows, the first being the names of the columns,
    // and here also the cells handed out, so that a cell is always the same
    // object.
    readonly property var d: ({ csvData: [], indexes: {} })
    readonly property var invalidIndex: ({ row: -1, column: -1, valid: false, model: null })

    function rowCount(parent) {
        return d.csvData.length
    }

    function columnCount(parent) {
        return d.csvData.length ? d.csvData[0].length : 0
    }

    function hasIndex(row, column, parent) {
        return row >= 0 && column >= 0 && row < rowCount() && column < columnCount()
    }

    function index(row, column = 0, parent) {
        if (!hasIndex(row, column))
            return invalidIndex
        const key = row + "," + column
        if (!d.indexes[key])
            d.indexes[key] = { row: row, column: column, valid: true, model: model }
        return d.indexes[key]
    }

    function data(index, role = Qt.DisplayRole) {
        if (role === Qt.DisplayRole && index && hasIndex(index.row, index.column))
            return d.csvData[index.row][index.column]
        return undefined
    }

    // What is above a column is its name, and what is beside a row its team.
    function headerData(section, orientation, role = Qt.DisplayRole) {
        if (role !== Qt.DisplayRole || section < 0)
            return undefined
        if (orientation === Qt.Horizontal && section < columnCount())
            return d.csvData[0][section]
        if (orientation === Qt.Vertical && section < rowCount() && columnCount() > 0)
            return d.csvData[section][0]
        return undefined
    }

    // Qt::ItemIsSelectable | Qt::ItemIsEnabled.
    function flags(index) {
        return index && index.valid ? 33 : 0
    }

    function roleNames() {
        return {
            0: "display", 1: "decoration", 2: "edit", 3: "toolTip", 4: "statusTip", 5: "whatsThis",
            257: "background"
        }
    }

    function readCsv(csvFile) {
        modelAboutToBeReset()

        const text = read(csvFile)
        if (text === undefined) {
            console.warn("Could not open " + csvFile + " for reading")
            return
        }

        const rows = parse(text)
        const headers = rows.length ? rows[0] : []
        d.indexes = {}
        d.csvData = headers.length ? [headers] : []
        for (const row of rows.slice(1)) {
            // A row with more or fewer fields than there are names is none.
            if (row.length !== headers.length)
                continue
            const team = row[0]
            d.csvData.push([team].concat([1, 2, 3, 4].map((column) => tryConvertToInt(team, headers[column], row[column]))))
        }

        modelReset()
    }

    // The rest is private in C++, or the parser's.

    // The file whole, or nothing when it cannot be read.
    function read(csvFile) {
        const example = "../../../qtdoc/examples/demos/graphs_csv/"
        const url = String(csvFile)
        const request = new XMLHttpRequest()
        request.open("GET", url.startsWith("qrc:/") ? Qt.resolvedUrl(example + url.slice(5).replace(/^\/+/, ""))
                          : /^[a-z][a-z0-9+.-]*:/i.test(url) ? url
                          : Qt.resolvedUrl(example + url), false)
        try {
            request.send()
        } catch (error) {
            return undefined
        }
        if (request.status !== 200 && request.status !== 0 || !request.responseText)
            return undefined
        // A server may answer for a file it has not got with a page of its own.
        if (/^text\/html/.test(request.getResponseHeader("Content-Type") || ""))
            return undefined
        return request.responseText
    }

    // The rows of a CSV file, each the fields it has. A field in quotes can
    // have commas and line ends in it, and a quote as two; an empty line is
    // no row.
    function parse(text) {
        const rows = []
        let row = []
        let field = ""
        let quoted = false
        let any = false
        const endRow = () => {
            if (any || row.length) {
                row.push(field)
                rows.push(row)
            }
            row = []
            field = ""
            any = false
        }
        for (let at = 0; at < text.length; ++at) {
            const c = text[at]
            if (quoted) {
                if (c !== "\"")
                    field += c
                else if (text[at + 1] === "\"")
                    field += text[++at]
                else
                    quoted = false
            } else if (c === "\"") {
                quoted = true
                any = true
            } else if (c === ",") {
                row.push(field)
                field = ""
            } else if (c === "\n" || c === "\r") {
                endRow()
            } else {
                field += c
                any = true
            }
        }
        endRow()
        return rows
    }

    // The number a field starts with, which is all std::from_chars reads;
    // -1 and a warning when it starts with none, or with -1.
    function tryConvertToInt(team, fieldName, field) {
        const digits = /^-?[0-9]+/.exec(field)
        let value = digits ? Number(digits[0]) : -1
        if (value < -2147483648 || value > 2147483647)
            value = -1
        if (value === -1)
            console.warn(team + ": error in " + fieldName + " field")
        return value
    }
}
