// A shape that goes towards the other shapes its mesh has of itself: a square
// 30 across facing the eye, with one target twice as wide that faces a
// little to the right and one twice as tall that faces a little upwards, as
// `tests/assets/makemesh.py` writes it. Twelve of it in three rows, lit from
// straight ahead at half strength.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    property real grown: 0.5

    function read() {
        return {};
    }

    function step(n) {
        root.grown = 1;
    }

    component Sheet: Model {
        source: "../assets/sheet.mesh"
        materials: PrincipledMaterial {
            baseColor: "#ffffff"
            roughness: 1
        }
    }

    component Told: Model {
        property string corners: ""
        property string pixels: "void MAIN() { BASE_COLOR = vec4(1.0); ROUGHNESS = 1.0; }"
        property int lit: CustomMaterial.Shaded
        source: "../assets/sheet.mesh"
        materials: CustomMaterial {
            property real much: 0.5
            shadingMode: lit
            __vertexShaderCode: corners
            __fragmentShaderCode: pixels
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

        DirectionalLight {
            brightness: 0.5
        }

        // With no targets said, and gone all the way to the first, half way
        // to it, and half way to the first with all the way to the second.
        Sheet { x: -150; y: 100 }
        Sheet { x: -50; y: 100; morphTargets: MorphTarget { weight: 1 } }
        Sheet { x: 50; y: 100; morphTargets: MorphTarget { weight: root.grown } }
        Sheet { x: 150; y: 100; morphTargets: [ MorphTarget { weight: 0.5 }, MorphTarget { weight: 1 } ] }

        // More targets said than the mesh has, and one said to be of how
        // the corners face alone.
        Sheet { x: -150; morphTargets: [ MorphTarget {}, MorphTarget { weight: 1 }, MorphTarget { weight: 1 } ] }
        Sheet { x: -50; morphTargets: MorphTarget { weight: 1; attributes: MorphTarget.Normal } }
        // A CustomMaterial that says nothing of the corners, and one that
        // says something of them and nothing of the targets.
        Told { x: 50; morphTargets: MorphTarget { weight: 1 } }
        Told { x: 150; corners: "void MAIN() { }"; morphTargets: MorphTarget { weight: 1 } }

        // What a CustomMaterial has of the targets itself: where the second
        // has a corner, how the first has it face, how much each weighs and
        // how many there are, and what there is of a shape with none.
        Told {
            x: -150
            y: -100
            corners: "void MAIN() { VERTEX += (MORPH_POSITION(1) - VERTEX) * much; }"
            morphTargets: [ MorphTarget { weight: 1 }, MorphTarget { weight: 1 } ]
        }
        Told {
            x: -50
            y: -100
            lit: CustomMaterial.Unshaded
            corners: "VARYING vec3 faced; void MAIN() { faced = MORPH_NORMAL(0); vec3 from = VERTEX; VERTEX += MORPH_WEIGHTS[0] * (MORPH_POSITION(0) - from) + MORPH_WEIGHTS[1] * (MORPH_POSITION(1) - from); POSITION = MODELVIEWPROJECTION_MATRIX * vec4(VERTEX, 1.0); }"
            pixels: "VARYING vec3 faced; void MAIN() { FRAGCOLOR = vec4(faced, 1.0); }"
            morphTargets: [ MorphTarget { weight: 1 }, MorphTarget { weight: 0.5 } ]
        }
        Told {
            x: 50
            y: -100
            corners: "void MAIN() { vec3 from = VERTEX; for (int i = 0; i < QT_MORPH_MAX_COUNT; ++i) VERTEX += MORPH_WEIGHTS[i] * (MORPH_POSITION(i) - from); }"
            morphTargets: [ MorphTarget { weight: 0.5 }, MorphTarget { weight: 1 } ]
        }
        Told {
            x: 150
            y: -100
            source: "#Rectangle"
            scale: Qt.vector3d(0.3, 0.3, 0.3)
            corners: "void MAIN() { VERTEX += MORPH_POSITION(0); }"
            morphTargets: MorphTarget { weight: 1 }
        }
    }
}
