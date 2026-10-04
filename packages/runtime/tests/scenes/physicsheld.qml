// What a program does with a body it picks up, as a hand does a torch: a
// small trigger in the hand finds it, the program takes its shapes away
// and the world's hold of it, carries it, and gives both back. And a
// character that walks through a trigger, and bodies whose shapes, or
// whose world's density, change.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 120
    property var seen: ({})
    property var zoned: []
    property int taken: -1
    property bool own: false

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function pose(body) {
        const p = body.position
        const q = body.rotation
        return [round(p.x), round(p.y), round(p.z), round(q.scalar), round(q.x), round(q.y), round(q.z)]
    }

    function see(name, value) {
        if (!seen[name])
            seen[name] = []
        seen[name].push(value)
    }

    PhysicsWorld {
        id: world
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            const frame = ++root.frames
            if (frame === 1)
                root.own = torch.shapes[0].parent === torch
            if (root.taken >= 0 && frame > root.taken && frame < root.taken + 20) {
                hand.x += 10
                torch.position = hand.scenePosition
                torch.rotation = hand.sceneRotation
                torch.reset(torch.position, torch.rotation.toEulerAngles())
            }
            if (root.taken >= 0 && frame === root.taken + 20) {
                torch.collisionShapes = torch.shapes
                torch.pivot = Qt.vector3d(0, 0, 0)
                torch.simulationEnabled = true
            }
            if (root.taken >= 0 && frame <= root.taken + 26)
                root.see("torch", [frame].concat(root.pose(torch)))
            if (frame === 30) {
                ball.diameter = 200
                swapped.collisionShapes = [spare]
                world.defaultDensity = 0.002
            }
            if (frame === 40) {
                const push = Qt.vector3d(1000000, 0, 0)
                grown.applyCentralImpulse(push)
                swapped.applyCentralImpulse(push)
                denser.applyCentralImpulse(push)
            }
            if (frame === 50)
                root.see("pushed", [root.round(grown.x), root.round(swapped.x), root.round(denser.x)])
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        StaticRigidBody {
            eulerRotation.x: -90
            collisionShapes: PlaneShape {}
        }

        Node {
            id: hand
            y: 700
            eulerRotation.z: 30

            TriggerBody {
                scale: Qt.vector3d(0.03, 0.03, 0.03)
                collisionShapes: [SphereShape {}]
                onBodyEntered: body => {
                    root.zoned.push([root.frames, "entered", body.objectName])
                    if (root.taken < 0) {
                        root.taken = root.frames
                        torch.collisionShapes = null
                        torch.simulationEnabled = false
                        torch.pivot = Qt.vector3d(0, 10, 0)
                    }
                }
                onBodyExited: body => root.zoned.push([root.frames, "exited", body.objectName])
            }
        }

        DynamicRigidBody {
            id: torch
            objectName: "Torch"
            y: 1000
            sendTriggerReports: true
            physicsMaterial: PhysicsMaterial {
                restitution: 0.1
                dynamicFriction: 10
                staticFriction: 10
            }
            property list<CollisionShape> shapes: [
                CapsuleShape {
                    eulerRotation: Qt.vector3d(0, 0, -90)
                    position: Qt.vector3d(0, 25, 0)
                    diameter: 5
                    height: 40
                },
                SphereShape {
                    diameter: 20
                    y: 60
                }
            ]
            collisionShapes: shapes
        }

        // Walks through a doorway that tells of it.
        CharacterController {
            objectName: "walker"
            y: 76
            z: 2000
            gravity: Qt.vector3d(0, -981, 0)
            movement: Qt.vector3d(200, 0, 0)
            sendTriggerReports: true
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
        }

        TriggerBody {
            x: 100
            y: 100
            z: 2000
            scale: Qt.vector3d(0.5, 2, 1)
            collisionShapes: BoxShape {}
            onBodyEntered: body => root.zoned.push([root.frames, "in", body.objectName])
            onBodyExited: body => root.zoned.push([root.frames, "out", body.objectName])
        }

        // Pushed alike in frame 40, each as heavy as it has become.
        DynamicRigidBody {
            id: grown
            y: 500
            z: 4000
            gravityEnabled: false
            collisionShapes: SphereShape {
                id: ball
            }
        }

        // Given a box for its ball: one shape where one was, which Qt does
        // not see as another, so it is the ball still, of the new density.
        DynamicRigidBody {
            id: swapped
            y: 500
            z: 6000
            gravityEnabled: false
            property list<CollisionShape> others: [
                BoxShape {
                    id: spare
                    extents: Qt.vector3d(200, 100, 100)
                }
            ]
            collisionShapes: SphereShape {}
        }

        DynamicRigidBody {
            id: denser
            y: 500
            z: 8000
            gravityEnabled: false
            collisionShapes: BoxShape {}
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            zoned: zoned,
            taken: taken,
            own: own
        }
    }
}
