import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias items: items
    property alias carrier: carrier
    property alias leader: leader
    property alias trail: trail
    property int attached: 0
    property int detached: 0
    property int followed: 0

    ParticleSystem {
        id: system
        anchors.fill: parent
        ItemParticle {
            id: items
            groups: ["item"]
            delegate: Rectangle {
                width: 10; height: 20; color: "blue"
                property bool mine: ItemParticle.particle === items
                ItemParticle.onAttached: root.attached++
                ItemParticle.onDetached: root.detached++
            }
        }
        Emitter {
            id: carrier
            x: 100; y: 100
            group: "item"; enabled: false; lifeSpan: 1000
            velocity: PointDirection { x: 100 }
        }
        Emitter {
            id: leader
            x: 50; y: 200
            group: "lead"; enabled: false; lifeSpan: 2000
            velocity: PointDirection { x: 100 }
        }
        TrailEmitter {
            id: trail
            follow: "lead"; group: "trail"
            emitRatePerParticle: 10; lifeSpan: 200; size: 4
            onEmitFollowParticles: (particles, followed) => root.followed += particles.length
        }
    }
}
