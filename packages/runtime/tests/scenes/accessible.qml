import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property bool on: false

    Rectangle {
        id: button
        objectName: "button"
        width: 100
        height: 40
        color: "steelblue"
        Accessible.role: Accessible.Button
        Accessible.name: "backspace"
        Accessible.description: root.on ? "takes one away" : ""
    }

    Rectangle {
        id: box
        objectName: "box"
        y: 50
        width: 40
        height: 40
        color: "tomato"
        Accessible.role: Accessible.CheckBox
        Accessible.checkable: true
        Accessible.checked: root.on
        Accessible.labelledBy: caption
    }

    Text {
        id: caption
        objectName: "caption"
        x: 50
        y: 50
        text: "Remember"
        Accessible.ignored: root.on
    }

    function read() {
        return [button.Accessible.role === Accessible.Button, button.Accessible.name, box.Accessible.checked,
                Accessible.Button, Accessible.StaticText]
    }

    function items() {
        return [button, box, caption]
    }

    function step() {
        root.on = true
    }
}
