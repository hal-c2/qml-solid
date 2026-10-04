// A scene whose surroundings are an ExtendedSceneEnvironment: what is drawn
// is brought to the screen by an effect after it rather than as each thing
// is drawn. `plain()` hands the scene to a SceneEnvironment that says the
// same, and the functions after it each change one thing the effect does.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 300
    height: 200
    color: "#202020"

    function plain() {
        view.environment = usual;
    }
    function brighter() {
        extended.exposure = 2.5;
    }
    function toned(mode, white) {
        extended.tonemapMode = mode;
        extended.whitePoint = white;
    }
    function adjusted() {
        extended.colorAdjustmentsEnabled = true;
        extended.adjustmentBrightness = 0.8;
        extended.adjustmentContrast = 1.3;
        extended.adjustmentSaturation = 0.4;
    }
    function vignetted() {
        extended.vignetteEnabled = true;
        extended.vignetteColor = "#200060";
        extended.vignetteRadius = 0.5;
        extended.vignetteStrength = 10;
    }
    function smooth() {
        extended.fxaaEnabled = true;
    }
    function sharp() {
        extended.sharpnessAmount = 0.8;
    }
    function dithered() {
        extended.ditheringEnabled = true;
    }
    function many() {
        extended.antialiasingMode = SceneEnvironment.MSAA;
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: extended

        ExtendedSceneEnvironment {
            id: extended
            backgroundMode: SceneEnvironment.Color
            clearColor: "#405060"
        }
        SceneEnvironment {
            id: usual
            backgroundMode: SceneEnvironment.Color
            clearColor: "#405060"
        }

        OrthographicCamera {
            id: camera
            z: 500
        }
        DirectionalLight {
            eulerRotation: Qt.vector3d(-30, -30, 0)
            brightness: 2
        }

        Model {
            x: -90
            source: "#Sphere"
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            materials: PrincipledMaterial {
                baseColor: "#c08040"
                roughness: 0.4
            }
        }
        Model {
            source: "#Cube"
            scale: Qt.vector3d(0.6, 0.6, 0.6)
            eulerRotation: Qt.vector3d(30, 30, 0)
            materials: DefaultMaterial {
                diffuseColor: "#40c060"
            }
        }
        Model {
            x: 90
            y: 40
            source: "#Rectangle"
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#8090ff"
            }
        }
        Model {
            x: 90
            y: -40
            source: "#Rectangle"
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColor: "#000000"
                emissiveFactor: Qt.vector3d(3, 1.5, 0.2)
            }
        }
        Model {
            x: 60
            z: 100
            source: "#Rectangle"
            scale: Qt.vector3d(0.5, 1.2, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ffffff"
                opacity: 0.4
            }
        }
    }
}
