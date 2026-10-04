// The pictures a material reads besides its colour's: three rows of five
// tiles, each with one of them, lit from straight ahead at half strength.
// The pictures are flat (`tests/assets/makemaps.py`), so a tile is one colour.
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

        Tile { x: -160; y: 100; materials: PrincipledMaterial { roughness: 1 } }
        Tile { x: -80; y: 100; materials: PrincipledMaterial { roughness: 1; normalMap: Texture { source: "../assets/tilt.png" } } }
        Tile { x: 0; y: 100; materials: PrincipledMaterial { roughness: 1; normalStrength: 0.4; normalMap: Texture { source: "../assets/tilt.png" } } }
        Tile { x: 80; y: 100; materials: PrincipledMaterial { roughness: 1; roughnessMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 160; y: 100; materials: PrincipledMaterial { roughness: 1; roughnessChannel: Material.R; roughnessMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: -160; y: 0; materials: PrincipledMaterial { roughness: 0.5; baseColor: "#ff8040"; metalness: 1 } }
        Tile { x: -80; y: 0; materials: PrincipledMaterial { roughness: 0.5; baseColor: "#ff8040"; metalness: 1; metalnessMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 0; y: 0; materials: PrincipledMaterial { roughness: 0.5; baseColor: "#ff8040"; metalness: 1; metalnessChannel: Material.G; metalnessMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 80; y: 0; materials: PrincipledMaterial { roughness: 1; occlusionMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 160; y: 0; materials: PrincipledMaterial { roughness: 1; occlusionAmount: 0.5; occlusionChannel: Material.B; occlusionMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: -160; y: -100; materials: PrincipledMaterial { roughness: 1; baseColor: "#000000"; emissiveFactor: Qt.vector3d(1, 1, 1); emissiveMap: Texture { source: "../assets/flag.png" } } }
        Tile { x: -80; y: -100; materials: PrincipledMaterial { roughness: 1; opacityChannel: Material.R; opacityMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 0; y: -100; materials: PrincipledMaterial { roughness: 1; opacityChannel: Material.R; invertOpacityMapValue: true; opacityMap: Texture { source: "../assets/parts.png" } } }
        Tile { x: 80; y: -100; materials: PrincipledMaterial { roughness: 1; opacityMap: Texture { source: "../assets/faint.png" } } }
        Tile { x: 160; y: -100; materials: PrincipledMaterial { roughness: 1; roughnessMap: Texture { source: "../assets/faint.png" } } }
    }
}
