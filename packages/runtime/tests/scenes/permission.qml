import QtCore
import QtQuick

Item {
    id: root
    property var seen: []
    property alias permission: permission
    property alias other: other

    LocationPermission {
        id: permission
        accuracy: LocationPermission.Precise
        availability: LocationPermission.WhenInUse
        onStatusChanged: root.seen.push("status " + status)
        onAccuracyChanged: root.seen.push("accuracy " + accuracy)
    }

    LocationPermission {
        id: other
    }

    function read() {
        return [permission.status, permission.accuracy, permission.availability, other.status, other.accuracy, other.availability]
    }

    function names() {
        return [Qt.Undetermined, Qt.Granted, Qt.Denied, LocationPermission.Approximate, LocationPermission.Precise,
                LocationPermission.WhenInUse, LocationPermission.Always]
    }
}
