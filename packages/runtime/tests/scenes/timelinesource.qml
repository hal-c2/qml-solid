import QtQuick
import QtQuick.Timeline

// Groups whose keyframes are in files, one with a keyframe of its own as
// well, two whose file is not one, and one with no keyframes at all.
Item {
    id: root
    width: 400
    height: 300
    property real n: 1
    property vector3d v: Qt.vector3d(0, 0, 0)
    property quaternion q: Qt.quaternion(0, 1, 0, 0)
    property color c: "red"
    property bool flag: false
    property real mixed: 1
    property real bad: 1
    property real none: 1
    property alias timeline: timeline
    property alias gm: gm

    Timeline {
        id: timeline
        startFrame: 0; endFrame: 100; enabled: true
        KeyframeGroup { target: root; property: "n"; keyframeSource: "../assets/number.qad" }
        KeyframeGroup { target: root; property: "v"; keyframeSource: "../assets/vector.qad" }
        KeyframeGroup { target: root; property: "q"; keyframeSource: "../assets/turn.qad" }
        KeyframeGroup { target: root; property: "c"; keyframeSource: "../assets/colour.qad" }
        KeyframeGroup { target: root; property: "flag"; keyframeSource: "../assets/flag.qad" }
        KeyframeGroup {
            id: gm
            target: root; property: "mixed"; keyframeSource: "../assets/number.qad"
            Keyframe { frame: 75; value: 1000 }
        }
        KeyframeGroup { target: root; property: "bad"; keyframeSource: "../assets/bad.qad" }
        KeyframeGroup { target: root; property: "bad"; keyframeSource: "../assets/missing.qad" }
        KeyframeGroup { target: root; property: "none" }
    }
    function count() { return gm.keyframes.length }
    function at(frame) {
        timeline.currentFrame = frame
        return [n, String(v), String(q), String(c), flag, mixed, bad, none]
    }
}
