// What an object is given as it is made, it has before it is told that it
// is complete: also what is given an alias of a property that something in
// it declares.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var names: ["ant", "bee", "cat"]

    T.StackView {
        id: stack
        anchors.fill: parent
    }

    Component {
        id: made
        PushedPage {
            names: root.names
        }
    }

    PushedPage {
        id: declared
        index: 2
        names: root.names
    }

    Loader {
        id: loader
    }

    function read() {
        const pushed = stack.push(made, { index: 1 }, T.StackView.Immediate)
        const created = made.createObject(root, { index: 0 })
        loader.setSource("PushedPage.qml", { index: 2, names: root.names })
        const loaded = loader.item
        return [declared.seen, declared.own, pushed.seen, pushed.own, created.seen, created.own, loaded.seen, loaded.own,
                pushed.width, pushed.height]
    }
}
