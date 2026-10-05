// A view that draws a cube turning, and one that draws a cube once, each
// saying how fast it draws.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "white"

    property var turning: view.renderStats
    property var still: other.renderStats
    // What a binding to the frames a second was given.
    property var seen: []
    property int fps: view.renderStats.fps
    onFpsChanged: seen.push(fps)

    component Cube: View3D {
        property alias angle: cube.eulerRotation.y
        width: 200
        height: 200
        PerspectiveCamera { z: 300 }
        DirectionalLight {}
        Model {
            id: cube
            source: "#Cube"
            materials: PrincipledMaterial { baseColor: "red" }
        }
    }

    Row {
        Cube {
            id: view
            NumberAnimation on angle { from: 0; to: 360; duration: 4000; loops: Animation.Infinite }
        }
        Cube { id: other }
    }
}
