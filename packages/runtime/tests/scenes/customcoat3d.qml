// What a CustomMaterial that is lit says of a clear coat and of how much it
// gives back as it turns, its shaders given as text and not as files: two
// rows of five red balls lit from straight ahead at half strength, and under
// them four balls that mirror the walls round a ReflectionProbe.
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

    component Ball: Model {
        property string says: ""
        property string before: ""
        property string corners: ""
        source: "#Sphere"
        scale: Qt.vector3d(0.6, 0.6, 0.6)
        materials: CustomMaterial {
            property real much: 0.5
            property real sooner: 8
            shadingMode: CustomMaterial.Shaded
            __vertexShaderCode: corners
            __fragmentShaderCode: before + "void MAIN() { BASE_COLOR = vec4(1.0, 0.0, 0.0, 1.0); ROUGHNESS = 1.0; " + says + " }"
        }
    }

    component Wall: Model {
        property color paint: "red"
        source: "#Cube"
        scale: Qt.vector3d(2, 2, 2)
        materials: PrincipledMaterial { lighting: PrincipledMaterial.NoLighting; baseColor: paint }
    }

    component Mirrors: View3D {
        property string says: ""
        width: 100
        height: 100
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#204060"
        }
        OrthographicCamera { z: 500 }
        ReflectionProbe { boxSize: Qt.vector3d(2000, 2000, 2000) }
        Model {
            source: "#Sphere"
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            receivesReflections: true
            materials: CustomMaterial {
                shadingMode: CustomMaterial.Shaded
                __fragmentShaderCode: "void MAIN() { " + says + " }"
            }
        }
        Wall { x: 300; paint: "#ff0000" }
        Wall { x: -300; paint: "#00ff00" }
        Wall { y: 300; paint: "#0000ff" }
        Wall { y: -300; paint: "#ffff00" }
        Wall { z: 900; scale: Qt.vector3d(4, 4, 4); paint: "#804020" }
    }

    View3D {
        id: view
        width: 400
        height: 200
        camera: camera

        OrthographicCamera {
            id: camera
            z: 500
        }

        DirectionalLight {
            brightness: 0.5
        }

        Ball { x: -160; y: 50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3;" }
        Ball { x: -80; y: 50; says: "CLEARCOAT_AMOUNT = much; CLEARCOAT_ROUGHNESS = 0.3;" }
        Ball { x: 0; y: 50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3; CLEARCOAT_FRESNEL_POWER = 10 - sooner;" }
        Ball { x: 80; y: 50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3; CLEARCOAT_FRESNEL_SCALE = 0.5; CLEARCOAT_FRESNEL_BIAS = 0.2;" }
        Ball { x: 160; y: 50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3; CLEARCOAT_NORMAL = normalize(NORMAL + vec3(0.5, 0.0, 0.0));" }
        Ball { x: -160; y: -50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3; IOR = 2.0;" }
        Ball { x: -80; y: -50; says: "CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.3; NORMAL = normalize(NORMAL + vec3(0.0, 0.5, 0.0));" }
        Ball { x: 0; y: -50; says: "ROUGHNESS = 0.3;" }
        Ball { x: 80; y: -50; says: "ROUGHNESS = 0.3; FRESNEL_SCALE = 0.5; FRESNEL_BIAS = 0.2; TRANSMISSION_FACTOR = 0.0; THICKNESS_FACTOR = 0.0; ATTENUATION_COLOR = vec3(1.0); ATTENUATION_DISTANCE = 0.0;" }
        Ball {
            x: 160
            y: -50
            corners: "VARYING vec3 where; void MAIN() { where = VERTEX; }"
            before: "VARYING vec3 where; "
            says: "CLEARCOAT_AMOUNT = where.x > 0.0 ? 1.0 : 0.0; CLEARCOAT_ROUGHNESS = 0.3;"
        }
    }

    Row {
        y: 200
        Mirrors { says: "METALNESS = 1.0; ROUGHNESS = 0.0;" }
        Mirrors { says: "METALNESS = 0.0; ROUGHNESS = 1.0;" }
        Mirrors { says: "BASE_COLOR = vec4(0.0, 0.0, 0.0, 1.0); ROUGHNESS = 1.0; SPECULAR_AMOUNT = 0.0; CLEARCOAT_AMOUNT = 1.0; CLEARCOAT_ROUGHNESS = 0.0;" }
        Mirrors { says: "METALNESS = 1.0; ROUGHNESS = 0.0; FRESNEL_SCALE = 0.5; FRESNEL_BIAS = 0.2;" }
    }
}
