// Nodes that keep facing another: two LookAtNodes, one of them inside a
// node that is turned and rolled itself, and a camera with a node to look
// at. `go()` moves what they face, `away()` moves the two that face it.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 200
    height: 200
    color: "#202020"

    function three(v) {
        return [v.x, v.y, v.z];
    }

    function read() {
        return {
            plain: three(plain.eulerRotation),
            forward: three(plain.forward),
            inner: three(inner.eulerRotation),
            innerForward: three(inner.forward),
            camera: three(camera.eulerRotation),
            cameraForward: three(camera.forward),
            none: three(none.eulerRotation),
        };
    }

    function go() {
        aim.position = Qt.vector3d(-200, -40, -50);
    }

    function away() {
        plain.y = 300;
        camera.x = -100;
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        PerspectiveCamera {
            id: camera
            position: Qt.vector3d(100, 200, 400)
            lookAtNode: aim
        }

        DirectionalLight {}

        Node {
            id: aim
            position: Qt.vector3d(50, 80, -120)
            Model {
                source: "#Cube"
                scale: Qt.vector3d(0.5, 0.5, 0.5)
                materials: DefaultMaterial {
                    diffuseColor: "#c04040"
                }
            }
        }

        LookAtNode {
            id: plain
            position: Qt.vector3d(-100, 20, 60)
            eulerRotation.z: 25
            target: aim
        }

        Node {
            eulerRotation: Qt.vector3d(20, 50, 10)
            position: Qt.vector3d(10, 20, 30)
            LookAtNode {
                id: inner
                x: 100
                target: aim
            }
        }

        LookAtNode {
            id: none
            eulerRotation: Qt.vector3d(10, 20, 30)
        }
    }
}
