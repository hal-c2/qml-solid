import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias painter: painter
    property alias stream: stream
    property int emitted: 0

    ParticleSystem {
        id: system
        anchors.fill: parent
        ImageParticle { id: painter; source: "../../assets/white.png"; entryEffect: ImageParticle.None }
        Emitter {
            id: stream
            x: 100; y: 50
            emitRate: 10; lifeSpan: 1000
            size: 20; endSize: 40
            velocity: PointDirection { x: 100 }
            acceleration: PointDirection { y: 200 }
            onEmitParticles: (particles) => root.emitted += particles.length
        }
    }
}
