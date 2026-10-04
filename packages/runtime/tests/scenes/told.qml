import QtCore
import QtQuick

Item {
    id: root
    property var seen: []
    property int two: 2

    Text {
        width: 100
        height: width * root.two
        horizontalAlignment: Text.AlignHCenter
        property int mine: 3
        property int bound: root.two
        property int named: Text.AlignRight
        onWidthChanged: root.seen.push("width " + width)
        onHeightChanged: root.seen.push("height " + height)
        onHorizontalAlignmentChanged: root.seen.push("alignment " + horizontalAlignment)
        onMineChanged: root.seen.push("mine " + mine)
        onBoundChanged: root.seen.push("bound " + bound)
        onNamedChanged: root.seen.push("named " + named)
    }

    LocationPermission {
        accuracy: LocationPermission.Precise
        availability: root.two - 1
        onAccuracyChanged: root.seen.push("accuracy " + accuracy)
        onAvailabilityChanged: root.seen.push("availability " + availability)
    }
}
