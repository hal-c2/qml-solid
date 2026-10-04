import QtQuick
import QtQuick.Timeline

// What a timeline takes and gives back: a binding, a value assigned before
// it and one assigned while it has the property; two groups on one
// property; a property with a Behavior; a timeline enabled from the start.
Item {
    id: root
    width: 400
    height: 300
    property real base: 40
    property alias a: a
    property alias first: first
    property alias second: second

    Rectangle { id: a; x: root.base; y: root.base; width: root.base; height: 10; opacity: 0.5 }
    Rectangle { id: two; x: 5; width: 10; height: 10 }
    Rectangle {
        id: slow
        x: 5; width: 10; height: 10
        Behavior on x { NumberAnimation { duration: 1000 } }
    }
    Rectangle { id: early; x: root.base; width: 10; height: 10 }
    Timeline {
        id: first
        startFrame: 0; endFrame: 100; enabled: false
        KeyframeGroup { target: a; property: "x"; Keyframe { frame: 100; value: 140 } }
        KeyframeGroup { target: a; property: "y"; Keyframe { frame: 100; value: 140 } }
        KeyframeGroup { target: a; property: "width"; Keyframe { frame: 100; value: 140 } }
        KeyframeGroup { target: a; property: "opacity"; Keyframe { frame: 100; value: 1 } }
        KeyframeGroup { target: two; property: "x"; Keyframe { frame: 100; value: 105 } }
        KeyframeGroup { target: two; property: "x"; Keyframe { frame: 50; value: 1005 } }
        KeyframeGroup { target: slow; property: "x"; Keyframe { frame: 100; value: 105 } }
    }
    Timeline {
        id: second
        startFrame: 0; endFrame: 100; enabled: true; currentFrame: 50
        KeyframeGroup { target: early; property: "x"; Keyframe { frame: 100; value: 140 } }
    }
    property real atCompleted: -1
    Component.onCompleted: atCompleted = early.x
    function read() { return [a.x, a.y, a.width, a.opacity, two.x, slow.x, early.x] }
}
