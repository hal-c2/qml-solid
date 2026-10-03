import QtQuick

Text {
    property alias knot: knot
    width: 30; height: 10

    // A picture Qt keeps inside the plugin that is the module.
    Image {
        id: knot
        source: "qrc:/qt-project.org/imports/QtShelf/Pine/images/knot.png"
    }
}
