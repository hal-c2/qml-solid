// What a View3D paints: shapes with and without light on them, seen flat
// on by a camera that makes one unit one pixel.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        DirectionalLight {
            ambientColor: "#181818"
        }

        PointLight {
            x: 150
            y: -20
            z: 200
            color: "#ffe0c0"
            brightness: 0.5
        }

        // Its own colour, whatever light there is.
        Model {
            source: "#Rectangle"
            x: -150
            y: 90
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#336699"
            }
        }

        Model {
            source: "#Rectangle"
            x: -50
            y: 90
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                diffuseColor: "#cc6633"
            }
        }

        Model {
            source: "#Rectangle"
            x: 50
            y: 90
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: PrincipledMaterial {
                baseColor: "#33cc66"
                roughness: 0.5
            }
        }

        Model {
            source: "#Rectangle"
            x: 150
            y: 90
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: PrincipledMaterial {
                baseColor: "#c0a060"
                metalness: 1
                roughness: 0.3
            }
        }

        // Turned from the light, it is darker.
        Model {
            source: "#Rectangle"
            x: -150
            y: -20
            eulerRotation.y: 50
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                diffuseColor: "white"
            }
        }

        // What is behind shows through.
        Model {
            source: "#Rectangle"
            x: -50
            y: -20
            scale: Qt.vector3d(0.6, 0.6, 1)
            opacity: 0.5
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "red"
            }
        }

        Model {
            source: "#Rectangle"
            x: 50
            y: -20
            scale: Qt.vector3d(0.8, 0.4, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseMap: Texture {
                    source: "../assets/flag.png"
                    magFilter: Texture.Nearest
                }
            }
        }

        Model {
            source: "#Sphere"
            x: 150
            y: -20
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            materials: DefaultMaterial {
                diffuseColor: "#8080ff"
            }
        }

        // The nearer of two is the one seen, whichever is declared first.
        Model {
            source: "#Cube"
            x: -150
            y: -110
            z: 100
            scale: Qt.vector3d(0.3, 0.3, 0.3)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "yellow"
            }
        }

        Model {
            source: "#Rectangle"
            x: -150
            y: -110
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#00ffff"
            }
        }

        // Its back is not drawn, unless the material says so.
        Model {
            source: "#Rectangle"
            x: -50
            y: -110
            eulerRotation.y: 180
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "magenta"
            }
        }

        Model {
            source: "#Rectangle"
            x: 50
            y: -110
            eulerRotation.y: 180
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                cullMode: Material.NoCulling
                diffuseColor: "magenta"
            }
        }
    }

    function read() {
        return 1
    }
}
