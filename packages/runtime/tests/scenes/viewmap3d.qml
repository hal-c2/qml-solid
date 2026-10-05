// A View3D as a picture in another's scene: on the left the view itself is
// the Texture's item, in the middle a ShaderEffectSource of a second view
// is, which hides that view, and on the right one that does not mirror
// what it is of. Each view is three sheets of a colour and a small one,
// before a grey, and the first sheet of each is of another colour after a
// step.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function step() {
        shown.first = "#00ffff";
        hidden.first = "#ffffff";
    }

    component Sheet: Model {
        property color paint
        source: "#Rectangle"
        scale: Qt.vector3d(0.48, 0.48, 1)
        materials: PrincipledMaterial {
            lighting: PrincipledMaterial.NoLighting
            baseColor: paint
        }
    }

    component Quarters: View3D {
        id: quarters
        property color first: "red"
        width: 128
        height: 128
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#808080"
        }
        OrthographicCamera {
            z: 100
        }
        Sheet { x: -32; y: 32; paint: quarters.first }
        Sheet { x: 32; y: 32; paint: "#00ff00" }
        Sheet { x: -32; y: -32; paint: "#0000ff" }
        Sheet { x: 16; y: -16; scale: Qt.vector3d(0.16, 0.16, 1); paint: "#ffff00" }
    }

    Quarters {
        id: shown
        x: 400
    }
    Quarters {
        id: hidden
        first: "#ff00ff"
    }
    ShaderEffectSource {
        id: stood
        sourceItem: hidden
        hideSource: true
    }
    ShaderEffectSource {
        id: unturned
        sourceItem: hidden
        textureMirroring: ShaderEffectSource.NoMirroring
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
            x: -120
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture {
                    sourceItem: shown
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
        Model {
            source: "#Rectangle"
            x: 0
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture {
                    sourceItem: stood
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
        Model {
            source: "#Rectangle"
            x: 120
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture {
                    sourceItem: unturned
                    magFilter: Texture.Nearest
                    minFilter: Texture.Nearest
                }
            }
        }
    }
}
