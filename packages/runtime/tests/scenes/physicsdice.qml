// A world as small as a table of dice, that looks for what moves too fast
// to be seen touching (`enableCCD`): dice made while it runs and thrown
// as they are made, a pull and a material that change, groups that such
// a world does not look at, and a body made inside a trigger. Lengths are
// centimetres. `physics/tray.mesh` is a square of 200 lying flat, 20 above
// the ground.
import QtQuick
import QtQuick3D
import QtQuick3D.Physics

Item {
    id: root
    width: 400
    height: 300

    property int frames: 0
    property bool done: frames >= 140
    property real pull: 981
    property var dice: []
    property var told: []
    property int heard: 0
    property var zoned: []
    property var seen: ({})

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function place(body) {
        const p = body.position
        return [round(p.x), round(p.y), round(p.z)]
    }

    function see(name, value) {
        if (!seen[name])
            seen[name] = []
        seen[name].push(value)
    }

    PhysicsMaterial {
        id: stuff
        staticFriction: 0.5
        dynamicFriction: 0.5
        restitution: 0.5
    }

    PhysicsMaterial {
        id: rubber
        restitution: 1
    }

    Component {
        id: maker
        DynamicRigidBody {
            id: die
            receiveContactReports: true
            sendContactReports: true
            massMode: DynamicRigidBody.CustomDensity
            density: 1.13
            physicsMaterial: stuff
            collisionShapes: BoxShape {
                extents: Qt.vector3d(1.9, 1.9, 1.9)
            }
            onBodyContact: (body, positions, impulses, normals) => {
                root.heard++
                if (root.told.length < 6)
                    root.told.push([root.frames, die.objectName, body.objectName, positions.length])
            }
            Component.onCompleted: applyCentralForce(Qt.vector3d(0, -77500, 0))
        }
    }

    Component {
        id: floater
        DynamicRigidBody {
            objectName: "floater"
            sendTriggerReports: true
            x: 1000
            gravityEnabled: false
            collisionShapes: SphereShape {
                diameter: 2
            }
        }
    }

    PhysicsWorld {
        id: world
        scene: view.scene
        enableCCD: true
        gravity: Qt.vector3d(0, -root.pull, 0)
        typicalLength: 1
        typicalSpeed: 1000
        minimumTimestep: 10
        maximumTimestep: 10
        onFrameDone: {
            const frame = ++root.frames
            if (frame === 3) {
                root.dice = [maker.createObject(holder, {
                    objectName: "first",
                    y: 5
                }), maker.createObject(holder, {
                    objectName: "second",
                    y: 10
                }), floater.createObject(holder)]
                bullet.setLinearVelocity(Qt.vector3d(0, -20000, 0))
            }
            if (frame >= 3 && frame <= 8)
                root.see("first", root.round(root.dice[0].y))
            if (frame === 50)
                rubber.restitution = 0
            if (frame === 60)
                root.pull = 162
            if (frame >= 59 && frame <= 64)
                root.see("faller", root.round(faller.y))
            if (frame === 30 || frame === 40 || frame === 55 || frame === 75 || frame === 100)
                root.see("bouncer", root.round(bouncer.y))
            if (frame === 80) {
                root.see("stack", [root.place(root.dice[0]), root.place(root.dice[1]), root.dice[0].isSleeping, root.dice[1].isSleeping])
                root.see("count", zone.collisionCount)
            }
        }
    }

    View3D {
        id: view
        anchors.fill: parent

        PerspectiveCamera {
            z: 100
        }

        Node {
            id: holder
        }

        // 60 across, its top where `y` is nothing.
        StaticRigidBody {
            objectName: "table"
            y: -6
            scale: Qt.vector3d(0.3, 0.3, 0.3)
            sendContactReports: true
            physicsMaterial: stuff
            collisionShapes: TriangleMeshShape {
                source: "physics/tray.mesh"
            }
        }

        // Two metres a step, at a plate a fifth of a centimetre thick.
        StaticRigidBody {
            objectName: "plate"
            x: 200
            collisionShapes: BoxShape {
                extents: Qt.vector3d(20, 0.2, 20)
            }
        }

        DynamicRigidBody {
            id: bullet
            x: 200
            y: 100
            collisionShapes: SphereShape {
                diameter: 1
            }
        }

        // In another world these would pass through each other.
        StaticRigidBody {
            objectName: "slab"
            x: 400
            filterIgnoreGroups: 2
            collisionShapes: BoxShape {
                extents: Qt.vector3d(20, 2, 20)
            }
        }

        DynamicRigidBody {
            id: ghost
            x: 400
            y: 5
            filterGroup: 1
            collisionShapes: SphereShape {
                diameter: 2
            }
        }

        DynamicRigidBody {
            id: faller
            x: 600
            y: 1000
            collisionShapes: SphereShape {
                diameter: 2
            }
        }

        // Comes back as high as it fell from, until its material is told
        // not to.
        StaticRigidBody {
            objectName: "pad"
            x: 800
            y: -1
            physicsMaterial: rubber
            collisionShapes: BoxShape {
                extents: Qt.vector3d(20, 2, 20)
            }
        }

        DynamicRigidBody {
            id: bouncer
            x: 800
            y: 20
            physicsMaterial: rubber
            collisionShapes: SphereShape {
                diameter: 2
            }
        }

        TriggerBody {
            id: zone
            x: 1000
            collisionShapes: BoxShape {
                extents: Qt.vector3d(10, 10, 10)
            }
            onBodyEntered: body => root.zoned.push([root.frames, "entered", body.objectName, collisionCount])
            onBodyExited: body => root.zoned.push([root.frames, "exited", body ? body.objectName : null, collisionCount])
        }
    }

    function read() {
        return {
            frames: frames,
            seen: seen,
            told: told,
            heard: heard,
            zoned: zoned,
            rest: {
                first: dice.length ? place(dice[0]) : [],
                sleeping: dice.length ? dice[0].isSleeping : false,
                bullet: place(bullet),
                ghost: place(ghost),
                bouncer: place(bouncer)
            }
        }
    }
}
