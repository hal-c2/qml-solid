// The spaces before a line break hang: Qt counts them neither in how wide the
// line is nor in where its alignment puts it, though it counts those that end
// the text, and those that start a line. A line break that ends the text
// starts no line, and only makes the text a line taller than what it covers.
// A TextEdit keeps both.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    property var texts: ["ab", "ab ", " ab", "ab  ", "ab \ncd", "ab \n", " ab \n cd ", "ab\n\n", "\n"]

    Column {
        id: right
        Repeater {
            model: root.texts
            Text { width: 120; text: modelData; horizontalAlignment: Text.AlignRight; font.pixelSize: 16 }
        }
    }
    Column {
        id: centred
        x: 130
        Repeater {
            model: root.texts
            Text { width: 120; text: modelData; horizontalAlignment: Text.AlignHCenter; font.pixelSize: 16 }
        }
    }
    Column {
        id: more
        x: 260
        Text { width: 60; wrapMode: Text.Wrap; text: "ab cd ef gh ij kl\n"; horizontalAlignment: Text.AlignRight; font.pixelSize: 16 }
        Text { width: 60; wrapMode: Text.Wrap; text: "ab cd ef \ngh ij kl"; font.pixelSize: 16 }
        Text { width: 120; maximumLineCount: 1; text: "ab\n"; font.pixelSize: 16 }
        Text { width: 120; maximumLineCount: 2; elide: Text.ElideRight; text: "ab\n\n"; font.pixelSize: 16 }
        Text { width: 120; maximumLineCount: 1; elide: Text.ElideRight; text: "ab \ncd"; font.pixelSize: 16 }
        Text { width: 120; height: 40; verticalAlignment: Text.AlignBottom; text: "ab\n"; font.pixelSize: 16 }
        Text { text: "ab \ncd"; font.pixelSize: 16 }
        TextEdit { text: "ab \n"; font.pixelSize: 16 }
    }

    function sizes(column) {
        const all = []
        for (let i = 0; i < column.children.length; i++) {
            const text = column.children[i]
            if (text.lineCount === undefined) continue
            all.push([text.implicitWidth, text.contentWidth, text.implicitHeight, text.contentHeight, text.lineCount,
                text.truncated === true, text.height, text.baselineOffset])
        }
        return all
    }
    function answers() {
        return [sizes(right), sizes(centred), sizes(more)]
    }
}
