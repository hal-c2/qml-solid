import QtQuick
import QtQuick.VectorImage

// mark.svg is 90 by 60, green with a white disc; disc.svg is 60 by 30.
Rectangle {
    id: root

    property alias none: none
    property alias mark: mark
    property alias disc: disc
    property alias packed: packed
    property alias box: box
    property alias units: units
    property alias wide: wide
    property alias part: part
    property alias across: across
    property alias down: down
    property alias acrossFit: acrossFit
    property alias empty: empty
    property alias kids: kids
    property alias kid: kid
    property alias later: later
    property alias stretch: stretch
    property alias fit: fit
    property alias crop: crop
    property alias asItIs: asItIs
    property alias offset: offset
    property alias squashed: squashed

    // The sizes of a VectorImage, how many children it has, and the last of
    // them, which the file is drawn in: where it is, its size and its scale.
    function read(item) {
        const sizes = [item.implicitWidth, item.implicitHeight, item.width, item.height, item.children.length]
        if (!item.children.length)
            return sizes
        const held = item.children[item.children.length - 1]
        return sizes.concat([held.x, held.y, held.width, held.height, held.transform[0].xScale, held.transform[0].yScale])
    }

    function said() {
        return [VectorImage.NoResize, VectorImage.PreserveAspectFit, VectorImage.PreserveAspectCrop, VectorImage.Stretch,
                VectorImage.GeometryRenderer, VectorImage.CurveRenderer, none.fillMode, none.preferredRendererType,
                none.assumeTrustedSource, none.animations.loops, none.animations.paused]
    }

    width: 400
    height: 300
    color: "#000000"

    Item {
        visible: false

        VectorImage { id: none }
        VectorImage { id: mark; source: "../assets/mark.svg" }
        VectorImage { id: disc; source: "../assets/disc.svg" }
        VectorImage { id: packed; source: "../assets/disc.svgz" }
        // No size: its viewBox, 40.6 by 20.5.
        VectorImage { id: box; source: "../assets/box.svg" }
        // 20mm by 10pt.
        VectorImage { id: units; source: "../assets/units.svg" }
        // A width and no height.
        VectorImage { id: wide; source: "../assets/wide.svg" }
        // 34% by 20.
        VectorImage { id: part; source: "../assets/part.svg" }
        VectorImage { id: across; source: "../assets/mark.svg"; width: 180 }
        VectorImage { id: down; source: "../assets/mark.svg"; height: 30 }
        VectorImage { id: acrossFit; source: "../assets/mark.svg"; width: 180; fillMode: VectorImage.PreserveAspectFit }
        VectorImage { id: empty; source: "../assets/mark.svg"; width: 0; height: 100; fillMode: VectorImage.PreserveAspectFit }
        VectorImage {
            id: kids
            source: "../assets/mark.svg"
            Rectangle { id: kid; width: 10; height: 10 }
        }
        VectorImage { id: later; source: "../assets/mark.svg"; width: 180; fillMode: VectorImage.PreserveAspectFit }
    }

    VectorImage { id: stretch; source: "../assets/mark.svg"; width: 200; height: 100 }
    VectorImage { id: fit; x: 210; source: "../assets/mark.svg"; width: 200; height: 100; fillMode: VectorImage.PreserveAspectFit }
    VectorImage { id: crop; y: 150; source: "../assets/mark.svg"; width: 100; height: 50; fillMode: VectorImage.PreserveAspectCrop }
    VectorImage { id: asItIs; x: 210; y: 150; source: "../assets/mark.svg"; width: 200; height: 100; fillMode: VectorImage.NoResize }
    // 100 by 50, of a viewBox of 40 by 20 from (10, 10): red, and blue from
    // (20, 15) to (30, 20).
    VectorImage { id: offset; x: 105; y: 110; source: "../assets/offset.svg"; width: 100; height: 100 }
    // 30 by 20, of a viewBox of 40 by 20: red, the top left quarter blue.
    VectorImage { id: squashed; x: 310; y: 150; source: "../assets/squashed.svg" }
}
