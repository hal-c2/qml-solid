// Five rectangles facing the camera and three lights: a dim one for
// everything, a red one for what is in a node, with a blue it adds wherever
// a surface faces, and a green one for a model and what is inside it. The
// functions each change what one of the lights is for.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 300
    height: 200
    color: "#202020"

    function unscoped() {
        some.scope = null;
    }
    function rescoped() {
        some.scope = right;
    }
    function hidden() {
        some.scope = unseen;
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#101010"
        }

        OrthographicCamera {
            id: camera
            z: 500
        }

        DirectionalLight {
            brightness: 0.2
        }
        DirectionalLight {
            id: some
            color: "#ff0000"
            ambientColor: "#000060"
            brightness: 0.5
            scope: group
        }
        DirectionalLight {
            id: one
            color: "#00ff00"
            brightness: 0.5
            scope: right
        }

        Node {
            id: group
            Model {
                x: -110
                source: "#Rectangle"
                scale: Qt.vector3d(0.4, 0.8, 1)
                materials: PrincipledMaterial { roughness: 1 }
            }
            Node {
                Model {
                    x: -55
                    source: "#Rectangle"
                    scale: Qt.vector3d(0.4, 0.8, 1)
                    materials: PrincipledMaterial { roughness: 1 }
                }
            }
        }
        Model {
            source: "#Rectangle"
            scale: Qt.vector3d(0.4, 0.8, 1)
            materials: PrincipledMaterial { roughness: 1 }
        }
        Model {
            id: right
            x: 55
            source: "#Rectangle"
            scale: Qt.vector3d(0.4, 0.8, 1)
            materials: PrincipledMaterial { roughness: 1 }
            Model {
                x: 137.5
                source: "#Rectangle"
                materials: PrincipledMaterial { roughness: 1 }
            }
        }
        Node {
            id: unseen
            visible: false
        }
    }
}
