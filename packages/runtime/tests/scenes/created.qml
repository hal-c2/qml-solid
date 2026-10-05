// What is made while the program runs: a component of a type of a module, by
// their names, and an object of a text of QML, which sees what the file that
// gives the text sees.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    property string shade: "blue"
    property var typed: null
    property var written: null
    property var joined: null
    property var seeing: null
    property var tile: null

    Item { id: inner; property int size: 7 }

    Component.onCompleted: {
        typed = Qt.createComponent("QtQuick", "Rectangle").createObject(root, { width: 30, height: 20, color: "red" })
        written = Qt.createQmlObject('import QtQuick; Rectangle { width: 30; height: width * 2; color: "red" }', root)
        joined = Qt.createQmlObject('import QtQuick; Text { text: "it is ' + root.shade + '"; color: "' + shade + '" }', written)
        seeing = Qt.createQmlObject(`import QtQuick
            Rectangle { color: root.shade; width: inner.size; height: shade.length }`, root)
        tile = Qt.createQmlObject('import QtQuick; Tile { }', inner)
    }

    function ofType() {
        const component = Qt.createComponent("QtQuick", "Rectangle")
        return [component.status === Component.Ready, typed.width, typed.parent === root, "" + typed.color]
    }
    function ofText() {
        return [written.width, written.height, written.parent === root, "" + written.color,
            joined.text, "" + joined.color, joined.parent === written]
    }
    // The text given was put together once: what it was put together of is
    // what it was then, and what it names is what that is now.
    function ofContext() {
        shade = "green"
        return ["" + seeing.color, seeing.width, seeing.height, joined.text, tile.kind, tile.parent === inner]
    }
    function unknown() {
        const component = Qt.createComponent("QtQuick", "Nothing")
        return [component.status === Component.Error, component.errorString(), component.createObject(root)]
    }
}
