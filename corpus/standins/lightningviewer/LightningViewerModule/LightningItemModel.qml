// Stands in for LightningItemModel (lightningitemmodel.cpp): the strikes
// heard of, a row each with its latitude, longitude and timestamp (seconds
// since 1970), the oldest first and never more than a thousand.
import QtQml
import QtQml.Models
import "geo.js" as Geo

ListModel {
    readonly property int historySize: 1000

    function insertData(data) {
        if (count === historySize)
            remove(0)
        append({ latitude: data.latitude, longitude: data.longitude, timestamp: data.timestamp })
    }

    // The newest strike within searchRadius metres of searchCenter: how far,
    // when and in which direction from there. Nothing when there is none.
    function getLatestStrikeInfo(searchCenter, searchRadius) {
        for (let index = count - 1; index >= 0; --index) {
            const strike = get(index)
            const distance = Geo.distance(searchCenter, strike)
            if (distance > searchRadius)
                continue
            return {
                distance: distance,
                timestamp: strike.timestamp,
                direction: Geo.azimuth(searchCenter, strike)
            }
        }
        return null
    }
}
