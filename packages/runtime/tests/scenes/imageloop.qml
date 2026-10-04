import QtQuick
import QtQuick.Layouts

// A picture asked for at a size that follows from its own.
Item {
    id: root
    width: 400; height: 300

    Image { id: plain; source: "../assets/mark.svg" }
    // As Qt's coffee has it: as wide as it is high, and as high as it is
    // loaded.
    Image {
        id: loop
        source: "../assets/mark.svg"
        sourceSize.width: height * 1.5
        sourceSize.height: 20
    }
    // Nothing else says how high: the picture's own height, then.
    Image {
        id: free
        source: "../assets/mark.svg"
        sourceSize.width: height
    }
    RowLayout {
        height: 60
        Image {
            id: laid
            source: "../assets/mark.svg"
            Layout.alignment: Qt.AlignCenter
            sourceSize.width: height * 3
            sourceSize.height: 20
        }
    }

    function size(image) {
        return [image.width, image.height, image.sourceSize.width, image.sourceSize.height,
                image.paintedWidth, image.paintedHeight]
    }
    function read() {
        return [size(plain), size(loop), size(free), size(laid)]
    }
    property bool ready: plain.status === Image.Ready && loop.status === Image.Ready
                         && free.status === Image.Ready && laid.status === Image.Ready
}
