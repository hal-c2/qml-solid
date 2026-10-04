// What else a material's pictures do: three rows of five, lit from straight
// ahead at half strength, as in `maps3d.qml`.
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

    component Tile: Model {
        source: "#Rectangle"
        scale: Qt.vector3d(0.6, 0.6, 1)
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

        Tile { x: -160; y: 100; materials: PrincipledMaterial { roughness: 1; baseColor: "#ff8040"; metalness: 1; roughnessMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: -80; y: 100; materials: PrincipledMaterial { roughness: 1; baseColor: "#ff8040"; metalness: 1; roughnessMap: Texture { source: "../assets/faint.png" } } }
        Tile { x: 0; y: 100; materials: DefaultMaterial { normalMap: Texture { source: "../assets/tilt.png" } } }
        Tile { x: 80; y: 100; materials: DefaultMaterial { bumpAmount: 5; bumpMap: Texture { source: "../assets/slope.png" } } }
        Tile { x: 160; y: 100; materials: PrincipledMaterial { roughness: 1; alphaMode: PrincipledMaterial.Opaque; opacity: 0.5 } }
        Tile { x: -160; y: 0; materials: DefaultMaterial { diffuseColor: "#000000"; emissiveFactor: Qt.vector3d(1, 1, 1); emissiveMap: Texture { source: "../assets/flag.png" } } }
        Tile { x: -80; y: 0; materials: DefaultMaterial { opacityMap: Texture { source: "../assets/faint.png" } } }
        Model { source: "#Sphere"; x: 0; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; baseColor: "#ff0000"; clearcoatAmount: 1; clearcoatRoughnessAmount: 0.1 } }
        Model { source: "#Sphere"; x: 80; y: 0; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 1; normalMap: Texture { source: "../assets/tilt.png" } } }
        Tile { x: 160; y: 0; eulerRotation.y: 180; materials: PrincipledMaterial { roughness: 1; cullMode: Material.NoCulling; normalMap: Texture { source: "../assets/tilt.png" } } }
        Tile { x: -160; y: -100; materials: PrincipledMaterial { roughness: 1; emissiveFactor: Qt.vector3d(0.5, 0.5, 0.5); emissiveMap: Texture { source: "../assets/flag.png" } } }
        Tile { x: -80; y: -100; materials: PrincipledMaterial { roughness: 1; alphaMode: PrincipledMaterial.Mask; opacity: 0.5 } }
        Tile { x: 0; y: -100; materials: PrincipledMaterial { roughness: 1; normalMap: Texture { source: "../assets/tilt.png"; scaleU: -1 } } }
        Tile { x: 80; y: -100; eulerRotation.z: 90; materials: PrincipledMaterial { roughness: 1; normalMap: Texture { source: "../assets/tilt.png" } } }
        Model { source: "#Sphere"; x: 160; y: -100; scale: Qt.vector3d(0.6, 0.6, 0.6); materials: PrincipledMaterial { roughness: 0.3; baseColor: "#ff0000" } }
    }
}
