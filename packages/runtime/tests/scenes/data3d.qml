// Pictures given as their numbers, two pixels each way, on eight sheets.
// Above: four colours a byte each, the same as fractions, and two that are
// seen through, of which one says so. Below: one channel, numbers beside a
// file's name, fractions as a PrincipledMaterial's colour, and halves.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    readonly property var colours: [0.5, 0.25, 1, 1, 0.1, 0.02, 0.8, 1, 2, 0.5, 0.05, 1, 0.2, 0.2, 0.2, 1]

    function read() {
        return {};
    }

    function bytes(values) {
        const buffer = new ArrayBuffer(values.length);
        new Uint8Array(buffer).set(values);
        return buffer;
    }

    function fractions(values) {
        const buffer = new ArrayBuffer(values.length * 4);
        new Float32Array(buffer).set(values);
        return buffer;
    }

    function halves(values) {
        const buffer = new ArrayBuffer(values.length * 2);
        new Uint16Array(buffer).set(values);
        return buffer;
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        component Sheet: Model {
            id: sheet
            property TextureData numbers
            property bool principled: false
            source: "#Rectangle"
            scale: Qt.vector3d(0.8, 0.8, 1)
            materials: principled ? shown : drawn

            Texture {
                id: picture
                magFilter: Texture.Nearest
                minFilter: Texture.Nearest
                textureData: sheet.numbers
            }
            DefaultMaterial {
                id: drawn
                lighting: DefaultMaterial.NoLighting
                diffuseMap: picture
            }
            PrincipledMaterial {
                id: shown
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: picture
            }
        }

        Sheet {
            x: -150
            y: 50
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                textureData: root.bytes([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255])
            }
        }
        Sheet {
            x: -50
            y: 50
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                format: TextureData.RGBA32F
                textureData: root.fractions(root.colours)
            }
        }
        Sheet {
            x: 50
            y: 50
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                hasTransparency: true
                textureData: root.bytes([255, 0, 0, 128, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 64])
            }
        }
        Sheet {
            x: 150
            y: 50
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                textureData: root.bytes([255, 0, 0, 128, 0, 255, 0, 128, 0, 0, 255, 255, 255, 255, 0, 64])
            }
        }
        Sheet {
            x: -150
            y: -50
            principled: true
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                format: TextureData.R8
                textureData: root.bytes([255, 128, 64, 0])
            }
        }
        Model {
            source: "#Rectangle"
            x: -50
            y: -50
            scale: Qt.vector3d(0.8, 0.8, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseMap: Texture {
                    source: "../assets/sky.png"
                    textureData: ProceduralTextureData {
                        width: 1
                        height: 1
                        textureData: root.bytes([0, 128, 255, 255])
                    }
                }
            }
        }
        Sheet {
            x: 50
            y: -50
            principled: true
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                format: TextureData.RGBA32F
                textureData: root.fractions(root.colours)
            }
        }
        Sheet {
            x: 150
            y: -50
            numbers: ProceduralTextureData {
                width: 2
                height: 2
                format: TextureData.RGBA16F
                textureData: root.halves([0x3800, 0x3400, 0x3c00, 0x3c00, 0x2e66, 0x251f, 0x3a66, 0x3c00, 0x4000, 0x3800, 0x2a66, 0x3c00, 0x3266, 0x3266, 0x3266, 0x3c00])
            }
        }
    }
}
