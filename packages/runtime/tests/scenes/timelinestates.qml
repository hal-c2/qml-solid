import QtQuick
import QtQuick.Timeline

// A timeline that states enable and move, as Qt Design Studio writes them,
// and whose keyframes and groups change while it is enabled.
Item {
    id: root
    width: 400
    height: 300
    property real base: 40
    property alias timeline: timeline
    property alias gx: gx
    property alias k1: k1
    property alias k2: k2
    property alias other: other

    Rectangle { id: box; x: root.base; y: 5; width: 10; height: 10 }
    Rectangle { id: other; x: 7; y: 5; width: 10; height: 10 }
    Timeline {
        id: timeline
        startFrame: 0; endFrame: 100; enabled: false
        animations: [ TimelineAnimation { id: anim; from: 0; to: 100; duration: 200; running: false } ]
        KeyframeGroup {
            id: gx
            target: box; property: "x"
            Keyframe { id: k1; frame: 0; value: 100 }
            Keyframe { id: k2; frame: 100; value: 200 }
        }
        KeyframeGroup {
            target: box; property: "y"
            Keyframe { frame: 0; value: 100 }
            Keyframe { frame: 100; value: 300 }
        }
    }
    states: [
        State { name: "half"; PropertyChanges { target: timeline; enabled: true; currentFrame: 50 } },
        State {
            name: "run"
            PropertyChanges { target: timeline; enabled: true }
            PropertyChanges { target: anim; running: true }
        },
        State { name: "end"; PropertyChanges { target: timeline; enabled: true; currentFrame: 100 } }
    ]
    function read() { return [timeline.enabled, timeline.currentFrame, box.x, box.y, other.x, other.y] }
    function to(name) { state = name; return read() }
    function inQuad() { k1.easing.type = Easing.InQuad; return read() }
}
