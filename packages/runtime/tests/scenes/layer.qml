import QtQuick
import QtQuick.Effects
import QtQuick.Templates as T

Rectangle {
    id: root
    width: 400; height: 300
    color: "white"
    // The effects there were, in the order they were complete.
    property var made: []
    property alias button: button
    property alias box: box
    property alias soft: soft

    // The effect names what holds the item it is of.
    T.Button {
        id: button
        x: 40; y: 30; width: 120; height: 40
        background: Rectangle {
            radius: button.height / 2
            color: "#336699"
            layer.enabled: true
            layer.effect: Halo { id: round; name: "button"; rounded: button.background.radius; Component.onCompleted: root.made.push(round) }
        }
    }
    Rectangle {
        id: box
        x: 40; y: 120; width: 100; height: 40
        radius: 4
        color: "#336699"
        layer.enabled: true
        layer.effect: Halo { id: square; name: "box"; rounded: box.radius; Component.onCompleted: root.made.push(square) }
    }
    Rectangle {
        id: soft
        x: 240; y: 120; width: 80; height: 40
        opacity: 0.5
        color: "#336699"
        layer.enabled: true
        layer.effect: MultiEffect { shadowEnabled: true; shadowColor: "black"; shadowVerticalOffset: 10; shadowBlur: 0 }
    }
}
