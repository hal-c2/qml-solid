// Rows of sprites that come one over the other, in the order they are in
// the table, the newest first and the oldest first, as the table fills and
// its places are taken again.
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
                source: "../assets/sheet.png"
            }
            spriteSequence: SpriteSequence3D {
                frameCount: 4
                interpolate: false
            }
        }
        ParticleEmitter3D {
            particle: sprite
            particleScale: 10
            lifeSpan: 1000
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

        Row { y: 120 }
        Row { y: 60; kind.sortMode: Particle3D.SortNewest }
        Row { y: 0; kind.sortMode: Particle3D.SortOldest }
        Row { y: -60; kind.maxAmount: 4; kind.sortMode: Particle3D.SortOldest }
        Row { y: -120; kind.maxAmount: 6; kind.sortMode: Particle3D.SortOldest }
    }

    property var acts: [
        function () { root.t = 1000 },
        function () { root.t = 1100 },
        function () { root.t = 1350 },
        function () { root.t = 1600 },
        function () { root.t = 1850 },
        function () { root.t = 2100 }
    ]

    function act(index) {
        acts[index]()
    }
}
