// Systems whose time goes by itself, as a test lets time pass and pauses,
// stops and starts one. How much time went by is not the same twice, so
// what is read does not tell it: only which way the time went since it was
// last read, and whether what there is, is what that time gives.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300

    component Kind: ModelParticle3D {
        maxAmount: 200
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

    View3D {
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#000000"
        }

        OrthographicCamera {
            id: camera
            z: 500
        }

        // Twenty a second, for as long as the time goes.
        ParticleSystem3D {
            id: going

            Kind {
                id: steady
            }
            ParticleEmitter3D {
                particle: steady
                emitRate: 20
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, 100, 0)
                }
            }
        }

        // One of each from the start, going right at 100 a second: where
        // they are drawn is how long the system has been going.
        ParticleSystem3D {
            y: -100

            Kind {
                id: block
                delegate: Model {
                    source: "#Cube"
                    scale: Qt.vector3d(0.2, 0.2, 0.2)
                    materials: DefaultMaterial {
                        lighting: DefaultMaterial.NoLighting
                    }
                }
            }
            ParticleEmitter3D {
                particle: block
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
            SpriteParticle3D {
                id: spot
                maxAmount: 4
                color: "#ff0000"
                fadeInDuration: 0
                fadeOutDuration: 0
            }
            ParticleEmitter3D {
                particle: spot
                y: 50
                particleScale: 10
                lifeSpan: 20000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(100, 0, 0)
                }
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
        }
    }

    // How many there are of a kind: a table has a size for each, and none
    // for what is past the last.
    function count(kind) {
        var table = kind.instanceTable
        for (var index = 0; index < 200; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                return index
        }
        return 200
    }

    property var acts: [
        function () {},
        function () { going.paused = true },
        function () {},
        function () { going.paused = false },
        function () { going.running = false },
        function () {},
        function () { going.running = true },
        function () {},
        function () { going.paused = true },
        function () { going.running = false },
        function () { going.paused = true },
        function () { going.running = true }
    ]

    function act(index) {
        acts[index]()
    }

    property int before: 0

    function read() {
        var now = going.time
        var said = {
            "running": going.running,
            "paused": going.paused,
            "went": now > before ? "on" : now < before ? "back" : "nowhere",
            "emitted": Math.abs(count(steady) - now * 20 / 1000) <= 1.5
        }
        before = now
        return said
    }
}
