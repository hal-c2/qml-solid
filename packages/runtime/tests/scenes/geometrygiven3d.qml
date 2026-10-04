// A shape handed over as a C++ class derived from QQuick3DGeometry hands
// one over: rows of numbers, what each part of a row is, and the order the
// corners are joined in. Two triangles, the second a subset of its own.
// Qt has no Geometry a QML file can make, so this is not a scene for Qt.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 200
    height: 200
    color: "#202020"

    function floats(values) {
        const buffer = new ArrayBuffer(values.length * 4);
        new Float32Array(buffer).set(values);
        return buffer;
    }

    function shorts(values) {
        const buffer = new ArrayBuffer(values.length * 2);
        new Uint16Array(buffer).set(values);
        return buffer;
    }

    function read() {
        const b = model.bounds;
        return {
            bounds: [[b.minimum.x, b.minimum.y, b.minimum.z], [b.maximum.x, b.maximum.y, b.maximum.z]],
            stride: given.stride(),
            attributes: given.attributeCount(),
            second: [given.attribute(1).semantic, given.attribute(1).offset, given.attribute(1).componentType],
            primitive: given.primitiveType(),
            vertices: given.vertexData().byteLength,
            indices: given.indexData().byteLength,
            subsets: given.subsetCount(),
            name: given.subsetName(1),
            min: given.boundsMin().x,
            dirtied: root.dirtied,
        };
    }

    // Moves the first corner, as `setVertexData(offset, data)` does.
    function move() {
        given.setVertexData(0, floats([-80, -80, 0]));
    }

    function empty() {
        given.clear();
    }

    property int dirtied: 0

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        Model {
            id: model
            geometry: Geometry {
                id: given
                onGeometryNodeDirty: root.dirtied++
                Component.onCompleted: {
                    given.setStride(24);
                    given.addAttribute(Geometry.PositionSemantic, 0, Geometry.F32Type);
                    given.addAttribute(Geometry.NormalSemantic, 12, Geometry.F32Type);
                    given.addAttribute({ semantic: Geometry.IndexSemantic, offset: 0, componentType: Geometry.U16Type });
                    given.setVertexData(root.floats([-40, -80, 0, 0, 0, 1, 80, -80, 0, 0, 0, 1, 80, 40, 0, 0, 0, 1, -80, 80, 0, 0, 0, 1, -80, 0, 0, 0, 0, 1, 0, 80, 0, 0, 0, 1]));
                    given.setIndexData(root.shorts([0, 1, 2, 3, 4, 5]));
                    given.setPrimitiveType(Geometry.Triangles);
                    given.setBounds(Qt.vector3d(-80, -80, 0), Qt.vector3d(80, 80, 0));
                    given.addSubset(0, 3, Qt.vector3d(-40, -80, 0), Qt.vector3d(80, 40, 0), "lower");
                    given.addSubset(3, 3, Qt.vector3d(-80, 0, 0), Qt.vector3d(0, 80, 0), "upper");
                }
            }
            materials: [red, blue]
        }
        DefaultMaterial {
            id: red
            lighting: DefaultMaterial.NoLighting
            diffuseColor: "#ff0000"
        }
        DefaultMaterial {
            id: blue
            lighting: DefaultMaterial.NoLighting
            diffuseColor: "#0000ff"
        }
    }
}
