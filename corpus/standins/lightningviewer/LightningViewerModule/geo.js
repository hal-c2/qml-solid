// What the C++ asks QGeoCoordinate: how far and in which direction one place
// is from another. A place is anything with a latitude and a longitude, so a
// coordinate of QtPositioning's, a row of the model or a strike just heard of.
.pragma library

// Qt's own mean radius of the earth, in kilometres.
const earthMeanRadius = 6371.0072

function radians(degrees) {
    return degrees * (Math.PI / 180)
}

// QGeoCoordinate::isValid.
function isValid(place) {
    return !!place && place.latitude >= -90 && place.latitude <= 90
            && place.longitude >= -180 && place.longitude <= 180
}

// QGeoCoordinate::distanceTo: metres along the great circle, and 0 when
// either place is none.
function distance(from, to) {
    if (!isValid(from) || !isValid(to))
        return 0
    const dlat = Math.sin(radians(to.latitude - from.latitude) / 2)
    const dlon = Math.sin(radians(to.longitude - from.longitude) / 2)
    const y = dlat * dlat + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * dlon * dlon
    return 2 * Math.asin(Math.sqrt(y)) * earthMeanRadius * 1000
}

// QGeoCoordinate::azimuthTo: degrees clockwise from north, in [0, 360), and
// 0 when either place is none.
function azimuth(from, to) {
    if (!isValid(from) || !isValid(to))
        return 0
    const dlon = radians(to.longitude - from.longitude)
    const lat1 = radians(from.latitude)
    const lat2 = radians(to.latitude)
    const y = Math.sin(dlon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlon)
    const degrees = Math.atan2(y, x) * (180 / Math.PI) + 360
    const whole = Math.trunc(degrees)
    return (whole + 360) % 360 + (degrees - whole)
}

function fuzzyEqual(a, b) {
    return (isNaN(a) && isNaN(b)) || Math.abs(a - b) * 1e12 <= Math.min(Math.abs(a), Math.abs(b))
}

// QGeoCoordinate's ==: the same latitude, longitude and altitude, where at a
// pole the longitude does not matter.
function same(a, b) {
    return fuzzyEqual(a.latitude, b.latitude)
            && (Math.abs(a.latitude) === 90 || fuzzyEqual(a.longitude, b.longitude))
            && fuzzyEqual(a.altitude, b.altitude)
}
