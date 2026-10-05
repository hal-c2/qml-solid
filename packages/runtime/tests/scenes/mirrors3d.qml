// A ball that mirrors what is round it, by a ReflectionProbe: twelve views.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "white"

    component Wall: Model {
        property color paint: "red"
        source: "#Cube"
        scale: Qt.vector3d(2, 2, 2)
        materials: PrincipledMaterial { lighting: PrincipledMaterial.NoLighting; baseColor: paint }
    }

    component Mirrors: View3D {
        id: view
        property alias probe: probe
        property alias ball: ball
        property alias metal: metal
        property bool cast: true
        width: 100
        height: 100
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#204060"
        }
        OrthographicCamera { z: 500 }
        ReflectionProbe {
            id: probe
            boxSize: Qt.vector3d(2000, 2000, 2000)
        }
        Model {
            id: ball
            source: "#Sphere"
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            receivesReflections: true
            materials: PrincipledMaterial { id: metal; metalness: 1; roughness: 0; baseColor: "white" }
        }
        Wall { x: 300; paint: "#ff0000"; castsReflections: view.cast }
        Wall { x: -300; paint: "#00ff00" }
        Wall { y: 300; paint: "#0000ff" }
        Wall { y: -300; paint: "#ffff00" }
        Wall { z: 900; scale: Qt.vector3d(4, 4, 4); paint: "#804020" }
    }

    Grid {
        columns: 4
        Mirrors {}
        Mirrors { ball.receivesReflections: false }
        Mirrors { probe.clearColor: "#808080" }
        Mirrors { probe.boxSize: Qt.vector3d(50, 50, 50) }
        Mirrors { probe.boxSize: Qt.vector3d(50, 50, 50); probe.x: 60 }
        Mirrors { metal.roughness: 0.5 }
        Mirrors { cast: false }
        Mirrors { probe.x: 150 }
        Mirrors { probe.x: 150; probe.parallaxCorrection: true }
        Mirrors { metal.metalness: 0; metal.roughness: 1 }
        Mirrors { probe.quality: ReflectionProbe.VeryLow }
        Mirrors { metal.baseColor: "#808080" }
    }
}
