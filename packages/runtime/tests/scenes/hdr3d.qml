// A Radiance picture, brighter than a screen can show: behind the scene,
// lighting a rough ball and a mirror, and as the colour of a sheet.
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
            lightProbe: Texture { source: "../assets/bright.hdr" }
        }

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
            source: "#Rectangle"
            x: 120
            scale: Qt.vector3d(0.8, 0.4, 1)
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture {
                    source: "../assets/bright.hdr"
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
    }
}
