import QtQuick
import QtQuick.Templates as T

// How big a font is when it is told to be no size at all: as big as it was.
Item {
    id: root
    width: 400
    height: 300

    property real step: 0
    // What a sum with something missing in it comes to.
    function missing(scale) {
        const from = undefined * 0.9
        return Math.round(from * scale)
    }

    Text { id: zero; text: "Hello"; font.pixelSize: root.step * 0 }
    Text { id: less; text: "Hello"; font.pixelSize: -3 - root.step }
    Text { id: none; text: "Hello"; font.pixelSize: root.missing(2) }
    Text { id: later; text: "Hello"; font.pixelSize: root.step > 1 ? root.missing(2) : root.step > 0 ? 0 : 20 }
    Text { id: both; text: "Hello"; font.pointSize: 18; font.pixelSize: root.step * 0 }
    Text { id: points; text: "Hello"; font.pointSize: 18; Component.onCompleted: font.pointSize = -1 }
    Text { id: whole; text: "Hello"; font.pixelSize: 30.7 + root.step * 0 }
    // The size given through an alias is the only one the font is given:
    // what the label said itself is not said any more.
    Sized { id: through; font.pixelSize: root.missing(3) }
    Sized { id: kept }
    // A control's font is the same.
    T.Label { id: labelled; text: "Hello"; font.pixelSize: root.missing(4) }
    T.Label { id: asked; text: "Hello"; font.pixelSize: 22; Component.onCompleted: font.pixelSize = 0 }

    function size(text) {
        return text.font.pixelSize + "/" + text.implicitHeight
    }

    function read() {
        const said = []
        said.push([zero, less, none, later, both, whole, through.label, kept.label, labelled, asked].map(size).join(" "))
        said.push(points.font.pointSize)
        root.step = 1
        said.push(size(later))
        root.step = 2
        said.push(size(later))
        try {
            later.font.pixelSize = root.missing(2)
        } catch (error) {
            said.push(String(error))
        }
        later.font.pixelSize = -4
        said.push(size(later))
        later.font.pixelSize = 16
        said.push(size(later))
        return said
    }
}
