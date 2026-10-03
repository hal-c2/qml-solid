// The controls of a range: sliders, dials, progress bars and the indicator
// of pages. What they say is noted, and compared with what Qt's say of the
// same. The handles are put where a style puts them.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }

    property alias sl: sl
    property alias st: st
    property alias sr: sr
    property alias sv: sv
    property alias so: so
    property alias sn: sn
    property alias sbound: sbound
    property alias rs: rs
    property alias ri: ri
    property alias rx: rx
    property alias dial: dial
    property alias dw: dw
    property alias dh: dh
    property alias pb: pb
    property alias po: po
    property alias pe: pe
    property alias busy: busy
    property alias pg: pg
    property alias pn: pn
    property alias ts: ts
    property alias th: th
    property alias ms: ms
    property real source: 0.25

    T.Slider {
        id: sl
        x: 10; y: 10; width: 200; height: 20
        handle: Rectangle {
            x: sl.leftPadding + sl.visualPosition * (sl.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        onValueChanged: root.note("sl.value " + value.toFixed(3))
        onPositionChanged: root.note("sl.position " + position.toFixed(3))
        onPressedChanged: root.note("sl.pressed " + pressed)
        onMoved: root.note("sl.moved")
    }
    // Stepped, the handle at a step all the while.
    T.Slider {
        id: st
        x: 10; y: 40; width: 200; height: 20
        from: 0; to: 10; stepSize: 2; value: 3
        snapMode: T.Slider.SnapAlways
        handle: Rectangle {
            x: st.visualPosition * (st.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        onValueChanged: root.note("st.value " + value.toFixed(3))
        onPositionChanged: root.note("st.position " + position.toFixed(3))
        onMoved: root.note("st.moved")
    }
    // The value changes when the handle is let go, at a step then.
    T.Slider {
        id: sr
        x: 10; y: 70; width: 200; height: 20
        from: 0; to: 100; stepSize: 10; live: false
        snapMode: T.Slider.SnapOnRelease
        handle: Rectangle {
            x: sr.visualPosition * (sr.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        onValueChanged: root.note("sr.value " + value.toFixed(3))
        onPositionChanged: root.note("sr.position " + position.toFixed(3))
        onMoved: root.note("sr.moved")
    }
    T.Slider {
        id: sv
        x: 230; y: 10; width: 20; height: 120
        orientation: Qt.Vertical
        wheelEnabled: true
        topPadding: 10; bottomPadding: 10
        handle: Rectangle {
            y: sv.topPadding + sv.visualPosition * (sv.availableHeight - height)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        onValueChanged: root.note("sv.value " + value.toFixed(3))
        onPositionChanged: root.note("sv.position " + position.toFixed(3))
        onPressedChanged: root.note("sv.pressed " + pressed)
        onMoved: root.note("sv.moved")
    }
    // Out of range, the wrong way round, and bound.
    T.Slider { id: so; value: 5 }
    T.Slider { id: sn; from: 10; to: 0; value: 2.5; stepSize: 2 }
    T.Slider {
        id: sbound
        value: root.source
        onValueChanged: root.note("sbound.value " + value.toFixed(3))
    }

    T.RangeSlider {
        id: rs
        x: 10; y: 100; width: 200; height: 20
        hoverEnabled: true
        first.value: 0.25
        second.value: 0.75
        first.handle: Rectangle {
            x: rs.first.visualPosition * (rs.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        second.handle: Rectangle {
            x: rs.second.visualPosition * (rs.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "silver"
        }
        first.onValueChanged: root.note("one.value " + first.value.toFixed(3))
        first.onPositionChanged: root.note("one.position " + first.position.toFixed(3))
        first.onPressedChanged: root.note("one.pressed " + first.pressed)
        first.onHoveredChanged: root.note("one.hovered " + first.hovered)
        first.onMoved: root.note("one.moved")
        second.onValueChanged: root.note("two.value " + second.value.toFixed(3))
        second.onPositionChanged: root.note("two.position " + second.position.toFixed(3))
        second.onPressedChanged: root.note("two.pressed " + second.pressed)
        second.onHoveredChanged: root.note("two.hovered " + second.hovered)
        second.onMoved: root.note("two.moved")
    }
    // Whole numbers, the first given past the second, and nothing live.
    T.RangeSlider {
        id: ri
        x: 10; y: 130; width: 200; height: 20
        from: 0; to: 10; stepSize: 1; live: false
        snapMode: T.RangeSlider.SnapAlways
        first.value: 8
        second.value: 3
        first.handle: Rectangle {
            x: ri.first.visualPosition * (ri.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "gray"
        }
        second.handle: Rectangle {
            x: ri.second.visualPosition * (ri.availableWidth - width)
            implicitWidth: 20; implicitHeight: 20; color: "silver"
        }
        first.onValueChanged: root.note("ione.value " + first.value.toFixed(3))
        first.onPositionChanged: root.note("ione.position " + first.position.toFixed(3))
        first.onMoved: root.note("ione.moved")
        second.onValueChanged: root.note("itwo.value " + second.value.toFixed(3))
        second.onPositionChanged: root.note("itwo.position " + second.position.toFixed(3))
        second.onMoved: root.note("itwo.moved")
    }
    T.RangeSlider { id: rx; from: 10; to: 0; first.value: 7; second.value: 12; orientation: Qt.Vertical }

    T.Dial {
        id: dial
        x: 10; y: 170; width: 100; height: 100
        handle: Rectangle { width: 10; height: 10; color: "gray" }
        onValueChanged: root.note("dial.value " + value.toFixed(3))
        onAngleChanged: root.note("dial.angle " + angle.toFixed(1))
        onPressedChanged: root.note("dial.pressed " + pressed)
        onMoved: root.note("dial.moved")
        onWrapped: (direction) => root.note("dial.wrapped " + direction)
    }
    // Round and round, in whole numbers.
    T.Dial {
        id: dw
        x: 120; y: 170; width: 100; height: 100
        from: 0; to: 10; stepSize: 1; wrap: true; wheelEnabled: true
        startAngle: 0; endAngle: 360
        onValueChanged: root.note("dw.value " + value.toFixed(3))
        onAngleChanged: root.note("dw.angle " + angle.toFixed(1))
        onMoved: root.note("dw.moved")
        onWrapped: (direction) => root.note("dw.wrapped " + direction)
    }
    // Dragged across, the value when let go.
    T.Dial {
        id: dh
        x: 230; y: 170; width: 100; height: 100
        inputMode: T.Dial.Horizontal; live: false
        startAngle: -90; endAngle: 90
        onValueChanged: root.note("dh.value " + value.toFixed(3))
        onPositionChanged: root.note("dh.position " + position.toFixed(3))
        onAngleChanged: root.note("dh.angle " + angle.toFixed(1))
        onMoved: root.note("dh.moved")
    }

    T.ProgressBar { id: pb; from: 0; to: 10; value: 4 }
    T.ProgressBar { id: po; value: 5; indeterminate: true }
    T.ProgressBar { id: pe; from: 3; to: 3; value: 3 }
    T.BusyIndicator { id: busy }

    T.PageIndicator {
        id: pg
        x: 250; y: 20; width: 150; height: 30
        count: 4; currentIndex: 1; interactive: true; spacing: 10
        delegate: Rectangle {
            required property int index
            property bool down: pressed
            implicitWidth: 20; implicitHeight: 20
            color: index === pg.currentIndex ? "black" : down ? "gray" : "silver"
            onDownChanged: root.note("pg.down " + index + " " + down)
        }
        contentItem: Row {
            spacing: pg.spacing
            Repeater { model: pg.count; delegate: pg.delegate }
        }
        onCurrentIndexChanged: root.note("pg.currentIndex " + currentIndex)
    }
    T.PageIndicator {
        id: pn
        x: 250; y: 60; width: 150; height: 30
        count: 3
        delegate: Rectangle { implicitWidth: 20; implicitHeight: 20; color: "silver" }
        contentItem: Row { Repeater { model: pn.count; delegate: pn.delegate } }
        onCurrentIndexChanged: root.note("pn.currentIndex " + currentIndex)
    }

    T.ToolSeparator { id: ts }
    T.ToolSeparator { id: th; orientation: Qt.Horizontal }
    T.MenuSeparator { id: ms }

    function answers() {
        return [
            // What each is before anything is done to it.
            [sl.from, sl.to, sl.value, sl.position, sl.visualPosition, sl.stepSize, sl.snapMode, sl.pressed, sl.orientation],
            [sl.horizontal, sl.vertical, sl.live, sl.touchDragThreshold, sl.focusPolicy, sl.activeFocusOnTab, sl.wheelEnabled],
            [sl.implicitHandleWidth, sl.implicitHandleHeight, sl.handle.parent === sl, so.handle, so.implicitHandleWidth],
            [T.Slider.NoSnap, T.Slider.SnapAlways, T.Slider.SnapOnRelease],
            [st.value, st.position, st.valueAt(0.5), st.valueAt(0.44), sl.valueAt(0.44), sr.valueAt(0.26)],
            [sv.vertical, sv.position, sv.visualPosition, sv.handle.y],
            [so.value, so.position, sn.value, sn.position, sn.visualPosition, sn.valueAt(0.3), sbound.value],
            [rs.from, rs.to, rs.stepSize, rs.snapMode, rs.orientation, rs.live, rs.horizontal, rs.vertical, rs.touchDragThreshold],
            [rs.focusPolicy, rs.activeFocusOnTab, rs.first.handle.activeFocusOnTab, rs.first.handle.parent === rs],
            [rs.first.value, rs.first.position, rs.first.visualPosition, rs.first.pressed, rs.first.hovered],
            [rs.second.value, rs.second.position, rs.second.visualPosition, rs.first.implicitHandleWidth, rs.second.implicitHandleHeight],
            [ri.first.value, ri.first.position, ri.second.value, ri.second.position, ri.valueAt(0.44)],
            [rx.first.value, rx.first.position, rx.first.visualPosition, rx.second.value, rx.second.position, rx.first.handle],
            [dial.from, dial.to, dial.value, dial.position, dial.angle, dial.startAngle, dial.endAngle, dial.stepSize],
            [dial.snapMode, dial.inputMode, dial.wrap, dial.live, dial.pressed, dial.focusPolicy, dial.activeFocusOnTab],
            [T.Dial.Circular, T.Dial.Horizontal, T.Dial.Vertical, T.Dial.Clockwise, T.Dial.CounterClockwise, T.Dial.SnapOnRelease],
            [dial.handle.parent === dial, dw.angle, dw.startAngle, dw.endAngle, dh.angle],
            [pb.from, pb.to, pb.value, pb.position, pb.visualPosition, pb.indeterminate, pb.focusPolicy],
            [po.value, po.position, po.indeterminate, pe.value, pe.position, busy.running],
            [pg.count, pg.currentIndex, pg.interactive, pg.contentItem.children.length, pg.implicitContentWidth, pn.interactive],
            [ts.orientation, ts.horizontal, ts.vertical, th.horizontal, th.vertical, ms.focusPolicy],
        ]
    }
}
