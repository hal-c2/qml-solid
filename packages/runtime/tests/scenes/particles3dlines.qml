// Lines, a time set at each step: of one piece; of four with a picture
// along them; narrower and fainter towards the end; of a length; facing
// the eye and lying in a system that is turned; bent by gravity; and one
// that is still to be seen for a while after its particle is gone.
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
        property alias kind: line
        property alias emitter: emitter
        property alias way: way
        running: false
        time: root.t

        LineParticle3D {
            id: line
            color: "#ffffff"
            fadeInDuration: 0
            fadeOutDuration: 0
            maxAmount: 4
            particleScale: 10
        }
        ParticleEmitter3D {
            id: emitter
            particle: line
            x: -35
            lifeSpan: 1000
            velocity: VectorDirection3D {
                id: way
                direction: Qt.vector3d(80, 0, 0)
            }
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
        }
        Cell {
            x: -50
            y: 75
            kind.segmentCount: 4
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: 50
            y: 75
            kind.segmentCount: 4
            kind.alphaFade: 0.3
            kind.scaleMultiplier: 0.7
            kind.particleScale: 30
        }
        Cell {
            x: 150
            y: 75
            kind.segmentCount: 8
            kind.length: 30
            kind.texcoordMode: LineParticle3D.Fill
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
        }
        Cell {
            x: -150
            y: -75
            eulerRotation.x: 50
            kind.segmentCount: 4
            kind.billboard: true
            way.direction: Qt.vector3d(80, 30, 0)
        }
        Cell {
            x: -50
            y: -75
            eulerRotation.x: 50
            kind.segmentCount: 4
            emitter.particleRotation: Qt.vector3d(30, 0, 0)
            way.direction: Qt.vector3d(80, 30, 0)
        }
        Cell {
            x: 50
            y: -75
            kind.segmentCount: 3
            kind.texcoordMode: LineParticle3D.Relative
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            way.direction: Qt.vector3d(80, 60, 0)

            Gravity3D {
                magnitude: 200
                direction: Qt.vector3d(0, -1, 0)
            }
        }
        Cell {
            x: 150
            y: -75
            kind.segmentCount: 4
            kind.color: "#ff0000"
            kind.eolFadeOutDuration: 400
            emitter.lifeSpan: 500
        }
    }

    property var acts: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800].map(function (time) {
        return function () { root.t = time }
    })

    function act(index) {
        acts[index]()
    }
}
