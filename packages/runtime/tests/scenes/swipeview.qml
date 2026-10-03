// SwipeView under the ListView every style gives it, and beside a container
// bound to it both ways as a TabBar is. `answers` is asked of Qt too, before
// and after each `step`, and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 6
    property alias view: view
    property alias list: list
    property alias bar: bar
    property alias paired: paired
    property alias column: column

    Component {
        id: page
        Item {
            implicitWidth: 70
            implicitHeight: 30
        }
    }

    T.SwipeView {
        id: view
        width: 200
        height: 100
        padding: 4
        spacing: 10
        implicitWidth: contentWidth + leftPadding + rightPadding
        implicitHeight: contentHeight + topPadding + bottomPadding
        contentItem: ListView {
            id: list
            model: view.contentModel
            interactive: view.interactive
            currentIndex: view.currentIndex
            spacing: view.spacing
            orientation: view.orientation
            snapMode: ListView.SnapOneItem
            boundsBehavior: Flickable.StopAtBounds
            highlightRangeMode: ListView.StrictlyEnforceRange
            preferredHighlightBegin: 0
            preferredHighlightEnd: 0
            highlightMoveDuration: 0
        }
        Item {
            id: a
            implicitWidth: 50
            implicitHeight: 20
        }
        Item {
            id: b
            implicitWidth: 60
            implicitHeight: 25
        }
        Item {
            id: c
            width: 33
            height: 44
        }
    }

    Item {
        id: outside
    }

    T.Container {
        id: bar
        y: 120
        width: 200
        height: 20
        currentIndex: paired.currentIndex
        contentItem: ListView {
            model: bar.contentModel
            currentIndex: bar.currentIndex
            orientation: ListView.Horizontal
        }
        Item {
            width: 20
            height: 20
        }
        Item {
            width: 20
            height: 20
        }
        Item {
            width: 20
            height: 20
        }
    }

    T.SwipeView {
        id: paired
        y: 150
        width: 100
        height: 50
        currentIndex: bar.currentIndex
        orientation: Qt.Vertical
        contentItem: ListView {
            id: column
            model: paired.contentModel
            currentIndex: paired.currentIndex
            spacing: paired.spacing
            orientation: paired.orientation
            snapMode: ListView.SnapOneItem
            highlightRangeMode: ListView.StrictlyEnforceRange
            preferredHighlightBegin: 0
            preferredHighlightEnd: 0
            highlightMoveDuration: 0
        }
        Item {
            id: first
        }
        Item {
            id: second
        }
        Item {
            id: third
        }
    }

    function step(index) {
        switch (index) {
        case 0:
            view.setCurrentIndex(1)
            bar.setCurrentIndex(2)
            break
        case 1:
            view.incrementCurrentIndex()
            view.incrementCurrentIndex()
            paired.decrementCurrentIndex()
            break
        case 2:
            view.insertItem(0, page.createObject(null))
            bar.currentIndex = 0
            break
        case 3:
            view.orientation = Qt.Vertical
            view.spacing = 6
            paired.currentIndex = 2
            break
        case 4:
            view.width = 150
            view.height = 80
            view.currentIndex = 1
            bar.decrementCurrentIndex()
            break
        case 5:
            view.removeItem(a)
            paired.setCurrentIndex(0)
            break
        }
    }

    // Where a page is from the beginning of the content: a view that has had
    // rows put before the ones it shows begins before zero.
    function box(item) {
        const within = item.parent === list.contentItem
        return [item.x - (within ? list.originX : 0), item.y - (within ? list.originY : 0), item.width, item.height]
    }

    function attached(item) {
        return [item.SwipeView.index, item.SwipeView.isCurrentItem, item.SwipeView.isNextItem, item.SwipeView.isPreviousItem, item.SwipeView.view === view]
    }

    function answers() {
        return [
            [view.count, view.currentIndex, list.currentIndex, view.currentItem === view.itemAt(view.currentIndex)],
            [view.interactive, view.orientation, view.horizontal, view.vertical, view.activeFocusOnTab],
            [view.contentWidth, view.contentHeight, view.implicitWidth, view.implicitHeight],
            box(list),
            [list.contentX - list.originX, list.contentY - list.originY, list.contentWidth, list.contentHeight],
            // Qt leaves a page put before the ones shown where it was made.
            view.itemAt(0) === a || view.currentIndex === 0 ? box(view.itemAt(0)) : [view.itemAt(0).width, view.itemAt(0).height],
            box(view.itemAt(1)),
            box(view.itemAt(2)),
            view.count > 3 ? box(view.itemAt(3)) : [],
            attached(view.itemAt(0)),
            attached(b),
            attached(c),
            attached(outside),
            [bar.currentIndex, paired.currentIndex, column.currentIndex, column.contentY],
            [box(first), box(second), box(third)],
            [first.SwipeView.isCurrentItem, second.SwipeView.isCurrentItem, third.SwipeView.isCurrentItem, third.SwipeView.view === paired],
        ]
    }
}
