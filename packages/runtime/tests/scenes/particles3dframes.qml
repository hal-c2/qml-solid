// Sprites with pictures: one with greys and a half seen frame, one that is
// seen through more to one side; ones that go through the frames of a
// picture, forwards and one into the next, backwards, to and fro, from a
// frame in a time of their own, and staying at one; and one coloured from
// a table over its life.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

    component Cell: ParticleSystem3D {
        id: cell
        property alias kind: sprite
        property alias emitter: emitter
        running: false
        time: root.t

        SpriteParticle3D {
            id: sprite
            color: "#ffffff"
            fadeInDuration: 0
            fadeOutDuration: 0
            maxAmount: 4
        }
        ParticleEmitter3D {
            id: emitter
            particle: sprite
            particleScale: 10
            lifeSpan: 1000
            emitBursts: EmitBurst3D {
                amount: 1
            }
        }
    }

    View3D {
        anchors.fill: parent
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#808080"
        }

        OrthographicCamera {
            z: 500
        }

        Cell {
            x: -150
            y: 75
            kind.sprite: Texture {
                source: "../assets/shade.png"
            }
        }
        Cell {
            x: -50
            y: 75
            kind.sprite: Texture {
                source: "../assets/fade.png"
            }
        }
        Cell {
            x: 50
            y: 75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
            }
        }
        Cell {
            x: 150
            y: 75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
                interpolate: false
                animationDirection: SpriteSequence3D.Reverse
            }
        }
        Cell {
            x: -150
            y: -75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
                interpolate: false
                animationDirection: SpriteSequence3D.Alternate
            }
        }
        Cell {
            x: -50
            y: -75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
                interpolate: false
                frameIndex: 1
                duration: 400
            }
        }
        Cell {
            x: 50
            y: -75
            kind.colorTable: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: 150
            y: -75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
                frameIndex: 2
                animationDirection: SpriteSequence3D.SingleFrame
            }
        }
    }

    property var acts: [
        function () { root.t = 375 },
        function () { root.t = 625 },
        function () { root.t = 900 }
    ]

    function act(index) {
        acts[index]()
    }
}
