// SpinBox and DoubleSpinBox as a style writes them, and with nothing given.
// `read` is asked of Qt too, before and after each `step`, and what the
// boxes say is noted. A letter of the font is 8 wide at 16.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 14
    property var notes: []
    property alias box: box
    property alias input: input
    property alias bare: bare
    property alias back: back
    property alias early: early
    property alias named: named
    property alias word: word
    property alias real: real
    property alias realInput: realInput
    property int source: 4

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    T.SpinBox {
        id: box
        x: 10
        y: 10
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, contentItem.implicitWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding,
                                 up.implicitIndicatorHeight, down.implicitIndicatorHeight)
        leftPadding: padding + (box.mirrored ? (up.indicator ? up.indicator.width : 0) : (down.indicator ? down.indicator.width : 0))
        rightPadding: padding + (box.mirrored ? (down.indicator ? down.indicator.width : 0) : (up.indicator ? up.indicator.width : 0))
        font.family: boxes.name
        font.pixelSize: 16
        hoverEnabled: true

        validator: IntValidator {
            bottom: Math.min(box.from, box.to)
            top: Math.max(box.from, box.to)
        }
        contentItem: TextInput {
            id: input
            text: box.displayText
            padding: 6
            font: box.font
            horizontalAlignment: Qt.AlignHCenter
            verticalAlignment: Qt.AlignVCenter
            readOnly: !box.editable
            validator: box.validator
            inputMethodHints: box.inputMethodHints
        }
        up.indicator: Rectangle {
            id: more
            x: box.mirrored ? 0 : box.width - width
            height: box.height
            implicitWidth: 30
            implicitHeight: 36
            color: box.up.pressed ? "gray" : "silver"
        }
        down.indicator: Rectangle {
            id: less
            x: box.mirrored ? box.width - width : 0
            height: box.height
            implicitWidth: 30
            implicitHeight: 32
            color: box.down.pressed ? "gray" : "silver"
        }
        background: Rectangle {
            implicitWidth: 140
            color: "#eeeeee"
        }
        onValueChanged: root.note("value " + value)
        onValueModified: root.note("modified " + value)
        onDisplayTextChanged: root.note("text " + displayText)
        up.onPressedChanged: root.note("up.pressed " + up.pressed)
        down.onPressedChanged: root.note("down.pressed " + down.pressed)
        up.onHoveredChanged: root.note("up.hovered " + up.hovered)
        down.onHoveredChanged: root.note("down.hovered " + down.hovered)
        onFocusReasonChanged: root.note("reason " + focusReason)
    }

    // What a box is that nothing was said of.
    T.SpinBox {
        id: bare
        x: 200
        y: 10
    }

    // The ends the wrong way round, and a value outside them.
    T.SpinBox {
        id: back
        x: 200
        y: 40
        from: 10
        to: -10
        stepSize: 4
        value: 30
        up.indicator: Item { id: backMore }
        down.indicator: Item { id: backLess }
    }

    // A value that is in range once the ends are known, and one that is bound.
    T.SpinBox {
        id: early
        x: 200
        y: 70
        value: root.source * 50
        to: 500
    }

    // Values that are written as words.
    T.SpinBox {
        id: named
        x: 10
        y: 70
        width: 120
        height: 30
        property var words: ["none", "some", "all"]
        to: 2
        value: 1
        editable: true
        textFromValue: function(value) { return words[value] }
        valueFromText: function(text) { return words.indexOf(text) }
        contentItem: TextInput {
            id: word
            text: named.displayText
            font.family: boxes.name
            font.pixelSize: 16
            readOnly: !named.editable
        }
        onValueModified: root.note("named.modified " + value)
    }

    T.DoubleSpinBox {
        id: real
        x: 10
        y: 120
        width: 140
        height: 30
        leftPadding: 30
        rightPadding: 30
        value: 2.345
        stepSize: 0.25
        validator: DoubleValidator {
            bottom: Math.min(real.from, real.to)
            top: Math.max(real.from, real.to)
            decimals: real.decimals
        }
        contentItem: TextInput {
            id: realInput
            text: real.displayText
            font.family: boxes.name
            font.pixelSize: 16
            readOnly: !real.editable
            validator: real.validator
            inputMethodHints: real.inputMethodHints
        }
        up.indicator: Rectangle {
            id: realMore
            x: real.width - width
            width: 30
            height: 30
            color: "silver"
        }
        down.indicator: Rectangle {
            id: realLess
            width: 30
            height: 30
            color: "silver"
        }
        onValueChanged: root.note("real.value " + value)
        onValueModified: root.note("real.modified " + value)
        onDisplayTextChanged: root.note("real.text " + displayText)
    }

    T.DoubleSpinBox {
        id: plain
        x: 200
        y: 120
    }

    // What the boxes say while they are made is not asked for.
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
            // Kept between the ends.
            box.value = 150
            back.value = -30
            real.value = 250
            break
        case 1:
            box.to = 50
            real.to = 20.005
            break
        case 2:
            // The ends the wrong way round.
            box.from = 60
            box.value = 70
            break
        case 3:
            box.increase()
            box.increase()
            back.decrease()
            real.decrease()
            break
        case 4:
            box.from = 0
            box.wrap = true
            box.decrease()
            real.wrap = true
            real.value = 20
            real.increase()
            break
        case 5:
            box.wrap = false
            box.stepSize = 7
            box.increase()
            real.stepSize = 0.004
            real.increase()
            break
        case 6:
            real.decimals = 1
            break
        case 7:
            // A number as its locale writes it.
            box.to = 100000
            box.value = 12345
            box.locale = Qt.locale("de_DE")
            real.to = 5000
            real.value = 1234.56
            real.locale = Qt.locale("de_DE")
            break
        case 8:
            box.textFromValue = function(value, locale) { return "<" + value + ">" }
            box.value = 3
            root.source = 6
            break
        case 9:
            early.to = 250
            root.source = 1
            break
        case 10:
            box.LayoutMirroring.enabled = true
            box.editable = true
            real.editable = true
            break
        case 11:
            named.increase()
            named.increase()
            break
        case 12:
            box.forceActiveFocus(Qt.TabFocusReason)
            break
        case 13:
            bare.forceActiveFocus()
            box.up.indicator = null
            box.enabled = false
            break
        }
    }

    function read() {
        if (boxes.status !== FontLoader.Ready) return null
        return [
            [box.from, box.to, box.value, box.stepSize, box.displayText, box.editable, box.live, box.wrap, box.inputMethodHints, box.inputMethodComposing],
            [box.implicitWidth, box.implicitHeight, box.width, box.height, box.leftPadding, box.rightPadding, input.x, input.y, input.width, input.height, input.text],
            [more.x, more.y, more.width, more.height, more.z, more.enabled, more.parent === box, box.up.implicitIndicatorWidth, box.up.implicitIndicatorHeight, box.up.pressed, box.up.hovered, more.visible],
            [less.x, less.y, less.width, less.height, less.z, less.enabled, less.parent === box, box.down.implicitIndicatorWidth, box.down.implicitIndicatorHeight, box.down.pressed, box.down.hovered],
            [box.focusPolicy, box.activeFocusOnTab, input.activeFocusOnTab, box.activeFocus, input.activeFocus, box.focusReason, box.wheelEnabled, input.readOnly, box.up.indicator === more],
            [bare.from, bare.to, bare.value, bare.stepSize, bare.displayText, bare.validator === null, bare.up.indicator === null, bare.down.indicator === null, bare.contentItem === null],
            [bare.implicitWidth, bare.implicitHeight, bare.focusPolicy, bare.activeFocusOnTab, bare.activeFocus, bare.up.implicitIndicatorWidth, typeof bare.textFromValue, typeof bare.valueFromText],
            [bare.textFromValue(-1234, Qt.locale("de_DE")), bare.valueFromText("1.234", Qt.locale("de_DE")), bare.textFromValue(1234.5, Qt.locale("en_US"))],
            [back.from, back.to, back.value, back.stepSize, back.displayText, backMore.enabled, backLess.enabled],
            [early.value, early.to, early.displayText, root.source],
            [named.value, named.displayText, word.text, named.textFromValue(2), named.valueFromText("some")],
            [real.from, real.to, real.value, real.stepSize, real.decimals, real.displayText, realInput.text, realMore.enabled, realLess.enabled, realInput.readOnly],
            [plain.from, plain.to, plain.value, plain.stepSize, plain.decimals, plain.displayText, plain.live === undefined, plain.inputMethodHints, plain.textFromValue(1234.5678, 3, Qt.locale("de_DE")), plain.valueFromText("1.234,5", Qt.locale("de_DE"))],
            // What changed together is noted in whatever order.
            take().sort(),
        ]
    }
}
