import QtQuick
import QtQuick.Timeline

// A timeline's animations, each saying what it is told and what the others
// read at that moment.
Item {
    id: root
    width: 400
    height: 300
    property real v: 0
    property var said: []
    property alias timeline: timeline
    property alias plain: plain
    property alias pong: pong
    property alias pong2: pong2
    property alias forever: forever

    function say(who, what) {
        said.push([who, what, Math.round(timeline.currentFrame), Math.round(v),
                   [plain.running, pong.running, pong2.running, forever.running].map(Number).join(""),
                   pong.loops, pong2.loops, pong.from, pong.to].join(" "))
    }
    function take() { const all = said; said = []; return all }

    Timeline {
        id: timeline
        startFrame: 0; endFrame: 100; enabled: true
        animations: [
            TimelineAnimation {
                id: plain
                from: 10; to: 90; duration: 200; running: false
                onStarted: root.say("plain", "started")
                onStopped: root.say("plain", "stopped")
                onFinished: root.say("plain", "finished")
                onRunningChanged: root.say("plain", "running " + running)
            },
            TimelineAnimation {
                id: pong
                from: 20; to: 80; duration: 200; running: false; pingPong: true
                onStarted: root.say("pong", "started")
                onStopped: root.say("pong", "stopped")
                onFinished: root.say("pong", "finished")
                onRunningChanged: root.say("pong", "running " + running)
            },
            TimelineAnimation {
                id: pong2
                from: 20; to: 80; duration: 200; running: false; pingPong: true; loops: 2
                onStarted: root.say("pong2", "started")
                onStopped: root.say("pong2", "stopped")
                onFinished: root.say("pong2", "finished")
                onRunningChanged: root.say("pong2", "running " + running)
            },
            TimelineAnimation {
                id: forever
                from: 0; to: 100; duration: 200; running: false; loops: -1
                onStarted: root.say("forever", "started")
                onStopped: root.say("forever", "stopped")
                onFinished: root.say("forever", "finished")
            }
        ]
        KeyframeGroup {
            target: root; property: "v"
            Keyframe { frame: 0; value: 0 }
            Keyframe { frame: 100; value: 1000 }
        }
    }
    property string made: ""
    Component.onCompleted: made = [plain.target === timeline, plain.property, plain.easing.type].join(" ")
}
