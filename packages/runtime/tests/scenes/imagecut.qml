// `sourceClipRect`: the part of a picture an Image is to have of it. `read`
// is asked of Qt too, and the colours of the points the test looks at are
// those of Qt's picture of the scene. flag.png is 40 by 20: red on the left,
// blue on the right, with a green corner of five by five.
import QtQuick

Rectangle {
    id: root
    width: 400
    height: 300
    color: "white"

    property alias plain: plain
    property alias cut: cut
    property alias corner: corner
    property alias small: small
    property alias both: both
    property alias fit: fit
    property alias over: over
    property alias outside: outside
    property alias empty: empty
    property alias flat: flat
    property alias later: later

    Image { id: plain; x: 300; y: 200; source: "pictures/flag.png" }
    Image { id: cut; x: 10; y: 10; source: "pictures/flag.png"; sourceClipRect: Qt.rect(15, 0, 10, 10) }
    Image { id: corner; x: 40; y: 10; width: 50; height: 50; source: "pictures/flag.png"; sourceClipRect: Qt.rect(0, 0, 5, 5) }
    Image { id: small; x: 100; y: 10; source: "pictures/flag.png"; sourceSize.height: 10; sourceClipRect: Qt.rect(5, 0, 10, 10) }
    Image { id: both; x: 130; y: 10; source: "pictures/flag.png"; sourceSize: Qt.size(80, 40); sourceClipRect: Qt.rect(30, 0, 20, 30) }
    Image { id: fit; x: 10; y: 100; width: 60; height: 90; fillMode: Image.PreserveAspectFit; source: "pictures/flag.png"; sourceClipRect: Qt.rect(15, 0, 10, 10) }
    Image { id: over; x: 100; y: 100; source: "pictures/flag.png"; sourceClipRect: Qt.rect(30, 10, 20, 20) }
    Image { id: outside; x: 150; y: 100; source: "pictures/flag.png"; sourceClipRect: Qt.rect(200, 200, 30, 30) }
    Image { id: empty; x: 200; y: 100; source: "pictures/flag.png"; sourceClipRect: Qt.rect(20, 10, 0, 0) }
    Image { id: flat; x: 250; y: 100; source: "pictures/flag.png"; sourceClipRect: Qt.rect(20, 10, 30, 0) }
    Image { id: later; x: 300; y: 100; source: "pictures/flag.png" }

    function size(image) {
        return [image.implicitWidth, image.implicitHeight, image.paintedWidth, image.paintedHeight, image.sourceSize.width,
                image.sourceSize.height, image.status].join("/")
    }

    function read() {
        const first = [plain, cut, corner, small, both, fit, over, outside, empty, flat].map(size)
        const before = "" + later.sourceClipRect
        later.sourceClipRect = Qt.rect(5, 5, 10, 20)
        const set = size(later) + " " + later.sourceClipRect
        later.sourceClipRect = undefined
        const reset = size(later) + " " + later.sourceClipRect
        later.sourceClipRect = Qt.rect(20, 0, 20, 10)
        return [first.join(" "), before, set, reset]
    }
}
