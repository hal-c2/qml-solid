// TextArea as a style writes it, with nothing given, and in what scrolls
// it: a Flickable it is attached to, and a ScrollView. `read` is asked of Qt
// too, before and after each `step`. A letter of the font is 8 wide at 16.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 8
    property var notes: []
    property alias area: area
    property alias bare: bare
    property alias flick: flick
    property alias flicked: flicked
    property alias scrolled: scrolled
    property alias view: view

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    T.TextArea {
        id: area
        x: 10
        y: 10
        implicitWidth: Math.max(contentWidth + leftPadding + rightPadding, implicitBackgroundWidth + leftInset + rightInset)
        implicitHeight: Math.max(contentHeight + topPadding + bottomPadding, implicitBackgroundHeight + topInset + bottomInset)
        padding: 6
        leftPadding: padding + 4
        font.family: boxes.name
        font.pixelSize: 16
        text: "abc\ndefgh"
        placeholderText: "hint"
        placeholderTextColor: "#80ff0000"
        hoverEnabled: false
        background: Rectangle {
            id: back
            implicitWidth: 60
            implicitHeight: 20
            color: "#eeeeee"
        }
        onPressed: event => root.notes.push("pressed " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onReleased: event => root.notes.push("released " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onPressAndHold: event => root.notes.push("held " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onHoveredChanged: root.notes.push("hovered " + hovered)
        onFocusReasonChanged: root.notes.push("reason " + focusReason)
    }

    // What an area is that nothing was said of.
    T.TextArea {
        id: bare
        x: 200
        y: 10
        text: "ab\ncd"
        font.family: boxes.name
        font.pixelSize: 16
    }

    // An area that a Flickable scrolls.
    Flickable {
        id: flick
        x: 10
        y: 100
        width: 120
        height: 60
        T.TextArea.flickable: T.TextArea {
            id: flicked
            implicitWidth: contentWidth + leftPadding + rightPadding
            implicitHeight: contentHeight + topPadding + bottomPadding
            padding: 4
            topInset: 1
            font.family: boxes.name
            font.pixelSize: 16
            text: "one\ntwo\nthree\nfour\nfive\nsix"
            background: Rectangle {
                id: behind
                color: "#eeeeee"
            }
        }
        // Qt looks for the cursor while the area is being made, finds it
        // at the corner, inside no padding, and starts the Flickable there.
        Component.onCompleted: returnToBounds()
    }

    // And one in a ScrollView, which is attached to the view's Flickable.
    T.ScrollView {
        id: view
        x: 200
        y: 100
        width: 100
        height: 50
        T.TextArea {
            id: scrolled
            implicitWidth: contentWidth + leftPadding + rightPadding
            implicitHeight: contentHeight + topPadding + bottomPadding
            leftPadding: 2
            font.family: boxes.name
            font.pixelSize: 16
            text: "a line longer than it\nb\nc\nd"
        }
    }

    function take() {
        const taken = notes
        notes = []
        return taken
    }

    function step(index) {
        switch (index) {
        case 0:
            area.text = ""
            area.leftInset = 3
            area.topInset = 2
            break
        case 1:
            area.width = 100
            area.wrapMode = TextEdit.Wrap
            area.text = "aaaa bbbb cccc dddd"
            break
        case 2:
            // The cursor is kept in sight.
            flicked.cursorPosition = flicked.length
            scrolled.cursorPosition = 21
            break
        case 3:
            flicked.cursorPosition = 5
            scrolled.cursorPosition = scrolled.length
            break
        case 4:
            flicked.text = "a line longer than the flickable is\nb"
            break
        case 5:
            flicked.wrapMode = TextEdit.Wrap
            break
        case 6:
            flick.width = 200
            flick.height = 150
            scrolled.cursorPosition = 0
            view.height = 120
            break
        case 7:
            area.forceActiveFocus(Qt.TabFocusReason)
            break
        }
    }

    function read() {
        if (boxes.status !== FontLoader.Ready) return null
        const inner = view.contentItem
        return [
            [area.implicitWidth, area.implicitHeight, area.width, area.height, area.contentWidth, area.contentHeight, area.lineCount],
            [area.implicitBackgroundWidth, area.implicitBackgroundHeight, back.x, back.y, back.width, back.height, back.z, back.parent === area],
            [area.placeholderText, String(area.placeholderTextColor), area.hovered, area.hoverEnabled, area.focusReason, area.activeFocusOnTab, area.activeFocus],
            [bare.implicitWidth, bare.implicitHeight, bare.width, bare.height, bare.contentWidth, bare.contentHeight, bare.background === null],
            [bare.placeholderText, String(bare.placeholderTextColor), String(bare.color), bare.hovered, bare.activeFocusOnTab, bare.focusReason],
            [flicked.parent === flick.contentItem, flicked.x, flicked.y, flicked.width, flicked.height, flicked.implicitWidth, flicked.implicitHeight],
            [flick.contentWidth, flick.contentHeight, flick.contentX, flick.contentY, flicked.cursorRectangle.x, flicked.cursorRectangle.y],
            [behind.parent === flick, behind.x, behind.y, behind.width, behind.height, behind.z],
            [scrolled.parent === inner.contentItem, scrolled.x, scrolled.y, scrolled.width, scrolled.height, scrolled.implicitWidth, scrolled.implicitHeight],
            [inner.contentWidth, inner.contentHeight, inner.contentX, inner.contentY, view.contentWidth, view.contentHeight],
            take(),
        ]
    }
}
