import QtQuick

// A label as a program has one: what is in it has a font of its own, which
// whoever uses the label may say again.
Item {
    property alias font: label.font
    property alias label: label

    Text {
        id: label
        text: "Hello"
        font {
            pixelSize: 30
            bold: true
        }
    }
}
