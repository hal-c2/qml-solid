import QtQuick
import QtQuick.Timeline

// A timeline over a bound property, a colour, and two that are not
// interpolated.
Item {
    id: root
    width: 400
    height: 300
    property real base: 40
    property alias timeline: timeline
    property alias box: box

    Rectangle {
        id: box
        width: 50; height: 50
        x: root.base; y: 7
        color: "red"
        objectName: "start"
    }
    Timeline {
        id: timeline
        startFrame: 0
        endFrame: 100
        enabled: false
        KeyframeGroup {
            target: box; property: "x"
            Keyframe { frame: 20; value: 100 }
            Keyframe { frame: 60; value: 200; easing.type: Easing.InQuad }
            Keyframe { frame: 80; value: 0 }
        }
        KeyframeGroup {
            target: box; property: "color"
            Keyframe { frame: 0; value: "blue" }
            Keyframe { frame: 100; value: "#80ffff00" }
        }
        KeyframeGroup {
            target: box; property: "visible"
            Keyframe { frame: 30; value: false }
            Keyframe { frame: 70; value: true }
        }
        KeyframeGroup {
            target: box; property: "objectName"
            Keyframe { frame: 30; value: "thirty" }
            Keyframe { frame: 70; value: "seventy" }
        }
    }
    function read() { return [box.x, String(box.color), box.visible, box.objectName] }
    function at(frame) { timeline.currentFrame = frame; return read() }
}
