import QtQuick
import Qt.labs.synchronizer

Item {
    id: root
    width: 200; height: 100
    property alias a: a
    property alias b: b
    property alias c: c
    property alias box: box
    property alias inset: inset
    property QtObject other: null
    property string which: "v"
    property var log: []

    QtObject { id: a; property real v: 5; property real w: 3; onVChanged: root.log.push("a.v " + v) }
    QtObject { id: b; property real v: 9; onVChanged: root.log.push("b.v " + v) }
    QtObject { id: c; property real v: 11; onVChanged: root.log.push("c.v " + v) }

    Synchronizer { sourceObject: a; sourceProperty: "v"; targetObject: b; targetProperty: "v" }

    Rectangle {
        id: box
        width: 7; height: 10; color: "red"
        Synchronizer on width { sourceObject: b; sourceProperty: "v" }
    }
    Rectangle {
        id: inset
        anchors.left: parent.left; anchors.top: box.bottom
        width: 10; height: 10; color: "blue"
        Synchronizer on anchors.leftMargin { sourceObject: a; sourceProperty: "w" }
    }

    // Its source is not there yet.
    Synchronizer { sourceObject: root.other; sourceProperty: root.which; targetObject: c; targetProperty: "v" }
}
