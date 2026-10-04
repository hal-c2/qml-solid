// Where nodes in space are, as Qt works it out: a node's own place, turn,
// scale and pivot, inside its parent's, and what a camera makes of it.
import QtQuick
import QtQuick3D

Item {
    id: root
    width: 400
    height: 300

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        PerspectiveCamera {
            id: camera
            x: 100
            y: 50
            z: 600
            eulerRotation.y: 10
        }

        Node {
            id: outer
            x: 100
            y: 20
            z: -30
            eulerRotation.x: 30
            eulerRotation.y: 45
            scale.x: 2
            scale.y: 2
            scale.z: 2
            pivot.x: 10

            Node {
                id: inner
                position: Qt.vector3d(5, 10, 15)
                eulerRotation.z: 90
                scale.y: 3

                Model {
                    id: cube
                    source: "#Cube"
                    y: 40
                    eulerRotation.y: 20
                    materials: DefaultMaterial {
                        diffuseColor: "red"
                    }
                }
            }
        }

        Node {
            id: spun
            eulerRotation: Qt.vector3d(10, 20, 30)
            Node {
                id: child
                x: 10
            }
        }
    }

    function round(value) {
        return Math.round(value * 1000) / 1000 + 0
    }

    function vector(v) {
        return [round(v.x), round(v.y), round(v.z)]
    }

    function turn(q) {
        return [round(q.scalar), round(q.x), round(q.y), round(q.z)]
    }

    function read() {
        return {
            outer: vector(outer.scenePosition),
            inner: vector(inner.scenePosition),
            cube: vector(cube.scenePosition),
            scale: vector(cube.sceneScale),
            rotation: turn(inner.sceneRotation),
            cubeRotation: turn(cube.sceneRotation),
            own: turn(outer.rotation),
            forward: vector(inner.forward),
            up: vector(inner.up),
            right: vector(inner.right),
            point: vector(inner.mapPositionToScene(Qt.vector3d(1, 2, 3))),
            back: vector(inner.mapPositionFromScene(Qt.vector3d(1, 2, 3))),
            between: vector(cube.mapPositionToNode(outer, Qt.vector3d(1, 2, 3))),
            way: vector(inner.mapDirectionToScene(Qt.vector3d(1, 2, 3))),
            wayBack: vector(inner.mapDirectionFromScene(Qt.vector3d(1, 2, 3))),
            seen: vector(view.mapFrom3DScene(cube.scenePosition)),
            there: vector(view.mapTo3DScene(Qt.vector3d(120, 80, 300))),
            viewport: vector(camera.mapToViewport(cube.scenePosition)),
            from: vector(camera.mapFromViewport(Qt.vector3d(0.25, 0.75, 100))),
            bounds: [vector(cube.bounds.minimum), vector(cube.bounds.maximum)],
            parent: [inner.parent === outer, cube.parent === inner, outer.children.length],
        }
    }

    function step(index) {
        if (index === 0) {
            spun.rotate(40, Qt.vector3d(0, 1, 0), Node.LocalSpace)
            return [turn(spun.rotation), vector(spun.eulerRotation), vector(child.scenePosition)]
        }
        if (index === 1) {
            spun.rotate(40, Qt.vector3d(1, 0, 0), Node.SceneSpace)
            return [turn(spun.rotation), vector(spun.eulerRotation), vector(child.scenePosition)]
        }
        if (index === 2) {
            child.rotate(25, Qt.vector3d(0, 0, 1), Node.SceneSpace)
            return [turn(child.rotation), turn(child.sceneRotation), vector(child.forward)]
        }
        if (index === 3) {
            spun.eulerRotation.y = 70
            outer.pivot = Qt.vector3d(0, 5, 0)
            return [turn(spun.rotation), vector(child.scenePosition), vector(cube.scenePosition)]
        }
        camera.lookAt(cube.scenePosition)
        return [vector(camera.eulerRotation), vector(camera.forward)]
    }
}
