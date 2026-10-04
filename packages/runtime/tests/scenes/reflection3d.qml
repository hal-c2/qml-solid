// Two reflection probes in a scene: one as it comes, one with everything
// asked of it. `read()` is what each says of itself.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 100
    height: 100

    function numbers(v) {
        return [v.x, v.y, v.z];
    }
    function told(probe) {
        return {
            quality: probe.quality,
            clearColor: "" + probe.clearColor,
            refreshMode: probe.refreshMode,
            timeSlicing: probe.timeSlicing,
            parallaxCorrection: probe.parallaxCorrection,
            boxSize: numbers(probe.boxSize),
            boxOffset: numbers(probe.boxOffset),
            debugView: probe.debugView,
            texture: probe.texture,
            scenePosition: numbers(probe.scenePosition),
            scheduleUpdate: typeof probe.scheduleUpdate
        };
    }
    function read() {
        return {
            plain: told(plain),
            asked: told(asked),
            enums: [ReflectionProbe.VeryLow, ReflectionProbe.Low, ReflectionProbe.Medium, ReflectionProbe.High, ReflectionProbe.VeryHigh,
                    ReflectionProbe.FirstFrame, ReflectionProbe.EveryFrame,
                    ReflectionProbe.None, ReflectionProbe.AllFacesAtOnce, ReflectionProbe.IndividualFaces]
        };
    }

    View3D {
        id: view
        anchors.fill: parent

        ReflectionProbe {
            id: plain
        }
        Node {
            x: 10

            ReflectionProbe {
                id: asked
                y: 5
                boxSize.x: 3000
                boxOffset.y: 990
                timeSlicing: ReflectionProbe.IndividualFaces
                quality: ReflectionProbe.VeryHigh
                refreshMode: ReflectionProbe.FirstFrame
                parallaxCorrection: true
                clearColor: "#102030"
            }
        }
    }
}
