// The shapes QtQuick3D.Helpers works out, each turned so that more than one
// side of it is seen. Above and in the middle they are drawn with a picture
// and no light, to show where on each the picture lies; below they are grey
// under one light, to show which way each part of them faces.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    function box(model) {
        const b = model.bounds;
        return [[b.minimum.x, b.minimum.y, b.minimum.z], [b.maximum.x, b.maximum.y, b.maximum.z]];
    }

    function read() {
        return {
            plane: box(plane),
            turned: box(turned),
            cuboid: box(cuboid),
            sphere: box(sphere),
            torus: box(torus),
            cylinder: box(cylinder),
            cone: box(cone),
            cut: box(cut),
            given: box(given),
            grid: box(grid),
            nothing: box(nothing),
            status: [plane.geometry.status, nothing.geometry.status],
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
            eulerRotation: Qt.vector3d(-30, -30, 0)
        }

        Texture {
            id: picture
            source: "../assets/sky.png"
            magFilter: Texture.Nearest
            minFilter: Texture.Nearest
        }
        DefaultMaterial {
            id: drawn
            lighting: DefaultMaterial.NoLighting
            diffuseMap: picture
        }
        DefaultMaterial {
            id: orange
            lighting: DefaultMaterial.NoLighting
            diffuseColor: "#ff8000"
        }
        DefaultMaterial {
            id: grey
            diffuseColor: "#c0c0c0"
        }

        Model {
            id: plane
            x: -160
            y: 100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            geometry: PlaneGeometry {}
            materials: drawn
        }
        Model {
            id: turned
            x: -80
            y: 100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: -60
            geometry: PlaneGeometry {
                width: 120
                height: 80
                plane: PlaneGeometry.XZ
                reversed: true
                mirrored: true
                meshResolution: Qt.size(3, 5)
            }
            materials: drawn
        }
        Model {
            id: cuboid
            y: 100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(30, 30, 0)
            geometry: CuboidGeometry {
                xExtent: 100
                yExtent: 60
                zExtent: 80
            }
            materials: drawn
        }
        Model {
            id: sphere
            x: 80
            y: 100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(20, 40, 0)
            geometry: SphereGeometry {
                radius: 50
            }
            materials: drawn
        }
        Model {
            id: torus
            x: 160
            y: 100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: 60
            geometry: TorusGeometry {
                radius: 35
                tubeRadius: 15
            }
            materials: drawn
        }

        Model {
            id: cylinder
            x: -160
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(40, 0, 20)
            geometry: CylinderGeometry {
                radius: 30
                length: 80
            }
            materials: drawn
        }
        Model {
            id: cone
            x: -80
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: -50
            geometry: ConeGeometry {}
            materials: drawn
        }
        Model {
            id: cut
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: 50
            geometry: ConeGeometry {
                topRadius: 25
                bottomRadius: 50
                length: 60
                rings: 2
            }
            materials: drawn
        }
        Model {
            id: given
            x: 80
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            geometry: ProceduralMesh {
                positions: [Qt.vector3d(10, 10, 0), Qt.vector3d(50, 10, 0), Qt.vector3d(50, 50, 0), Qt.vector3d(10, 50, 0), Qt.vector3d(-50, -50, 0), Qt.vector3d(40, -50, 0), Qt.vector3d(-50, 30, 0)]
                normals: [Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1), Qt.vector3d(0, 0, 1)]
                uv0s: [Qt.vector2d(0, 0), Qt.vector2d(1, 0), Qt.vector2d(1, 1), Qt.vector2d(0, 1), Qt.vector2d(0.1, 0.1), Qt.vector2d(0.1, 0.1), Qt.vector2d(0.1, 0.1)]
                indexes: [0, 1, 2, 0, 2, 3, 4, 5, 6]
                subsets: [
                    ProceduralMeshSubset {
                        offset: 0
                        count: 6
                    },
                    ProceduralMeshSubset {
                        offset: 6
                        count: 3
                    }
                ]
            }
            materials: [drawn, orange]
        }
        Model {
            id: grid
            x: 160
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            geometry: GridGeometry {
                horizontalLines: 5
                verticalLines: 4
                horizontalStep: 20
                verticalStep: 30
            }
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#00ff00"
            }
        }
        Model {
            id: nothing
            geometry: SphereGeometry {
                segments: 2
            }
            materials: drawn
        }

        Model {
            x: -160
            y: -100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(30, 30, 0)
            geometry: CuboidGeometry {
                xExtent: 100
                yExtent: 60
                zExtent: 80
            }
            materials: grey
        }
        Model {
            x: -80
            y: -100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            geometry: SphereGeometry {
                radius: 50
            }
            materials: grey
        }
        Model {
            y: -100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(40, 0, 20)
            geometry: CylinderGeometry {
                radius: 30
                length: 80
            }
            materials: grey
        }
        Model {
            x: 80
            y: -100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: 50
            geometry: ConeGeometry {
                topRadius: 25
                bottomRadius: 50
                length: 60
            }
            materials: grey
        }
        Model {
            x: 160
            y: -100
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation.x: 60
            geometry: TorusGeometry {
                radius: 35
                tubeRadius: 15
            }
            materials: grey
        }
    }
}
