// A StackView that was given no transition, which is what the template is
// before a style has its say: Qt has nothing that runs one then, and what
// is popped stays where it was, hidden. `answers` is asked of Qt too.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 6
    property var log: []
    property var seen: []

    function name(item) {
        return item ? item.name : null
    }

    function row(item) {
        if (!item)
            return null
        return [item.name, item.x, item.y, item.width, item.height, item.visible, item.StackView.index,
                item.StackView.status, item.StackView.view === stack, item.parent === stack]
    }

    Component {
        id: page
        Item {
            property string name: "page"
            x: 7
            StackView.onActivating: root.log.push(name + " activating")
            StackView.onActivated: root.log.push(name + " activated")
            StackView.onDeactivating: root.log.push(name + " deactivating")
            StackView.onDeactivated: root.log.push(name + " deactivated")
            StackView.onRemoved: root.log.push(name + " removed")
        }
    }

    Item {
        id: holder
        Item {
            id: kept
            property string name: "kept"
            x: 9
            height: 20
            StackView.onRemoved: root.log.push(name + " removed")
        }
    }

    T.StackView {
        id: stack
        width: 200
        height: 100
        onBusyChanged: root.log.push("busy " + busy)
        onDepthChanged: root.log.push("depth " + depth)
        onEmptyChanged: root.log.push("empty " + empty)
        onCurrentItemChanged: root.log.push("current " + root.name(currentItem))
    }

    // What it starts with, as an item of its own and as a file.
    T.StackView {
        id: inline
        y: 120
        width: 100
        height: 50
        initialItem: Item {
            property string name: "inline"
            StackView.onActivated: root.log.push(name + " activated")
            StackView.onRemoved: root.log.push(name + " removed")
        }
    }

    T.StackView {
        id: filed
        y: 180
        width: 100
        height: 50
        initialItem: "StackPage.qml"
    }

    function first(view) {
        const item = view.currentItem
        if (!item)
            return [view.depth, null]
        return [view.depth, item.name, item.width, item.height, item.visible, item.parent === view,
                item.StackView.status, item.StackView.index, view.children.length]
    }

    function step(index) {
        switch (index) {
        case 0:
            seen = [name(stack.push(page, { name: "a" })), stack.busy, stack.currentItem.StackView.status]
            break
        case 1:
            seen = [name(stack.push(page, { name: "b" })), stack.busy, stack.get(0).visible]
            break
        case 2:
            seen = [name(stack.push(kept)), kept.width, kept.height, kept.x]
            break
        case 3:
            seen = [name(stack.pop()), stack.depth, kept.visible, kept.parent === holder, kept.width]
            break
        case 4:
            seen = [name(stack.replace(page, { name: "c" })), stack.depth]
            break
        case 5: {
            stack.clear()
            const was = inline.currentItem
            inline.clear()
            seen = [stack.depth, stack.empty, was.visible, was.parent === null, was.width, inline.children.length]
            break
        }
        }
    }

    function answers() {
        const said = root.log
        root.log = []
        const rows = []
        for (let i = 0; i < stack.depth; i++)
            rows.push(row(stack.get(i)))
        const inside = []
        for (let i = 0; i < stack.children.length; i++)
            inside.push([stack.children[i].name, stack.children[i].visible])
        return [
            [stack.depth, stack.empty, stack.busy, name(stack.currentItem)],
            rows,
            inside,
            row(kept).concat([kept.parent === holder]),
            first(inline),
            first(filed),
            seen,
            said,
        ]
    }
}
