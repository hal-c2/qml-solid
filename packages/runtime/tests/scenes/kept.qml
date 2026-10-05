// A file a build keeps in the program is named by where it is in there
// (`qrc:/…`), which on the web is a file the page fetches: the name stays
// what the program wrote.
import QtQuick
import "kept/style"

Item {
    id: root
    width: 200
    height: 120

    property string mark: "disc"

    Image { id: whole; source: "qrc:/qt/qml/Kept/flag.png" }
    Image { id: joined; y: 30; source: `qrc:/qt/qml/Kept/marks/${root.mark}.svg` }
    Image { id: alone; y: 70; source: "qrc:/pictures/alone.png" }
    // A part of the program built by itself names the program's files too.
    Mark { id: part; x: 100; name: "mark" }

    function sizes() {
        return [whole, joined, alone, part].map(image => [image.status, image.sourceSize.width, image.sourceSize.height])
    }
    function names() {
        return [String(whole.source), String(joined.source), String(alone.source), String(part.source)]
    }
}
