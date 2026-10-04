// Bodies that go while the world runs: one from under another, and one
// from inside a trigger; one that comes again, and one that is inside a
// trigger from the first. An Instantiator makes them and takes them away.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 320
    property var seen: ({})
    property var zoned: []

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function see(name, value) {
        if (!seen[name])
            seen[name] = []
        seen[name].push(value)
    }

    Instantiator {
        id: under
        delegate: DynamicRigidBody {
            parent: holder
            objectName: "lower"
            y: 50
            collisionShapes: BoxShape {}
        }
    }

    Instantiator {
        id: guest
        delegate: DynamicRigidBody {
            parent: holder
            objectName: "visitor"
            sendTriggerReports: true
            x: 1000
            y: 800
            collisionShapes: SphereShape {
                diameter: 20
            }
        }
    }

    PhysicsWorld {
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            const frame = ++root.frames
            if (frame === 60)
                guest.model = 0
            if (frame >= 60 && frame <= 63)
                root.see("count", zone.collisionCount)
            if (frame === 120) {
                root.see("asleep", upper.isSleeping)
                under.model = 0
            }
            if (frame >= 120 && frame <= 125 || frame === 320)
                root.see("upper", root.round(upper.y))
            if (frame === 140)
                guest.model = 1
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

        StaticRigidBody {
            eulerRotation.x: -90
            collisionShapes: PlaneShape {}
        }

        DynamicRigidBody {
            id: upper
            y: 150
            collisionShapes: BoxShape {}
        }

        TriggerBody {
            id: zone
            x: 1000
            y: 500
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 400, 100)
            }
            onBodyEntered: body => root.zoned.push([root.frames, "entered", body.objectName, collisionCount])
            onBodyExited: body => root.zoned.push([root.frames, "exited", body ? body.objectName : null, collisionCount])
        }

        // Inside a trigger from the first, and going nowhere.
        TriggerBody {
            id: around
            x: 2000
            y: 500
            collisionShapes: BoxShape {}
            onBodyEntered: body => root.zoned.push([root.frames, "around", body.objectName, collisionCount])
        }

        DynamicRigidBody {
            objectName: "floater"
            sendTriggerReports: true
            x: 2000
            y: 500
            gravityEnabled: false
            collisionShapes: SphereShape {
                diameter: 20
            }
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            zoned: zoned
        }
    }
}
