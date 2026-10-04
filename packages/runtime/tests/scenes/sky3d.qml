// A picture of everything round a place, seen behind the scene: four
// colours round the upper half and four round the lower. The eye is in the
// middle and turns about the way up, and what it sees can be blurred.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    property real turn: 0
    property real blur: 0

    function read() {
        return {};
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.SkyBox
            lightProbe: Texture { source: "../assets/sky.png" }
            skyboxBlurAmount: root.blur
        }

        PerspectiveCamera {
            id: camera
            eulerRotation.y: root.turn
        }
    }
}
