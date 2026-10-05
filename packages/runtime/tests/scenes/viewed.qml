// What is mounted is in a view, as the root of a QQuickView is in the view's
// content item: `parent` is an item as large as what it is mounted in, and a
// root that fills its parent fills that.
import QtQuick

Rectangle {
    id: root
    anchors.fill: parent
    color: "#848895"
    border.color: "black"

    Rectangle {
        id: corner
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        width: 20; height: 20
    }

    function answers() {
        const at = corner.mapToItem(null, 0, 0)
        return [width, height, parent !== null, parent.width, parent.height, at.x, at.y]
    }
}
