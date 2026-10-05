// Particles brighter than their alpha, as most of Qt's examples have them:
// ten of each on one spot, over white and over blue.
import QtQuick
import QtQuick.Particles

Rectangle {
    id: root
    width: 400; height: 300
    color: "white"
    property alias system: system
    property alias paint: paint
    property alias smoke: smoke
    property alias spots: spots
    property alias puffs: puffs

    Rectangle { x: 200; width: 200; height: 300; color: "#2060c0" }
    ParticleSystem { id: system; anchors.fill: parent }
    ImageParticle {
        id: paint
        system: system; groups: ["paint"]
        source: "../../assets/white.png"; color: "#1a1a80"; alpha: 0.2; entryEffect: ImageParticle.None
    }
    ImageParticle {
        id: smoke
        system: system; groups: ["smoke"]
        source: "../../assets/white.png"; color: "yellow"; alpha: 0.1; entryEffect: ImageParticle.None
    }
    Emitter { id: spots; system: system; group: "paint"; enabled: false; lifeSpan: 100000; size: 40 }
    Emitter { id: puffs; system: system; group: "smoke"; enabled: false; lifeSpan: 100000; size: 40 }
}
