// Rows of sprites that come one over the other, drawn the farthest first:
// going away from the eye and coming towards it, and in a system that is
// not where the scene begins.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

    component Row: ParticleSystem3D {
        id: row
        property alias kind: sprite
        property real away: 0
        running: false
        time: root.t
        x: -100

        SpriteParticle3D {
            id: sprite
            fadeInDuration: 0
            fadeOutDuration: 0
            maxAmount: 10
            sprite: Texture {
                source: "../assets/frame.png"
            }
        }
        ParticleEmitter3D {
            particle: sprite
            particleScale: 10
            lifeSpan: 10000
            emitRate: 4
            velocity: VectorDirection3D {
                direction: Qt.vector3d(100, 0, row.away)
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

        Row { y: 120; kind.sortMode: Particle3D.SortOldest }
        Row { x: 0; y: 60; kind.sortMode: Particle3D.SortDistance; away: 100 }
        Row { x: 0; y: 0; kind.sortMode: Particle3D.SortDistance; away: -100 }
        Row { y: -60; kind.sortMode: Particle3D.SortDistance; away: 100 }
        Row { x: 60; y: -120; kind.sortMode: Particle3D.SortDistance; away: -100 }
    }

    property var acts: [
        function () { root.t = 1000 },
        function () { root.t = 1100 }
    ]

    function act(index) {
        acts[index]()
    }
}
