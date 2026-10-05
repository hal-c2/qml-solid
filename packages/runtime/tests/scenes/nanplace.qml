// Where an item is and how big, given what is no number: Qt's setters take
// no notice of a NaN, so the item stays as it was.
import QtQuick

Item {
    id: root
    width: 200
    height: 100

    property real part: 0
    property alias bound: bound
    property alias put: put

    // What each is once it has been given what is no number.
    function read() {
        const seen = [];
        const note = () => seen.push([bound.x, bound.y, bound.width, bound.height, put.x, put.y, put.width, put.height]);
        note();
        put.x = 0 / 0;
        put.y = 5;
        put.y = Number.NaN;
        put.width = 0 / 0;
        put.height = 0 / 0;
        note();
        root.part = 4;
        note();
        root.part = 0;
        note();
        put.x = 7;
        put.width = undefined;
        note();
        return seen;
    }

    Rectangle {
        id: bound
        x: 12 / root.part - 0 / root.part
        y: root.part * 0 / root.part + 2
        width: 10 * (1 + root.part / root.part)
        height: root.part / root.part * 30
    }

    Rectangle {
        id: put
        x: 1
        width: 30
        implicitWidth: 44
        height: 40
    }

}
