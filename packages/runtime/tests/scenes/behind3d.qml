// A red square before a green one, each half over the other, with the
// surroundings behind them: the nearer one is over the further.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 200
    height: 100
    color: "#202020"

    View3D {
        id: view
        anchors.fill: parent
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.SkyBox
            lightProbe: Texture { source: "../assets/sky.png" }
        }

        PerspectiveCamera {
            z: 86.6
            clipNear: 1
        }

        component Square: Model {
            source: "#Rectangle"
            scale: Qt.vector3d(0.8, 0.6, 1)
        }
        Square {
            x: -20
            z: 10
            materials: PrincipledMaterial { lighting: PrincipledMaterial.NoLighting; baseColor: "#ff0000" }
        }
        Square {
            x: 20
            materials: PrincipledMaterial { lighting: PrincipledMaterial.NoLighting; baseColor: "#00ff00" }
        }
    }
}
