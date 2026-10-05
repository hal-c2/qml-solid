// `this` in a binding or a handler is the object it is written on; a
// function has its own.
import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property int size: 3
    property var said: []
    function grown() { return this.size + 1 }

    Rectangle {
        id: box
        width: this.height * 2
        height: 10
        property var each: [1, 2].map(n => this.height + n)
        function wider() { return this.width + 1 }
        MouseArea {
            id: area
            width: 7
            signal poked()
            onPoked: root.said.push(["handler", this === area, this.width, parent.wider()])
            Component.onCompleted: {
                root.said.push(["completed", this === area, this.width])
                poked()
            }
        }
        states: State {
            name: "on"
            when: root.size === 3
            PropertyChanges { target: box; color: this === box ? "red" : "blue"; border.width: this.height }
        }
    }
    Repeater {
        model: 2
        Text { text: "n" + this.index + ":" + (this.parent === root) }
    }
    Text { id: label; width: 9; font.pixelSize: this.width + 5; anchors.leftMargin: this.width }

    function read() {
        return [grown(), box.width, box.each, children[1].text, children[2].text, label.font.pixelSize, label.anchors.leftMargin, String(box.color), box.border.width, said]
    }
}
