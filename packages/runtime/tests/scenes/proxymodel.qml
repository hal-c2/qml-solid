import QtQuick

Item {
    id: root
    width: 200; height: 200
    property string wanted: "fruit"
    property var log: []
    property alias src: src
    property alias plain: plain
    property alias fn: fn
    property alias ff: ff
    property alias rs: rs
    property alias ss: ss
    property alias vf: vf
    property alias vfil: vfil
    property alias vf2: vf2
    property alias rows: rows
    property alias plainRows: plainRows
    property alias vfRows: vfRows

    ListModel {
        id: src
        ListElement { name: "pear"; kind: "fruit"; cost: 3 }
        ListElement { name: "Apple"; kind: "fruit"; cost: 2 }
        ListElement { name: "leek"; kind: "veg"; cost: 1 }
        ListElement { name: "fig"; kind: "fruit"; cost: 10 }
        ListElement { name: "apple"; kind: "veg"; cost: 2 }
    }
    SortFilterProxyModel {
        id: plain
        model: src
    }
    SortFilterProxyModel {
        id: fn
        model: src
        filters: [
            FunctionFilter {
                id: ff
                component Data: QtObject { property string kind; property int cost }
                function filter(d: Data): bool { return d.kind === root.wanted }
            }
        ]
        sorters: [
            RoleSorter { id: rs; roleName: "cost" },
            StringSorter { id: ss; roleName: "name" }
        ]
    }
    SortFilterProxyModel {
        id: vf
        sourceModel: src
        filters: [
            ValueFilter { id: vfil; roleName: "kind"; value: "veg" },
            ValueFilter { id: vf2; roleName: "cost" }
        ]
    }
    Repeater {
        id: rows
        model: fn
        Rectangle {
            required property string name
            required property int cost
            required property int index
            required property var model
            y: index * 12; width: 20 + cost; height: 10; color: "teal"
            Component.onCompleted: root.log.push("+" + name)
            Component.onDestruction: root.log.push("-" + name)
        }
    }
    Repeater {
        id: plainRows
        model: plain
        Item { required property string name; required property int cost }
    }
    Repeater {
        id: vfRows
        model: vf
        Item { required property string name }
    }
}
