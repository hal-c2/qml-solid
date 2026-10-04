// What moves a body other than falling: the `kinematic` properties of one
// a program moves, `reset`, a velocity, locks on its axes; and what stops
// one: `simulationEnabled`, `gravityEnabled`, a world that is not running.
// A body made while the world runs, and one inside a node that is turned
// and scaled.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 40
    property var seen: ({})
    property var late: null
    property int stopped: -1

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function place(body) {
        const p = body.position
        return [round(p.x), round(p.y), round(p.z)]
    }

    function turn(body) {
        const q = body.rotation
        return [round(q.scalar), round(q.x), round(q.y), round(q.z)]
    }

    function see(name, value) {
        if (!seen[name])
            seen[name] = []
        seen[name].push(value)
    }

    Component {
        id: maker
        DynamicRigidBody {
            x: 3000
            collisionShapes: SphereShape {
                diameter: 20
            }
        }
    }

    Timer {
        id: again
        interval: 200
        onTriggered: {
            root.stopped = root.frames
            world.running = true
        }
    }

    PhysicsWorld {
        id: world
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            const frame = ++root.frames
            if (frame <= 6) {
                root.see("kin", root.place(kin).concat(root.turn(kin)))
                root.see("placed", root.place(placed))
            }
            if (frame === 3) {
                kin.kinematicPosition = Qt.vector3d(100, 20, 0)
                kin.kinematicEulerRotation = Qt.vector3d(0, 90, 0)
                sent.setLinearVelocity(Qt.vector3d(10, 10, 0))
                sent.setAngularVelocity(Qt.vector3d(1, 1, 1))
            }
            if (frame === 5)
                root.late = maker.createObject(holder)
            if (frame >= 5 && frame <= 9)
                root.see("late", root.late.y)
            if (frame === 10) {
                fallen.reset(Qt.vector3d(1000, 300, 0), Qt.vector3d(0, 0, 45))
                inside.reset(Qt.vector3d(10, 0, 0), Qt.vector3d(0, 0, 0))
                off.simulationEnabled = true
                floating.gravityEnabled = true
            }
            if (frame >= 10 && frame <= 13) {
                root.see("fallen", root.place(fallen).concat(root.turn(fallen)))
                root.see("inside", root.place(inside))
                root.see("off", root.round(off.y))
                root.see("floating", root.round(floating.y))
            }
            if (frame === 12) {
                root.see("sent", root.place(sent).concat(root.turn(sent)))
                root.see("child", root.place(child).concat(root.turn(child)))
            }
            if (frame === 20) {
                world.running = false
                again.start()
            }
            if (frame >= 20 && frame <= 22)
                root.see("paused", root.round(fallen.y))
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        Node {
            id: holder
        }

        // Moved by a program: where `position` says until the world has it,
        // and from then on where `kinematicPosition` does.
        DynamicRigidBody {
            id: kin
            y: 50
            isKinematic: true
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: placed
            x: 500
            y: 300
            isKinematic: true
            kinematicPosition: Qt.vector3d(500, 10, 0)
            collisionShapes: BoxShape {}
        }

        DynamicRigidBody {
            id: fallen
            x: 1000
            collisionShapes: SphereShape {
                diameter: 20
            }
        }

        Node {
            x: 2000
            y: 100
            scale: Qt.vector3d(2, 2, 2)
            DynamicRigidBody {
                id: inside
                collisionShapes: SphereShape {
                    diameter: 20
                }
            }
        }

        DynamicRigidBody {
            id: off
            x: 4000
            simulationEnabled: false
            collisionShapes: SphereShape {
                diameter: 20
            }
        }

        DynamicRigidBody {
            id: floating
            x: 5000
            gravityEnabled: false
            collisionShapes: SphereShape {
                diameter: 20
            }
        }

        // Held where it is along `y`, and from turning about `x` and `z`.
        DynamicRigidBody {
            id: sent
            x: 6000
            linearAxisLock: DynamicRigidBody.LockY
            angularAxisLock: DynamicRigidBody.LockX | DynamicRigidBody.LockZ
            collisionShapes: BoxShape {}
        }

        // Falls down the scene: along its parent's `x`, backwards.
        Node {
            x: 7000
            eulerRotation.z: 90
            scale: Qt.vector3d(2, 2, 2)
            DynamicRigidBody {
                id: child
                x: 50
                collisionShapes: BoxShape {}
            }
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            stopped: stopped
        }
    }
}
