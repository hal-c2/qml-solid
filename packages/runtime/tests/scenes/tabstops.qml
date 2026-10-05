// A tab in a Text goes on to the next of the stops Qt has every 80 pixels
// along a line, counted from where the line starts: from a stop it is on, to
// the one after. At a soft wrap it hangs, and where a text is cut to fit it
// counts as a whole stop's distance. A TextEdit says how far apart they are.
import QtQuick

Item {
    id: root
    width: 400
    height: 300

    readonly property var texts: ["a\tb", "ab\t", "\t", "a\t\tb", "ab \tcd \t\nef", "a long word here\tb", "a\tb\nlonger\tb"]

    Column {
        id: plain
        Repeater {
            model: root.texts
            Text { required property string modelData; text: modelData }
        }
    }
    Column {
        id: right
        x: 200
        Repeater {
            model: root.texts
            Text { required property string modelData; text: modelData; width: 190; horizontalAlignment: Text.AlignRight }
        }
    }
    Text { id: wrapped; y: 200; width: 150; wrapMode: Text.WordWrap; text: "one\ttwo three\tfour five six" }
    Text { id: elided; y: 250; width: 150; elide: Text.ElideRight; text: "one\ttwo three\tfour five six" }
    Text { id: left; y: 270; width: 150; elide: Text.ElideLeft; text: "one\ttwo three\tfour five six" }
    Text { id: middle; y: 285; width: 150; elide: Text.ElideMiddle; text: "one\ttwo three\tfour five six" }
    TextEdit { id: edit; x: 200; y: 200; text: "a\tb\nab\t" }
    TextEdit { id: narrow; x: 200; y: 250; tabStopDistance: 30; text: "a\tb\nab\t" }

    function read(item) {
        return [item.implicitWidth, item.contentWidth, item.lineCount]
    }
    function answers() {
        const all = []
        for (let i = 0; i < root.texts.length; i++) all.push(read(plain.children[i]), read(right.children[i]))
        all.push(read(wrapped), read(elided), read(left), read(middle), [edit.implicitWidth, edit.contentWidth], [narrow.implicitWidth, narrow.contentWidth])
        return all
    }
}
