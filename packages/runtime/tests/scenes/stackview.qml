// StackView with six transitions, as a style gives it: what it is asked to
// push, pop and replace, what is attached to each item, and the order its
// signals come in. `answers` is asked of Qt too, before and after each
// `step`, and what Qt says is what the test expects. `seen` is what a step
// found right after its call, with the transitions still to run.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 18
    property var log: []
    property var seen: []
    property int presses: 0
    property alias stack: stack
    property alias kept: kept

    function name(item) {
        return item ? item.name : null
    }

    function row(item) {
        if (!item)
            return null
        return [item.name, item.x, item.y, item.width, item.height, item.visible, item.opacity, item.focus,
                item.StackView.index, item.StackView.status, item.StackView.view === stack, item.parent === stack]
    }

    Component {
        id: page
        Item {
            property string name: "first"
            implicitWidth: 30
            implicitHeight: 40
            StackView.onActivating: root.log.push(name + " activating")
            StackView.onActivated: root.log.push(name + " activated")
            StackView.onDeactivating: root.log.push(name + " deactivating")
            StackView.onDeactivated: root.log.push(name + " deactivated")
            StackView.onRemoved: root.log.push(name + " removed")
            MouseArea {
                anchors.fill: parent
                onPressed: root.presses++
            }
        }
    }

    // One that says how wide it is, and that it stays visible under others.
    Component {
        id: fixed
        Item {
            property string name: "fixed"
            width: 60
            StackView.visible: true
        }
    }

    Item {
        id: holder
        Item {
            id: kept
            property string name: "kept"
            width: 50
            height: 20
            StackView.onActivated: root.log.push(name + " activated")
            StackView.onDeactivated: root.log.push(name + " deactivated")
            StackView.onRemoved: root.log.push(name + " removed")
        }
    }

    T.StackView {
        id: stack
        width: 200
        height: 100
        initialItem: page
        pushEnter: Transition { NumberAnimation { property: "x"; from: stack.width; to: 0; duration: 100 } }
        pushExit: Transition { NumberAnimation { property: "x"; from: 0; to: -stack.width; duration: 100 } }
        popEnter: Transition { NumberAnimation { property: "opacity"; from: 0; to: 1; duration: 100 } }
        popExit: Transition { NumberAnimation { property: "opacity"; from: 1; to: 0; duration: 100 } }
        replaceEnter: Transition { XAnimator { from: stack.width; to: 0; duration: 100 } }
        replaceExit: Transition { XAnimator { from: 0; to: -stack.width; duration: 100 } }
        onBusyChanged: root.log.push("busy " + busy)
        onDepthChanged: root.log.push("depth " + depth)
        onEmptyChanged: root.log.push("empty " + empty)
        onCurrentItemChanged: root.log.push("current " + root.name(currentItem))
    }

    function step(index) {
        switch (index) {
        case 0:
            seen = [name(stack.push(page, { name: "b" })), stack.busy, stack.currentItem.x, stack.get(0).x,
                    stack.get(1).StackView.status, stack.get(0).StackView.status, stack.get(0).visible]
            break
        case 1:
            seen = [name(stack.push([page, { name: "c" }, page, { name: "d" }, kept])), stack.depth,
                    stack.get(2) === null, stack.get(3) === null, kept.x, kept.width]
            break
        case 2: {
            const gone = stack.pop()
            seen = [gone === kept, stack.busy, name(stack.currentItem), stack.get(3).StackView.status,
                    kept.StackView.status, kept.visible, stack.currentItem.opacity]
            break
        }
        case 3:
            seen = [name(stack.push("StackPage.qml", { name: "file" }, StackView.Immediate)), stack.busy,
                    stack.currentItem.x, stack.currentItem.StackView.status, stack.get(3).visible]
            break
        case 4:
            seen = [name(stack.pop(null)), stack.depth, stack.busy]
            break
        case 5:
            seen = [name(stack.replace(page, { name: "r1" })), stack.depth, stack.busy,
                    stack.currentItem.StackView.status]
            break
        case 6:
            stack.push(page, { name: "p1" }, StackView.Immediate)
            stack.push(page, { name: "p2" }, StackView.Immediate)
            seen = [name(stack.replace(null, [page, { name: "r2" }, fixed, { name: "r3" }])), stack.depth,
                    stack.get(0) === null]
            break
        case 7: {
            const none = stack.find(function(item, index) { return item.name === "r2" })
            const found = stack.find(function(item, index) { return item.name === "r2" }, StackView.ForceLoad)
            seen = [none === null, name(found), found.StackView.index, found.StackView.status]
            stack.width = 240
            stack.height = 80
            break
        }
        case 8:
            seen = [name(stack.pushItem(page, { name: "q1" })), stack.busy, stack.currentItem.x]
            break
        case 9:
            seen = [name(stack.pushItems([page, { name: "q2" }, kept, { name: "kept2" }])), stack.depth,
                    stack.get(3) === null]
            break
        case 10:
            seen = [name(stack.popToIndex(2)), stack.depth, name(stack.currentItem)]
            break
        case 11:
            seen = [name(stack.popToItem(stack.get(1))), stack.depth, name(stack.currentItem)]
            break
        case 12:
            seen = [name(stack.popCurrentItem()), stack.depth, name(stack.currentItem)]
            break
        case 13:
            // A pop before the push before it is done.
            stack.pushItem(page, { name: "s1" })
            seen = [stack.busy, name(stack.pop(StackView.Immediate)), stack.busy, stack.depth,
                    name(stack.currentItem), stack.currentItem.x]
            break
        case 14:
            seen = [name(stack.replaceCurrentItem(kept, { name: "kept3" })), stack.depth, stack.busy]
            break
        case 15:
            stack.clear(StackView.PopTransition)
            seen = [stack.depth, stack.empty, stack.busy, name(stack.currentItem)]
            break
        case 16:
            seen = [name(stack.push(page, { name: "again" })), stack.busy, stack.currentItem.x,
                    stack.currentItem.StackView.status]
            break
        case 17:
            stack.clear()
            seen = [stack.depth, stack.empty, name(stack.currentItem)]
            break
        }
    }

    function answers() {
        const said = root.log
        root.log = []
        const rows = []
        for (let i = 0; i < stack.depth; i++)
            rows.push(row(stack.get(i)))
        return [
            [stack.depth, stack.empty, stack.busy, name(stack.currentItem)],
            rows,
            row(kept).concat([kept.parent === holder]),
            seen,
            said,
        ]
    }
}
