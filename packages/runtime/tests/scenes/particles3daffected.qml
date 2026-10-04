// Particles that something in their system does something to, and where
// each is as a test moves the time. Nothing varies: one particle of each
// kind, from a burst at the start, going right at 100 a second.
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
        lifeSpan: 2000
        velocity: VectorDirection3D {
            direction: Qt.vector3d(100, 0, 0)
        }
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

        // Falling, as things do, and falling some other way.
        Stopped {
            Kind {
                id: fallen
            }
            One {
                particle: fallen
            }
            Gravity3D {}
        }
        Stopped {
            Kind {
                id: pulled
            }
            One {
                particle: pulled
            }
            Gravity3D {
                magnitude: 50
                direction: Qt.vector3d(3, 4, 0)
            }
        }

        // Only what an affector is for, and nothing when it is not enabled.
        Stopped {
            Kind {
                id: chosen
            }
            One {
                particle: chosen
            }
            Kind {
                id: spared
            }
            One {
                particle: spared
            }
            Kind {
                id: twice
            }
            One {
                particle: twice
            }
            Gravity3D {
                particles: [chosen, twice]
            }
            Gravity3D {
                id: off
                enabled: false
                magnitude: 1000
            }
            Gravity3D {
                particles: twice
                magnitude: 40
                direction: Qt.vector3d(0, 0, 1)
            }
        }

        // Drawn to a place by the end of its life, and by a time before
        // it: there from then on, or gone.
        Stopped {
            Kind {
                id: drawn
            }
            One {
                particle: drawn
            }
            Attractor3D {
                particles: drawn
                x: 50
                y: 100
                z: -20
            }
            Kind {
                id: sooner
            }
            One {
                particle: sooner
            }
            Attractor3D {
                particles: sooner
                y: 100
                duration: 500
            }
            Kind {
                id: hidden
            }
            One {
                particle: hidden
            }
            Attractor3D {
                particles: hidden
                y: 100
                duration: 500
                hideAtEnd: true
            }
        }

        // Turned about a point.
        Stopped {
            Kind {
                id: turned
            }
            One {
                particle: turned
            }
            PointRotator3D {
                particles: turned
                magnitude: 90
                direction: Qt.vector3d(0, 0, 1)
                pivotPoint: Qt.vector3d(0, 50, 0)
            }
            Kind {
                id: swung
            }
            One {
                particle: swung
            }
            PointRotator3D {
                particles: swung
                magnitude: 45
                direction: Qt.vector3d(1, 1, 0)
            }
        }

        // Swaying, all as one.
        Stopped {
            Kind {
                id: swayed
            }
            One {
                particle: swayed
            }
            Wander3D {
                particles: swayed
                globalAmount: Qt.vector3d(10, 20, 30)
                globalPace: Qt.vector3d(1, 0.5, 0.25)
                globalPaceStart: Qt.vector3d(0, 0.25, 0.5)
            }
            Kind {
                id: eased
            }
            One {
                particle: eased
            }
            Wander3D {
                particles: eased
                globalAmount: Qt.vector3d(0, 40, 0)
                globalPace: Qt.vector3d(0, 0.5, 0)
                fadeInDuration: 400
                fadeOutDuration: 800
            }
        }

        // Pushed away from a place.
        Stopped {
            Kind {
                id: pushed
            }
            One {
                particle: pushed
            }
            Repeller3D {
                x: 60
                y: -10
                radius: 5
                outerRadius: 80
                strength: 30
            }
        }

        // Made bigger and smaller.
        Stopped {
            Kind {
                id: linear
            }
            One {
                particle: linear
                particleScale: 2
            }
            ScaleAffector3D {
                particles: linear
                minSize: 1
                maxSize: 3
                duration: 400
            }
            Kind {
                id: saw
            }
            One {
                particle: saw
            }
            ScaleAffector3D {
                particles: saw
                type: ScaleAffector3D.SewSaw
                minSize: 1
                maxSize: 3
                duration: 400
            }
            Kind {
                id: sine
            }
            One {
                particle: sine
            }
            ScaleAffector3D {
                particles: sine
                type: ScaleAffector3D.SineWave
                minSize: 1
                maxSize: 3
                duration: 400
            }
            Kind {
                id: bounce
            }
            One {
                particle: bounce
            }
            ScaleAffector3D {
                particles: bounce
                type: ScaleAffector3D.AbsSineWave
                minSize: 1
                maxSize: 3
                duration: 400
            }
            Kind {
                id: step
            }
            One {
                particle: step
            }
            ScaleAffector3D {
                particles: step
                type: ScaleAffector3D.Step
                minSize: 1
                maxSize: 3
                duration: 400
            }
            Kind {
                id: smooth
            }
            One {
                particle: smooth
            }
            ScaleAffector3D {
                particles: smooth
                type: ScaleAffector3D.SmoothStep
                minSize: 1
                maxSize: 3
                duration: 400
            }
        }

        // An affector that is elsewhere and names its system, and one that
        // is turned in it.
        Stopped {
            id: named

            Kind {
                id: far
            }
            One {
                particle: far
            }
            Kind {
                id: tilted
            }
            One {
                particle: tilted
            }
            Gravity3D {
                particles: tilted
                eulerRotation.z: 90
            }
        }
        Gravity3D {
            system: named
            particles: far
            magnitude: 60
        }
    }

    function near(value) {
        return Math.round(value * 1000) / 1000
    }

    // Where what there is of a kind is, and how big: a table has a size
    // for each, and none for what is past the last.
    function seen(kind) {
        var found = []
        var table = kind.instanceTable
        for (var index = 0; index < 12; index++) {
            var size = table.instanceScale(index)
            if (size.x === 0 && size.y === 0)
                break
            var at = table.instancePosition(index)
            found.push([near(at.x), near(at.y), near(at.z), near(size.x)])
        }
        return found
    }

    property var acts: [
        function () { root.t = 100 },
        function () { root.t = 300 },
        function () { root.t = 500 },
        function () { root.t = 600 },
        function () { root.t = 1000 },
        function () { off.enabled = true },
        function () { root.t = 1100 },
        function () { off.enabled = false },
        function () { root.t = 1500 },
        function () { root.t = 2000 },
        function () { root.t = 700 },
        function () { root.t = 0 },
        function () { root.t = 200 }
    ]

    function act(index) {
        acts[index]()
    }

    function read() {
        return {
            "fallen": seen(fallen),
            "pulled": seen(pulled),
            "chosen": seen(chosen),
            "spared": seen(spared),
            "twice": seen(twice),
            "drawn": seen(drawn),
            "sooner": seen(sooner),
            "hidden": seen(hidden),
            "turned": seen(turned),
            "swung": seen(swung),
            "swayed": seen(swayed),
            "eased": seen(eased),
            "pushed": seen(pushed),
            "linear": seen(linear),
            "saw": seen(saw),
            "sine": seen(sine),
            "bounce": seen(bounce),
            "step": seen(step),
            "smooth": seen(smooth),
            "far": seen(far),
            "tilted": seen(tilted)
        }
    }
}
