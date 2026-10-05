// More nodes than a view can follow one by one: twelve rows of twenty
// squares, every row a node and every square a model with a material of its
// own. One square's colour, how much is seen through one row and whether
// another is shown are the scene's to change.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    property color paint: "red"
    property real faded: 1
    property bool shown: true

    function read() {
        return {};
    }

    function step(n) {
        root.paint = "lime";
        root.faded = 0.5;
        root.shown = false;
    }

    View3D {
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        Repeater3D {
            model: 12

            Node {
                id: row
                required property int index
                y: 110 - 20 * index
                opacity: index === 4 ? root.faded : 1
                visible: index !== 6 || root.shown

                Repeater3D {
                    model: 20

                    Model {
                        required property int index
                        x: -171 + 18 * index
                        source: "#Rectangle"
                        scale: Qt.vector3d(0.14, 0.14, 1)
                        materials: PrincipledMaterial {
                            lighting: PrincipledMaterial.NoLighting
                            baseColor: row.index === 2 && index === 7 ? root.paint : index % 2 ? "blue" : "white"
                        }
                    }
                }
            }
        }
    }
}
