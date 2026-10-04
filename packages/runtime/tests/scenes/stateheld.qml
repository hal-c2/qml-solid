// A state the item is in from the start changes what a property of the
// item holds: the header exists by then, though nothing has read it.
import QtQuick
import QtQuick.Templates as T

T.Page {
    id: root
    width: 400
    height: 300
    property bool big: true

    header: T.ToolBar {
        id: bar
        implicitHeight: 62
    }

    Item {
        id: inner
        anchors.fill: parent
    }

    states: State {
        name: "big"
        when: root.big
        PropertyChanges {
            target: bar
            height: 56
        }
    }

    function read() {
        return [root.state, bar.height, bar.implicitHeight, inner.height]
    }

    function step(index) {
        root.big = index === 1
    }
}
