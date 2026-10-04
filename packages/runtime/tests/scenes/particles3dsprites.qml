// Sprites, one to a system: what the eye faces and what lies in the scene,
// turned; one moved aside by its offsets; one that is half there, one that
// lightens what is behind it and one that darkens it; and a system that is
// half there itself.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300

    component Cell: ParticleSystem3D {
        id: cell
        property alias kind: sprite
        property alias emitter: emitter
        running: false
        time: 100

        SpriteParticle3D {
            id: sprite
            color: "#ff0000"
            fadeInDuration: 0
            fadeOutDuration: 0
            maxAmount: 4
        }
        ParticleEmitter3D {
            id: emitter
            particle: sprite
            particleScale: 10
            lifeSpan: 10000
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
            emitter.particleRotation: Qt.vector3d(0, 0, 30)
            kind.billboard: true
            kind.color: "#ffffff"
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: -50
            y: 75
            emitter.particleRotation: Qt.vector3d(40, 0, 30)
            kind.color: "#ffffff"
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: 50
            y: 75
            emitter.particleRotation: Qt.vector3d(40, 0, 30)
            kind.billboard: true
            kind.color: "#ffffff"
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell { x: 150; y: 75; kind.offsetX: 0.5; kind.offsetY: 0.25 }
        Cell { x: -150; y: -75; kind.color: "#80ff0000" }
        Cell { x: -50; y: -75; kind.color: "#80ff8000"; kind.blendMode: SpriteParticle3D.Screen }
        Cell { x: 50; y: -75; kind.color: "#80ff8000"; kind.blendMode: SpriteParticle3D.Multiply }
        Cell { x: 150; y: -75; opacity: 0.5 }
    }
}
