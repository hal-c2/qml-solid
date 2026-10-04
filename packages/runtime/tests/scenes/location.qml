import QtQuick
import QtLocation
import QtPositioning

Item {
    id: root
    property alias map: map
    property alias marker: marker
    property alias view: view
    property alias frame: frame
    property var seen: []

    ListModel {
        id: places
        ListElement { latitude: 51.5073; longitude: -0.1277 }
        ListElement { latitude: 59.91; longitude: 10.75 }
    }

    // Maps of other providers, and of none.
    Map { id: bare; x: 400; width: 100; height: 80 }
    Map { id: lost; x: 400; width: 100; height: 80; plugin: Plugin { name: "nosuch" } }
    Map {
        id: overlay
        x: 400; width: 100; height: 80
        zoomLevel: 0.2
        center: QtPositioning.coordinate(80, 10)
        plugin: Plugin { name: "itemsoverlay" }
    }
    Map {
        id: own
        x: 400; width: 100; height: 80
        zoomLevel: 25
        plugin: Plugin {
            name: "osm"
            PluginParameter { name: "osm.mapping.providersrepository.disabled"; value: "true" }
            PluginParameter { name: "osm.mapping.custom.host"; value: "http://tiles.test/own/" }
            PluginParameter { name: "osm.mapping.custom.mapcopyright"; value: "Mine" }
            PluginParameter { name: "osm.mapping.custom.datacopyright"; value: "Theirs" }
        }
        onCopyrightsChanged: html => root.seen.push(html)
    }
    Plugin { id: unnamed }

    Item {
        id: frame
        width: 400
        height: 300

        Map {
            id: map
            anchors.fill: parent
            zoomLevel: 5
            center: QtPositioning.coordinate(52.37, 4.9)
            plugin: Plugin {
                name: "osm"
                PluginParameter { name: "osm.mapping.providersrepository.disabled"; value: "true" }
            }
            onCopyrightsChanged: html => root.seen.push(html)
            onCopyrightLinkActivated: link => root.seen.push("link " + link)

            MapQuickItem {
                id: marker
                coordinate: QtPositioning.coordinate(48.85, 2.35)
                anchorPoint.x: 12
                anchorPoint.y: 6
                sourceItem: Rectangle { id: flag; width: 24; height: 12; color: "red" }
            }

            MapItemView {
                id: view
                model: places
                delegate: MapQuickItem {
                    required property double latitude
                    required property double longitude
                    coordinate: QtPositioning.coordinate(latitude, longitude)
                    sourceItem: Rectangle { width: 10; height: 10; color: "blue"; anchors.centerIn: parent }
                }
            }

            Rectangle { anchors.top: map.top; anchors.right: map.right; width: 20; height: 20 }
        }
    }

    function point(p) {
        return [p.x, p.y]
    }

    function place(c) {
        return [c.latitude, c.longitude]
    }

    function box(item) {
        return [item.x, item.y, item.width, item.height]
    }

    // The map, its items and where it says places and points are.
    function read() {
        const out = [map.zoomLevel, ...place(map.center), map.minimumZoomLevel, map.maximumZoomLevel, map.bearing,
                     map.mapReady, map.activeMapType.name, map.mapItems.length, view.mapItems.length, ...box(view),
                     ...box(marker), ...point(flag.mapToItem(map, 0, 0)), ...point(flag.mapToItem(map, 24, 12)),
                     flag.parent.visible ? flag.parent.opacity : -1, flag.parent.visible, marker.parent === map]
        const dots = []
        for (const dot of view.mapItems)
            dots.push(dot)
        dots.sort((a, b) => a.latitude - b.latitude)
        for (const dot of dots)
            out.push(dot.latitude, ...box(dot), dot.sourceItem.x, dot.sourceItem.y, dot.parent === view)
        out.push(...point(map.fromCoordinate(QtPositioning.coordinate(48.85, 2.35))),
                 ...point(map.fromCoordinate(QtPositioning.coordinate(10, 100))),
                 ...point(map.fromCoordinate(QtPositioning.coordinate(10, 100), false)),
                 ...point(map.fromCoordinate(QtPositioning.coordinate(52.37, -170), false)),
                 ...point(map.fromCoordinate(QtPositioning.coordinate(), false)),
                 ...place(map.toCoordinate(Qt.point(0, 0))),
                 ...place(map.toCoordinate(Qt.point(-10, -10))),
                 ...place(map.toCoordinate(Qt.point(-10, -10), false)),
                 ...place(map.toCoordinate(Qt.point(500, 400), false)),
                 ...place(map.toCoordinate(Qt.point(-5000, 100), false)),
                 map.toCoordinate(Qt.point(100, 100)).altitude)
        return out.map(value => typeof value === "number" && !isFinite(value) ? String(value) : value)
    }

    // Where the corner of a tile is: `count` of them are the Earth across.
    function corner(x, y, count) {
        return point(map.fromCoordinate(QtPositioning.mercatorToCoord(Qt.point(x / count, y / count)), false))
    }

    // What the providers say they have, and what a map makes of each.
    function others() {
        const out = []
        for (const type of map.supportedMapTypes)
            out.push(type.style, type.name, type.description, type.mobile, type.night, type.cameraCapabilities.maximumZoomLevel)
        const osm = map.plugin
        out.push(map.activeMapType === map.supportedMapTypes[0], map.error, map.errorString, map.copyrightsVisible,
                 String(map.color), map.clip, osm.name, osm.isAttached, Array.from(osm.availableServiceProviders).sort().join(),
                 osm.supportsMapping(), osm.supportsMapping(Plugin.OnlineMappingFeature),
                 osm.supportsMapping(Plugin.OfflineMappingFeature), osm.supportsMapping(Plugin.NoMappingFeatures),
                 osm.supportsMapping(Plugin.OnlineMappingFeature | Plugin.LocalizedMappingFeature),
                 MapType.StreetMap, MapType.TerrainMap, MapType.CustomMap, Plugin.AnyMappingFeatures,
                 Plugin.PlaceMatchingFeature)
        out.push(bare.zoomLevel, bare.minimumZoomLevel, bare.maximumZoomLevel, bare.supportedMapTypes.length,
                 bare.activeMapType.style, bare.activeMapType.name, bare.mapReady, bare.error, bare.plugin,
                 ...point(bare.fromCoordinate(bare.center)), bare.toCoordinate(Qt.point(1, 1)).isValid)
        out.push(lost.error, lost.errorString, lost.mapReady, lost.supportedMapTypes.length, lost.plugin.isAttached,
                 lost.plugin.supportsMapping(), unnamed.isAttached, unnamed.supportsMapping())
        out.push(overlay.zoomLevel, ...place(overlay.center), overlay.minimumZoomLevel, overlay.maximumZoomLevel,
                 overlay.mapReady, overlay.supportedMapTypes.length, overlay.activeMapType.name,
                 overlay.plugin.supportsMapping(), overlay.plugin.supportsMapping(Plugin.OnlineMappingFeature),
                 overlay.plugin.supportsMapping(Plugin.OfflineMappingFeature),
                 ...point(overlay.fromCoordinate(overlay.center)))
        const last = own.supportedMapTypes[own.supportedMapTypes.length - 1]
        out.push(own.zoomLevel, own.maximumZoomLevel, own.supportedMapTypes.length, last.style, last.name,
                 own.activeMapType.name)
        own.activeMapType = last
        own.zoomLevel = 25
        out.push(own.activeMapType === last, own.zoomLevel, own.maximumZoomLevel, ...seen)
        return out.map(value => typeof value === "number" && !isFinite(value) ? String(value) : value)
    }

    function step(index) {
        switch (index) {
        case 0:
            map.pan(30, -20.9)
            break
        case 1: {
            // What a wheel does: closer, the place under the pointer staying there.
            const at = Qt.point(100, 80)
            const under = map.toCoordinate(at)
            map.zoomLevel += 1.5
            map.alignCoordinateToPoint(under, at)
            break
        }
        case 2:
            map.bearing = 400
            break
        case 3:
            map.pan(-50, 10)
            map.alignCoordinateToPoint(QtPositioning.coordinate(48.85, 2.35), Qt.point(390, 20))
            break
        case 4:
            map.bearing = -360
            map.zoomLevel = 1
            break
        case 5:
            map.zoomLevel = 5
            break
        case 6:
            map.center = QtPositioning.coordinate()
            map.zoomLevel = -1
            map.pan(0, 0)
            map.pan(300, 0)
            map.alignCoordinateToPoint(QtPositioning.coordinate(), Qt.point(0, 0))
            break
        case 7:
            map.center = QtPositioning.coordinate(89, -170)
            break
        case 8:
            map.center = QtPositioning.coordinate(52.37, 4.9)
            map.bearing = 330
            marker.zoomLevel = 4
            break
        case 9:
            map.bearing = 0
            marker.zoomLevel = 0
            marker.anchorPoint = Qt.point(0, 12)
            places.append({ latitude: -33.87, longitude: 151.21 })
            places.remove(0)
            break
        case 10:
            marker.coordinate = QtPositioning.coordinate()
            map.zoomLevel = 2.25
            break
        case 11:
            frame.height = 1000
            break
        case 12:
            frame.height = 300
            break
        case 13:
            map.activeMapType = map.supportedMapTypes[4]
            map.minimumZoomLevel = 4
            break
        case 14:
            map.maximumZoomLevel = 3
            break
        case 15:
            map.zoomLevel = 31
            map.minimumZoomLevel = -1
            map.maximumZoomLevel = 40
            break
        }
    }
}
