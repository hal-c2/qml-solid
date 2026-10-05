import QtQuick

Item {
    id: root
    width: 200; height: 100
    property var said: []

    ListModel {
        id: rows
        ListElement { name: "a"; cost: 1 }
        ListElement { name: "b"; cost: 2 }
        ListElement { name: "c"; cost: 3 }
    }

    Connections {
        target: rows
        function onDataChanged(from, to, roles) { root.said.push(["data", from.row, from.column, to.row, roles.length]) }
        function onRowsInserted(parent, first, last) { root.said.push(["inserted", parent.valid, first, last, rows.count]) }
        function onRowsRemoved(parent, first, last) { root.said.push(["removed", first, last, rows.count]) }
        function onRowsMoved(parent, first, last, to, row) { root.said.push(["moved", first, last, row]) }
    }

    function step(work) {
        said = []
        work()
        return said
    }

    function run() {
        return [
            step(() => rows.setProperty(1, "cost", 5)),
            step(() => rows.setProperty(1, "cost", 5)),
            step(() => rows.set(0, { name: "z", cost: 9 })),
            step(() => { rows.get(2).name = "q" }),
            step(() => rows.append({ name: "d", cost: 4 })),
            step(() => rows.append([{ name: "e", cost: 4 }, { name: "f", cost: 4 }])),
            step(() => rows.insert(1, { name: "i", cost: 4 })),
            step(() => rows.move(0, 2, 2)),
            step(() => rows.move(3, 0, 1)),
            step(() => rows.remove(1, 2)),
            step(() => rows.set(rows.count, { name: "n" })),
            step(() => rows.setProperty(0, "extra", 5)),
            step(() => rows.clear()),
            step(() => rows.clear()),
        ]
    }
}
