// What a program seldom does to a world that runs: a body made kinematic
// and let go again, a kinematic body turned about a pivot, and touches
// between bodies that do not move by themselves, which a world tells of
// when it is asked to.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 240
    property var seen: ({})
    property var told: []
    property int heard: 0

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function vector(v) {
        return [round(v.x), round(v.y), round(v.z)]
    }

    function see(name, value) {
        if (!seen[name])
            seen[name] = []
        seen[name].push(value)
    }

    // The first time each of two bodies is told of the other.
    function tell(self, other) {
        root.heard++
        if (!root.told.some(one => one[1] === self && one[2] === other))
            root.told.push([root.frames, self, other])
    }

    PhysicsWorld {
        id: world
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        reportKinematicKinematicCollisions: true
        reportStaticKinematicCollisions: true
        onFrameDone: {
            const frame = ++root.frames
            if (frame === 20) {
                turning.isKinematic = true
                turning.kinematicPosition = Qt.vector3d(0, 500, 0)
            }
            if (frame === 40)
                turning.isKinematic = false
            if (frame >= 19 && frame <= 24 || frame >= 39 && frame <= 44)
                root.see("turning", root.round(turning.y))
            if (frame === 5)
                root.see("arm", [root.vector(arm.position), root.vector(arm.eulerRotation), root.vector(arm.pivot), root.vector(arm.scenePosition)])
            if (frame >= 10 && frame <= 40)
                pusher.kinematicPosition = Qt.vector3d(-300 + 10 * (frame - 10), 200, 4000)
            if (frame === 240)
                root.see("ball", root.vector(ball.position))
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

        DynamicRigidBody {
            id: turning
            y: 1000
            collisionShapes: SphereShape {}
        }

        // A slab stood on end by a turn about a point a hundred along it,
        // and a ball let fall on where that puts it.
        DynamicRigidBody {
            id: arm
            isKinematic: true
            kinematicPosition: Qt.vector3d(0, 200, 2000)
            kinematicPivot: Qt.vector3d(100, 0, 0)
            kinematicEulerRotation: Qt.vector3d(0, 0, 90)
            collisionShapes: BoxShape {
                extents: Qt.vector3d(100, 20, 100)
            }
        }

        DynamicRigidBody {
            id: ball
            y: 400
            z: 2000
            collisionShapes: SphereShape {
                diameter: 20
            }
        }

        // Moved through another that a program moves, and through one that
        // nothing does.
        DynamicRigidBody {
            id: pusher
            objectName: "pusher"
            isKinematic: true
            kinematicPosition: Qt.vector3d(-300, 200, 4000)
            sendContactReports: true
            receiveContactReports: true
            collisionShapes: BoxShape {}
            onBodyContact: body => root.tell("pusher", body.objectName)
        }

        DynamicRigidBody {
            objectName: "held"
            isKinematic: true
            kinematicPosition: Qt.vector3d(-150, 200, 4000)
            sendContactReports: true
            receiveContactReports: true
            collisionShapes: BoxShape {}
            onBodyContact: body => root.tell("held", body.objectName)
        }

        StaticRigidBody {
            objectName: "post"
            x: 50
            y: 200
            z: 4000
            sendContactReports: true
            receiveContactReports: true
            collisionShapes: BoxShape {}
            onBodyContact: body => root.tell("post", body.objectName)
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            told: told,
            heard: heard
        }
    }
}
