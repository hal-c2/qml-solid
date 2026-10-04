// Particles that are emitted where others are, as a test moves the time.
// Those followed go right at 100 a second and those that follow them up at
// 100 a second: one that is at x, y was emitted y × 10 ms ago, where the
// one it follows was x to the right.
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

        // So many a second for each there is.
        Stopped {
            Kind {
                id: led
            }
            Led {
                particle: led
            }
            Kind {
                id: steady
            }
            Trail {
                particle: steady
                follow: led
                emitRate: 5
            }
        }

        // Some when one starts, and some when one ends.
        Stopped {
            Kind {
                id: born
            }
            Led {
                particle: born
            }
            Kind {
                id: started
            }
            Trail {
                particle: started
                follow: born
                emitBursts: DynamicBurst3D {
                    triggerMode: DynamicBurst3D.TriggerStart
                    amount: 2
                }
            }
            Kind {
                id: ended
            }
            Trail {
                particle: ended
                follow: born
                emitBursts: DynamicBurst3D {
                    triggerMode: DynamicBurst3D.TriggerEnd
                    amount: 1
                }
            }
        }

        // Of a sprite a start and an end are each told once. The time the
        // bursts have is one the test does not come to.
        Stopped {
            SpriteParticle3D {
                id: lit
                maxAmount: 10
            }
            Led {
                particle: lit
            }
            Kind {
                id: lighted
            }
            Trail {
                particle: lighted
                follow: lit
                emitBursts: DynamicBurst3D {
                    triggerMode: DynamicBurst3D.TriggerStart
                    time: 9000
                    amount: 2
                }
            }
            Kind {
                id: out
            }
            Trail {
                particle: out
                follow: lit
                emitBursts: DynamicBurst3D {
                    triggerMode: DynamicBurst3D.TriggerEnd
                    time: 9000
                    amount: 1
                }
            }
        }

        // An emitter that is turned turns the way they set off, and where
        // it is is nothing to where they start.
        Stopped {
            Kind {
                id: straight
            }
            Led {
                particle: straight
            }
            Kind {
                id: aside
            }
            Trail {
                particle: aside
                follow: straight
                emitRate: 5
                x: 30
                eulerRotation.z: 90
            }
        }

        // Some at a time, and some when a program asks.
        Stopped {
            Kind {
                id: seen
            }
            Led {
                particle: seen
            }
            Kind {
                id: timed
            }
            Trail {
                particle: timed
                follow: seen
                emitBursts: DynamicBurst3D {
                    time: 1000
                    amount: 2
                }
            }
            Kind {
                id: asked
            }
            Trail {
                id: asker
                particle: asked
                follow: seen
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
        function () { root.t = 1000 },
        function () { asker.burst(2) },
        function () { root.t = 1100 },
        function () { root.t = 1500 },
        function () { root.t = 1900 },
        function () { root.t = 2000 },
        function () { root.t = 1200 },
        function () { root.t = 1400 },
        function () { root.t = 2600 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "led": places(led),
            "steady": places(steady),
            "started": places(started),
            "ended": places(ended),
            "lighted": places(lighted),
            "out": places(out),
            "aside": places(aside),
            "timed": places(timed),
            "asked": places(asked)
        }
    }
}
