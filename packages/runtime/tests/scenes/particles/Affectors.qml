import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias fall: fall
    property alias drop: drop
    property alias slow: slow
    property alias aged: aged
    property alias wander: wander
    property alias pull: pull
    property alias custom: custom
    property alias push: push
    property alias swirl: swirl
    property int hits: 0
    property int calls: 0

    component Burst: Emitter { enabled: false; lifeSpan: 5000 }

    ParticleSystem {
        id: system
        anchors.fill: parent

        Burst { id: fall; group: "fall"; x: 20; y: 20 }
        Gravity { groups: ["fall"]; magnitude: 100; angle: 90 }

        Burst { id: drop; group: "drop"; x: 40; y: 20 }
        Gravity { groups: ["drop"]; magnitude: 100; angle: 90; once: true; onAffected: (x, y) => root.hits++ }

        Burst { id: slow; group: "slow"; x: 60; y: 20; velocity: PointDirection { x: 100 } }
        Friction { groups: ["slow"]; factor: 2 }

        Burst { id: aged; group: "aged"; x: 150; y: 100; velocity: PointDirection { x: 100 } }
        Age { groups: ["aged"]; x: 200; width: 100; height: 300; lifeLeft: 100; advancePosition: false }

        Burst { id: wander; group: "wander"; x: 100; y: 200 }
        Wander { groups: ["wander"]; xVariance: 50; pace: 100 }

        Burst { id: pull; group: "pull"; x: 100; y: 250 }
        Attractor {
            groups: ["pull"]
            pointX: 200; pointY: 250; strength: 2
            affectedParameter: Attractor.Position; proportionalToDistance: Attractor.Constant
        }

        Burst { id: custom; group: "custom"; x: 300; y: 20 }
        Affector {
            groups: ["custom"]
            onAffectParticles: (particles, dt) => {
                root.calls++
                for (var i = 0; i < particles.length; i++) {
                    particles[i].vx = 40
                    particles[i].red = 0.5
                }
            }
        }

        Burst { id: push; group: "push"; x: 300; y: 60 }
        Affector { groups: ["push"]; relative: false; velocity: PointDirection { x: 10; y: -5 } }

        Burst { id: swirl; group: "swirl"; x: 300; y: 200; width: 50; height: 50 }
        Turbulence { groups: ["swirl"]; x: 250; y: 150; width: 150; height: 150; strength: 100 }
    }
}
