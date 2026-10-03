import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias tinted: tinted
    property alias second: second
    property alias faded: faded
    property alias scaled: scaled
    property alias animated: animated
    property alias turning: turning
    property alias varied: varied
    property alias tint: tint
    property alias fade: fade
    property alias grow: grow
    property alias sprite: sprite
    property alias turn: turn
    property alias vary: vary

    component Burst: Emitter { enabled: false; lifeSpan: 1000; size: 20 }

    ParticleSystem { id: system; anchors.fill: parent }

    ImageParticle {
        id: tinted
        system: system; groups: ["tint"]
        source: "../../assets/white.png"; color: "#ff8000"; entryEffect: ImageParticle.None
    }
    // The group's colours are the first painter's: this one keeps its own.
    ImageParticle {
        id: second
        system: system; groups: ["tint"]; x: 100
        source: "../../assets/white.png"; color: "#0000ff"; entryEffect: ImageParticle.None
    }
    ImageParticle { id: faded; system: system; groups: ["fade"]; source: "../../assets/white.png" }
    ImageParticle {
        id: scaled
        system: system; groups: ["scale"]
        source: "../../assets/white.png"; entryEffect: ImageParticle.Scale
    }
    ImageParticle {
        id: animated
        system: system; groups: ["sprite"]
        spritesInterpolate: false; entryEffect: ImageParticle.None
        sprites: [
            Sprite { name: "all"; source: "../../assets/sheet.png"; frameCount: 4; frameDuration: 100; to: { "end": 1 } },
            Sprite { name: "end"; source: "../../assets/sheet.png"; frameCount: 2; frameX: 20; frameWidth: 10; frameDuration: 200 }
        ]
    }
    ImageParticle {
        id: turning
        system: system; groups: ["turn"]
        source: "../../assets/half.png"; rotation: 90; entryEffect: ImageParticle.None
    }
    ImageParticle {
        id: varied
        system: system; groups: ["vary"]
        source: "../../assets/white.png"; color: "#804020"; colorVariation: 0.5; alpha: 0.5
        entryEffect: ImageParticle.None
    }

    Burst { system: system; id: tint; group: "tint"; x: 50; y: 50 }
    Burst { system: system; id: fade; group: "fade"; x: 150; y: 50 }
    Burst { system: system; id: grow; group: "scale"; x: 250; y: 50 }
    Burst { system: system; id: sprite; group: "sprite"; x: 50; y: 150; lifeSpan: 2000 }
    Burst { system: system; id: turn; group: "turn"; x: 150; y: 150 }
    Burst { system: system; id: vary; group: "vary"; x: 250; y: 150 }
}
