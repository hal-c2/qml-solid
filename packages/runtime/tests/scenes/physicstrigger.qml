// Who is told what: balls fall through a TriggerBody, each sending or
// hearing of it or not; balls land on a floor, each sending or hearing of
// that or not; and bodies in groups pass through what ignores their group.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 150
    property var told: []
    property var counts: []

    function tell(who, what, other, more) {
        told.push([frames, who.objectName, what, other.objectName].concat(more || []))
    }

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    PhysicsWorld {
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            root.frames++
            if (root.frames === 30 || root.frames === 60)
                root.counts.push(zone.collisionCount)
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        TriggerBody {
            id: zone
            objectName: "zone"
            y: 100
            collisionShapes: BoxShape {
                extents: Qt.vector3d(400, 20, 100)
            }
            onBodyEntered: body => root.tell(zone, "bodyEntered", body, [collisionCount])
            onBodyExited: body => root.tell(zone, "bodyExited", body, [collisionCount])
            onEnteredTriggerBody: body => root.tell(zone, "enteredTriggerBody", body)
            onBodyContact: body => root.tell(zone, "bodyContact", body)
        }

        component Ball: DynamicRigidBody {
            id: ball
            y: 150
            collisionShapes: SphereShape {
                diameter: 20
            }
            onEnteredTriggerBody: body => root.tell(ball, "enteredTriggerBody", body)
            onExitedTriggerBody: body => root.tell(ball, "exitedTriggerBody", body)
            onBodyContact: (body, positions, impulses, normals) => root.tell(ball, "bodyContact", body, [positions.length, root.round(normals[0].y)])
        }

        Ball {
            objectName: "both"
            x: -100
            sendTriggerReports: true
            receiveTriggerReports: true
        }

        Ball {
            objectName: "sender"
            sendTriggerReports: true
        }

        Ball {
            objectName: "receiver"
            x: 100
            receiveTriggerReports: true
        }

        Ball {
            objectName: "silent"
            x: 150
        }

        // Far below, where what fell through the trigger does not come.
        StaticRigidBody {
            id: floor
            objectName: "floor"
            y: -3000
            eulerRotation.x: -90
            sendContactReports: true
            receiveContactReports: true
            collisionShapes: PlaneShape {}
            onBodyContact: (body, positions, impulses, normals) => root.tell(floor, "bodyContact", body, [positions.length, root.round(normals[0].y)])
        }

        Ball {
            objectName: "hears"
            x: 1000
            y: -2985
            receiveContactReports: true
        }

        Ball {
            objectName: "sends"
            x: 1100
            y: -2985
            sendContactReports: true
        }

        Ball {
            objectName: "neither"
            x: 1200
            y: -2985
        }

        // A slab that what is in group 1 passes through.
        StaticRigidBody {
            objectName: "slab"
            x: 2000
            y: -2900
            filterIgnoreGroups: 2
            collisionShapes: BoxShape {
                extents: Qt.vector3d(400, 20, 100)
            }
        }

        Ball {
            id: ghost
            objectName: "ghost"
            x: 1900
            y: -2850
            filterGroup: 1
        }

        Ball {
            id: solid
            objectName: "solid"
            x: 2000
            y: -2850
            filterGroup: 2
        }

        // One that passes through what is in the slab's group, 0.
        Ball {
            id: passing
            objectName: "passing"
            x: 2100
            y: -2850
            filterGroup: 3
            filterIgnoreGroups: 1
        }
    }

    function read() {
        return {
            frames: frames,
            told: told.filter(one => one[0] < 150),
            counts: counts,
            zone: [zone.x, zone.y, zone.z],
            rest: [round(ghost.y), round(solid.y), round(passing.y)]
        }
    }
}
