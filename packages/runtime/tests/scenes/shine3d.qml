// What a DefaultMaterial gives back of a light: four brown balls lit from
// straight ahead, one a little rough, one smooth, one tinted green and half
// as shiny, and one that gives nothing back.
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
            clearColor: "#202020"
        }

        PerspectiveCamera {
            id: camera
            z: 259.8
            clipNear: 1
        }

        DirectionalLight {
        }

        component Ball: Model { source: "#Sphere"; scale: Qt.vector3d(0.6, 0.6, 0.6) }
        Ball { x: -120; materials: DefaultMaterial { diffuseColor: "#804020"; specularAmount: 1; specularRoughness: 0.3 } }
        Ball { x: -40; materials: DefaultMaterial { diffuseColor: "#804020"; specularAmount: 1 } }
        Ball { x: 40; materials: DefaultMaterial { diffuseColor: "#804020"; specularAmount: 0.5; specularRoughness: 0.3; specularTint: "#00ff00" } }
        Ball { x: 120; materials: DefaultMaterial { diffuseColor: "#804020" } }
    }
}
