// An Image of a drawing is as big as QtSvg makes the file, which is not as
// big as a browser does: an inch is 90, a side is cut down to a whole
// number, and a file that only says its `viewBox` is of that size.
import QtQuick

Item {
    id: root
    width: 300
    height: 200

    Repeater {
        id: all
        model: ["a", "b", "c", "d", "e", "f", "h", "box"]
        Image { source: "../assets/drawn/" + modelData + ".svg" }
    }
    Image { id: asked; source: "../assets/drawn/box.svg"; sourceSize.width: 100 }
    Image { id: wide; source: "../assets/drawn/box.svg"; width: 120 }

    function loading() {
        for (let i = 0; i < all.count; i++)
            if (all.itemAt(i).status === Image.Loading) return true
        return asked.status === Image.Loading || wide.status === Image.Loading
    }
    function sizes() {
        const sizes = {}
        for (let i = 0; i < all.count; i++) {
            const image = all.itemAt(i)
            sizes[all.model[i]] = [image.status, image.implicitWidth, image.implicitHeight, image.sourceSize.width, image.sourceSize.height]
        }
        return sizes
    }
    function scaled() {
        return [asked, wide].map(i => [i.width, i.height, i.implicitWidth, i.implicitHeight, i.sourceSize.width, i.sourceSize.height, i.paintedWidth, i.paintedHeight])
    }
}
