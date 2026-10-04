// Container as a style's QML uses it: with a view over `contentModel` as its
// content item, and with an item that is no view. `answers` is asked of Qt
// too, before and after each `step`, and what Qt says is what the test
// expects.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 9
    property Item taken: null
    property Item made: null

    Component {
        id: chip
        Rectangle {
            width: 25
            height: 10
        }
    }

    T.Container {
        id: plain
        width: 200
        height: 40
        padding: 3
        contentItem: Row {
            id: row
            spacing: 2
        }
        Rectangle {
            id: p0
            width: 30
            height: 10
        }
        Rectangle {
            id: p1
            width: 40
            height: 12
        }
        QtObject {
            id: thing
        }
        Rectangle {
            id: p2
            width: 50
            height: 10
        }
    }

    T.Container {
        id: listed
        y: 50
        width: 200
        height: 40
        currentIndex: 1
        contentItem: ListView {
            id: list
            model: listed.contentModel
            currentIndex: listed.currentIndex
            orientation: ListView.Horizontal
            spacing: 5
        }
        Rectangle {
            id: l0
            width: 30
            height: 10
        }
        Repeater {
            id: repeater
            model: 2
            Rectangle {
                width: 20
                height: 10
            }
        }
        Rectangle {
            id: l3
            width: 40
            height: 10
        }
    }

    T.Container {
        id: empty
        y: 100
        width: 100
        height: 20
    }

    function step(index) {
        switch (index) {
        case 0:
            plain.incrementCurrentIndex()
            listed.setCurrentIndex(2)
            break
        case 1:
            plain.incrementCurrentIndex()
            plain.incrementCurrentIndex()
            listed.decrementCurrentIndex()
            listed.decrementCurrentIndex()
            listed.decrementCurrentIndex()
            break
        case 2:
            made = chip.createObject(null)
            plain.insertItem(0, made)
            listed.currentIndex = 2
            break
        case 3:
            plain.moveItem(0, 2)
            listed.moveItem(2, 0)
            break
        case 4:
            plain.moveItem(3, 0)
            listed.insertItem(3, l0)
            break
        case 5:
            taken = plain.takeItem(1)
            listed.removeItem(l0)
            break
        case 6:
            plain.removeItem(p2)
            plain.addItem(taken)
            listed.currentIndex = 2
            repeater.model = 1
            break
        case 7:
            empty.addItem(chip.createObject(null))
            empty.addItem(chip.createObject(null))
            listed.currentIndex = 0
            break
        case 8:
            empty.takeItem(0)
            empty.takeItem(0)
            listed.takeItem(0)
            break
        }
    }

    function names(container) {
        const all = [p0, p1, p2, l0, l3, made]
        const out = []
        for (let index = 0; index < container.count; index++) {
            const at = all.indexOf(container.itemAt(index))
            out.push(at < 0 ? "r" : ["p0", "p1", "p2", "l0", "l3", "made"][at])
        }
        return out.join(" ")
    }

    function places(container) {
        const out = []
        for (let index = 0; index < container.count; index++) out.push(container.itemAt(index).x)
        return out
    }

    function answers() {
        return [
            [plain.count, plain.currentIndex, names(plain), plain.contentModel.count],
            [plain.currentItem === plain.itemAt(plain.currentIndex), plain.itemAt(7) === null, plain.contentChildren.length, plain.contentData.length],
            [places(plain), row.children.length, p0.parent === row],
            [plain.contentWidth, plain.contentHeight, plain.implicitContentWidth, plain.implicitContentHeight],
            [row.x, row.y, row.width, row.height],
            [listed.count, listed.currentIndex, list.currentIndex, list.count, names(listed)],
            [places(listed), l3.parent === list.contentItem, listed.currentItem === list.currentItem],
            [listed.contentWidth, listed.contentHeight, list.contentWidth],
            [empty.count, empty.currentIndex, empty.currentItem === null, empty.contentItem !== null, empty.contentWidth],
            [taken !== null, taken === p0, taken ? taken.parent === null : false, taken ? taken.parent === row : false],
        ]
    }
}
