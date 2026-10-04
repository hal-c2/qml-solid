// Ten balls lit by nothing but a picture of everything round them: rough
// and smooth, metal and not, a DefaultMaterial with and without a shine, a
// coat, one that gives nothing back and one tinted. How bright the picture
// is, how far down it reaches and how it is turned can be set.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    property real exposure: 1
    property real horizon: 0
    property vector3d orientation: Qt.vector3d(0, 0, 0)

    function read() {
        return {};
    }

    function turn(x, y, z) {
        root.orientation = Qt.vector3d(x, y, z);
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#202020"
            lightProbe: Texture { source: "../assets/sky.png" }
            probeExposure: root.exposure
            probeHorizon: root.horizon
            probeOrientation: root.orientation
        }

        PerspectiveCamera {
            id: camera
            z: 259.8
            clipNear: 1
        }

        component Ball: Model { source: "#Sphere"; scale: Qt.vector3d(0.6, 0.6, 0.6) }
        Ball { x: -160; y: 70; materials: PrincipledMaterial { roughness: 1 } }
        Ball { x: -80; y: 70; materials: PrincipledMaterial { roughness: 0.5 } }
        Ball { x: 0; y: 70; materials: PrincipledMaterial { roughness: 0; metalness: 1 } }
        Ball { x: 80; y: 70; materials: PrincipledMaterial { roughness: 0.4; metalness: 1 } }
        Ball { x: 160; y: 70; materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000" } }
        Ball { x: -160; y: -70; materials: DefaultMaterial { } }
        Ball { x: -80; y: -70; materials: DefaultMaterial { specularAmount: 1; specularRoughness: 0.3 } }
        Ball { x: 0; y: -70; materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.2 } }
        Ball { x: 80; y: -70; materials: PrincipledMaterial { roughness: 1; specularAmount: 0 } }
        Ball { x: 160; y: -70; materials: PrincipledMaterial { roughness: 0.2; metalness: 0.5; baseColor: "#ffcc00"; specularTint: 1 } }
    }
}
