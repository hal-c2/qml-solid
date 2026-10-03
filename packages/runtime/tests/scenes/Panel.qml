import QtQuick

Rectangle {
    id: panel
    property int padding: 10
    property string title: "untitled"
    property int notified: 0
    property alias body: body
    property alias bodyColor: body.color
    default property alias content: body.data
    signal resized(int width)
    enum Kind { Plain, Raised = 2 }

    function grow(by) {
        width = width + by
        resized(width)
    }

    onWidthChanged: notified = notified + 1
    width: 100; height: 80
    color: "white"

    Rectangle {
        id: body
        anchors.fill: parent
        anchors.margins: padding
        color: "silver"
    }
}
