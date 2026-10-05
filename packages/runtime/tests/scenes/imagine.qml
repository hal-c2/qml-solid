// The `Imagine` attached type: where an object's pictures are, said of it
// or of what it is in. `answers` is asked of Qt too, after each step, and
// what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Imagine

Item {
    id: root
    width: 400
    height: 300

    // The changes since the scene was made: Qt tells an object of the path
    // of what it is put in as it is put there, which a page has from the
    // start.
    property int changes: 0
    property int ownChanges: 0
    property var made: [0, 0]
    Component.onCompleted: made = [changes, ownChanges]

    Item {
        id: plain
        Item { id: inner }
    }
    Item {
        id: given
        Imagine.path: ":/custom"
        Imagine.onPathChanged: root.ownChanges++
        Item {
            id: under
            Imagine.onPathChanged: root.changes++
            Item { id: deep; Imagine.path: "qrc:/other/pictures/" }
            Item { id: deeper }
        }
        T.Popup {
            id: popup
            Item { id: popped }
        }
    }
    Item { id: filed; Imagine.path: "/somewhere/pictures" }
    Item { id: mover }

    readonly property int steps: 5
    function step(index) {
        [() => { given.Imagine.path = ":/changed/" },
         () => { deep.Imagine.path = undefined },
         () => { mover.parent = under },
         () => { given.Imagine.path = undefined },
         () => { under.Imagine.path = "pictures"; plain.Imagine.path = "" }][index]()
    }

    // A path that is not of Qt's resources is a file's to Qt. A page has no
    // files: it is whatever address it is.
    function address(url) {
        return String(url).replace(/^file:(\/\/)?/, "")
    }

    function answers() {
        const rows = [plain, inner, given, under, deep, deeper, popup, popped, filed, mover]
            .map((item) => [item.Imagine.path, address(item.Imagine.url)])
        rows.push([changes - made[0], ownChanges - made[1]])
        return rows
    }
}
