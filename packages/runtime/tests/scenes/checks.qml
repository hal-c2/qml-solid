// The buttons that are checked: check boxes, radio buttons, tabs, switches
// and the button that is held, and the delegates that are rows of a view.
// What they say is noted, and compared with what Qt's say of the same.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }

    property alias cb: cb
    property alias tri: tri
    property alias fn: fn
    property alias r1: r1
    property alias r2: r2
    property alias r3: r3
    property alias t1: t1
    property alias t2: t2
    property alias sw: sw
    property alias dl: dl
    property alias dt: dt
    property alias plain: plain
    property alias cd: cd
    property alias rd1: rd1
    property alias rd2: rd2
    property alias sd: sd

    T.CheckBox {
        id: cb
        x: 10; y: 10; width: 80; height: 30
        onCheckStateChanged: root.note("cb.checkState " + checkState)
        onCheckedChanged: root.note("cb.checked " + checked)
        onToggled: root.note("cb.toggled")
        onClicked: root.note("cb.clicked")
    }
    T.CheckBox {
        id: tri
        x: 10; y: 45; width: 80; height: 30
        tristate: true
        onCheckStateChanged: root.note("tri.checkState " + checkState)
        onCheckedChanged: root.note("tri.checked " + checked)
        onToggled: root.note("tri.toggled")
        onClicked: root.note("tri.clicked")
    }
    // A click leads where the function says.
    T.CheckBox {
        id: fn
        x: 10; y: 80; width: 80; height: 30
        tristate: true
        checkState: Qt.PartiallyChecked
        nextCheckState: function() { return checkState === Qt.Checked ? Qt.Unchecked : Qt.Checked }
        onCheckStateChanged: root.note("fn.checkState " + checkState)
        onToggled: root.note("fn.toggled")
    }

    // Of several that say they are checked the last is.
    Item {
        x: 100; y: 10
        T.RadioButton {
            id: r1
            width: 80; height: 30
            onCheckedChanged: root.note("r1.checked " + checked)
            onToggled: root.note("r1.toggled")
            onClicked: root.note("r1.clicked")
        }
        T.RadioButton {
            id: r2
            y: 35; width: 80; height: 30
            checked: true
            onCheckedChanged: root.note("r2.checked " + checked)
            onToggled: root.note("r2.toggled")
        }
        T.RadioButton {
            id: r3
            y: 70; width: 80; height: 30
            checked: true
            onCheckedChanged: root.note("r3.checked " + checked)
            onToggled: root.note("r3.toggled")
            onClicked: root.note("r3.clicked")
        }
    }
    Item {
        x: 100; y: 120
        T.TabButton {
            id: t1
            width: 45; height: 30
            checked: true
            onCheckedChanged: root.note("t1.checked " + checked)
        }
        T.TabButton {
            id: t2
            x: 45; width: 45; height: 30
            onCheckedChanged: root.note("t2.checked " + checked)
            onToggled: root.note("t2.toggled")
        }
    }

    T.Switch {
        id: sw
        x: 200; y: 10; width: 100; height: 30
        onCheckedChanged: root.note("sw.checked " + checked)
        onToggled: root.note("sw.toggled")
        onClicked: root.note("sw.clicked")
        onReleased: root.note("sw.released")
        onCanceled: root.note("sw.canceled")
        onPositionChanged: root.note("sw.position " + position)
        indicator: Rectangle {
            x: 10; y: 5; width: 40; height: 20
            color: "silver"
            Rectangle { x: sw.visualPosition * 20; width: 20; height: 20; color: "teal" }
        }
    }

    // Without a transition it is there at once, and gone when it is let go.
    T.DelayButton {
        id: dl
        x: 200; y: 50; width: 100; height: 30
        onProgressChanged: root.note("dl.progress " + progress)
        onActivated: root.note("dl.activated")
        onCheckedChanged: root.note("dl.checked " + checked)
        onToggled: root.note("dl.toggled")
        onClicked: root.note("dl.clicked")
    }
    T.DelayButton {
        id: dt
        x: 200; y: 90; width: 100; height: 30
        delay: 1000
        onActivated: root.note("dt.activated")
        onCheckedChanged: root.note("dt.checked " + checked)
        onToggled: root.note("dt.toggled")
        onClicked: root.note("dt.clicked")
        transition: Transition {
            NumberAnimation { duration: dt.delay * (dt.pressed ? 1.0 - dt.progress : 0.3 * dt.progress) }
        }
    }

    T.ItemDelegate {
        id: plain
        x: 200; y: 130; width: 100; height: 25
        onClicked: root.note("plain.clicked")
    }
    T.CheckDelegate {
        id: cd
        x: 200; y: 160; width: 100; height: 25
        tristate: true
        onCheckStateChanged: root.note("cd.checkState " + checkState)
        onToggled: root.note("cd.toggled")
    }
    Item {
        x: 200; y: 190
        T.RadioDelegate {
            id: rd1
            width: 100; height: 25
            onCheckedChanged: root.note("rd1.checked " + checked)
        }
        T.RadioDelegate {
            id: rd2
            y: 30; width: 100; height: 25
            onCheckedChanged: root.note("rd2.checked " + checked)
            onToggled: root.note("rd2.toggled")
        }
    }
    T.SwitchDelegate {
        id: sd
        x: 310; y: 10; width: 80; height: 30
        onToggled: root.note("sd.toggled")
        onPositionChanged: root.note("sd.position " + position)
        indicator: Rectangle { x: 30; y: 5; width: 40; height: 20; color: "silver" }
    }

    function answers() {
        return [
            // What each is before anything is done to it.
            [cb.checkable, cb.checked, cb.checkState, cb.tristate, cb.autoExclusive, cb.focusPolicy, typeof cb.nextCheckState],
            [fn.checked, fn.checkState, tri.checkState],
            [r1.checkable, r1.autoExclusive, r1.checked, r2.checked, r3.checked, r1.focusPolicy],
            [t1.checkable, t1.autoExclusive, t1.checked, t2.checked, t1.focusPolicy],
            [sw.checkable, sw.checked, sw.position, sw.visualPosition, sw.autoExclusive, sw.focusPolicy],
            [dl.checkable, dl.checked, dl.delay, dl.progress, dl.transition, dt.delay, dt.transition !== null],
            [plain.checkable, plain.highlighted, plain.focusPolicy, plain.activeFocusOnTab],
            [cd.checkable, cd.tristate, cd.checkState, cd.focusPolicy],
            [rd1.checkable, rd1.autoExclusive, rd1.focusPolicy, sd.checkable, sd.position, sd.visualPosition, sd.focusPolicy],
        ]
    }
}
