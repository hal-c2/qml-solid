// Shapes that are files: a mesh's triangles under a ball, a mesh's hull as
// a body, and a picture as ground. `physics/pyramid.mesh` is a square of
// 100 on the ground with its top 100 above the middle, `physics/tray.mesh`
// a square of 200 lying flat 20 above the ground, and `physics/heights.png`
// eight dots by four, the left half dark (64) and the right bright (191).
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 150
    property var early: ({})
    property var late: ({})

    PhysicsWorld {
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            root.frames++
            if (root.frames === 3) {
                hullFree.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
                hullScaled.applyCentralImpulse(Qt.vector3d(100000, 0, 0))
            }
            if (root.frames === 15)
                root.early = root.places()
            if (root.frames === 150)
                root.late = root.places()
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        StaticRigidBody {
            scale: Qt.vector3d(1, 2, 1)
            collisionShapes: TriangleMeshShape {
                source: "physics/tray.mesh"
            }
        }

        DynamicRigidBody {
            id: onTray
            objectName: "onTray"
            y: 60
            collisionShapes: SphereShape {
                diameter: 20
            }
        }

        StaticRigidBody {
            x: 1000
            eulerRotation.x: -90
            collisionShapes: PlaneShape {}
        }

        DynamicRigidBody {
            id: hull
            objectName: "hull"
            x: 1000
            y: 5
            collisionShapes: ConvexMeshShape {
                source: "physics/pyramid.mesh"
            }
        }

        DynamicRigidBody {
            id: hullFree
            objectName: "hullFree"
            y: 2000
            gravityEnabled: false
            collisionShapes: ConvexMeshShape {
                source: "physics/pyramid.mesh"
            }
        }

        DynamicRigidBody {
            id: hullScaled
            objectName: "hullScaled"
            y: 4000
            scale: Qt.vector3d(2, 1, 1)
            gravityEnabled: false
            collisionShapes: ConvexMeshShape {
                source: "physics/pyramid.mesh"
            }
        }

        // The plane has no end: the ground of heights is above it.
        StaticRigidBody {
            x: 3000
            y: 500
            collisionShapes: HeightFieldShape {
                id: field
                source: "physics/heights.png"
            }
        }

        DynamicRigidBody {
            id: low
            objectName: "low"
            position: Qt.vector3d(2970, 500, 10)
            collisionShapes: SphereShape {
                diameter: 10
            }
        }

        DynamicRigidBody {
            id: high
            objectName: "high"
            position: Qt.vector3d(3030, 540, 10)
            collisionShapes: SphereShape {
                diameter: 10
            }
        }

        StaticRigidBody {
            x: 5000
            y: 500
            scale: Qt.vector3d(2, 1, 1)
            collisionShapes: HeightFieldShape {
                id: wide
                source: "physics/heights.png"
                extents: Qt.vector3d(200, 50, 100)
            }
        }

        DynamicRigidBody {
            id: onWide
            objectName: "onWide"
            position: Qt.vector3d(5100, 530, -30)
            collisionShapes: SphereShape {
                diameter: 10
            }
        }
    }

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function places() {
        const bodies = {}
        for (const body of [onTray, hull, hullFree, hullScaled, low, high, onWide]) {
            const p = body.position
            bodies[body.objectName] = [round(p.x), round(p.y), round(p.z), body.isSleeping]
        }
        return bodies
    }

    function read() {
        return {
            frames: frames,
            early: early,
            late: late,
            extents: [field.extents.x, field.extents.y, field.extents.z, wide.extents.x, wide.extents.y, wide.extents.z]
        }
    }
}
