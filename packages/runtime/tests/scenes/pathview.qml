import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property var log: []
    property real side: 10

    // Every row is on the path, spread along it from its start.
    PathView {
        id: plain
        model: 5
        delegate: Item {
            required property int index
            width: 10; height: 20
        }
        path: Path {
            startX: 0; startY: 0
            PathLine { x: 100; y: 0 }
        }
        onCurrentIndexChanged: root.log.push("plain current " + currentIndex)
        onMovementStarted: root.log.push("plain started")
        onMovementEnded: root.log.push("plain ended")
    }

    // Some of them, about the middle of the path, with what the path says
    // of where they are.
    PathView {
        id: ranged
        model: ListModel {
            id: names
            ListElement { name: "a" }
            ListElement { name: "b" }
            ListElement { name: "c" }
            ListElement { name: "d" }
            ListElement { name: "e" }
            ListElement { name: "f" }
        }
        pathItemCount: 3
        preferredHighlightBegin: 0.5
        preferredHighlightEnd: 0.5
        highlightRangeMode: PathView.StrictlyEnforceRange
        highlightMoveDuration: 0
        highlight: Rectangle { width: 30; height: 30; color: "yellow"; objectName: "highlight" }
        delegate: Text {
            required property int index
            required property string name
            width: 20; height: 20
            text: name
            scale: PathView.size ?? 1
            property bool current: PathView.isCurrentItem
            property bool on: PathView.onPath
            property var of: PathView.view
        }
        path: Path {
            startX: 0; startY: 100
            PathAttribute { name: "size"; value: 1 }
            PathLine { x: 100; y: 100 }
            PathAttribute { name: "size"; value: 2 }
            PathLine { x: 100; y: 200 }
            PathAttribute { name: "size"; value: 1 }
        }
        onCurrentIndexChanged: root.log.push("ranged current " + currentIndex)
    }

    // A path that ends where it started.
    PathView {
        id: round
        model: 4
        delegate: Item { required property int index; width: root.side; height: root.side }
        path: Path {
            startX: 300; startY: 100
            PathAngleArc { centerX: 250; centerY: 100; radiusX: 50; radiusY: 50; startAngle: 0; sweepAngle: 360 }
        }
    }

    // One with a size, which is what the mouse can turn.
    PathView {
        id: turned
        objectName: "turned"
        y: 240
        width: 200
        height: 40
        model: 4
        delegate: Rectangle {
            id: box
            required property int index
            width: 20; height: 20
            color: "steelblue"
            MouseArea {
                anchors.fill: parent
                enabled: box.index % 2 === 0
                onClicked: root.log.push("clicked " + box.index)
                onCanceled: root.log.push("canceled " + box.index)
            }
        }
        path: Path {
            startX: 0; startY: 20
            PathLine { x: 200; y: 20 }
        }
        onCurrentIndexChanged: root.log.push("turned current " + currentIndex)
        onMovementStarted: root.log.push("turned started")
        onMovementEnded: root.log.push("turned ended")
        onDragStarted: root.log.push("turned drag started")
        onDragEnded: root.log.push("turned drag ended")
        onFlickStarted: root.log.push("turned flick started")
        onFlickEnded: root.log.push("turned flick ended")
    }

    function turning() {
        return [about(turned), turned.moving, turned.dragging, turned.flicking]
    }

    function round2(value) { return Math.round(value * 100) / 100 }

    function about(view) {
        const items = []
        for (let index = 0; index < view.count; index++) {
            const item = view.itemAtIndex(index)
            items.push(item ? [round2(item.x), round2(item.y), item.PathView.onPath, item.PathView.isCurrentItem] : null)
        }
        return [view.count, view.currentIndex, round2(view.offset), view.currentItem ? view.currentItem.index : null, items]
    }

    function read() {
        const said = log
        log = []
        const sizes = []
        for (let index = 0; index < ranged.count; index++) {
            const item = ranged.itemAtIndex(index)
            sizes.push(item ? [item.name, round2(item.scale), item.current, item.on, item.of === ranged] : null)
        }
        const highlight = ranged.highlightItem
        return [said, about(plain), about(ranged), sizes, highlight ? [highlight.objectName, round2(highlight.x), round2(highlight.y)] : null, about(round),
                [plain.indexAt(22, 5), plain.indexAt(22, 50), plain.itemAt(45, 5) ? plain.itemAt(45, 5).index : null, plain.moving, plain.flicking, plain.dragging,
                 plain.interactive, plain.pathItemCount, plain.cacheItemCount, plain.dragMargin, plain.highlightMoveDuration, plain.snapMode, plain.movementDirection,
                 plain.highlightRangeMode, plain.preferredHighlightBegin, plain.preferredHighlightEnd, plain.width, plain.height, plain.maximumFlickVelocity, plain.flickDeceleration,
                 PathView.StrictlyEnforceRange, PathView.SnapOneItem, PathView.Positive, PathView.SnapPosition, PathView.Contain]]
    }

    function step(index) {
        switch (index) {
        case 0: plain.offset = 1.5; break
        case 1: plain.currentIndex = 2; break
        case 2: plain.offset = 7.25; break
        case 3: plain.offset = -1; break
        case 4: plain.incrementCurrentIndex(); break
        case 5: plain.currentIndex = 0; plain.decrementCurrentIndex(); break
        case 6: ranged.currentIndex = 2; break
        case 7: ranged.incrementCurrentIndex(); break
        case 8: ranged.offset = 0.5; break
        case 9: ranged.pathItemCount = 4; break
        case 10: names.remove(1); break
        case 11: ranged.currentIndex = 4; names.remove(4); break
        case 12: names.insert(0, { name: "z" }); break
        case 13: names.move(4, 1, 1); break
        case 14: ranged.positionViewAtIndex(1, PathView.Beginning); break
        case 15: ranged.positionViewAtIndex(1, PathView.End); break
        case 16: ranged.positionViewAtIndex(1, PathView.Center); break
        case 17: ranged.pathItemCount = undefined; break
        case 18: round.offset = 0.5; plain.model = 2; break
        case 19: plain.model = 0; break
        case 20: plain.model = 3; plain.currentIndex = 7; break
        case 21: plain.snapMode = PathView.SnapToItem; plain.offset = 1.4; break
        case 22: plain.preferredHighlightBegin = 0.25; plain.preferredHighlightEnd = 0.25; break
        case 23: plain.currentIndex = 1; break
        case 24: plain.movementDirection = PathView.Positive; plain.currentIndex = 0; break
        case 25: round.currentIndex = 3; break
        case 26: root.side = 30; break
        case 27: turned.snapMode = PathView.SnapOneItem; break
        }
    }
}
