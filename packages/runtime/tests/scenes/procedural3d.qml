// The sky QtQuick3D.Helpers makes, seen behind the scene: blue above, grey
// below, and a sun a third of the way up. The eye is in the middle and can
// be turned.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function read() {
        return {};
    }

    function turn(x, y, z) {
        camera.eulerRotation = Qt.vector3d(x, y, z);
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.SkyBox
            lightProbe: Texture { textureData: ProceduralSkyTextureData { } }
        }

        PerspectiveCamera {
            id: camera
        }
    }
}
