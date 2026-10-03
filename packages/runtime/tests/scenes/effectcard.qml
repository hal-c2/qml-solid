import QtQuick
import QtQuick.Effects

// The three ways the examples use MultiEffect, as the compiler makes them:
// the shadow of a card, the tint of an icon, a picture cut to a circle.
Item {
    id: root
    property alias card: card
    property alias mask: userMask
    width: 400; height: 300

    Rectangle {
        id: card
        x: 20; y: 20; width: 60; height: 40
        radius: 6
        color: "white"
    }
    MultiEffect {
        source: card
        anchors.fill: card
        shadowEnabled: true
        shadowColor: "black"
        shadowOpacity: 0.5
    }

    Rectangle {
        id: icon
        x: 120; y: 20; width: 40; height: 40
        color: "white"
    }
    MultiEffect {
        anchors.fill: icon
        source: icon
        colorization: 1
        colorizationColor: "#2CDE85"
    }

    Rectangle {
        id: userImage
        x: 200; y: 20; width: 40; height: 40
        color: "#336699"
        visible: false
    }
    Image {
        id: userMask
        source: "/assets/circle.png"
        anchors.fill: userImage
        visible: false
    }
    MultiEffect {
        source: userImage
        anchors.fill: userImage
        maskSource: userMask
        maskEnabled: true
    }
}
