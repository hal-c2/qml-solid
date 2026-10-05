// What an item's own properties make of what they are given.
import QtQuick

Item {
    id: root
    width: 200; height: 100
    property var given: false
    property alias bound: bound
    property alias plain: plain

    Item {
        id: bound
        opacity: root.given; scale: root.given; rotation: root.given; z: root.given
        visible: root.given; enabled: root.given; clip: root.given
    }
    Item { id: plain }

    function read(item) {
        return [item.opacity, item.scale, item.rotation, item.z, item.visible, item.enabled, item.clip]
    }
    function assigned(value) {
        const made = []
        for (const name of ["opacity", "scale", "rotation", "z", "visible", "enabled", "clip"]) {
            try {
                plain[name] = value
                made.push(plain[name])
            } catch (error) {
                made.push(error.message)
            }
        }
        return made
    }
}
