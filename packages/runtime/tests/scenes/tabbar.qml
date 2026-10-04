// TabBar under the ListView a style gives it, and over an item that is no
// view. `answers` is asked of Qt, before and after each `step`, and what Qt
// says is what the test expects. The test runs `tabbar.js`, which is this
// with a stand-in for TabButton: a bar takes nothing else for a tab.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 7
    property alias fixed: fixed

    Component {
        id: tab
        T.TabButton {
            implicitWidth: 30
            implicitHeight: 18
        }
    }

    T.TabBar {
        id: bar
        width: 300
        spacing: 2
        padding: 5
        implicitWidth: contentWidth + leftPadding + rightPadding
        implicitHeight: contentHeight + topPadding + bottomPadding
        contentItem: ListView {
            id: list
            model: bar.contentModel
            currentIndex: bar.currentIndex
            spacing: bar.spacing
            orientation: ListView.Horizontal
            boundsBehavior: Flickable.StopAtBounds
            flickableDirection: Flickable.AutoFlickIfNeeded
            snapMode: ListView.SnapToItem
            highlightMoveDuration: 0
            highlightRangeMode: ListView.ApplyRange
            preferredHighlightBegin: 40
            preferredHighlightEnd: width - 40
        }
        T.TabButton {
            id: t0
            implicitWidth: 40
            implicitHeight: 20
        }
        T.TabButton {
            id: t1
            implicitWidth: 50
            implicitHeight: 24
            width: 80
        }
        T.TabButton {
            id: t2
            implicitWidth: 60
            implicitHeight: 16
            height: 10
        }
        Rectangle {
            id: stray
            width: 5
            height: 5
        }
    }

    T.TabBar {
        id: fixed
        y: 100
        width: 120
        height: 30
        position: T.TabBar.Footer
        currentIndex: 1
        contentWidth: 77
        contentHeight: 22
        wheelEnabled: true
        contentItem: Row {
            id: row
        }
        T.TabButton {
            id: f0
            implicitWidth: 10
            implicitHeight: 10
        }
        T.TabButton {
            id: f1
            implicitWidth: 10
            implicitHeight: 10
        }
        T.TabButton {
            id: f2
            implicitWidth: 10
            implicitHeight: 10
        }
    }

    function step(index) {
        switch (index) {
        case 0:
            bar.setCurrentIndex(2)
            fixed.decrementCurrentIndex()
            break
        case 1:
            t0.checked = true
            f2.checked = true
            break
        case 2:
            bar.addItem(tab.createObject(null))
            bar.width = 400
            break
        case 3:
            bar.spacing = 6
            t1.width = 100
            fixed.position = T.TabBar.Header
            break
        case 4:
            bar.removeItem(t0)
            fixed.moveItem(2, 0)
            break
        case 5:
            bar.insertItem(0, stray)
            t2.implicitHeight = 30
            break
        case 6:
            bar.currentIndex = 0
            fixed.takeItem(1)
            break
        }
    }

    // Where a tab is from the beginning of the content: a view that has lost
    // the rows before the ones it shows begins after zero.
    function box(item) {
        if (!item)
            return null
        const within = item.parent === list.contentItem
        return [Math.round((item.x - (within ? list.originX : 0)) * 1000) / 1000, item.y, item.width, item.height]
    }

    function attached(item) {
        return item ? [item.TabBar.index, item.TabBar.tabBar === bar, item.TabBar.tabBar === fixed, item.TabBar.position] : null
    }

    function answers() {
        return [
            [bar.count, bar.currentIndex, list.currentIndex, bar.position, bar.currentItem ? bar.currentItem.checked : null],
            [bar.contentWidth, bar.contentHeight, bar.implicitWidth, bar.implicitHeight, bar.height],
            box(list),
            box(t0),
            box(t1),
            box(t2),
            box(bar.itemAt(bar.count - 1)),
            attached(t0),
            attached(t2),
            attached(stray),
            [stray.parent === null, stray.parent === bar, stray.parent === list.contentItem],
            [fixed.count, fixed.currentIndex, fixed.position, fixed.currentItem ? fixed.currentItem.checked : null],
            [fixed.contentWidth, fixed.contentHeight, fixed.implicitContentWidth, fixed.implicitContentHeight],
            [box(f0), box(f1), box(f2)],
            [attached(f0), attached(f1), attached(f2)],
        ]
    }
}
