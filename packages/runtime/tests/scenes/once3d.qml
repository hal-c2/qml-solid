// Two balls that mirror what is round them, the left by a ReflectionProbe
// that looks once and the right by one that looks every time. `whiten()`
// makes the wall to the right of each white, and `ask()` asks the left
// probe to look again.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "white"

    property color wall: "#ff0000"
    function whiten() {
        root.wall = "#ffffff";
    }
    function ask() {
        once.probe.scheduleUpdate();
    }

    component Wall: Model {
        property color paint: "red"
        source: "#Cube"
        scale: Qt.vector3d(2, 2, 2)
        materials: PrincipledMaterial { lighting: PrincipledMaterial.NoLighting; baseColor: paint }
    }

    component Mirrors: View3D {
        property alias probe: probe
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
            source: "#Sphere"
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            receivesReflections: true
            materials: PrincipledMaterial { metalness: 1; roughness: 0; baseColor: "white" }
        }
        Wall { x: 300; paint: root.wall }
        Wall { x: -300; paint: "#00ff00" }
    }

    Row {
        Mirrors { id: once; probe.refreshMode: ReflectionProbe.FirstFrame }
        Mirrors { id: every }
    }
}
