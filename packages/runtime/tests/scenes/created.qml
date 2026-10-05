// What is made while the program runs: a component of a type of a module, by
// their names.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    property var typed: null

    Component.onCompleted: {
        typed = Qt.createComponent("QtQuick", "Rectangle").createObject(root, { width: 30, height: 20, color: "red" })
    }

    function ofType() {
        const component = Qt.createComponent("QtQuick", "Rectangle")
        return [component.status === Component.Ready, typed.width, typed.parent === root, "" + typed.color]
    }
    function unknown() {
        const component = Qt.createComponent("QtQuick", "Nothing")
        return [component.status === Component.Error, component.errorString(), component.createObject(root)]
    }
}
