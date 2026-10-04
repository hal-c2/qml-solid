import QtQuick
import QtQuick3D
import QtQuick.Timeline

// A timeline over what a node is placed by: its position and its turn as
// one value each, its scale, one of its angles, and all three.
Item {
    id: root
    width: 400
    height: 300
    property alias timeline: timeline

    Node { id: moved; x: 1; y: 2; z: 3 }
    Node { id: turned; rotation: Qt.quaternion(0.707107, 0, 0.707107, 0) }
    Node { id: scaled; scale.x: 2; scale.y: 2; scale.z: 2 }
    Node { id: angled; eulerRotation.x: 10; eulerRotation.y: 20; eulerRotation.z: 30 }
    Node { id: whole; eulerRotation: Qt.vector3d(10, 20, 30) }
    Timeline {
        id: timeline
        startFrame: 0; endFrame: 100; enabled: false
        KeyframeGroup {
            target: moved; property: "position"
            Keyframe { frame: 0; value: Qt.vector3d(10, 20, 30) }
            Keyframe { frame: 100; value: Qt.vector3d(110, 220, 330) }
        }
        KeyframeGroup {
            target: turned; property: "rotation"
            Keyframe { frame: 0; value: Qt.quaternion(1, 0, 0, 0) }
            Keyframe { frame: 100; value: Qt.quaternion(0, 0, 1, 0) }
        }
        KeyframeGroup {
            target: scaled; property: "scale"
            Keyframe { frame: 50; value: Qt.vector3d(4, 6, 8) }
        }
        KeyframeGroup {
            target: angled; property: "eulerRotation.x"
            Keyframe { frame: 0; value: 0 }
            Keyframe { frame: 100; value: 90 }
        }
        KeyframeGroup {
            target: whole; property: "eulerRotation"
            Keyframe { frame: 100; value: Qt.vector3d(40, 50, 60) }
        }
    }
    function read() {
        return [String(moved.position), [moved.x, moved.y, moved.z].join(" "), String(turned.rotation), String(turned.eulerRotation),
                String(scaled.scale), scaled.scale.x, String(angled.eulerRotation), String(angled.rotation), String(whole.eulerRotation)]
    }
    function at(frame) { timeline.currentFrame = frame; return read() }
}
