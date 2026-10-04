// What a CustomMaterial paints: shapes drawn by shaders of the scene's own,
// written as Qt has them written, with the material's properties as what
// they are handed. Seen flat on by a camera that makes one unit one pixel.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function retint() {
        plain.tint = "#996633";
    }
    function shifted() {
        moved.shift = Qt.vector2d(0, -10);
        moved.steps = 1;
    }

    component Tile: Model {
        property int column: 0
        property int row: 0
        source: "#Rectangle"
        x: -175 + 50 * column
        y: 125 - 50 * row
        scale: Qt.vector3d(0.4, 0.4, 1)
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
            ambientColor: "#181818"
        }

        PointLight {
            x: 150
            y: -20
            z: 200
            color: "#ffe0c0"
            brightness: 0.5
        }

        // What is not lit is the colour its shader says.
        Tile {
            materials: CustomMaterial {
                id: plain
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                property color tint: "#336699"
            }
        }

        // Its corners are where its own shader puts them, and what that
        // hands on is what the other reads.
        Tile {
            column: 1
            materials: CustomMaterial {
                id: moved
                shadingMode: CustomMaterial.Unshaded
                vertexShader: "materials/moved.vert"
                fragmentShader: "materials/moved.frag"
                property vector2d shift: Qt.vector2d(0, 0)
                property real level: 0.5
                property int steps: 2
                property bool on: true
                property vector3d rgb: Qt.vector3d(1, 0.5, 0.25)
                property vector4d more: Qt.vector4d(0, 0, 0, 0.75)
            }
        }

        Tile {
            column: 2
            scale: Qt.vector3d(0.4, 0.2, 1)
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                vertexShader: "materials/moved.vert"
                fragmentShader: "materials/picture.frag"
                property vector2d shift: Qt.vector2d(0, 0)
                property TextureInput base: TextureInput {
                    texture: Texture {
                        source: "../assets/flag.png"
                        magFilter: Texture.Nearest
                    }
                }
            }
        }

        // Seen through as its blending says.
        Tile {
            column: 3
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                sourceBlend: CustomMaterial.SrcAlpha
                destinationBlend: CustomMaterial.OneMinusSrcAlpha
                property color tint: "#80ff0000"
            }
        }

        Tile {
            column: 4
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                sourceBlend: CustomMaterial.One
                destinationBlend: CustomMaterial.One
                property color tint: "#404040"
            }
        }

        Tile {
            column: 5
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                property color tint: "#80ff0000"
            }
        }

        Tile {
            column: 6
            opacity: 0.5
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                property color tint: "#00ff00"
            }
        }

        Tile {
            column: 7
            eulerRotation.y: 180
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                cullMode: Material.NoCulling
                fragmentShader: "materials/plain.frag"
                property color tint: "magenta"
            }
        }

        // What is lit is lit as a PrincipledMaterial is.
        Tile {
            row: 1
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                property color tint: "#33cc66"
                property real rough: 0.5
                property real metal: 0
            }
        }

        Tile {
            row: 1
            column: 1
            materials: PrincipledMaterial {
                baseColor: "#33cc66"
                roughness: 0.5
                specularAmount: 0.5
            }
        }

        Tile {
            row: 1
            column: 2
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                property color tint: "#c0a060"
                property real rough: 0.3
                property real metal: 1
            }
        }

        Tile {
            row: 1
            column: 3
            materials: PrincipledMaterial {
                baseColor: "#c0a060"
                roughness: 0.3
                metalness: 1
            }
        }

        // Unless it says itself what each light gives it.
        Tile {
            row: 1
            column: 4
            materials: CustomMaterial {
                fragmentShader: "materials/ambient.frag"
            }
        }

        Tile {
            row: 1
            column: 5
            materials: CustomMaterial {
                fragmentShader: "materials/shine.frag"
            }
        }

        Tile {
            row: 1
            column: 6
            materials: CustomMaterial {
                fragmentShader: "materials/post.frag"
            }
        }

        Tile {
            row: 1
            column: 7
            opacity: 0.5
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                property color tint: "#ff0000"
                property real rough: 1
                property real metal: 0
            }
        }

        Tile {
            row: 2
            materials: CustomMaterial {
                vertexShader: "materials/raised.vert"
                fragmentShader: "materials/raised.frag"
                property real rise: 20
                property real lean: 1
            }
        }

        Tile {
            row: 2
            column: 1
            scale: Qt.vector3d(0.4, 0.2, 1)
            materials: CustomMaterial {
                fragmentShader: "materials/sampled.frag"
                property TextureInput base: TextureInput {
                    texture: Texture {
                        source: "../assets/flag.png"
                        magFilter: Texture.Nearest
                    }
                }
            }
        }

        Tile {
            row: 2
            column: 2
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                property color tint: "#80ff0000"
                property real rough: 1
                property real metal: 0
            }
        }

        Tile {
            row: 2
            column: 3
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                sourceBlend: CustomMaterial.SrcAlpha
                destinationBlend: CustomMaterial.OneMinusSrcAlpha
                property color tint: "#80ff0000"
                property real rough: 1
                property real metal: 0
            }
        }

        // One of many is its entry's colour, where its entry puts it.
        Model {
            source: "#Rectangle"
            x: 50
            y: 25
            scale: Qt.vector3d(0.2, 0.2, 1)
            instancing: InstanceList {
                instances: [
                    InstanceListEntry { position: Qt.vector3d(-15, 10, 0); color: "#ff8000" },
                    InstanceListEntry { position: Qt.vector3d(15, -10, 0); color: "#0080ff" }
                ]
            }
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                vertexShader: "materials/each.vert"
                fragmentShader: "materials/each.frag"
            }
        }

        Model {
            source: "#Rectangle"
            x: 100
            y: 25
            scale: Qt.vector3d(0.2, 0.2, 1)
            instancing: InstanceList {
                instances: [
                    InstanceListEntry { position: Qt.vector3d(-15, 10, 0); color: "#ff8000" },
                    InstanceListEntry { position: Qt.vector3d(15, -10, 0); color: "#0080ff" }
                ]
            }
            materials: CustomMaterial {
                fragmentShader: "materials/lit.frag"
                property color tint: "#ffffff"
                property real rough: 1
                property real metal: 0
            }
        }

        // What is behind it, as the shader reads it.
        Tile {
            row: 3
            scale: Qt.vector3d(0.6, 0.2, 1)
            x: -150
            z: -10
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ff8040"
            }
        }

        Tile {
            row: 3
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/screen.frag"
            }
        }

        Tile {
            row: 3
            scale: Qt.vector3d(0.6, 0.2, 1)
            x: -50
            z: -10
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ff8040"
            }
        }

        // And how far it is: what is blended reads of what is behind it,
        // what is not, of itself as well.
        Tile {
            row: 3
            column: 2
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/depth.frag"
                sourceBlend: CustomMaterial.One
                destinationBlend: CustomMaterial.Zero
            }
        }

        Tile {
            row: 3
            column: 6
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/depth.frag"
            }
        }

        // Where the eye is, which way it looks and how far it sees, and
        // how it sees.
        Tile {
            row: 3
            column: 4
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/camera.frag"
            }
        }

        Tile {
            row: 3
            column: 5
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                vertexShader: "materials/seen.vert"
                fragmentShader: "materials/seen.frag"
                property var much: 0.5
            }
        }

        // How much of it is there, blended by itself.
        Tile {
            row: 3
            column: 7
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Unshaded
                fragmentShader: "materials/plain.frag"
                sourceBlend: CustomMaterial.SrcAlpha
                destinationBlend: CustomMaterial.OneMinusSrcAlpha
                sourceAlphaBlend: CustomMaterial.One
                destinationAlphaBlend: CustomMaterial.Zero
                property color tint: "#80ff0000"
            }
        }
    }
}
