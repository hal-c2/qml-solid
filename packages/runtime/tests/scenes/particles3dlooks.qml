// Particles whose time a test moves, and what each looks like then: where
// it is, how big, how it is turned and of what colour. Nothing varies, so
// that every answer is the same every time: one particle of each kind,
// from a burst at the start.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

    component Kind: ModelParticle3D {
        maxAmount: 10
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
    component One: ParticleEmitter3D {
        lifeSpan: 1000
        emitBursts: EmitBurst3D {
            amount: 1
        }
    }

    View3D {
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        // One that lives half a second, and is there or not at its end.
        Stopped {
            Kind {
                id: brief
            }
            One {
                particle: brief
                lifeSpan: 500
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(30, 40, -50)
                }
            }
        }

        // One that grows, and turns as it goes.
        Stopped {
            Kind {
                id: grown
            }
            One {
                particle: grown
                particleScale: 2
                particleEndScale: 6
                particleRotation: Qt.vector3d(10, 20, 30)
                particleRotationVelocity: Qt.vector3d(90, 0, 45)
            }
        }

        // One of a colour, that fades in and out.
        Stopped {
            Kind {
                id: faded
                color: "#804020"
                fadeInDuration: 200
                fadeOutDuration: 400
            }
            One {
                particle: faded
            }
        }

        // One that grows in and shrinks out instead, and one that does
        // neither whatever the durations.
        Stopped {
            Kind {
                id: shrunk
                color: "#80ff0000"
                fadeInEffect: Particle3D.FadeScale
                fadeOutEffect: Particle3D.FadeScale
                fadeInDuration: 200
                fadeOutDuration: 400
            }
            One {
                particle: shrunk
                particleScale: 3
            }
            Kind {
                id: plain
                fadeInEffect: Particle3D.FadeNone
                fadeOutEffect: Particle3D.FadeNone
                fadeInDuration: 200
                fadeOutDuration: 400
            }
            One {
                particle: plain
            }
        }

        // One whose life goes backwards.
        Stopped {
            Kind {
                id: back
                fadeInDuration: 200
                fadeOutDuration: 400
            }
            One {
                particle: back
                reversed: true
                particleScale: 2
                particleEndScale: 6
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
            }
        }

        // One that looks at a place, and one that looks where it set out
        // for.
        Stopped {
            Kind {
                id: aimed
                alignMode: Particle3D.AlignTowardsTarget
                alignTargetPosition: Qt.vector3d(100, 100, 0)
            }
            One {
                particle: aimed
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
            }
            Kind {
                id: ahead
                alignMode: Particle3D.AlignTowardsStartVelocity
            }
            One {
                particle: ahead
                particleRotation: Qt.vector3d(0, 0, 45)
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 50, 20)
                }
            }
        }

        // An emitter that is somewhere in a system that is somewhere, and
        // turned in it: where its particle is, is said in the system.
        Stopped {
            x: 40
            eulerRotation.z: 30

            Kind {
                id: placed
            }
            One {
                particle: placed
                x: 50
                y: 20
                eulerRotation.z: 90
                scale: Qt.vector3d(2, 2, 2)
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
            }
            // And one in a node that is.
            Node {
                x: -50
                eulerRotation.y: 90

                Kind {
                    id: nested
                }
                One {
                    particle: nested
                    z: 10
                    velocity: VectorDirection3D {
                        direction: Qt.vector3d(0, 0, 100)
                    }
                }
            }
        }

        // Ways to say which way.
        Stopped {
            Kind {
                id: unit
            }
            One {
                particle: unit
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(30, 40, 0)
                    normalized: true
                }
            }
            Kind {
                id: towards
            }
            One {
                particle: towards
                x: 100
                velocity: TargetDirection3D {
                    position: Qt.vector3d(100, 200, 0)
                    magnitude: 0.5
                }
            }
            Kind {
                id: straight
            }
            One {
                particle: straight
                x: 100
                velocity: TargetDirection3D {
                    position: Qt.vector3d(400, 400, 0)
                    normalized: true
                    magnitude: 50
                }
            }
        }

        // Many at once, from a shape that has no room: all at one place.
        Stopped {
            Kind {
                id: shaped
            }
            ParticleEmitter3D {
                particle: shaped
                emitRate: 4
                lifeSpan: 600
                shape: ParticleShape3D {
                    type: ParticleShape3D.Sphere
                    extents: Qt.vector3d(0, 0, 0)
                }
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, -100, 0)
                }
            }
        }
    }

    function near(value) {
        return Math.round(value * 1000) / 1000
    }

    // What there is of a kind: a table has a size for each, and none for
    // what is past the last.
    function seen(kind) {
        var found = []
        var table = kind.instanceTable
        for (var index = 0; index < 12; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                break
            var at = table.instancePosition(index)
            var turn = table.instanceRotation(index)
            var tint = table.instanceColor(index)
            found.push({
                "at": [near(at.x), near(at.y), near(at.z)],
                "size": [near(size.x), near(size.y), near(size.z)],
                "turn": [near(turn.scalar), near(turn.x), near(turn.y), near(turn.z)],
                "tint": [near(tint.r), near(tint.g), near(tint.b), near(tint.a)]
            })
        }
        return found
    }

    property var acts: [
        function () { root.t = 100 },
        function () { root.t = 250 },
        function () { root.t = 499 },
        function () { root.t = 500 },
        function () { root.t = 501 },
        function () { root.t = 800 },
        function () { root.t = 999 },
        function () { root.t = 1000 },
        function () { root.t = 1001 },
        function () { root.t = 1250 },
        function () { root.t = 300 },
        function () { root.t = 0 },
        function () { root.t = 50 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "brief": seen(brief),
            "grown": seen(grown),
            "faded": seen(faded),
            "shrunk": seen(shrunk),
            "plain": seen(plain),
            "back": seen(back),
            "aimed": seen(aimed),
            "ahead": seen(ahead),
            "placed": seen(placed),
            "nested": seen(nested),
            "unit": seen(unit),
            "towards": seen(towards),
            "straight": seen(straight),
            "shaped": seen(shaped)
        }
    }
}
