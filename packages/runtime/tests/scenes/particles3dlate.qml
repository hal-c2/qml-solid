// Particle systems whose time is something from the start: what each has
// emitted when a test moves it on and back, read as in particles3d.qml.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 1100

    component Kind: ModelParticle3D {
        maxAmount: 50
        fadeInDuration: 0
        fadeOutDuration: 0
        delegate: Model {
            source: "#Cube"
            scale: Qt.vector3d(0.1, 0.1, 0.1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
            }
        }
    }
    component Stopped: ParticleSystem3D {
        running: false
        time: root.t
    }
    component Up: VectorDirection3D {
        direction: Qt.vector3d(0, 100, 0)
    }

    View3D {
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        // So many a second.
        Stopped {
            Kind {
                id: steady
            }
            ParticleEmitter3D {
                particle: steady
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
        }

        // Bursts that are there from the start: before the time the system
        // begins at, and after it.
        Stopped {
            Kind {
                id: burst
            }
            ParticleEmitter3D {
                particle: burst
                lifeSpan: 20000
                velocity: Up {}
                emitBursts: [
                    EmitBurst3D {
                        amount: 1
                    },
                    EmitBurst3D {
                        time: 500
                        amount: 1
                    },
                    EmitBurst3D {
                        time: 1500
                        amount: 1
                    }
                ]
            }
        }

        // And bursts that come when the time does.
        Stopped {
            Kind {
                id: dynamic
            }
            ParticleEmitter3D {
                particle: dynamic
                lifeSpan: 20000
                velocity: Up {}

                DynamicBurst3D {
                    time: 500
                    amount: 2
                }
                DynamicBurst3D {
                    time: 1300
                    amount: 3
                }
            }
        }
    }

    function count(kind) {
        var table = kind.instanceTable
        for (var index = 0; index < 60; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                return index
        }
        return 60
    }

    function starts(kind, now) {
        var found = []
        for (var index = 0, all = count(kind); index < all; index++)
            found.push(Math.round(now - kind.instanceTable.instancePosition(index).y * 10))
        return found
    }

    property var acts: [
        function () { root.t = 1200 },
        function () { root.t = 1600 },
        function () { root.t = 400 },
        function () { root.t = 700 },
        function () { root.t = 1400 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "steady": starts(steady, root.t),
            "burst": starts(burst, root.t),
            "dynamic": starts(dynamic, root.t)
        }
    }
}
