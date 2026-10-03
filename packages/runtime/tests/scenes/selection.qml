import QtQuick

Item {
    id: root
    width: 200; height: 200
    property var log: []
    property alias src: src
    property alias sorted: sorted
    property alias sel: sel
    property bool chosen: sel.hasSelection && sel.isSelected(src.index(1, 0))

    ListModel {
        id: src
        ListElement { name: "pear" }
        ListElement { name: "Apple" }
        ListElement { name: "leek" }
        ListElement { name: "fig" }
        ListElement { name: "apple" }
    }
    SortFilterProxyModel { id: sorted; model: src; sorters: [ RoleSorter { roleName: "name" } ] }
    ItemSelectionModel {
        id: sel
        model: src
        onSelectionChanged: (selected, deselected) => root.log.push("selection " + selected.length + " " + deselected.length)
        onCurrentChanged: (current, previous) => root.log.push("current " + current.row + " " + current.column + " " + previous.row + " " + previous.valid)
        onCurrentRowChanged: (current, previous) => root.log.push("row " + current.row + " " + previous.row)
        onCurrentColumnChanged: (current, previous) => root.log.push("column " + current.column + " " + previous.column)
    }
}
