// A picture whose path is the component's own property, which it uses here.
import QtQuick

Item {
    id: root
    property url shown
    readonly property alias status: image.status
    Image {
        id: image
        source: root.shown
    }
}
