// A picture in a frame: what it shows and how is the Image's, by aliases.
import QtQuick

Item {
    id: root

    property alias source: image.source
    property alias sourceSize: image.sourceSize
    property alias fillMode: image.fillMode
    readonly property alias status: image.status

    implicitWidth: image.implicitWidth
    implicitHeight: image.implicitHeight

    Image {
        id: image
        anchors.fill: parent
    }
}
