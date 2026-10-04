import QtQuick

// Bindings that come back to the property they are for.
Item {
    id: root
    width: 200; height: 200

    // As Qt's hangman has it: no loop, since text that does not wrap is as
    // wide as it is whatever the width of its item.
    Rectangle {
        id: box
        width: label.contentWidth + 20; height: 30
        Text {
            id: label
            anchors.fill: parent
            horizontalAlignment: Text.AlignRight
            text: "score"
            font.pixelSize: 20
        }
    }
    // A loop, which ends where it began.
    Item { id: a; width: b.width + 1 }
    Item { id: b; width: a.width }
    // What the property had is what its binding reads of it.
    Item { id: own; width: width + 5 }

    function read() {
        return [box.width - label.contentWidth, label.width - label.contentWidth,
                a.width > 0 && a.width < 3, b.width < 2, own.width]
    }
}
