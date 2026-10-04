import QtQuick

Item {
    id: root
    width: 400; height: 300

    Item { id: a; width: 67; height: 33; anchors.centerIn: parent }
    Item {
        id: b; width: 67.5; height: 33.5
        anchors.horizontalCenter: parent.horizontalCenter; anchors.verticalCenter: parent.verticalCenter
    }
    Item {
        id: odd; x: 10; y: 20; width: 101; height: 51
        Item { id: c; width: 20; height: 10; anchors.centerIn: parent }
        Item { id: d; width: 21; height: 11; anchors.centerIn: parent; anchors.horizontalCenterOffset: 1.5 }
        Item { id: e; width: 21; height: 11; anchors.centerIn: parent; anchors.alignWhenCentered: false }
    }
    Item {
        id: f; width: 31; height: 15
        anchors.horizontalCenter: odd.horizontalCenter; anchors.verticalCenter: odd.verticalCenter
    }
    Item { id: g; width: 30; height: 14; anchors.left: odd.horizontalCenter; anchors.top: odd.verticalCenter }
    Item { id: h; width: 30; height: 14; anchors.right: odd.horizontalCenter; anchors.bottom: odd.verticalCenter }
    Item {
        id: i
        anchors.left: odd.horizontalCenter; anchors.right: parent.right
        anchors.top: odd.verticalCenter; anchors.bottom: parent.bottom
    }
    Item { id: j; width: 31; height: 15; anchors.centerIn: odd }
    Item { id: k; width: 31; height: 15; anchors.horizontalCenter: odd.right; anchors.verticalCenter: odd.bottom }

    function read() {
        return [a, b, c, d, e, f, g, h, i, j, k].map(o => [o.x, o.y, o.width, o.height])
    }

    function step(index) {
        if (index === 0) a.anchors.alignWhenCentered = false
    }
}
