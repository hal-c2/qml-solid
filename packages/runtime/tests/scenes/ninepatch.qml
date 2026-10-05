import QtQuick
import QtQuick.Controls.impl

// Pictures that say how they stretch (`assets/makepatches.py` writes them,
// and says what each is of), at sizes that are not their own.
Item {
    id: root
    width: 400
    height: 300

    Rectangle { anchors.fill: parent; color: "white" }

    NinePatchImage { id: stretch; x: 10; y: 10; width: 60; height: 40; source: "../assets/patches/stretch.9.png" }
    NinePatchImage { id: padded; x: 80; y: 10; width: 50; height: 30; source: "../assets/patches/padded.9.png" }
    NinePatchImage { id: inset; x: 140; y: 10; width: 60; height: 50; source: "../assets/patches/inset.9.png" }
    NinePatchImage { id: far; x: 210; y: 10; width: 40; height: 30; source: "../assets/patches/far.9.png" }
    NinePatchImage { id: near; x: 260; y: 10; width: 40; height: 30; source: "../assets/patches/near.9.png" }
    NinePatchImage { id: edge; x: 310; y: 10; width: 40; height: 30; source: "../assets/patches/edge.9.png" }

    // What is left over is an odd number of pixels, for two pieces.
    NinePatchImage { id: several; x: 10; y: 70; width: 30; height: 20; source: "../assets/patches/several.9.png" }
    NinePatchImage { id: bare; x: 50; y: 70; width: 30; height: 30; source: "../assets/patches/bare.9.png" }
    NinePatchImage { id: named; x: 90; y: 70; width: 32; height: 32; source: "../assets/patches/not.a.9.png" }
    NinePatchImage { id: shout; x: 130; y: 70; width: 40; height: 30; source: "../assets/patches/Shout.9.PNG" }
    NinePatchImage { id: halves; x: 180; y: 70; width: 46; height: 20; source: "../assets/patches/halves.9.png" }
    NinePatchImage { id: smoothed; x: 240; y: 70; width: 46; height: 20; smooth: true; source: "../assets/patches/halves.9.png" }
    NinePatchImage { id: own; x: 300; y: 70; source: "../assets/patches/stretch.9.png" }
    NinePatchImage { id: plain; x: 330; y: 70; width: 20; height: 20; source: "../assets/patches/whole.png" }

    // A size that is no whole number of pixels.
    NinePatchImage { id: partly; x: 10; y: 120; width: 60.5; height: 40.5; source: "../assets/patches/stretch.9.png" }
    // Its source is changed.
    NinePatchImage { id: changing; x: 80; y: 120; width: 60; height: 50; source: "../assets/patches/inset.9.png" }
    NinePatchImage { id: none; x: 150; y: 120; width: 20; height: 20 }

    readonly property var all: [stretch, padded, inset, far, near, edge, several, bare, named, shout, halves, smoothed, own, plain, partly, changing, none]

    function ready() {
        return all.every((image) => image.status !== Image.Loading)
    }

    readonly property int steps: 6
    function step(index) {
        changing.source = ["../assets/patches/whole.png", "", "../assets/patches/padded.9.png", "../assets/patches/not.a.9.png",
            "../assets/patches/bare.9.png", "../assets/patches/near.9.png"][index]
    }

    function answers() {
        return all.map((image) => [image.status, image.smooth, image.implicitWidth, image.implicitHeight,
            image.sourceSize.width, image.sourceSize.height, image.paintedWidth, image.paintedHeight,
            image.topPadding, image.leftPadding, image.rightPadding, image.bottomPadding,
            image.topInset, image.leftInset, image.rightInset, image.bottomInset])
    }
}
