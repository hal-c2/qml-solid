import QtQuick
import QtQuick.Controls.Basic.impl as Basic
import QtQuick.Controls.Fusion.impl as Fusion
import QtQuick.Controls.Material.impl as Material
import QtQuick.Controls.Universal.impl as Universal

// What the styles paint in C++, where it stands still: dials, bars that say
// how far something is, what a text field is in, a ripple that is on.
Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    Rectangle { anchors.fill: parent; color: "white" }

    Basic.DialImpl { id: dial; width: 100; height: 100; progress: 0.5; color: "#ff0000" }
    Basic.DialImpl {
        id: quarter; x: 110; width: 75; height: 60; progress: 1; startAngle: -90; endAngle: 180; color: "#0000ff"
    }
    Basic.DialImpl { id: plain; visible: false }
    Basic.ProgressBarImpl { id: bar; x: 200; width: 100; height: 20; implicitHeight: 6; progress: 0.4; color: "#008000" }
    Basic.ProgressBarImpl { id: busyBar; visible: false; indeterminate: true }
    Basic.BusyIndicatorImpl { id: hiddenBusy; visible: false; running: false }

    Material.ProgressBarImpl {
        id: thin; x: 200; y: 30; width: 100; height: 20; implicitHeight: 4; progress: 0.75; color: "#ff00ff"
    }
    Universal.ProgressBarImpl {
        id: flat; x: 200; y: 60; width: 100; height: 20; implicitHeight: 10; progress: 0.25; color: "#0000ff"
    }
    Universal.ProgressBarImpl { id: busyFlat; visible: false; indeterminate: true }
    Universal.FocusRectangle { id: focused; x: 320; y: 10; width: 41; height: 31 }
    Universal.BusyIndicatorImpl { id: dots; visible: false }

    Fusion.DialImpl { id: round; y: 110; width: 100; height: 100; palette.button: "#c0c0c0" }
    Fusion.DialImpl {
        id: ringed; x: 110; y: 110; width: 80; height: 100; highlight: true
        palette.button: "#80a0c0"; palette.highlight: "#ff0000"
    }
    Fusion.DialImpl { id: off; x: 200; y: 110; width: 60; height: 60; enabled: false; palette.button: "#c0c0c0" }
    Fusion.KnobImpl { id: knob; x: 270; y: 110; width: 40; height: 40; palette.button: "#c0c0c0" }
    Fusion.BusyIndicatorImpl { id: spinner; x: 320; y: 110; width: 56; height: 56; color: "#000000"; running: true }

    Material.MaterialTextContainer {
        id: outlined; y: 220; width: 120; height: 50; outlineColor: "#ff0000"; focusedOutlineColor: "#0000ff"
    }
    Material.MaterialTextContainer {
        id: gapped; x: 130; y: 220; width: 120; height: 50; outlineColor: "#008000"
        placeholderTextWidth: 40; horizontalPadding: 16; controlHasText: true; placeholderHasText: true
    }
    Material.MaterialTextContainer {
        id: filled; x: 260; y: 220; width: 120; height: 50; filled: true
        fillColor: "#c0c0c0"; outlineColor: "#0000ff"; focusedOutlineColor: "#ff0000"
    }
    Material.Ripple {
        id: lit; x: 320; y: 60; width: 60; height: 40; clip: true; color: "#800000ff"; active: true
    }
    Material.Ripple { id: still; visible: false; trigger: Material.Ripple.Release }
    Material.BusyIndicatorImpl { id: stopped; visible: false }

    // The text of a field that floats: over an outline, inside a filled
    // one, and where it rests.
    Item {
        id: field; x: 200; y: 180; width: 190; height: 40
        Material.FloatingPlaceholderText {
            id: resting; text: "abc"; font.family: boxes.name; font.pixelSize: 20
            controlHeight: 40; leftPadding: 16; floatingLeftPadding: 12; verticalPadding: 8
        }
        Material.FloatingPlaceholderText {
            id: floating; text: "abc"; font.family: boxes.name; font.pixelSize: 20; controlHasText: true
            controlHeight: 40; leftPadding: 16; floatingLeftPadding: 12; verticalPadding: 8
        }
        Material.FloatingPlaceholderText {
            id: inside; text: "abc"; font.family: boxes.name; font.pixelSize: 20; controlHasText: true; filled: true
            controlHeight: 40; leftPadding: 16; floatingLeftPadding: 12; verticalPadding: 8
            horizontalAlignment: Text.AlignRight
        }
        Material.FloatingPlaceholderText {
            id: unsaid; font.family: boxes.name; font.pixelSize: 20; controlHasText: true
            controlHeight: 40; leftPadding: 16; floatingLeftPadding: 12
        }
    }

    function ready() {
        return boxes.status === FontLoader.Ready
    }

    function placed(item) {
        return [item.x, item.y, item.scale, item.transformOrigin, item.largestHeight, item.implicitWidth]
    }

    function answers() {
        return [
            [String(plain.color), plain.progress, plain.startAngle, plain.endAngle],
            [bar.clip, busyBar.clip, busyFlat.clip, String(busyBar.color), String(busyFlat.color), busyBar.progress],
            [hiddenBusy.running, hiddenBusy.visible],
            [String(hiddenBusy.pen), String(hiddenBusy.fill)],
            [dots.count, String(dots.color), spinner.running, spinner.visible, String(spinner.color)],
            [round.highlight, ringed.highlight],
            [outlined.focusAnimationProgress, gapped.focusAnimationProgress, filled.focusAnimationProgress],
            [outlined.filled, outlined.placeholderTextWidth, outlined.horizontalPadding, outlined.controlHasText],
            [Material.MaterialTextContainer.AlignLeft, Material.MaterialTextContainer.AlignRight,
             Material.MaterialTextContainer.AlignHCenter, Material.MaterialTextContainer.AlignJustify],
            [Material.Ripple.Press, Material.Ripple.Release, still.trigger, still.pressed, still.active, still.clipRadius,
             still.anchor === null],
            [stopped.running, stopped.visible, String(stopped.color)],
            placed(resting), placed(floating), placed(inside), placed(unsaid),
            [resting.height, resting.width, Item.Left, Item.Right, Item.Center]
        ]
    }
}
