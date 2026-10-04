// How heavy Qt's physics makes a body, read off how it moves when pushed
// where nothing pulls: from a density and the shapes' sizes, the scale they
// have in the scene, a mass, or how hard the body is to turn.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 15
    property var bodies: ({})
    readonly property var all: [early, earlyDense, box, dense, heavy, capsule, scaled, ball, capsuleScaled, offset, tensor, matrix, two, forced, pushedAt, forcedAt, sent, light]

    PhysicsWorld {
        scene: view.scene
        gravity: Qt.vector3d(0, 0, 0)
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            root.frames++
            if (root.frames === 3)
                root.push()
            if (root.frames === 15)
                root.bodies = root.places()
        }
    }

    function push() {
        box.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        box.applyTorqueImpulse(Qt.vector3d(0, 0, 1000000))
        dense.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        heavy.applyCentralImpulse(Qt.vector3d(100, 0, 0))
        capsule.applyCentralImpulse(Qt.vector3d(10000, 0, 0))
        scaled.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        ball.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        capsuleScaled.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        offset.applyTorqueImpulse(Qt.vector3d(0, 0, 10000000))
        tensor.applyCentralImpulse(Qt.vector3d(100, 0, 0))
        tensor.applyTorqueImpulse(Qt.vector3d(0, 0, 4000))
        matrix.applyTorqueImpulse(Qt.vector3d(4000, 0, 0))
        two.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        forced.applyCentralForce(Qt.vector3d(10000000, 0, 0))
        forced.applyTorque(Qt.vector3d(0, 100000000, 0))
        pushedAt.applyImpulse(Qt.vector3d(100000, 0, 0), Qt.vector3d(0, 50, 14000))
        forcedAt.applyForce(Qt.vector3d(10000000, 0, 0), Qt.vector3d(0, 50, 15000))
        sent.setLinearVelocity(Qt.vector3d(50, 0, 0))
        sent.setAngularVelocity(Qt.vector3d(0, 1, 0))
        light.applyCentralImpulse(Qt.vector3d(100, 0, 0))
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        // Pushed before the world has it.
        DynamicRigidBody {
            id: early
            objectName: "early"
            collisionShapes: BoxShape {}
            Component.onCompleted: applyCentralImpulse(Qt.vector3d(100, 0, 0))
        }

        DynamicRigidBody {
            id: earlyDense
            objectName: "earlyDense"
            z: 1000
            massMode: DynamicRigidBody.CustomDensity
            density: 0.002
            collisionShapes: BoxShape {}
            Component.onCompleted: applyCentralImpulse(Qt.vector3d(100000, 0, 0))
        }

        DynamicRigidBody {
            id: box
            objectName: "box"
            z: 2000
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: dense
            objectName: "dense"
            z: 3000
            massMode: DynamicRigidBody.CustomDensity
            density: 0.002
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 50, 20)
            }
        }

        DynamicRigidBody {
            id: heavy
            objectName: "heavy"
            z: 4000
            massMode: DynamicRigidBody.Mass
            mass: 5
            collisionShapes: SphereShape {}
        }

        DynamicRigidBody {
            id: capsule
            objectName: "capsule"
            z: 5000
            collisionShapes: CapsuleShape {
                diameter: 40
                height: 60
            }
        }

        DynamicRigidBody {
            id: scaled
            objectName: "scaled"
            z: 6000
            scale: Qt.vector3d(2, 1, 1)
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: ball
            objectName: "ball"
            z: 7000
            scale: Qt.vector3d(2, 3, 4)
            collisionShapes: SphereShape {}
        }

        DynamicRigidBody {
            id: capsuleScaled
            objectName: "capsuleScaled"
            z: 8000
            scale: Qt.vector3d(2, 3, 1)
            collisionShapes: CapsuleShape {
                diameter: 40
                height: 60
            }
        }

        // Its shape is off its middle: it turns about the shape's.
        DynamicRigidBody {
            id: offset
            objectName: "offset"
            z: 9000
            scale: Qt.vector3d(2, 1, 1)
            collisionShapes: BoxShape {
                position: Qt.vector3d(100, 0, 0)
                scale: Qt.vector3d(1, 2, 1)
            }
        }

        DynamicRigidBody {
            id: tensor
            objectName: "tensor"
            z: 10000
            massMode: DynamicRigidBody.MassAndInertiaTensor
            mass: 2
            inertiaTensor: Qt.vector3d(1000, 2000, 4000)
            collisionShapes: SphereShape {}
        }

        DynamicRigidBody {
            id: matrix
            objectName: "matrix"
            z: 11000
            massMode: DynamicRigidBody.MassAndInertiaMatrix
            mass: 2
            inertiaMatrix: [2000, 500, 0, 500, 3000, 0, 0, 0, 4000]
            collisionShapes: SphereShape {}
        }

        DynamicRigidBody {
            id: two
            objectName: "two"
            z: 12000
            collisionShapes: [
                BoxShape {},
                SphereShape {
                    x: 100
                }
            ]
        }

        DynamicRigidBody {
            id: forced
            objectName: "forced"
            z: 13000
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: pushedAt
            objectName: "pushedAt"
            z: 14000
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: forcedAt
            objectName: "forcedAt"
            z: 15000
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: sent
            objectName: "sent"
            z: 16000
            collisionShapes: BoxShape {}
        }

        // A mass below nothing is not taken.
        DynamicRigidBody {
            id: light
            objectName: "light"
            z: 17000
            massMode: DynamicRigidBody.Mass
            mass: 4
            collisionShapes: BoxShape {}
            Component.onCompleted: mass = -2
        }
    }

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function places() {
        const bodies = {}
        for (const body of all) {
            const p = body.position
            const q = body.rotation
            bodies[body.objectName] = [round(p.x), round(p.y), round(p.z), round(q.scalar), round(q.x), round(q.y), round(q.z)]
        }
        return bodies
    }

    function read() {
        return {
            frames: frames,
            bodies: bodies,
            masses: [early.mass, dense.mass, heavy.mass, light.mass, dense.density],
            parent: [box.collisionShapes[0].parent === box, two.collisionShapes.length]
        }
    }
}
