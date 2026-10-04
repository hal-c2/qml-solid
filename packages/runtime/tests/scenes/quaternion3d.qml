// The turns `Quaternion` makes by name: `read()` is each of them as its four
// numbers, and the square is turned by one.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 200
    height: 100
    color: "#202020"

    function show(q) {
        return [q.scalar, q.x, q.y, q.z];
    }
    function read() {
        return {
            euler: show(Quaternion.fromEulerAngles(-10, -45, 0)),
            eulerVector: show(Quaternion.fromEulerAngles(Qt.vector3d(30, 60, 90))),
            axis: show(Quaternion.fromAxisAndAngle(1, 2, 3, 40)),
            axisVector: show(Quaternion.fromAxisAndAngle(Qt.vector3d(0, 1, 0), 90)),
            none: show(Quaternion.fromAxisAndAngle(0, 0, 0, 90)),
            two: show(Quaternion.fromAxesAndAngles(Qt.vector3d(1, 0, 0), 30, Qt.vector3d(0, 1, 0), 60)),
            three: show(Quaternion.fromAxesAndAngles(Qt.vector3d(1, 0, 0), 30, Qt.vector3d(0, 1, 0), 60, Qt.vector3d(0, 0, 1), 90)),
            look: show(Quaternion.lookAt(Qt.vector3d(0, 0, 0), Qt.vector3d(100, 50, -100))),
            lookFrom: show(Quaternion.lookAt(Qt.vector3d(10, 20, 30), Qt.vector3d(-5, 0, 0), Qt.vector3d(0, 0, 2), Qt.vector3d(0, 1, 0))),
            ahead: show(Quaternion.lookAt(Qt.vector3d(0, 0, 0), Qt.vector3d(0, 0, -10))),
            behind: show(Quaternion.lookAt(Qt.vector3d(0, 0, 0), Qt.vector3d(0, 0, 10))),
            same: show(Quaternion.lookAt(Qt.vector3d(1, 1, 1), Qt.vector3d(1, 1, 1))),
            square: show(square.rotation),
        };
    }

    View3D {
        anchors.fill: parent
        PerspectiveCamera { z: 300 }
        DirectionalLight {}
        Model {
            id: square
            source: "#Rectangle"
            rotation: Quaternion.fromEulerAngles(-10, -45, 0)
            materials: PrincipledMaterial { baseColor: "red" }
        }
    }
}
