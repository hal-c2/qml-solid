// What the order things are declared in decides, and what an emitter
// starts from, as a test moves the time. Read as in particles3dtrails.qml:
// where each particle of a kind is.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

    component Kind: ModelParticle3D {
        maxAmount: 40
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
    component Led: ParticleEmitter3D {
        emitRate: 2
        lifeSpan: 800
        velocity: VectorDirection3D {
            direction: Qt.vector3d(100, 0, 0)
        }
    }
    component Trail: TrailEmitter3D {
        lifeSpan: 20000
        velocity: VectorDirection3D {
            direction: Qt.vector3d(0, 100, 0)
        }
    }

    View3D {
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        // Two emitters of one kind, each with a burst: the last declared
        // emits first, and the other empties the kind before its own.
        Stopped {
            Kind {
                id: shared
            }
            ParticleEmitter3D {
                particle: shared
                emitRate: 5
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
            ParticleEmitter3D {
                particle: shared
                emitRate: 5
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, 100, 0)
                }
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
        }

        // Two affectors: the last declared does its work first.
        Stopped {
            Kind {
                id: gr
            }
            ParticleEmitter3D {
                particle: gr
                lifeSpan: 20000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
            Gravity3D {}
            PointRotator3D {
                magnitude: 90
                direction: Qt.vector3d(0, 0, 1)
                pivotPoint: Qt.vector3d(50, 0, 0)
            }
        }
        Stopped {
            Kind {
                id: rg
            }
            ParticleEmitter3D {
                particle: rg
                lifeSpan: 20000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
            PointRotator3D {
                magnitude: 90
                direction: Qt.vector3d(0, 0, 1)
                pivotPoint: Qt.vector3d(50, 0, 0)
            }
            Gravity3D {}
        }

        // What is emitted where another is, is there to see at once when
        // the emitter that follows is declared before the one followed,
        // and from the next time on when it is declared after it.
        Stopped {
            Kind {
                id: led1
            }
            Kind {
                id: trail1
            }
            Led {
                particle: led1
            }
            Trail {
                particle: trail1
                follow: led1
                emitRate: 5
            }
        }
        Stopped {
            Kind {
                id: led2
            }
            Kind {
                id: trail2
            }
            Trail {
                particle: trail2
                follow: led2
                emitRate: 5
            }
            Led {
                particle: led2
            }
        }

        // A rate that was nought: it counts from when it is something.
        Stopped {
            Kind {
                id: roused
            }
            ParticleEmitter3D {
                id: rouser
                particle: roused
                emitRate: 0
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, 100, 0)
                }
            }
        }

        // Bursts come when the time does whatever the system's start time
        // is, and whatever they are said to be triggered by.
        Stopped {
            startTime: 300
            Kind {
                id: shifted
            }
            ParticleEmitter3D {
                particle: shifted
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, 100, 0)
                }
                DynamicBurst3D {
                    time: 500
                    amount: 1
                }
                DynamicBurst3D {
                    time: 1000
                    amount: 2
                    triggerMode: DynamicBurst3D.TriggerEnd
                }
            }
        }
    }

    function near(value) {
        return Math.round(value * 100) / 100
    }

    // Where what there is of a kind is: a table has a size for each, and
    // none for what is past the last.
    function places(kind) {
        var found = []
        var table = kind.instanceTable
        for (var index = 0; index < 45; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                break
            var at = table.instancePosition(index)
            found.push([near(at.x), near(at.y)])
        }
        return found
    }

    property var acts: [
        function () { root.t = 400 },
        function () { root.t = 600 },
        function () { rouser.emitRate = 10 },
        function () { root.t = 1000 },
        function () { root.t = 1100 },
        function () { root.t = 1500 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "shared": places(shared),
            "gr": places(gr),
            "rg": places(rg),
            "trail1": places(trail1),
            "trail2": places(trail2),
            "roused": places(roused),
            "shifted": places(shifted)
        }
    }
}
