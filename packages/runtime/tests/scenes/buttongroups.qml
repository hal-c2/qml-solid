// Buttons in groups, and buttons that do an action. What they say is noted,
// and compared with what Qt's say of the same.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }
    function name(of) { return of ? of.text : "none" }

    property alias grp: grp
    property alias g1: g1
    property alias g2: g2
    property alias g3: g3
    property alias listed: listed
    property alias l1: l1
    property alias l2: l2
    property alias multi: multi
    property alias all: all
    property alias m1: m1
    property alias m2: m2
    property alias act: act
    property alias ab: ab
    property alias ab2: ab2
    property alias ag: ag
    property alias x1: x1
    property alias x2: x2
    property alias bx1: bx1
    property alias bx2: bx2
    property alias loose: loose
    property alias ag2: ag2

    // Of those in a group that say they are checked the first is.
    T.ButtonGroup {
        id: grp
        onClicked: button => root.note("grp.clicked " + button.text)
        onCheckedButtonChanged: root.note("grp.checkedButton " + root.name(checkedButton))
    }
    T.Button {
        id: g1
        x: 10; y: 10; width: 80; height: 25
        text: "g1"; checkable: true; checked: true
        T.ButtonGroup.group: grp
        onCheckedChanged: root.note("g1.checked " + checked)
        onToggled: root.note("g1.toggled")
    }
    T.Button {
        id: g2
        x: 10; y: 40; width: 80; height: 25
        text: "g2"; checkable: true; checked: true
        T.ButtonGroup.group: grp
        onCheckedChanged: root.note("g2.checked " + checked)
        onToggled: root.note("g2.toggled")
    }
    T.Button {
        id: g3
        x: 10; y: 70; width: 80; height: 25
        text: "g3"; checkable: true
        T.ButtonGroup.group: grp
        onCheckedChanged: root.note("g3.checked " + checked)
        onToggled: root.note("g3.toggled")
    }

    // A group of whatever buttons a list has.
    T.ButtonGroup {
        id: listed
        buttons: column.children
        onCheckedButtonChanged: root.note("listed.checkedButton " + root.name(checkedButton))
    }
    Column {
        id: column
        x: 10; y: 110
        T.CheckBox { id: l1; width: 80; height: 25; text: "l1"; checked: true }
        T.CheckBox { id: l2; width: 80; height: 25; text: "l2" }
        Text { text: "no button" }
    }

    // A box that says whether none, some or all of the others are checked,
    // and checks them all: each is bound to the other.
    T.ButtonGroup {
        id: multi
        exclusive: false
        checkState: all.checkState
        onCheckStateChanged: root.note("multi.checkState " + checkState)
    }
    T.CheckBox {
        id: all
        x: 110; y: 10; width: 80; height: 25
        text: "all"
        checkState: multi.checkState
        onCheckStateChanged: root.note("all.checkState " + checkState)
    }
    T.CheckBox {
        id: m1
        x: 110; y: 40; width: 80; height: 25
        text: "m1"; checked: true
        T.ButtonGroup.group: multi
        onCheckedChanged: root.note("m1.checked " + checked)
    }
    T.CheckBox {
        id: m2
        x: 110; y: 70; width: 80; height: 25
        text: "m2"
        T.ButtonGroup.group: multi
        onCheckedChanged: root.note("m2.checked " + checked)
    }

    T.Action {
        id: act
        text: "Act"
        icon.name: "edit"
        icon.color: "blue"
        checkable: true
        shortcut: "Ctrl+E"
        onTriggered: source => root.note("act.triggered " + root.name(source))
        onToggled: source => root.note("act.toggled " + root.name(source))
        onCheckedChanged: root.note("act.checked " + act.checked)
    }
    T.Button {
        id: ab
        x: 210; y: 10; width: 80; height: 25
        action: act
        onClicked: root.note("ab.clicked")
        onToggled: root.note("ab.toggled")
        onCheckedChanged: root.note("ab.checked " + checked)
        onEnabledChanged: root.note("ab.enabled " + enabled)
    }
    // What a button says itself counts for more than what its action says.
    T.Button {
        id: ab2
        x: 210; y: 40; width: 80; height: 25
        action: act
        text: "own"
        icon.name: "own"
        onClicked: root.note("ab2.clicked")
    }

    T.ActionGroup {
        id: ag
        onTriggered: action => root.note("ag.triggered " + action.text)
        onCheckedActionChanged: root.note("ag.checkedAction " + root.name(checkedAction))
        T.Action {
            id: x1
            text: "x1"; checkable: true; checked: true
            onCheckedChanged: root.note("x1.checked " + x1.checked)
            onEnabledChanged: root.note("x1.enabled " + x1.enabled)
        }
        T.Action {
            id: x2
            text: "x2"; checkable: true
            onCheckedChanged: root.note("x2.checked " + x2.checked)
            onTriggered: root.note("x2.triggered")
        }
    }
    T.Button {
        id: bx1
        x: 210; y: 80; width: 80; height: 25
        action: x1
        onCheckedChanged: root.note("bx1.checked " + checked)
    }
    T.Button {
        id: bx2
        x: 210; y: 110; width: 80; height: 25
        action: x2
        onCheckedChanged: root.note("bx2.checked " + checked)
        onToggled: root.note("bx2.toggled")
        onClicked: root.note("bx2.clicked")
    }
    T.ActionGroup { id: ag2; exclusive: false; enabled: false }
    T.Action { id: loose; text: "loose"; T.ActionGroup.group: ag2 }

    function answers() {
        return [
            [g1.checked, g2.checked, g3.checked, root.name(grp.checkedButton), grp.buttons.length, grp.exclusive, grp.checkState],
            [l1.checked, l2.checked, root.name(listed.checkedButton), listed.buttons.length, listed.checkState],
            [multi.checkState, all.checkState, all.checked, m1.checked, m2.checked, multi.checkedButton, multi.buttons.length],
            [act.text, act.icon.name, String(act.icon.color), act.checkable, act.checked, act.enabled, String(act.shortcut)],
            [ab.text, ab.icon.name, String(ab.icon.color), ab.checkable, ab.checked, ab.enabled, ab.action === act],
            [ab2.text, ab2.icon.name, String(ab2.icon.color), ab2.checkable],
            [x1.checked, x2.checked, root.name(ag.checkedAction), ag.actions.length, ag.exclusive, ag.enabled, bx1.checked, bx2.checked, bx1.text],
            [loose.enabled, ag2.actions.length, ag2.checkedAction],
        ]
    }
}
