// What a program walks about: a character that falls to a floor, walks
// into a wall and is put somewhere else; one that does not fall, one that
// cannot steer while it falls, one that is scaled, one that climbs steps,
// and one inside a node that is turned and scaled.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 180
    property var seen: ({})
    property var hits: []

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function place(body) {
        const p = body.position
        return [round(p.x), round(p.y), round(p.z), body.collisions]
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
            root.see("walker", root.place(walker))
            root.see("flier", root.place(flier))
            root.see("stiff", root.place(stiff))
            root.see("big", root.place(big))
            root.see("climber", root.place(climber))
            root.see("child", root.place(child))
            if (frame === 40) {
                walker.movement = Qt.vector3d(200, 0, 0)
                climber.movement = Qt.vector3d(100, 0, 0)
                flier.movement = Qt.vector3d(0, 50, -100)
                child.movement = Qt.vector3d(100, 0, 0)
            }
            if (frame === 110)
                walker.teleport(Qt.vector3d(0, 300, 500))
                    }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        StaticRigidBody {
            objectName: "floor"
            eulerRotation.x: -90
            collisionShapes: PlaneShape {}
        }

        StaticRigidBody {
            objectName: "wall"
            x: 150
            y: 200
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 400, 400)
            }
        }

        CharacterController {
            id: walker
            y: 100
            gravity: Qt.vector3d(0, -981, 0)
            enableShapeHitCallback: true
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
            onShapeHit: (body, position, impulse, normal) => {
                if (root.hits.length < 3 || body.objectName === "wall" && !root.hits.some(hit => hit[1] === "wall"))
                    root.hits.push([root.frames, body.objectName, [root.round(position.x), root.round(position.y), root.round(position.z)], [root.round(impulse.x), root.round(impulse.y), root.round(impulse.z)], [root.round(normal.x), root.round(normal.y), root.round(normal.z)]])
            }
        }

        // No pull on it: it goes where it is told, at the speed it is told.
        CharacterController {
            id: flier
            y: 500
            z: 2000
            movement: Qt.vector3d(100, 0, 0)
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
        }

        // Falls where it is, whatever it is told, until it lands.
        CharacterController {
            id: stiff
            y: 200
            z: 4000
            gravity: Qt.vector3d(0, -981, 0)
            midAirControl: false
            movement: Qt.vector3d(100, 0, 0)
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
        }

        // Scaled: as wide as its `x` makes it, as tall as its `y` does.
        CharacterController {
            id: big
            y: 400
            z: 6000
            scale: Qt.vector3d(2, 3, 1)
            gravity: Qt.vector3d(0, -981, 0)
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
        }

        // Steps it walks up: one a fifth its height, and one twice that
        // above the first.
        StaticRigidBody {
            objectName: "low"
            x: 100
            y: 10
            z: 8000
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 20, 400)
            }
        }

        StaticRigidBody {
            objectName: "high"
            x: 200
            y: 30
            z: 8000
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 60, 400)
            }
        }

        CharacterController {
            id: climber
            y: 76
            z: 8000
            gravity: Qt.vector3d(0, -981, 0)
            collisionShapes: CapsuleShape {
                diameter: 50
                height: 100
            }
        }

        // Told to go along its own `x`, which in the scene is `z`
        // backwards; where it is, is said in its parent.
        Node {
            y: 300
            z: 10000
            eulerRotation.y: 90
            scale: Qt.vector3d(2, 2, 2)
            CharacterController {
                id: child
                x: 10
                collisionShapes: CapsuleShape {
                    diameter: 50
                    height: 100
                }
            }
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            hits: hits
        }
    }
}
