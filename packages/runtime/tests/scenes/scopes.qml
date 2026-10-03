import QtQuick

Item {
    id: board
    property int __cell: 8
    property alias dot: dot
    property alias chip: chip
    width: 400; height: 300

    component Dot: Rectangle { width: board.width / 2; height: __cell; color: "red" }

    Dot { id: dot }
    Item {
        y: 100
        Chip { id: chip }
    }
}
