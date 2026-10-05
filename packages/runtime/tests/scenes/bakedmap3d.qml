// The same file as a picture on a sheet: Qt draws the first side of its
// first level, the row the file begins with at the top. A
// PrincipledMaterial takes its numbers to be in linear light, and a
// DefaultMaterial to be as a screen shows them.
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
            backgroundMode: SceneEnvironment.Color
            clearColor: "black"
        }

        PerspectiveCamera {
            id: camera
            z: 259.8
            clipNear: 1
        }

        Model {
            source: "#Rectangle"
            x: -80
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture {
                    source: "../assets/baked.ktx"
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
        Model {
            source: "#Rectangle"
            x: 80
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseMap: Texture {
                    source: "../assets/baked.ktx"
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
    }
}
