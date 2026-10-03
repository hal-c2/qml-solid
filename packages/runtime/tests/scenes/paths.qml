import QtQuick
import "paths/logic.js" as Logic

Item {
    id: root
    property int total: Logic.add(2, 3)
    property var block: Qt.createComponent("paths/Block.qml")
    property url picture: Qt.resolvedUrl("paths/picture.png")
    property string page: "Ball"
    property var shown: null
    property alias loader: loader
    property alias fixed: fixed
    width: 400; height: 300

    function make(kind, x) {
        return Logic.make(kind, root, x)
    }
    function component(kind) {
        return Logic.component(kind)
    }
    function made() {
        return Logic.made
    }
    function own() {
        return Logic.block
    }
    function show() {
        shown = "paths/" + page + ".qml"
    }
    function load() {
        loader.source = "paths/" + page + ".qml"
    }

    Loader { id: fixed; source: "paths/Block.qml" }
    Loader { id: loader; x: 100 }
}
