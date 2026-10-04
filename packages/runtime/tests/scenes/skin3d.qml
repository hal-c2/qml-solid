// A shape bent by joints: a strip whose lower half goes with one joint and
// whose upper half with another, as `tests/assets/makemesh.py` writes it.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function read() {
        return {
            bounds: [bent.bounds.minimum, bent.bounds.maximum].map((v) => [v.x, v.y, v.z]),
        };
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
            eulerRotation.y: 30
        }

        // The upper joint turned over to the right. Where the model itself
        // is put, and how big, does not come into it.
        Node {
            x: -120
            y: -100

            Skin {
                id: bentSkin
                joints: [a0, a1]
                inverseBindPoses: [Qt.matrix4x4(), Qt.matrix4x4(1, 0, 0, 0, 0, 1, 0, -100, 0, 0, 1, 0, 0, 0, 0, 1)]
            }

            Model {
                id: bent
                x: 300
                scale: Qt.vector3d(3, 3, 3)
                source: "../assets/bar.mesh"
                skin: bentSkin
                materials: DefaultMaterial {
                    lighting: DefaultMaterial.NoLighting
                    diffuseColor: "#ff0000"
                    cullMode: Material.NoCulling
                }
            }

            Node {
                id: a0

                Node {
                    id: a1
                    y: 100
                    eulerRotation.z: -90
                }
            }
        }

        // Joints with no pose to undo: the upper half goes where its joint
        // is from the middle of the scene.
        Node {
            y: -100

            Skin {
                id: plainSkin
                joints: [b0, b1]
            }

            Model {
                source: "../assets/bar.mesh"
                skin: plainSkin
                materials: DefaultMaterial {
                    lighting: DefaultMaterial.NoLighting
                    diffuseColor: "#00ff00"
                    cullMode: Material.NoCulling
                }
            }

            Node {
                id: b0

                Node {
                    id: b1
                    x: 60
                }
            }
        }

        // The upper joint turned from the light and squashed: the way the
        // strip faces turns with it.
        Node {
            x: 120
            y: -100

            Skin {
                id: litSkin
                joints: [c0, c1]
                inverseBindPoses: [Qt.matrix4x4(), Qt.matrix4x4(1, 0, 0, 0, 0, 1, 0, -100, 0, 0, 1, 0, 0, 0, 0, 1)]
            }

            Model {
                source: "../assets/bar.mesh"
                skin: litSkin
                materials: DefaultMaterial {
                    diffuseColor: "#ffffff"
                    cullMode: Material.NoCulling
                }
            }

            Node {
                id: c0

                Node {
                    id: c1
                    y: 100
                    eulerRotation.y: -60
                    scale: Qt.vector3d(1, 0.5, 1)
                }
            }
        }
    }
}
