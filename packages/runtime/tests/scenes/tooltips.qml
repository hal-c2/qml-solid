import QtQuick
import QtQuick.Templates as T

// Tool tips: one that is declared, with its delay and its timeout, and the
// one every item shares through `ToolTip.text` and the like.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    property bool on: false
    property alias tip: tip

    Item {
        id: a
        x: 50; y: 100; width: 100; height: 40
        T.ToolTip {
            id: tip
            text: "one"
            delay: 300
            timeout: 1000
            x: 10; y: -30
            implicitWidth: 60; implicitHeight: 24
            padding: 4
            contentItem: Text { text: tip.text }
            background: Rectangle { implicitWidth: 50; implicitHeight: 20; color: "yellow" }
            onVisibleChanged: root.log.push("tip visible " + visible)
            onOpened: root.log.push("tip opened")
            onClosed: root.log.push("tip closed")
            onTextChanged: root.log.push("tip text " + text)
            onDelayChanged: root.log.push("tip delay " + delay)
            onTimeoutChanged: root.log.push("tip timeout " + timeout)
        }
    }
    Item {
        id: b
        x: 200; y: 150; width: 100; height: 40
        T.ToolTip.text: "bee"
        T.ToolTip.delay: 200
        T.ToolTip.timeout: 600
        T.ToolTip.onVisibleChanged: root.log.push("b visible " + T.ToolTip.visible)
        T.ToolTip.onTextChanged: root.log.push("b text " + T.ToolTip.text)
        function tell() { return [T.ToolTip.visible, T.ToolTip.text, T.ToolTip.delay, T.ToolTip.timeout] }
        function show(text, ms) { if (ms === undefined) T.ToolTip.show(text); else T.ToolTip.show(text, ms) }
        function hide() { T.ToolTip.hide() }
        function shared() { return T.ToolTip.toolTip }
        function write(text) { T.ToolTip.text = text }
    }
    Item {
        id: c
        x: 20; y: 200; width: 60; height: 40
        T.ToolTip.visible: root.on
        T.ToolTip.text: "sea"
        T.ToolTip.onVisibleChanged: root.log.push("c visible " + T.ToolTip.visible)
        function tell() { return [T.ToolTip.visible, T.ToolTip.text, T.ToolTip.delay, T.ToolTip.timeout] }
        function hide() { T.ToolTip.hide() }
        function shared() { return T.ToolTip.toolTip }
        function write(text) { T.ToolTip.text = text }
        function time(delay, timeout) { T.ToolTip.delay = delay; T.ToolTip.timeout = timeout }
    }
    Item {
        id: d
        x: 300; y: 250; width: 60; height: 40
        T.ToolTip.onVisibleChanged: root.log.push("d visible " + T.ToolTip.visible)
        function tell() { return [T.ToolTip.visible, T.ToolTip.text, T.ToolTip.delay, T.ToolTip.timeout] }
        function set(on) { T.ToolTip.visible = on }
    }
    Connections {
        target: b.shared()
        function onVisibleChanged() { root.log.push("shared visible " + target.visible) }
        function onTextChanged() { root.log.push("shared text " + target.text) }
        function onDelayChanged() { root.log.push("shared delay " + target.delay) }
        function onTimeoutChanged() { root.log.push("shared timeout " + target.timeout) }
        function onParentChanged() { root.log.push("shared parent " + root.named(target.parent)) }
    }

    function named(item) {
        return item === a ? "a" : item === b ? "b" : item === c ? "c" : item === d ? "d" : item === null ? "none" : "other"
    }
    function step(i) {
        switch (i) {
        case 0: tip.open(); break
        case 1: tip.delay = 0; tip.open(); break
        case 2: tip.timeout = -1; break
        case 3: tip.timeout = 300; break
        case 4: tip.show("two", 400); break
        case 5: tip.hide(); break
        case 6: tip.delay = 300; tip.visible = true; break
        case 7: tip.visible = false; break
        case 8: tip.delay = 0; tip.timeout = -1; a.y = 10; tip.open(); break
        case 9: a.x = 330; tip.x = 80; break
        case 10: tip.close(); b.show("hi"); break
        case 11: root.on = true; break
        case 12: b.show("again", 300); break
        case 13: root.on = false; root.on = true; break
        case 14: c.write("ocean"); b.write("wasp"); break
        case 15: b.hide(); break
        case 16: c.time(100, 250); break
        case 17: c.hide(); break
        case 18: d.set(true); break
        case 19: d.set(false); root.on = false; break
        case 20: root.on = true; break
        }
    }
    function take() {
        const l = log
        log = []
        return l
    }
    function state() {
        const at = tip.contentItem.parent.mapToItem(root, 0, 0)
        const s = b.shared()
        return [[tip.visible, tip.opened, tip.text, tip.delay, tip.timeout, tip.x, tip.y, tip.width, tip.height, at.x, at.y],
                [s.visible, s.text, s.delay, s.timeout, named(s.parent), s === c.shared()],
                b.tell(), c.tell(), d.tell()]
    }
}
