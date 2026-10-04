import QtQuick
import QtSensors

Item {
    id: root
    property var seen: []
    property alias felt: felt

    Accelerometer {
        id: felt
        active: true
        // As the dice example reads it.
        readonly property vector3d force: {
            if (!reading)
                return Qt.vector3d(0, 0, 0)
            let r = reading as AccelerometerReading
            return Qt.vector3d(r.x, r.y, r.z)
        }
        onReadingChanged: root.seen.push("felt " + reading.x + " " + reading.y + " " + reading.z)
    }

    Accelerometer {
        id: pulled
        accelerationMode: Accelerometer.Gravity
        skipDuplicates: true
        onReadingChanged: root.seen.push("pulled " + reading.x + " " + reading.y + " " + reading.z)
        onActiveChanged: root.seen.push("pulled active " + active)
    }

    Accelerometer {
        id: pushed
        accelerationMode: Accelerometer.User
        active: true
        dataRate: 10
        onReadingChanged: root.seen.push("pushed " + reading.x + " " + reading.y + " " + reading.z)
    }

    Gyroscope {
        id: turned
        onReadingChanged: root.seen.push("turned " + reading.x + " " + reading.y + " " + reading.z)
    }

    // What Qt says of a sensor that has read nothing: the same with no
    // sensor at all, but for `active`, `identifier` and `connectedToBackend`.
    function read() {
        const r = felt.reading
        return [felt.type, turned.type, felt.dataRate, felt.error, felt.alwaysOn, felt.skipDuplicates, felt.accelerationMode,
                felt.description, felt.outputRange, felt.axesOrientationMode, felt.currentOrientation, felt.userOrientation,
                felt.maxBufferSize, felt.efficientBufferSize, felt.bufferSize, felt.busy, pulled.active, pulled.accelerationMode,
                pulled.skipDuplicates, r.x, r.y, r.z, r.timestamp, r === felt.reading, turned.reading.x, turned.reading.timestamp,
                felt.isFeatureSupported(Sensor.Buffering), Accelerometer.Combined, Accelerometer.Gravity, Accelerometer.User,
                Sensor.FixedOrientation, Sensor.AutomaticOrientation, Sensor.UserOrientation, Sensor.Buffering, Sensor.GeoValues]
    }

    function here() {
        return [felt.active, felt.connectedToBackend, felt.identifier, turned.active, QmlSensors.sensorTypes(),
                QmlSensors.defaultSensorForType("QAccelerometer"), QmlSensors.defaultSensorForType("QCompass")]
    }

    function force() {
        return [felt.force.x, felt.force.y, felt.force.z, felt.reading.timestamp > 0]
    }

    function start() {
        return [pulled.start(), pulled.active, turned.start(), turned.active]
    }

    function stop() {
        felt.stop()
        turned.active = false
        return [felt.active, turned.active]
    }
}
