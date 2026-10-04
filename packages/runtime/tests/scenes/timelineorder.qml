import QtQuick
import QtQuick.Timeline

// Keyframes out of order and several of one frame, each curve on the way to
// its keyframe, and a timeline that starts after frame 0.
Item {
    id: root
    width: 400
    height: 300
    property real a: 1
    property real b: 1
    property real c: 1
    property real big: 1
    property alias timeline: timeline

    Timeline {
        id: timeline
        startFrame: 10
        endFrame: 100
        enabled: true
        KeyframeGroup {
            target: root; property: "a"
            Keyframe { frame: 60; value: 60 }
            Keyframe { frame: 20; value: 20 }
            Keyframe { frame: 40; value: 400 }
            Keyframe { frame: 40; value: 40 }
            Keyframe { frame: 40; value: 4000 }
        }
        KeyframeGroup {
            target: root; property: "b"
            Keyframe { frame: 20; value: 0 }
            Keyframe { frame: 60; value: 100; easing.bezierCurve: [0.19, 1, 0.22, 1, 1, 1] }
            Keyframe { frame: 100; value: 0; easing.type: Easing.InOutQuad }
        }
        KeyframeGroup {
            target: root; property: "c"
            Keyframe { frame: 20; value: 0 }
            Keyframe { frame: 60; value: 100; easing.type: Easing.OutBack }
            Keyframe { frame: 100; value: 0; easing.type: Easing.OutElastic; easing.amplitude: 2; easing.period: 0.5 }
        }
        // More than sixteen: Qt's sort is another one from there on.
        KeyframeGroup {
            target: root; property: "big"
            Keyframe { frame: 60; value: 1000 }
            Keyframe { frame: 30; value: 1001 }
            Keyframe { frame: 70; value: 1002 }
            Keyframe { frame: 10; value: 1003 }
            Keyframe { frame: 20; value: 1004 }
            Keyframe { frame: 20; value: 1005 }
            Keyframe { frame: 60; value: 1006 }
            Keyframe { frame: 10; value: 1007 }
            Keyframe { frame: 40; value: 1008 }
            Keyframe { frame: 10; value: 1009 }
            Keyframe { frame: 20; value: 1010 }
            Keyframe { frame: 70; value: 1011 }
            Keyframe { frame: 70; value: 1012 }
            Keyframe { frame: 20; value: 1013 }
            Keyframe { frame: 40; value: 1014 }
            Keyframe { frame: 20; value: 1015 }
            Keyframe { frame: 70; value: 1016 }
            Keyframe { frame: 10; value: 1017 }
            Keyframe { frame: 20; value: 1018 }
            Keyframe { frame: 40; value: 1019 }
            Keyframe { frame: 10; value: 1020 }
            Keyframe { frame: 70; value: 1021 }
            Keyframe { frame: 10; value: 1022 }
            Keyframe { frame: 40; value: 1023 }
            Keyframe { frame: 10; value: 1024 }
            Keyframe { frame: 30; value: 1025 }
            Keyframe { frame: 50; value: 1026 }
            Keyframe { frame: 70; value: 1027 }
            Keyframe { frame: 30; value: 1028 }
            Keyframe { frame: 20; value: 1029 }
            Keyframe { frame: 50; value: 1030 }
            Keyframe { frame: 30; value: 1031 }
            Keyframe { frame: 20; value: 1032 }
            Keyframe { frame: 40; value: 1033 }
            Keyframe { frame: 60; value: 1034 }
            Keyframe { frame: 20; value: 1035 }
            Keyframe { frame: 20; value: 1036 }
            Keyframe { frame: 10; value: 1037 }
            Keyframe { frame: 40; value: 1038 }
            Keyframe { frame: 80; value: 1039 }
        }
    }
    function at(frame) { timeline.currentFrame = frame; return [a, b, c, big] }
}
