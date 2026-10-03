import QtQuick

// Rows that are dragged onto one another to be put in another order, the way
// Qt's to-do list example does it.
Item {
    id: root
    width: 200
    height: 200
    property var log: []

    ListModel {
        id: rows
        ListElement { name: "one" }
        ListElement { name: "two" }
        ListElement { name: "three" }
        ListElement { name: "four" }
    }

    ListView {
        id: view
        anchors.fill: parent
        model: rows
        delegate: Rectangle {
            id: row
            required property int index
            required property string name
            width: 200
            height: 40
            color: "white"
            z: mouseArea.pressed ? 1 : 0
            Drag.active: mouseArea.pressed
            Drag.hotSpot.x: width / 2
            Drag.hotSpot.y: height / 2

            Text { text: row.name }

            MouseArea {
                id: mouseArea
                anchors.fill: parent
                drag.target: parent
                drag.axis: Drag.YAxis
                onReleased: root.log.push("drop " + parent.Drag.drop())

                DropArea {
                    anchors.fill: parent
                    onEntered: drag => root.log.push("over " + row.name)
                    onDropped: drop => {
                        root.log.push(drop.source.name + " on " + row.name)
                        drop.accept()
                        rows.move(drop.source.DelegateModel.itemsIndex, row.index, 1)
                    }
                }
            }
        }
    }

    function read() {
        const names = []
        for (let index = 0; index < rows.count; index++)
            names.push(rows.get(index).name)
        const said = log
        log = []
        return [names, said]
    }
}
