import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias sparks: sparks
    property alias burster: burster
    property alias old: old
    property alias late: late
    property alias lateEmitter: lateEmitter

    ParticleSystem {
        id: system
        anchors.fill: parent
        ImageParticle { id: sparks; groups: ["spark"]; source: "../../assets/white.png"; entryEffect: ImageParticle.None }
        Emitter {
            id: burster
            x: 50; y: 50
            group: "spark"; enabled: false
            emitRate: 1000; lifeSpan: 500; maximumEmitted: 30; size: 10
        }
        Emitter { id: old; group: "old"; enabled: false; startTime: 950; emitRate: 10; lifeSpan: 1000 }
    }
    // Told their system later, as a game does that makes its pieces first.
    ImageParticle {
        id: late
        groups: ["late"]
        source: "../../assets/white.png"; color: "red"; entryEffect: ImageParticle.None
    }
    Emitter { id: lateEmitter; x: 300; y: 200; group: "late"; emitRate: 100; lifeSpan: 1000; size: 10 }
}
