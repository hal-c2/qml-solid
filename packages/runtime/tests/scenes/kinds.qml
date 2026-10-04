import QtQuick
import QtQuick.Shapes

Item {
    id: root
    width: 200; height: 200
    property var log: []
    property var made: null
    Component {
        id: chip
        Rectangle {
            property string kind: "chip"
            width: 10; height: 10
            Component.onDestruction: root.log.push("gone " + kind)
        }
    }
    Shape { id: shape; ShapePath { id: path; fillColor: "red" } }
    Rectangle { id: rect; property int extra: 1; function hello() {} signal went() }
    Text { id: label }
    Tile { id: tile }
    QtObject { id: plain }
    function make() { made = chip.createObject(root); return root.children.length }
    function unmake(delay) { made.destroy(delay); return root.children.length }
    function refuse() { try { rect.destroy(); return "destroyed" } catch (e) { return e.message } }
    function kinds() {
        return [shape instanceof Shape, shape instanceof Item, shape instanceof Rectangle, shape instanceof QtObject,
            rect instanceof Rectangle, rect instanceof Item, rect instanceof Tile, path instanceof ShapePath, path instanceof Item,
            label instanceof Text, tile instanceof Tile, tile instanceof Rectangle, tile instanceof Text,
            plain instanceof QtObject, plain instanceof Item, null instanceof Item, ({}) instanceof Item, 5 instanceof Item, undefined instanceof QtObject]
    }
    function owns() {
        return [path.hasOwnProperty("fillColor"), path.hasOwnProperty("nothing"), rect.hasOwnProperty("extra"),
            rect.hasOwnProperty("color"), rect.hasOwnProperty("width"), rect.hasOwnProperty("objectName"), rect.hasOwnProperty("destroy"),
            rect.hasOwnProperty("forceActiveFocus"), rect.hasOwnProperty("hello"), rect.hasOwnProperty("went"), rect.hasOwnProperty("widthChanged"),
            rect.hasOwnProperty("onWidthChanged"), rect.hasOwnProperty("anchors"), tile.hasOwnProperty("kind"), "color" in rect, "nothing" in rect]
    }
    function read() { return [root.children.length, log] }
}
