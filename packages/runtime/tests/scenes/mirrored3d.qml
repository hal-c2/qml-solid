// What a ReflectionProbe sees and who mirrors it: twelve views of a ball
// between walls, as `mirrors3d` has, with the surroundings behind them,
// lights on the walls, a DefaultMaterial on the ball, a second probe, a
// probe whose box is not where it is, and tone mappings.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "white"

    component Wall: Model {
        property color paint: "red"
        property bool lit: false
        source: "#Cube"
        scale: Qt.vector3d(2, 2, 2)
        materials: PrincipledMaterial { lighting: lit ? PrincipledMaterial.FragmentLighting : PrincipledMaterial.NoLighting; baseColor: paint; roughness: 1 }
    }

    component Mirrors: View3D {
        id: view
        property alias probe: probe
        property alias ball: ball
        property alias metal: metal
        property alias sun: sun
        property bool lit: false
        property bool plain: false
        property bool second: false
        width: 100
        height: 100
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#204060"
        }
        OrthographicCamera { z: 500 }
        DirectionalLight { id: sun; visible: false; eulerRotation.x: -45 }
        ReflectionProbe {
            id: probe
            boxSize: Qt.vector3d(2000, 2000, 2000)
        }
        // Far from the ball, and so not its probe, where there is to be one.
        ReflectionProbe {
            x: view.second ? 20 : 100000
            boxSize: Qt.vector3d(2000, 2000, 2000)
            clearColor: "#808080"
        }
        Model {
            id: ball
            source: "#Sphere"
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            receivesReflections: true
            materials: view.plain ? plain : metal
        }
        PrincipledMaterial { id: metal; metalness: 1; roughness: 0; baseColor: "white" }
        DefaultMaterial { id: plain; diffuseColor: "white" }
        property alias plainer: plain
        Wall { x: 300; paint: "#ff0000"; lit: view.lit }
        Wall { x: -300; paint: "#00ff00"; lit: view.lit }
        Wall { y: 300; paint: "#0000ff"; lit: view.lit }
        Wall { y: -300; paint: "#ffff00"; lit: view.lit }
        Wall { z: 900; scale: Qt.vector3d(4, 4, 4); paint: "#804020"; lit: view.lit }
    }

    Grid {
        columns: 4
        Mirrors { environment: SceneEnvironment { backgroundMode: SceneEnvironment.SkyBox; lightProbe: Texture { source: "../assets/sky.png" } } }
        Mirrors { environment: SceneEnvironment { backgroundMode: SceneEnvironment.Color; clearColor: "#204060"; lightProbe: Texture { source: "../assets/sky.png" } } }
        Mirrors { lit: true; sun.visible: true }
        Mirrors { plain: true }
        Mirrors { plain: true; plainer.specularAmount: 1; plainer.specularRoughness: 0 }
        Mirrors { second: true }
        Mirrors { second: true; probe.x: -30 }
        Mirrors { probe.boxSize: Qt.vector3d(50, 50, 50); probe.x: 120 }
        Mirrors { probe.boxSize: Qt.vector3d(50, 50, 50); probe.x: 150; probe.boxOffset: Qt.vector3d(-150, 0, 0) }
        Mirrors { environment: SceneEnvironment { backgroundMode: SceneEnvironment.Color; clearColor: "#204060"; tonemapMode: SceneEnvironment.TonemapModeNone } }
        Mirrors {
            environment: SceneEnvironment { backgroundMode: SceneEnvironment.Color; clearColor: "#204060"; tonemapMode: SceneEnvironment.TonemapModeFilmic }
            probe.clearColor: "#808080"
        }
        Mirrors { plain: true; plainer.specularAmount: 1; plainer.specularRoughness: 0.5 }
    }
}
