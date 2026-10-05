// A table of instances read from a file: one written as XML, and the same
// as Qt's `instancer` keeps it.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 300
    height: 200
    color: "#202020"

    function v3(v) { return [v.x, v.y, v.z] }
    function q4(q) { return [q.scalar, q.x, q.y, q.z] }
    function c4(c) { return [c.r, c.g, c.b, c.a] }
    function entry(table, i) {
        let d = table.instanceCustomData(i);
        return { position: v3(table.instancePosition(i)), scale: v3(table.instanceScale(i)), rotation: q4(table.instanceRotation(i)), color: c4(table.instanceColor(i)), data: [d.x, d.y, d.z, d.w] };
    }
    function all(table) {
        let made = [];
        for (let i = 0; i < table.instanceCount; i++) made.push(entry(table, i));
        return made;
    }
    function read() {
        return { count: [written.instanceCount, kept.instanceCount, none.instanceCount], written: all(written), kept: all(kept) };
    }

    View3D {
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }
        DirectionalLight {
        }

        FileInstancing {
            id: written
            source: "../assets/entries.xml"
        }
        FileInstancing {
            id: kept
            source: "../assets/entries.bin"
        }
        FileInstancing {
            id: none
        }

        Model {
            source: "#Cube"
            scale: Qt.vector3d(0.1, 0.1, 0.1)
            instancing: written
            materials: PrincipledMaterial {
            }
        }
        Model {
            source: "#Cube"
            scale: Qt.vector3d(0.1, 0.1, 0.1)
            instancing: kept
            materials: PrincipledMaterial {
            }
        }
        Model {
            source: "#Cube"
            scale: Qt.vector3d(0.1, 0.1, 0.1)
            instancing: none
            materials: PrincipledMaterial {
            }
        }
    }
}
