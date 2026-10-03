import QtQuick

Item {
    id: root
    width: 200; height: 200
    property alias src: src
    property alias af: af
    property alias cf: cf
    property alias dr: dr
    property alias es: es
    property alias fs: fs
    property alias d: d
    property alias bad: bad
    property var views: ({ a: ia, b: ib, c: ic, d: id_, e: ie, f: if_, g: ig, h: ih, bad: ibad })

    ListModel {
        id: src
        ListElement { name: "pear"; kind: "fruit"; cost: 3; tag: "a10" }
        ListElement { name: "Apple"; kind: "fruit"; cost: 2; tag: "a2" }
        ListElement { name: "leek"; kind: "veg"; cost: 1; tag: "B1" }
        ListElement { name: "fig"; kind: "fruit"; cost: 10; tag: "b-2" }
        ListElement { name: "apple"; kind: "veg"; cost: 2; tag: "a1" }
    }
    SortFilterProxyModel { id: a; model: src; filters: [ ValueFilter { id: af; roleName: "kind" } ] }
    SortFilterProxyModel { id: b; model: src; filters: [ ValueFilter { value: "veg" } ] }
    SortFilterProxyModel { id: c; model: src; filters: [ ValueFilter { id: cf; roleName: "cost"; value: "2" } ] }
    SortFilterProxyModel { id: d; model: src; sorters: [ RoleSorter { id: dr; roleName: "name" } ] }
    SortFilterProxyModel { id: e; model: src; sorters: [ StringSorter { id: es; roleName: "tag" } ] }
    SortFilterProxyModel {
        id: f
        model: src
        sorters: [
            FunctionSorter {
                id: fs
                component Data: QtObject { property string name; property int cost }
                function sort(l: Data, r: Data): int { return l.name.length - r.name.length }
            }
        ]
    }
    SortFilterProxyModel {
        id: g
        model: src
        sorters: [
            RoleSorter { roleName: "kind"; sortOrder: Qt.DescendingOrder },
            RoleSorter { roleName: "cost"; priority: 5 }
        ]
    }
    // A proxy of a proxy.
    SortFilterProxyModel { id: h; model: d; filters: [ ValueFilter { roleName: "kind"; value: "fruit" } ] }
    // Not a model with roles: Qt has no rows for it either.
    SortFilterProxyModel { id: bad }

    component Rows: Repeater { Item { required property string name; required property string tag } }
    Rows { id: ia; model: a }
    Rows { id: ib; model: b }
    Rows { id: ic; model: c }
    Rows { id: id_; model: d }
    Rows { id: ie; model: e }
    Rows { id: if_; model: f }
    Rows { id: ig; model: g }
    Rows { id: ih; model: h }
    Rows { id: ibad; model: bad }
}
