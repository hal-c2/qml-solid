// ContextMenu: who is asked for a menu, and where. Qt is asked the same with
// the right button of QtTest's mouse.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var notes: []
    property alias outer: outer
    property alias inner: inner
    property alias silent: silent
    property alias field: field

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    property bool ready: boxes.status === FontLoader.Ready

    function take() {
        const taken = notes
        notes = []
        return taken
    }

    Rectangle {
        id: outer
        x: 20
        y: 20
        width: 200
        height: 120
        color: "#dddddd"
        T.ContextMenu.onRequested: position => root.notes.push("outer " + position.x + "," + position.y)

        Rectangle {
            id: inner
            x: 30
            y: 10
            width: 80
            height: 40
            color: "#bbbbbb"
            T.ContextMenu.onRequested: position => root.notes.push("inner " + position.x + "," + position.y)
        }

        // One that is neither listened to nor has a menu leaves it to what it is in.
        Rectangle {
            id: silent
            x: 30
            y: 60
            width: 80
            height: 40
            color: "#999999"
            T.ContextMenu.menu: null
        }
    }

    // What stands in for a Menu: Qt takes none but its own.
    property int made: 0
    Rectangle {
        id: menued
        x: 250
        y: 20
        width: 100
        height: 60
        color: "#ccddee"
        T.ContextMenu.menu: QtObject {
            property Item parent
            function popup(position) { root.notes.push("popup " + position.x + "," + position.y + " " + (parent === menued)) }
            Component.onCompleted: root.made++
        }
    }

    T.TextField {
        id: field
        x: 20
        y: 160
        width: 200
        height: 30
        text: "abc"
        font.family: boxes.name
        font.pixelSize: 16
        leftPadding: 4
        topPadding: 3
        // A field's menu is asked for where its cursor is, wherever the mouse.
        T.ContextMenu.onRequested: position => root.notes.push("field " + position.x + "," + position.y)
    }
}
