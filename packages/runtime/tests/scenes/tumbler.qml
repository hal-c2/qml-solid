// Tumbler as a style writes it, over a TumblerView that makes the PathView
// of one that wraps and the ListView of one that does not; with a view of
// its own, and with nothing given. `read` is asked of Qt too, before and
// after each `step`, a second and a half apart: a tumbler takes a second
// to turn. What the tumblers say is noted.
import QtQuick
import QtQuick.Controls.impl
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 13
    property var notes: []
    property alias wheel: wheel
    property alias few: few
    property alias bare: bare
    property alias own: own
    property alias early: early
    property alias listed: listed
    property alias turned: turned

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    Component {
        id: row
        Text {
            text: modelData
            font.family: boxes.name
            font.pixelSize: 16
            opacity: 1.0 - Math.abs(T.Tumbler.displacement) / (T.Tumbler.tumbler.visibleItemCount / 2)
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            required property var modelData
            required property int index
            property real displacement: T.Tumbler.displacement
            property var of: T.Tumbler.tumbler
        }
    }

    // More rows than are seen: it wraps.
    T.Tumbler {
        id: wheel
        x: 10
        y: 10
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        padding: 5
        model: 10
        delegate: row
        readonly property real each: availableHeight / visibleItemCount
        contentItem: TumblerView {
            implicitWidth: 60
            implicitHeight: 200
            model: wheel.model
            delegate: wheel.delegate
            path: Path {
                startX: wheel.contentItem.width / 2
                startY: -wheel.each / 2
                PathLine {
                    x: wheel.contentItem.width / 2
                    y: (wheel.visibleItemCount + 1) * wheel.each - wheel.each / 2
                }
            }
        }
        background: Rectangle { color: "#eeeeee" }
        onCurrentIndexChanged: root.note("current " + currentIndex)
        onCountChanged: root.note("count " + count)
        onWrapChanged: root.note("wrap " + wrap)
        onMovingChanged: root.note("moving " + moving)
        onFocusReasonChanged: root.note("reason " + focusReason)
    }

    // Fewer: it does not.
    T.Tumbler {
        id: few
        x: 90
        y: 10
        width: 60
        height: 150
        model: ["a", "b", "c"]
        delegate: row
        readonly property real each: availableHeight / visibleItemCount
        contentItem: TumblerView {
            model: few.model
            delegate: few.delegate
            path: Path {
                startX: few.contentItem.width / 2
                startY: -few.each / 2
                PathLine {
                    x: few.contentItem.width / 2
                    y: (few.visibleItemCount + 1) * few.each - few.each / 2
                }
            }
        }
        onCurrentIndexChanged: root.note("few.current " + currentIndex)
        onCountChanged: root.note("few.count " + count)
        onWrapChanged: root.note("few.wrap " + wrap)
        onMovingChanged: root.note("few.moving " + moving)
    }

    // What a tumbler is that nothing was said of.
    T.Tumbler {
        id: bare
        x: 170
        y: 10
    }

    // A view of the tumbler's own: a PathView, and the row it starts at.
    // Qt forgets that row unless the tumbler is told whether it wraps.
    T.Tumbler {
        id: own
        x: 170
        y: 40
        width: 50
        height: 90
        visibleItemCount: 3
        model: 6
        currentIndex: 4
        wrap: true
        delegate: row
        contentItem: PathView {
            model: own.model
            delegate: own.delegate
            clip: true
            pathItemCount: own.visibleItemCount + 1
            preferredHighlightBegin: 0.5
            preferredHighlightEnd: 0.5
            dragMargin: width / 2
            path: Path {
                startX: own.contentItem.width / 2
                startY: -15
                PathLine { x: own.contentItem.width / 2; y: 105 }
            }
        }
    }

    // The row a tumbler that does not wrap starts at.
    T.Tumbler {
        id: early
        x: 240
        y: 10
        width: 50
        height: 100
        model: 8
        currentIndex: 5
        wrap: false
        delegate: row
        contentItem: TumblerView {
            model: early.model
            delegate: early.delegate
        }
    }

    // And one that does.
    T.Tumbler {
        id: turned
        x: 240
        y: 130
        width: 50
        height: 90
        visibleItemCount: 3
        model: 12
        currentIndex: 7
        delegate: row
        contentItem: TumblerView {
            model: turned.model
            delegate: turned.delegate
            path: Path {
                startX: turned.contentItem.width / 2
                startY: -15
                PathLine { x: turned.contentItem.width / 2; y: 105 }
            }
        }
    }

    // A ListView of the tumbler's own, inside an item.
    T.Tumbler {
        id: listed
        x: 300
        y: 10
        width: 50
        height: 120
        visibleItemCount: 3
        model: ["x", "y", "z", "w"]
        currentIndex: 2
        wrap: false
        delegate: row
        contentItem: Item {
            ListView {
                anchors.fill: parent
                model: listed.model
                delegate: listed.delegate
                clip: true
                snapMode: ListView.SnapToItem
                highlightRangeMode: ListView.StrictlyEnforceRange
                preferredHighlightBegin: height / 2 - height / listed.visibleItemCount / 2
                preferredHighlightEnd: height / 2 + height / listed.visibleItemCount / 2
            }
        }
    }

    // What the tumblers say while they are made is not asked for.
    Component.onCompleted: take()

    function note(text) {
        notes.push(text)
    }

    function take() {
        const taken = notes
        notes = []
        return taken
    }

    function step(index) {
        switch (index) {
        case 0:
            wheel.currentIndex = 3
            few.currentIndex = 2
            own.currentIndex = 0
            break
        case 1:
            // The shorter way round.
            wheel.currentIndex = 9
            few.currentIndex = 0
            break
        case 2:
            // A row there is none of is not gone to.
            wheel.currentIndex = 20
            wheel.currentIndex = -1
            few.currentIndex = 3
            few.currentIndex = -1
            listed.currentIndex = 2
            break
        case 3:
            // Whether it wraps is asked when it has other rows, not when
            // other rows are seen.
            wheel.visibleItemCount = 3
            few.visibleItemCount = 3
            break
        case 4:
            few.model = ["a", "b", "c", "d", "e", "f"]
            break
        case 5:
            wheel.wrap = false
            few.currentIndex = 4
            break
        case 6:
            wheel.currentIndex = 5
            wheel.wrap = undefined
            few.model = ["a", "b"]
            break
        case 7:
            // Qt's view goes to its first row before it has none; here that
            // is not said, so it is there already.
            wheel.currentIndex = 0
            wheel.model = 0
            break
        case 8:
            wheel.visibleItemCount = 5
            wheel.model = 4
            break
        case 9:
            wheel.model = 12
            wheel.topPadding = 25
            wheel.leftPadding = 15
            break
        case 10:
            wheel.positionViewAtIndex(7, T.Tumbler.Center)
            listed.positionViewAtIndex(0, T.Tumbler.Beginning)
            break
        case 11:
            wheel.forceActiveFocus(Qt.TabFocusReason)
            own.contentItem.incrementCurrentIndex()
            break
        case 12:
            bare.model = 3
            bare.currentIndex = 1
            turned.wrap = false
            break
        }
    }

    function round(value) {
        return Math.round(value * 1000) / 1000
    }

    // The view a tumbler turns, and what it is.
    function view(tumbler) {
        let item = tumbler.contentItem
        if (item && item.count === undefined) item = item.children.length ? item.children[0] : null
        return item
    }

    // The rows of a tumbler that are seen, in order: where each is, and how
    // far from the current one.
    function rows(tumbler) {
        const inside = view(tumbler)
        if (!inside) return []
        const list = inside.offset === undefined
        const items = list ? inside.contentItem.children : inside.children
        const top = list ? inside.contentY : 0
        const seen = []
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.index === undefined || item.y + item.height <= top || item.y >= top + inside.height) continue
            seen.push([item.index, round(item.x), round(item.y - top), item.width, round(item.height), round(item.displacement), round(item.opacity), item.of === tumbler])
        }
        seen.sort((a, b) => a[2] - b[2])
        return seen
    }

    function about(tumbler) {
        const inside = view(tumbler)
        const list = inside ? inside.offset === undefined : false
        return [
            tumbler.count, tumbler.currentIndex, tumbler.wrap, tumbler.visibleItemCount, tumbler.moving,
            tumbler.currentItem ? String(tumbler.currentItem.text) : null,
            inside ? (list ? "list" : "path") : "none",
            inside ? [inside.x, inside.y, inside.width, inside.height, inside.clip, inside.currentIndex, inside.count, inside.highlightRangeMode,
                      round(inside.preferredHighlightBegin), round(inside.preferredHighlightEnd)] : [],
            inside ? (list ? [round(inside.contentY), inside.snapMode] : [round(inside.offset), inside.pathItemCount, inside.dragMargin, inside.highlightMoveDuration]) : [],
        ]
    }

    function read() {
        if (boxes.status !== FontLoader.Ready) return null
        return [
            about(wheel),
            [wheel.implicitWidth, wheel.implicitHeight, wheel.width, wheel.height, wheel.availableWidth, wheel.availableHeight,
             wheel.contentItem.x, wheel.contentItem.y, wheel.contentItem.width, wheel.contentItem.height, wheel.contentItem.children.length],
            [wheel.focusPolicy, wheel.activeFocusOnTab, wheel.activeFocus, wheel.focusReason, wheel.flickDeceleration, wheel.wheelEnabled],
            rows(wheel),
            about(few),
            rows(few),
            [bare.count, bare.currentIndex, bare.wrap, bare.visibleItemCount, bare.moving, bare.currentItem === null, bare.model === undefined,
             bare.delegate === null, bare.contentItem === null, bare.implicitWidth, bare.implicitHeight, bare.activeFocusOnTab, bare.flickDeceleration],
            about(own),
            rows(own),
            about(early),
            rows(early),
            about(listed),
            rows(listed),
            about(turned),
            rows(turned),
            [T.Tumbler.Beginning, T.Tumbler.Center, T.Tumbler.End, T.Tumbler.Visible, T.Tumbler.Contain, T.Tumbler.SnapPosition],
            // What changed together is noted in whatever order.
            take().sort(),
        ]
    }
}
