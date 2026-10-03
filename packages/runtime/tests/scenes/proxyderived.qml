import QtQuick

// A proxy as Qt's toycustomizer has it: over a ListModel type of the
// program's own, given through an alias, asked again from a change handler.
Item {
    id: root
    width: 200; height: 200
    property alias model: proxy.model
    property alias proxy: proxy
    property alias view: view
    property alias rows: rows
    property int tab: 0
    property var log: []

    component Parts: ListModel {
        function groups() {
            return ["hat", "eye"]
        }
        ListElement { name: "cap"; group: "hat"; selected: false }
        ListElement { name: "lens"; group: "eye"; selected: false }
        ListElement { name: "crown"; group: "hat"; selected: false }
        ListElement { name: "patch"; group: "eye"; selected: false }
    }

    model: Parts {}

    SortFilterProxyModel {
        id: proxy
        property string groupFilter: root.model.groups()[root.tab] ?? ""
        onGroupFilterChanged: {
            root.log.push("filter " + groupFilter)
            invalidate()
        }
        filters: [
            FunctionFilter {
                component RoleData: QtObject { property string group }
                function filter(data: RoleData) : bool {
                    return (data.group === proxy.groupFilter)
                }
            }
        ]
        function setSelected(index_) {
            let proxyIndex = -1
            for (let i = 0; i < model.count; ++i) {
                const it = model.get(i)
                if (it.group === groupFilter) {
                    ++proxyIndex
                    if (proxyIndex === index_)
                        it.selected = true
                    else if (it.selected)
                        it.selected = false
                }
            }
        }
    }

    ListView {
        id: view
        width: 100; height: 100
        model: proxy
        delegate: Rectangle {
            required property string name
            required property bool selected
            required property int index
            width: 100; height: 20
            color: selected ? "red" : "blue"
        }
    }

    Repeater {
        id: rows
        model: proxy
        Item {
            required property string name
            required property bool selected
        }
    }
}
