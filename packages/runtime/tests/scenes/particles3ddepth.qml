// Sprites moved aside by so many times their own size; sprites before and
// behind models, which hide them and are not hidden by them where they are
// nearer; and two systems one before the other.
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
            clearColor: "black"
        }

        OrthographicCamera {
            z: 500
        }

        Cell { x: -150; y: 75; emitter.particleScale: 4; kind.particleScale: 10; kind.offsetX: 1 }
        Cell { x: -50; y: 75; emitter.particleRotation: Qt.vector3d(0, 0, 90); kind.offsetX: 1 }
        Cell { x: 50; y: 75; kind.billboard: true; kind.offsetX: 1; kind.offsetY: 0.5 }
        Cell { x: 150; y: 75; kind.billboard: true; emitter.particleRotation: Qt.vector3d(0, 0, 90); kind.offsetX: 1 }
        Cell {
            x: -150
            y: -75
            Model {
                source: "#Cube"
                z: 100
                scale: Qt.vector3d(0.2, 0.2, 0.2)
                materials: DefaultMaterial {
                    diffuseColor: "blue"
                    lighting: DefaultMaterial.NoLighting
                }
            }
        }
        Cell {
            x: -50
            y: -75
            Model {
                source: "#Cube"
                z: -100
                scale: Qt.vector3d(0.7, 0.7, 0.7)
                materials: DefaultMaterial {
                    diffuseColor: "blue"
                    lighting: DefaultMaterial.NoLighting
                }
            }
        }
        Cell {
            x: 50
            y: -75
            Model {
                source: "#Cube"
                z: 100
                scale: Qt.vector3d(0.2, 0.2, 0.2)
                opacity: 0.5
                materials: DefaultMaterial {
                    diffuseColor: "blue"
                    lighting: DefaultMaterial.NoLighting
                }
            }
        }
        Cell { x: 140; y: -75; z: 50 }
        Cell { x: 160; y: -65; kind.color: "#0000ff" }
    }
}
