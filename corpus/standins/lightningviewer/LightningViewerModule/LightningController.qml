// Stands in for Controller (controller.cpp), which QML knows as the
// singleton LightningController: the strikes there have been, and how far,
// when and in which direction the last one near the user was.
//
// The strikes come from the same service as in C++, see LightningProvider.
// "Near" is within a hundred kilometres. As in C++ a user whose location is
// not known is at no distance from anything, so every strike is near.
pragma Singleton
import QtQml
import "geo.js" as Geo

QtObject {
    id: controller

    readonly property LightningItemModel model: LightningItemModel {}
    // -1 when there is no last strike. The controller's own to set.
    property double lastStrikeDistance: -1
    property int lastStrikeTime: -1
    property double lastStrikeDirection: -1
    property bool distanceTimeLayerEnabled: false

    signal lastStrikeInfoUpdated()
    signal modelUpdated()

    // Private in C++.
    readonly property int notificationRadius: 100000
    readonly property LightningProvider provider: LightningProvider {}
    readonly property var d: ({ userLocation: { latitude: NaN, longitude: NaN, altitude: NaN } })

    function setUserLocation(coordinate) {
        if (Geo.same(d.userLocation, coordinate))
            return
        d.userLocation = {
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            altitude: coordinate.altitude
        }
        updateDistanceTime()
    }

    function setLastStrikeInfo(info) {
        lastStrikeDistance = info ? info.distance : -1
        lastStrikeTime = info ? info.timestamp : -1
        lastStrikeDirection = info ? info.direction : -1
        lastStrikeInfoUpdated()
    }

    // The last strike near the user, of those there have been.
    function updateDistanceTime() {
        if (distanceTimeLayerEnabled)
            setLastStrikeInfo(model.getLatestStrikeInfo(d.userLocation, notificationRadius))
    }

    function onDataReceived(data) {
        model.insertData(data)
        if (!distanceTimeLayerEnabled)
            return
        const distance = Geo.distance(d.userLocation, data)
        if (distance > notificationRadius)
            return
        setLastStrikeInfo({
            distance: distance,
            timestamp: data.timestamp,
            direction: Geo.azimuth(d.userLocation, data)
        })
    }

    onDistanceTimeLayerEnabledChanged: updateDistanceTime()
    Component.onCompleted: provider.dataReady.connect(onDataReceived)
}
