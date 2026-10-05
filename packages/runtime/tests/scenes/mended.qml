// A binding that cannot be evaluated while the objects are being made is
// told of when they all are, and not at all where it could be by then: what
// `Component.onCompleted` gives it, or a stack its first item. After that it
// is told of at once.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400; height: 300

    property var current: null
    property var never: null
    property string mended: current.title
    property string broken: never.title
    property string page: stack.currentItem.title

    Titled {
        id: titled
        title: root.current.title
    }
    T.StackView {
        id: stack
        anchors.fill: parent
        initialItem: Item {
            property string title: "page"
        }
    }

    Component.onCompleted: current = { title: "first" }

    function read() {
        return [mended, broken, titled.title, page]
    }

    readonly property int steps: 2
    function step(index) {
        current = index === 0 ? null : { title: "second" }
    }
}
