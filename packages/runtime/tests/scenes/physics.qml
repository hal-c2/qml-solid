// A box and a ball dropped on a floor, as Qt's physics world drops them:
// what its frames are, where the bodies are after so many of them, what
// the box is told of when it lands, and where they come to rest.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property var steps: []
    property var contacts: []

    PhysicsWorld {
        id: world
        scene: view.scene
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: (timestep) => {
            root.frames++
            if (root.frames <= 3)
                root.steps.push(timestep)
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 600
        }

        DirectionalLight {}

        StaticRigidBody {
            id: floor
            objectName: "floor"
            eulerRotation.x: -90
            sendContactReports: true
            collisionShapes: PlaneShape {}
        }

        DynamicRigidBody {
            id: box
            objectName: "box"
            y: 200
            receiveContactReports: true
            collisionShapes: BoxShape {}
            onBodyContact: (body, positions, impulses, normals) => {
                root.contacts.push({
                    frame: root.frames,
                    body: body.objectName,
                    counts: [positions.length, impulses.length, normals.length],
                    position: root.vector(positions[0]),
                    impulse: root.vector(impulses[0]),
                    normal: root.vector(normals[0])
                })
            }
        }

        DynamicRigidBody {
            id: ball
            objectName: "ball"
            x: 300
            y: 200
            massMode: DynamicRigidBody.CustomDensity
            density: 0.01
            physicsMaterial: PhysicsMaterial {
                restitution: 0.9
                staticFriction: 0.1
                dynamicFriction: 0.1
            }
            collisionShapes: SphereShape {
                diameter: 50
            }
        }
    }

    function round(value) {
        return Math.round(value * 10000) / 10000 + 0
    }

    function vector(v) {
        return [round(v.x), round(v.y), round(v.z)]
    }

    function turn(q) {
        return [round(q.scalar), round(q.x), round(q.y), round(q.z)]
    }

    function defaults() {
        const material = box.physicsMaterial
        return {
            world: [vector(world.gravity), world.running, world.enableCCD, world.typicalLength, world.typicalSpeed, world.defaultDensity],
            box: [box.mass, box.density, box.massMode, box.isKinematic, box.gravityEnabled, box.linearAxisLock, box.angularAxisLock, box.isSleeping],
            reports: [box.sendContactReports, box.receiveContactReports, box.sendTriggerReports, box.receiveTriggerReports],
            filters: [box.filterGroup, box.filterIgnoreGroups, box.simulationEnabled],
            material: [material.staticFriction, material.dynamicFriction, material.restitution],
            inertia: [vector(box.inertiaTensor), vector(box.centerOfMassPosition), turn(box.centerOfMassRotation), box.inertiaMatrix.length],
            kinematic: [vector(box.kinematicPosition), turn(box.kinematicRotation), vector(box.kinematicEulerRotation), vector(box.kinematicPivot)]
        }
    }

    function read() {
        return {
            frames: frames,
            steps: steps,
            contacts: contacts,
            box: vector(box.position),
            turn: turn(box.rotation),
            ball: vector(ball.position),
            sleeping: [box.isSleeping, ball.isSleeping]
        }
    }
}
