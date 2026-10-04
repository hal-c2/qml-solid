import QtQuick
import QtQuick.Templates as T

// What a type of a namespace attaches to an object, asked of the object in
// a script: `flick.T.ScrollBar.vertical`.
Item {
    id: root
    width: 400
    height: 300

    Flickable {
        id: flick
        width: 100; height: 100
        contentHeight: 400
        T.ScrollBar.vertical: T.ScrollBar { id: bar; objectName: "bar" }
        property var mine: T.ScrollBar.vertical
        Item { id: inner; property var through: flick.T.ScrollBar.vertical }
    }

    function read() {
        return [flick.T.ScrollBar.vertical === bar, flick.T.ScrollBar.vertical.objectName, flick.mine === bar,
                inner.through === bar, flick.T.ScrollBar.vertical.size, flick.T.ScrollBar.horizontal]
    }
}
