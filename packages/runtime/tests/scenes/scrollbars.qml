// ScrollBar and ScrollIndicator on their own and attached to a Flickable,
// and a ScrollView over a Flickable of its own and over one declared in it.
// `answers` is asked of Qt too, before and after each `step`, and what Qt
// says is what the test expects.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 16
    // How often the Flickable's bar and its indicator came to show.
    property int shown: 0
    property alias free: free
    property alias flick: flick
    property alias vbar: vbar
    property alias hbar: hbar
    property alias vdot: vdot
    property alias lone: lone
    property alias view: view
    property alias given: given
    property alias inner: inner
    property alias told: told

    T.ScrollBar {
        id: free
        x: 300
        width: 14
        height: 104
        padding: 2
        size: 0.3
        position: 0.2
        contentItem: Item {}
    }

    T.ScrollIndicator {
        id: lone
        x: 320
        width: 104
        height: 14
        padding: 2
        orientation: Qt.Horizontal
        size: 0.25
        position: 0.5
        contentItem: Item {}
    }

    Flickable {
        id: flick
        width: 200
        height: 100
        contentWidth: 400
        contentHeight: 500
        Item { width: 400; height: 500 }
        ScrollBar.vertical: T.ScrollBar {
            id: vbar
            implicitWidth: 10
            contentItem: Item {}
            onActiveChanged: if (active) root.shown += 1
        }
        ScrollBar.horizontal: T.ScrollBar {
            id: hbar
            implicitHeight: 8
            contentItem: Item {}
        }
        ScrollIndicator.vertical: T.ScrollIndicator {
            id: vdot
            implicitWidth: 4
            contentItem: Item {}
            onActiveChanged: if (active) root.shown += 10
        }
        ScrollIndicator.horizontal: T.ScrollIndicator {
            id: hdot
            implicitHeight: 4
            contentItem: Item {}
        }
    }

    ScrollPane {
        id: view
        y: 110
        width: 200
        height: 100
        padding: 5
        Item {
            id: only
            implicitWidth: 300
            implicitHeight: 380
        }
    }

    ScrollPane {
        id: given
        y: 220
        width: 150
        height: 60
        Flickable {
            id: inner
            contentWidth: 250
            contentHeight: 350
            Item { id: deep; width: 250; height: 350 }
        }
    }

    ScrollPane {
        id: told
        x: 210
        y: 110
        width: 100
        height: 80
        contentWidth: 320
        contentHeight: availableHeight
        Item { width: 10; height: 10 }
        Item { implicitWidth: 500; implicitHeight: 500 }
    }

    ScrollPane {
        id: bare
        x: 210
        y: 200
        width: 100
        height: 80
    }

    function round(value) {
        return Math.round(value * 10000) / 10000
    }

    function box(item) {
        return [round(item.x), round(item.y), round(item.width), round(item.height)]
    }

    function bar(item) {
        return [round(item.size), round(item.position), round(item.visualSize), round(item.visualPosition),
                item.orientation, item.horizontal, item.vertical, item.active].concat(box(item.contentItem))
    }

    function scrolled(item) {
        const inside = item.contentItem
        return [inside === inner, inside.clip, round(inside.contentWidth), round(inside.contentHeight),
                round(inside.contentX), round(inside.contentY),
                round(item.contentWidth), round(item.contentHeight),
                round(item.implicitContentWidth), round(item.implicitContentHeight),
                item.contentChildren.length, round(item.effectiveScrollBarWidth), round(item.effectiveScrollBarHeight)]
                .concat(box(inside))
    }

    function step(index) {
        switch (index) {
        case 0: free.minimumSize = 0.5; lone.minimumSize = 0.5; break
        case 1: free.position = 0.9; lone.position = 0.9; break
        case 2: free.size = 0.5; lone.size = 0.6; break
        case 3: free.minimumSize = 0; free.increase(); free.increase(); break
        case 4: free.stepSize = 0.25; free.decrease(); free.orientation = Qt.Horizontal; break
        case 5: free.size = 2; lone.size = 2; lone.position = -0.2; break
        case 6: free.size = -1; free.position = 0.4; free.active = true; break
        case 7: flick.contentY = 100; flick.contentX = 50; break
        case 8: vbar.position = 0.5; hbar.increase(); break
        case 9: flick.width = 300; flick.height = 150; break
        case 10: vbar.x = 40; hbar.implicitHeight = 12; flick.width = 250; flick.contentHeight = 300; break
        case 11: flick.contentY = 250; flick.contentHeight = 200; break
        case 12: view.down.position = 0.25; view.across.increase(); given.down.position = 0.5; break
        case 13: view.down.policy = T.ScrollBar.AlwaysOff; view.across.visible = false; only.implicitHeight = 760; break
        case 14: view.down.policy = T.ScrollBar.AlwaysOn; view.contentWidth = 600; inner.contentWidth = 400; inner.contentY = 29; break
        case 15: told.contentWidth = 90; told.height = 120; view.thick = 16; given.across.height = 7; break
        }
    }

    function answers() {
        return [
            bar(free).concat([free.pressed, free.interactive, free.stepSize, free.snapMode, free.policy, round(free.minimumSize)]),
            bar(lone).concat([round(lone.minimumSize)]),
            [round(flick.contentX), round(flick.contentY), flick.children.length, flick.contentItem.children.length],
            bar(vbar).concat(box(vbar), [vbar.parent === flick]),
            bar(hbar).concat(box(hbar), [hbar.parent === flick]),
            bar(vdot).concat(box(vdot), [vdot.parent === flick]),
            bar(hdot).concat(box(hdot), [hdot.parent === flick]),
            scrolled(view).concat([only.parent === view.contentItem.contentItem, view.contentItem.parent === view]),
            bar(view.down).concat(box(view.down), [view.down.parent === view]),
            bar(view.across).concat(box(view.across), [view.across.parent === view]),
            scrolled(given).concat([deep.parent === inner.contentItem, inner.parent === given]),
            bar(given.down).concat(box(given.down)),
            bar(given.across).concat(box(given.across)),
            scrolled(told),
            bar(told.down).concat(bar(told.across)),
            // Qt works out how thick the bars of an empty view are only once one changes.
            scrolled(bare).slice(0, 11),
        ]
    }
}
