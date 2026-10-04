import QtQuick
import QtQuick.Controls.Basic.impl as Basic
import QtQuick.Controls.Material.impl as Material
import QtQuick.Controls.Universal.impl as Universal

// What the styles paint in C++, where it moves.
Item {
    id: root
    width: 400
    height: 300

    property alias basicBusy: basicBusy
    property alias basicBar: basicBar
    property alias materialBusy: materialBusy
    property alias materialBar: materialBar
    property alias universalBusy: universalBusy
    property alias universalBar: universalBar
    property alias ripple: ripple
    property alias late: late
    property alias container: container
    property alias placeholder: placeholder

    property bool busy: true
    property bool pressed: false
    property bool focused: false
    property bool typed: false

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    Rectangle { anchors.fill: parent; color: "white" }

    Basic.BusyIndicatorImpl {
        id: basicBusy; width: 48; height: 48; pen: "#ff0000"; fill: "#0000ff"
        running: root.busy; opacity: root.busy ? 1 : 0
    }
    Basic.ProgressBarImpl { id: basicBar; x: 100; width: 100; height: 6; implicitHeight: 6; indeterminate: root.busy; color: "#008000" }

    Material.BusyIndicatorImpl { id: materialBusy; y: 60; width: 48; height: 48; color: "#ff0000"; running: root.busy }
    Material.ProgressBarImpl { id: materialBar; x: 100; y: 60; width: 100; height: 4; implicitHeight: 4; indeterminate: root.busy; color: "#008000" }

    Universal.BusyIndicatorImpl { id: universalBusy; y: 120; width: 60; height: 60; color: "#0000ff"; visible: root.busy }
    Universal.ProgressBarImpl { id: universalBar; x: 100; y: 120; width: 100; height: 10; implicitHeight: 10; indeterminate: root.busy; color: "#008000" }

    Item {
        id: button; x: 220; width: 60; height: 40
        property real pressX: 10
        property real pressY: 20
        Material.Ripple { id: ripple; anchors.fill: parent; color: "#40000000"; pressed: root.pressed; anchor: button; active: root.focused }
    }
    Material.Ripple {
        id: late; x: 300; width: 60; height: 40; color: "#40000000"; pressed: root.pressed; trigger: Material.Ripple.Release
    }

    Item {
        id: field; x: 220; y: 100; width: 160; height: 56
        Material.MaterialTextContainer {
            id: container; anchors.fill: parent; outlineColor: "#000000"; focusedOutlineColor: "#0000ff"
            placeholderTextWidth: 40; horizontalPadding: 16
            controlHasActiveFocus: root.focused; controlHasText: root.typed; placeholderHasText: true
        }
        Material.FloatingPlaceholderText {
            id: placeholder; text: "abc"; font.family: boxes.name; font.pixelSize: 20
            controlHeight: 56; leftPadding: 16; floatingLeftPadding: 12
            controlHasActiveFocus: root.focused; controlHasText: root.typed
        }
    }

    function ready() {
        return boxes.status === FontLoader.Ready
    }
}
