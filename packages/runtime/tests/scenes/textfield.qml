// TextField as a style writes it, and as it is with nothing given. `read` is
// asked of Qt too, before and after each `step`, and what Qt says is what
// the test expects. The font is one of boxes: a letter is 8 wide at 16.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 7
    property var notes: []
    property alias field: field
    property alias bare: bare
    property alias inner: inner
    property alias tight: tight

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    T.TextField {
        id: field
        x: 10
        y: 10
        implicitWidth: implicitBackgroundWidth + leftInset + rightInset || contentWidth + leftPadding + rightPadding
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, contentHeight + topPadding + bottomPadding)
        padding: 6
        leftPadding: padding + 4
        font.family: boxes.name
        font.pixelSize: 16
        text: "abc"
        placeholderText: "hint"
        placeholderTextColor: "#80ff0000"
        verticalAlignment: TextInput.AlignVCenter
        // Whether a field hovers of itself is the device's to say.
        hoverEnabled: false
        background: Rectangle {
            id: back
            implicitWidth: 200
            implicitHeight: 40
            color: "#eeeeee"
        }
        onPressed: event => root.notes.push("pressed " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onReleased: event => root.notes.push("released " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onPressAndHold: event => root.notes.push("held " + event.x + "," + event.y + " " + event.button + " " + event.buttons + " " + event.wasHeld)
        onHoveredChanged: root.notes.push("hovered " + hovered)
        onFocusReasonChanged: root.notes.push("reason " + focusReason)
    }

    // What a field is that nothing was said of.
    T.TextField {
        id: bare
        x: 10
        y: 60
        text: "ab"
        font.family: boxes.name
        font.pixelSize: 16
    }

    T.Control {
        id: around
        x: 10
        y: 100
        width: 200
        height: 60
        font.pixelSize: 20
        font.italic: true
        hoverEnabled: false
        contentItem: Item {
            T.TextField {
                id: inner
                width: 120
                height: 30
                font.bold: true
                leftInset: 3
                topInset: 4
                rightInset: 5
                bottomInset: 6
                background: Rectangle {
                    id: under
                    implicitWidth: 30
                    implicitHeight: 12
                }
            }
        }
    }

    // A background that says how wide it is, and where.
    T.TextField {
        id: tight
        x: 10
        y: 180
        width: 150
        height: 40
        background: Rectangle {
            id: narrow
            y: 5
            z: 2
            width: 20
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
            field.text = ""
            field.width = 120
            break
        case 1:
            field.topInset = 2
            field.leftInset = 3
            tight.leftInset = 1
            break
        case 2:
            around.font.pixelSize = 11
            around.hoverEnabled = true
            break
        case 3:
            field.placeholderText = "other"
            field.placeholderTextColor = "blue"
            break
        case 4:
            inner.hoverEnabled = false
            field.focusReason = Qt.TabFocusReason
            break
        case 5:
            field.forceActiveFocus()
            break
        case 6:
            bare.forceActiveFocus(Qt.MouseFocusReason)
            break
        }
    }

    function read() {
        if (boxes.status !== FontLoader.Ready) return null
        return [
            // As big as its background, or as its text and padding.
            [field.implicitWidth, field.implicitHeight, field.width, field.height, field.contentWidth, field.contentHeight],
            [field.implicitBackgroundWidth, field.implicitBackgroundHeight, field.topInset, field.leftInset, field.rightInset, field.bottomInset],
            [back.x, back.y, back.width, back.height, back.z, back.parent === field],
            [field.placeholderText, String(field.placeholderTextColor), field.length],
            [field.hovered, field.hoverEnabled, field.focusReason, field.activeFocusOnTab, field.activeFocus],
            [bare.implicitWidth, bare.implicitHeight, bare.width, bare.height, bare.background === null, bare.implicitBackgroundWidth],
            [bare.placeholderText, String(bare.placeholderTextColor), bare.hovered, bare.activeFocusOnTab, bare.focusReason, bare.activeFocus],
            // The font is that of the control around the field, where it has none.
            [inner.font.pixelSize, inner.font.italic, inner.font.bold, inner.font.weight, inner.hoverEnabled],
            [under.x, under.y, under.width, under.height, under.z, inner.implicitBackgroundWidth, inner.implicitBackgroundHeight],
            [inner.implicitWidth, inner.implicitHeight],
            [narrow.x, narrow.y, narrow.width, narrow.height, narrow.z],
            [tight.font.pixelSize, tight.font.weight, tight.font.family === bare.font.family, String(tight.color)],
            take(),
        ]
    }
}
