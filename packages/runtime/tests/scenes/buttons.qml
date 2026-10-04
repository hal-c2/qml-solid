// Buttons of QtQuick.Templates, given what a style gives them: a background,
// a content item, an indicator. What they say when they are pressed, clicked
// and given focus is noted, and compared with what Qt's say of the same.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }

    property alias a: a
    property alias b: b
    property alias c: c
    property alias d: d
    property alias inD: inD
    property alias e: e
    property alias h: h
    property alias inH: inH
    property alias r: r
    property alias styled: styled
    property alias round: round
    property alias under: under

    T.Button {
        id: a
        x: 10; y: 10; width: 100; height: 40
        text: "a"
        onPressed: root.note("a.pressed")
        onReleased: root.note("a.released")
        onClicked: root.note("a.clicked")
        onCanceled: root.note("a.canceled")
        onToggled: root.note("a.toggled " + checked)
        onDoubleClicked: root.note("a.doubleClicked")
        onPressAndHold: root.note("a.pressAndHold")
        onDownChanged: root.note("a.down " + down)
        onCheckedChanged: root.note("a.checked " + checked)
        onActiveFocusChanged: root.note("a.activeFocus " + activeFocus)
        background: Rectangle { color: a.down ? "gray" : "silver" }
        contentItem: Text { text: a.text }
    }
    T.Button {
        id: b
        x: 10; y: 60; width: 100; height: 40
        text: "b"
        checkable: true
        onPressed: root.note("b.pressed")
        onToggled: root.note("b.toggled " + checked)
        onClicked: root.note("b.clicked " + checked)
        onReleased: root.note("b.released " + checked)
        onCanceled: root.note("b.canceled")
        background: Rectangle { color: b.checked ? "teal" : "silver" }
    }
    T.Control {
        id: c
        x: 10; y: 110; width: 100; height: 40
        focusPolicy: Qt.ClickFocus
    }
    T.Control {
        id: d
        x: 10; y: 160; width: 100; height: 40
        focusPolicy: Qt.StrongFocus
        T.Control { id: inD; width: 50; height: 20 }
    }
    T.Button {
        id: e
        x: 150; y: 10; width: 100; height: 40
        focusPolicy: Qt.NoFocus
        onClicked: root.note("e.clicked")
    }

    // What is under a control that hovers does not: the control it is in
    // does.
    MouseArea {
        id: under
        x: 140; y: 50; width: 120; height: 70
        hoverEnabled: true
        onContainsMouseChanged: root.note("under " + containsMouse)
    }
    T.Button {
        id: h
        x: 150; y: 60; width: 100; height: 50
        hoverEnabled: true
        focusPolicy: Qt.NoFocus
        onHoveredChanged: root.note("h.hovered " + hovered)
        T.Control {
            id: inH
            x: 10; y: 10; width: 30; height: 20
            onHoveredChanged: root.note("inH.hovered " + hovered)
        }
    }

    T.Button {
        id: r
        x: 150; y: 130; width: 100; height: 40
        autoRepeat: true
        focusPolicy: Qt.NoFocus
        onPressed: root.note("r.pressed")
        onReleased: root.note("r.released")
        onClicked: root.note("r.clicked")
        onCanceled: root.note("r.canceled")
    }

    // A button as a style makes it: as big as what it is given.
    T.Button {
        id: styled
        x: 150; y: 180
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset,
                                implicitContentWidth + leftPadding + rightPadding + implicitIndicatorWidth + spacing)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset,
                                 implicitContentHeight + topPadding + bottomPadding,
                                 implicitIndicatorHeight + topPadding + bottomPadding)
        padding: 6
        spacing: 4
        text: "styled"
        icon.name: "go"
        icon.width: 24
        icon.color: "red"
        display: T.AbstractButton.TextUnderIcon
        highlighted: true
        indicator: Rectangle {
            id: mark
            implicitWidth: 14
            implicitHeight: 18
            x: styled.leftPadding
            y: styled.topPadding
        }
        contentItem: Item { implicitWidth: 60; implicitHeight: 20 }
        background: Rectangle { implicitWidth: 40; implicitHeight: 20 }
    }
    T.RoundButton {
        id: round
        x: 280; y: 10; width: 60; height: 40
    }
    T.RoundButton {
        id: square
        x: 280; y: 60; width: 60; height: 40
        radius: 3
    }

    function answers() {
        return [
            // What a button is before anything is done to it.
            [a.focusPolicy, a.focusReason, a.activeFocusOnTab, a.wheelEnabled, a.hovered, a.visualFocus],
            [a.pressed, a.down, a.checked, a.checkable, a.autoExclusive, a.autoRepeat, a.autoRepeatDelay, a.autoRepeatInterval],
            [a.pressX, a.pressY, a.display, a.action, a.indicator, a.implicitIndicatorWidth, a.implicitIndicatorHeight],
            [a.text, a.icon.name, String(a.icon.source), a.icon.width, a.icon.height, a.icon.cache],
            [a.highlighted, a.flat],
            [T.AbstractButton.IconOnly, T.AbstractButton.TextOnly, T.AbstractButton.TextBesideIcon, T.AbstractButton.TextUnderIcon],
            // Tab stops where the focus policy says.
            [c.activeFocusOnTab, d.activeFocusOnTab, e.activeFocusOnTab, inD.activeFocusOnTab, c.focusPolicy, inD.focusPolicy],
            // A control hovers when the one around it does.
            [h.hoverEnabled, inH.hoverEnabled],
            // What a style gave the button, and how big that makes it.
            [styled.implicitIndicatorWidth, styled.implicitIndicatorHeight, styled.indicator === mark, mark.parent === styled],
            [styled.implicitWidth, styled.implicitHeight, styled.width, styled.height],
            [styled.icon.name, styled.icon.width, styled.icon.height, String(styled.icon.color), styled.display, styled.highlighted],
            [round.radius, square.radius],
        ]
    }
}
