// Surroundings Qt baked into a KTX file: behind the scene, lighting a rough
// ball, in a mirror and in a ball half as smooth. The file is a cube whose
// sides and levels are each a colour of their own (`makeprobe.py`), and the
// eye looks at a corner of it, where three sides meet.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function read() {
        return {};
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.SkyBox
            lightProbe: Texture { source: "../assets/baked.ktx" }
        }

        Node {
            eulerRotation: Qt.vector3d(-30, 40, 0)

            PerspectiveCamera {
                id: camera
                z: 259.8
                clipNear: 1
            }

            Model {
                source: "#Sphere"
                x: -120
                scale: Qt.vector3d(0.6, 0.6, 0.6)
                materials: PrincipledMaterial { roughness: 1 }
            }
            Model {
                source: "#Sphere"
                scale: Qt.vector3d(0.6, 0.6, 0.6)
                materials: PrincipledMaterial { roughness: 0; metalness: 1 }
            }
            Model {
                source: "#Sphere"
                x: 120
                scale: Qt.vector3d(0.6, 0.6, 0.6)
                materials: PrincipledMaterial { roughness: 0.5; metalness: 1 }
            }
        }
    }
}
