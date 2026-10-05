// What is given to an alias is given to the property it is an alias of: a
// group (`sourceSize { }`) is that object's group, and a path is taken from
// the file that object is written in, as one given to a property a component
// declares is taken from the component's. One given to a component that is
// the picture is taken from here. And the size a picture is loaded at when
// `sourceSize` asks for both sides: the smaller that keeps its shape, the
// bigger where the fill mode keeps its shape too, and exactly that for a
// drawing that need not keep it.
import QtQuick
import "pictures"

Item {
    id: root
    width: 400
    height: 300

    Picture {
        id: plain
        source: "flag.png"
    }
    Picture {
        id: sized
        source: "flag.png"
        sourceSize {
            width: 10
            height: 10
        }
    }
    Picture {
        id: fitted
        source: "flag.png"
        fillMode: Image.PreserveAspectFit
        sourceSize.width: 10
        sourceSize.height: 10
    }

    Held {
        id: held
        shown: "flag.png"
    }
    Held {
        id: astray
        shown: "pictures/flag.png"
    }
    Shot {
        id: shot
        source: "pictures/flag.png"
    }
    Shot {
        id: missed
        source: "flag.png"
    }

    Repeater {
        id: loaded
        model: [
            ["/assets/disc.svg", Image.Stretch, 100, 20], ["/assets/disc.svg", Image.PreserveAspectFit, 100, 20],
            ["/assets/disc.svg", Image.PreserveAspectCrop, 100, 20], ["/assets/disc.svg", Image.PreserveAspectFit, 20, 100],
            ["/assets/disc.svg", Image.PreserveAspectFit, 100, 0], ["/assets/disc.svg", Image.Tile, 100, 20],
            ["/assets/flag.png", Image.Stretch, 30, 5], ["/assets/flag.png", Image.PreserveAspectFit, 30, 5],
            ["/assets/flag.png", Image.PreserveAspectCrop, 30, 5], ["/assets/flag.png", Image.PreserveAspectFit, 400, 5],
            ["/assets/flag.png", Image.PreserveAspectCrop, 400, 300], ["/assets/flag.png", Image.Stretch, 400, 300],
            ["/assets/flag.png", Image.Stretch, 400, 5]
        ]
        Image {
            required property var modelData
            source: modelData[0]
            fillMode: modelData[1]
            sourceSize.width: modelData[2]
            sourceSize.height: modelData[3]
        }
    }

    readonly property int steps: 0
    function step(index) {}

    function answers() {
        const all = [[held.status, astray.status, shot.status, missed.status]]
        all.push(...[plain, sized, fitted].map(p => [p.status, p.implicitWidth, p.implicitHeight, p.sourceSize.width, p.sourceSize.height]))
        for (let i = 0; i < loaded.count; i++) {
            const image = loaded.itemAt(i)
            all.push([image.implicitWidth, image.implicitHeight, image.sourceSize.width, image.sourceSize.height])
        }
        return all
    }
}
