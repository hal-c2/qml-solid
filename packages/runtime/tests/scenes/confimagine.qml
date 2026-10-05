// The same settings (`qtquickcontrols2.conf`) for Imagine: where the
// pictures are for an object that nothing gave a path. `answers` is asked
// of Qt too.
import QtQuick
import QtQuick.Controls.Imagine

Item {
    id: root
    width: 400
    height: 300

    Item {
        id: plain
        Item { id: inner }
    }
    Item {
        id: given
        Imagine.path: ":/custom"
        Item { id: under }
    }

    function answers() {
        const rows = [plain, inner, given, under].map((item) => [item.Imagine.path, String(item.Imagine.url)])
        given.Imagine.path = undefined
        rows.push([given.Imagine.path, String(under.Imagine.url)])
        return rows
    }
}
