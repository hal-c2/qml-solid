import QtQuick
import QtQuick.Timeline

// One keyframe at the end for a property of each type: the way there from
// the value it had.
Item {
    id: root
    width: 400
    height: 300
    property real level: 1.5
    property color tint: "#102030"
    property vector2d v2: Qt.vector2d(1, 2)
    property vector3d v3: Qt.vector3d(1, 2, 3)
    property vector4d v4: Qt.vector4d(1, 2, 3, 4)
    property quaternion quat: Qt.quaternion(1, 0, 0, 0)
    property point pt: Qt.point(1, 2)
    property size sz: Qt.size(10, 20)
    property rect rc: Qt.rect(1, 2, 30, 40)
    property bool flag: false
    property string text: "a"
    property double dbl: 2
    property alias timeline: timeline

    Timeline {
        id: timeline
        startFrame: 0
        endFrame: 100
        enabled: true
        KeyframeGroup { target: root; property: "level"; Keyframe { frame: 100; value: 10 } }
        KeyframeGroup { target: root; property: "tint"; Keyframe { frame: 100; value: "#ffeedd" } }
        KeyframeGroup { target: root; property: "v2"; Keyframe { frame: 100; value: Qt.vector2d(11, 22) } }
        KeyframeGroup { target: root; property: "v3"; Keyframe { frame: 100; value: Qt.vector3d(11, 22, 33) } }
        KeyframeGroup { target: root; property: "v4"; Keyframe { frame: 100; value: Qt.vector4d(11, 22, 33, 44) } }
        KeyframeGroup { target: root; property: "quat"; Keyframe { frame: 100; value: Qt.quaternion(0.707107, 0, 0.707107, 0) } }
        KeyframeGroup { target: root; property: "pt"; Keyframe { frame: 100; value: Qt.point(11, 22) } }
        KeyframeGroup { target: root; property: "sz"; Keyframe { frame: 100; value: Qt.size(110, 220) } }
        KeyframeGroup { target: root; property: "rc"; Keyframe { frame: 100; value: Qt.rect(11, 22, 130, 140) } }
        KeyframeGroup { target: root; property: "flag"; Keyframe { frame: 100; value: true } }
        KeyframeGroup { target: root; property: "text"; Keyframe { frame: 100; value: "b" } }
        // A number written as text is the number.
        KeyframeGroup { target: root; property: "dbl"; Keyframe { frame: 100; value: "12" } }
        // A member of a value, after the group that has the whole of it.
        KeyframeGroup { target: root; property: "v3.x"; Keyframe { frame: 100; value: 0 } }
    }
    function at(frame) {
        timeline.currentFrame = frame
        return {
            level: level, tint: String(tint), v2: String(v2), v3: String(v3), v4: String(v4), quat: String(quat),
            pt: String(pt), sz: String(sz), rc: String(rc), flag: flag, text: text, dbl: dbl
        }
    }
}
