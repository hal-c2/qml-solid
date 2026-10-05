import QtQuick
import QtShelf as Shelves

// QML of Qt's that comes to a module with a style: the style is that of the
// program that came to this.
Item {
    property var kind: Shelves.Shelf
    property alias knot: knot

    // A picture Qt keeps inside another module than this, which names it.
    Image {
        id: knot
        source: "qrc:/qt-project.org/imports/QtShelf/Pine/images/knot.png"
    }
}
