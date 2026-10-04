// Particle systems whose time a test moves: what each has emitted by then.
// Every particle goes up at 100 a second from where its emitter is, so one
// that is at y started y × 10 ms before, and what a system has is read as
// the times its particles started at.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

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

        // A rate that does not divide the time, and lives shorter than it.
        Stopped {
            Kind {
                id: brief
            }
            ParticleEmitter3D {
                particle: brief
                emitRate: 7
                lifeSpan: 300
                velocity: Up {}
            }
        }

        // No more at once than there is room for.
        Stopped {
            Kind {
                id: few
                maxAmount: 4
            }
            ParticleEmitter3D {
                particle: few
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
        }

        // A burst that is there from the start and one that comes when the
        // time does.
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
                        time: 100
                        amount: 4
                        duration: 200
                    },
                    DynamicBurst3D {
                        time: 500
                        amount: 3
                    }
                ]
            }
        }

        // A burst that takes its time, declared in its emitter.
        Stopped {
            Kind {
                id: spread
            }
            ParticleEmitter3D {
                particle: spread
                lifeSpan: 20000
                velocity: Up {}

                DynamicBurst3D {
                    time: 500
                    amount: 4
                    duration: 400
                }
            }
        }

        // An emitter that is enabled later.
        Stopped {
            Kind {
                id: late
            }
            ParticleEmitter3D {
                id: lateEmitter
                enabled: false
                particle: late
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
        }

        // A time that starts later than nought.
        Stopped {
            id: shiftedSystem

            Kind {
                id: shifted
            }
            ParticleEmitter3D {
                particle: shifted
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
        }

        // Bursts a program asks for.
        Stopped {
            Kind {
                id: asked
            }
            ParticleEmitter3D {
                id: asker
                particle: asked
                lifeSpan: 20000
                velocity: Up {}
            }
        }

        // A system that is emptied.
        Stopped {
            id: emptiedSystem

            Kind {
                id: emptied
            }
            ParticleEmitter3D {
                particle: emptied
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
                emitBursts: EmitBurst3D {
                    time: 0
                    amount: 2
                }

                DynamicBurst3D {
                    time: 200
                    amount: 3
                }
            }
        }

        // An emitter that is in no system, and one that names its own from
        // outside it.
        Stopped {
            id: named
        }
        Node {
            Kind {
                id: nowhere
            }
            ParticleEmitter3D {
                particle: nowhere
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
            Kind {
                id: elsewhere
            }
            ParticleEmitter3D {
                system: named
                particle: elsewhere
                emitRate: 10
                lifeSpan: 20000
                velocity: Up {}
            }
        }
    }

    // The particles there are of a kind: a table has a size for each, and
    // none for what is past the last.
    function count(kind) {
        var table = kind.instanceTable
        for (var index = 0; index < 60; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                return index
        }
        return 60
    }

    // When each of them started.
    function starts(kind, now) {
        var found = []
        for (var index = 0, all = count(kind); index < all; index++)
            found.push(Math.round(now - kind.instanceTable.instancePosition(index).y * 10))
        return found
    }

    // What a test does, one thing after another, and what there is to see
    // when it has.
    property var acts: [
        function () { root.t = 1000 },
        function () { root.t = 300 },
        function () { root.t = 600 },
        function () { root.t = 1200 },
        function () { lateEmitter.enabled = true },
        function () { root.t = 1300 },
        function () { asker.burst(3) },
        function () { root.t = 1400 },
        function () { asker.burst(4, 200) },
        function () { shiftedSystem.startTime = 1000 },
        function () { root.t = 1500 },
        function () { root.t = 1600 },
        function () { emptiedSystem.reset() },
        function () { root.t = 1700 },
        function () { root.t = 1800 },
        function () { root.t = 0 },
        function () { root.t = 250 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "steady": starts(steady, root.t),
            "brief": starts(brief, root.t),
            "few": starts(few, root.t),
            "burst": starts(burst, root.t),
            "spread": starts(spread, root.t),
            "late": starts(late, root.t),
            "shifted": starts(shifted, root.t + shiftedSystem.startTime),
            "asked": starts(asked, root.t),
            "emptied": starts(emptied, root.t),
            "nowhere": starts(nowhere, root.t),
            "elsewhere": starts(elsewhere, root.t)
        }
    }
}
