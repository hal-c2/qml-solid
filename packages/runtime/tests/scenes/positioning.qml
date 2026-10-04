import QtQuick
import QtPositioning

Item {
    id: root
    property var seen: []
    property alias source: source
    property geoCoordinate here: source.position.coordinate
    property geoCoordinate kept: QtPositioning.coordinate(1, 2)
    onKeptChanged: seen.push("kept " + kept)

    PositionSource {
        id: source
        updateInterval: 3000
        active: false
        preferredPositioningMethods: PositionSource.AllPositioningMethods
        onPositionChanged: root.seen.push("position " + position.coordinate + " " + root.here.latitude)
        onActiveChanged: root.seen.push("active " + active)
        onSourceErrorChanged: root.seen.push("error " + sourceError)
    }

    function read() {
        const position = source.position
        return [source.active, source.valid, source.updateInterval, source.preferredPositioningMethods, source.sourceError,
                String(position.coordinate), position.latitudeValid, position.longitudeValid, position.altitudeValid,
                position.horizontalAccuracyValid, position.verticalAccuracyValid, position.speedValid, position.directionValid,
                position.verticalSpeedValid, position.magneticVariationValid, position.directionAccuracyValid,
                String(position.timestamp) === "Invalid Date"]
    }

    function numbers() {
        const position = source.position
        return [position.horizontalAccuracy, position.verticalAccuracy, position.speed, position.direction,
                position.verticalSpeed, position.magneticVariation, position.directionAccuracy].map(String)
    }

    function names() {
        return [PositionSource.NoPositioningMethods, PositionSource.SatellitePositioningMethods,
                PositionSource.NonSatellitePositioningMethods, PositionSource.AllPositioningMethods, PositionSource.AccessError,
                PositionSource.ClosedError, PositionSource.UnknownSourceError, PositionSource.NoError,
                PositionSource.UpdateTimeoutError]
    }

    // Assigning the place it has is no change.
    function keep() {
        const before = seen.length
        kept = QtPositioning.coordinate(1, 2)
        kept = QtPositioning.coordinate(1, 2, 3)
        return seen.slice(before)
    }

    function places() {
        const amsterdam = QtPositioning.coordinate(52.37, 4.9)
        const paris = QtPositioning.coordinate(48.85, 2.35)
        const south = QtPositioning.coordinate(-52.3712, 4.9056, 3)
        const nowhere = QtPositioning.coordinate()
        const far = amsterdam.atDistanceAndAzimuth(100000, 45)
        const round = QtPositioning.coordinate(1, 2, 3).atDistanceAndAzimuth(5000000, 300)
        const over = QtPositioning.coordinate(80, 170).atDistanceAndAzimuth(3000000, 60)
        const square = QtPositioning.coordToMercator(amsterdam)
        const back = QtPositioning.mercatorToCoord(Qt.point(-0.25, 1.5))
        return [
            String(amsterdam), String(QtPositioning.coordinate(-52.37, -4.9, 12.5)), JSON.stringify(amsterdam),
            Object.keys(amsterdam).join(), amsterdam === QtPositioning.coordinate(52.37, 4.9),
            amsterdam == QtPositioning.coordinate(52.37, 4.9, 0), String(nowhere), nowhere.isValid,
            String(nowhere.latitude), String(nowhere.altitude), String(QtPositioning.coordinate(91, 0).longitude),
            QtPositioning.coordinate(0, 181).isValid, QtPositioning.coordinate(5).isValid,
            QtPositioning.coordinate(-90, -180).isValid, String(QtPositioning.coordinate("1", "2")),
            amsterdam.distanceTo(paris), amsterdam.azimuthTo(paris), paris.azimuthTo(amsterdam), amsterdam.distanceTo(nowhere),
            amsterdam.azimuthTo(nowhere), far.latitude, far.longitude, String(far.altitude), round.latitude, round.longitude,
            round.altitude, over.latitude, over.longitude, nowhere.atDistanceAndAzimuth(1, 1).isValid,
            south.toString(0), south.toString(1), south.toString(2), south.toString(3), south.toString(4), south.toString(5),
            String(QtPositioning.coordinate(0, 0)), String(QtPositioning.coordinate(-0.5, -0.5)),
            String(QtPositioning.coordinate(59.99999, 179.999999)), QtPositioning.coordinate(59.99999, 179.999999).toString(3),
            String(QtPositioning.coordinate(1, 2, -3.25)), String(QtPositioning.coordinate(1, 2, 1234567.5)),
            square.x, square.y, String(QtPositioning.coordToMercator(nowhere).x),
            QtPositioning.coordToMercator(QtPositioning.coordinate(90, 0)).y,
            QtPositioning.coordToMercator(QtPositioning.coordinate(-90, 0)).y,
            String(QtPositioning.mercatorToCoord(Qt.point(0.25, 0.25))), back.latitude, back.longitude,
            QtPositioning.mercatorToCoord(Qt.point(2.75, 0.5)).longitude, QtPositioning.mercatorToCoord(Qt.point(0.5, -5)).latitude,
            QtPositioning.mercatorToCoord(Qt.point(0.5, 6)).latitude
        ]
    }
}
