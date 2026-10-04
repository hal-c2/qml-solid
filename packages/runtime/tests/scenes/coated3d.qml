// A clear coat over a red ball, and what a ball gives back of a light: three
// rows of five, lit from straight ahead at half strength. The eye is at the
// middle, so each ball is seen from its own side.
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

        OrthographicCamera {
            id: camera
            z: 500
        }

        DirectionalLight {
            brightness: 0.5
        }

        Model { source: "#Sphere"; x: -160; y: 100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3 } }
        Model { source: "#Sphere"; x: -80; y: 100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 0.5; clearcoatRoughnessAmount: 0.3 } }
        Model { source: "#Sphere"; x: 0; y: 100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.5; clearcoatMap: Texture { source: "../assets/parts.png" } } }
        Model { source: "#Sphere"; x: 80; y: 100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.5; clearcoatRoughnessMap: Texture { source: "../assets/parts.png" } } }
        Model { source: "#Sphere"; x: 160; y: 100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.5; clearcoatChannel: Material.B; clearcoatRoughnessChannel: Material.B; clearcoatMap: Texture { source: "../assets/parts.png" } clearcoatRoughnessMap: Texture { source: "../assets/parts.png" } } }
        Model { source: "#Sphere"; x: -160; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3; clearcoatFresnelPower: 2 } }
        Model { source: "#Sphere"; x: -80; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3; indexOfRefraction: 2 } }
        Model { source: "#Sphere"; x: 0; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3; normalMap: Texture { source: "../assets/tilt.png" } } }
        Model { source: "#Sphere"; x: 80; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3; clearcoatNormalMap: Texture { source: "../assets/tilt.png" } } }
        Model { source: "#Sphere"; x: 160; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.3; clearcoatFresnelScaleBiasEnabled: true; clearcoatFresnelScale: 0.5; clearcoatFresnelBias: 0.2 } }
        Model { source: "#Sphere"; x: -160; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { baseColor: "#ff0000"; fresnelScaleBiasEnabled: true; fresnelScale: 0.5; fresnelBias: 0.2; roughness: 0.3 } }
        Model { source: "#Sphere"; x: -80; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { baseColor: "#ff0000"; specularAmount: 0.2; roughness: 0.3 } }
        Model { source: "#Sphere"; x: 0; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { baseColor: "#ff0000"; specularTint: 1; roughness: 0.3 } }
        Model { source: "#Sphere"; x: 80; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { baseColor: "#ff0000"; fresnelPower: 1; roughness: 0.3 } }
        Model { source: "#Sphere"; x: 160; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { baseColor: "#ff0000"; specularAmount: 0; roughness: 0.3 } }
    }
}
