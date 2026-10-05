// When what reads the picture of what is behind it is drawn: after what
// nothing is seen through and before all that something is, however far
// each is. Eight pairs in two rows before a brown wall: a square, and one
// 50 nearer the eye that is a little to the right of it and below. What
// reads the picture draws it with its red, green and blue changed about.
// Nothing is lit.
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

    component Reads: Model {
        property real dark: 1
        property real there: 1
        property bool blends: false
        property int hides: Material.OpaqueOnlyDepthDraw
        source: "#Rectangle"
        scale: Qt.vector3d(0.5, 0.5, 0.5)
        materials: CustomMaterial {
            property real shade: dark
            property real much: there
            shadingMode: CustomMaterial.Unshaded
            fragmentShader: "materials/behind.frag"
            sourceBlend: blends ? CustomMaterial.SrcAlpha : CustomMaterial.NoBlend
            destinationBlend: blends ? CustomMaterial.OneMinusSrcAlpha : CustomMaterial.NoBlend
            depthDrawMode: hides
        }
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        Square {
            z: -100
            scale: Qt.vector3d(4, 3, 1)
            paint: "#804020"
            through: 1
        }

        // What reads, before a blue square seen through and behind a red
        // one; before the blue and hiding nothing; and before another that
        // reads, itself half as bright.
        Square { x: -128; y: 68 }
        Reads { x: -112; y: 52; z: 50 }

        Reads { x: -48; y: 68 }
        Square { x: -32; y: 52; z: 50; paint: "red" }

        Square { x: 32; y: 68 }
        Reads { x: 48; y: 52; z: 50; hides: Material.NeverDepthDraw }

        Reads { x: 112; y: 68 }
        Reads { x: 128; y: 52; z: 50; dark: 0.5 }

        // Before a green square nothing is seen through; half there,
        // before the blue; half there, behind a red that is said to be 100
        // farther and hides; and half as bright and hiding nothing, before
        // another that is said to be 100 nearer.
        Square { x: -128; y: -52; paint: "#00ff00"; through: 1 }
        Reads { x: -112; y: -68; z: 50 }

        Square { x: -48; y: -52 }
        Reads { x: -32; y: -68; z: 50; there: 0.5; blends: true }

        Reads { x: 32; y: -52; there: 0.5; blends: true }
        Square { x: 48; y: -68; z: 50; paint: "red"; depthBias: 100; hides: Material.AlwaysDepthDraw }

        Reads { x: 112; y: -52; depthBias: -100 }
        Reads { x: 128; y: -68; z: 50; dark: 0.5; hides: Material.NeverDepthDraw }
    }
}
