// Sprites coloured from a table at the edges of it; going through frames to
// and fro in a time of their own; turned towards a point and the way they
// set out, which one that faces the eye is not; one that goes backwards
// and fades as it comes; and one that grows as it comes.
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
            kind.colorTable: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: -50
            y: 75
            kind.sprite: Texture {
                source: "../assets/sheet.png"
            }
            kind.spriteSequence: SpriteSequence3D {
                frameCount: 4
                interpolate: false
                duration: 400
                animationDirection: SpriteSequence3D.Alternate
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
                interpolate: false
                duration: 400
                animationDirection: SpriteSequence3D.AlternateReverse
            }
        }
        Cell {
            x: 150
            y: 75
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            kind.alignMode: Particle3D.AlignTowardsTarget
            kind.alignTargetPosition: Qt.vector3d(100, 100, 100)
        }
        Cell {
            x: -150
            y: -75
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            kind.alignMode: Particle3D.AlignTowardsStartVelocity
            emitter.velocity: VectorDirection3D {
                direction: Qt.vector3d(20, 10, 20)
            }
        }
        Cell {
            x: -50
            y: -75
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            kind.billboard: true
            kind.alignMode: Particle3D.AlignTowardsTarget
            kind.alignTargetPosition: Qt.vector3d(100, 100, 100)
            emitter.particleRotation: Qt.vector3d(0, 0, 30)
        }
        Cell {
            x: 50
            y: -75
            kind.color: "#ff0000"
            kind.fadeInDuration: 500
            emitter.reversed: true
            emitter.velocity: VectorDirection3D {
                direction: Qt.vector3d(0, 40, 0)
            }
        }
        Cell {
            x: 150
            y: -75
            kind.color: "#ff0000"
            kind.fadeInDuration: 500
            kind.fadeInEffect: Particle3D.FadeScale
            emitter.particleEndScale: 20
        }
    }

    property var acts: [
        function () { root.t = 50 },
        function () { root.t = 375 },
        function () { root.t = 625 },
        function () { root.t = 990 }
    ]

    function act(index) {
        acts[index]()
    }
}
