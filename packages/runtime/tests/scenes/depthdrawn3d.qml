// Which of two squares is drawn over the other where one is said to be
// farther or nearer than it is (`depthBias`), and where a material says
// whether what it draws hides what is drawn behind it afterwards
// (`depthDrawMode`). Ten pairs in two rows: a blue square, and a red one 50
// nearer the eye that is a little to the right of it and below. Nothing is
// lit.
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

    component Square: Model {
        property color paint: "blue"
        property real through: 0.5
        property int hides: Material.OpaqueOnlyDepthDraw
        source: "#Rectangle"
        scale: Qt.vector3d(0.5, 0.5, 0.5)
        materials: PrincipledMaterial {
            lighting: PrincipledMaterial.NoLighting
            baseColor: paint
            opacity: through
            depthDrawMode: hides
        }
    }

    component Far: Square { }
    component Near: Square { paint: "red"; z: 50 }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        // Both seen through: as they are; the red said to be 5 farther,
        // and 8; the blue said to be 8 nearer; and the red said to be 100
        // farther, hiding what is behind it.
        Far { x: -168; y: 68 }
        Near { x: -152; y: 52 }

        Far { x: -88; y: 68 }
        Near { x: -72; y: 52; depthBias: 5 }

        Far { x: -8; y: 68 }
        Near { x: 8; y: 52; depthBias: 8 }

        Far { x: 72; y: 68; depthBias: -8 }
        Near { x: 88; y: 52 }

        Far { x: 152; y: 68 }
        Near { x: 168; y: 52; depthBias: 100; hides: Material.AlwaysDepthDraw }

        // The red seen through and hiding what is behind it, where it is;
        // then neither seen through: the red hiding nothing; neither hiding
        // anything; neither hiding anything and the red said to be 100
        // farther; and both seen through again, the blue said to be 100
        // nearer and hiding what is behind it.
        Far { x: -168; y: -52 }
        Near { x: -152; y: -68; hides: Material.AlwaysDepthDraw }

        Far { x: -88; y: -52; through: 1 }
        Near { x: -72; y: -68; through: 1; hides: Material.NeverDepthDraw }

        Far { x: -8; y: -52; through: 1; hides: Material.NeverDepthDraw }
        Near { x: 8; y: -68; through: 1; hides: Material.NeverDepthDraw }

        Far { x: 72; y: -52; through: 1; hides: Material.NeverDepthDraw }
        Near { x: 88; y: -68; through: 1; depthBias: 100; hides: Material.NeverDepthDraw }

        Far { x: 152; y: -52; depthBias: -100; hides: Material.AlwaysDepthDraw }
        Near { x: 168; y: -68 }
    }
}
