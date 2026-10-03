import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property real shown: 1

    Rectangle {
        id: a
        width: 50; height: 50; color: "red"
        opacity: root.shown
        Behavior on opacity { OpacityAnimator { id: fade; duration: 100 } }
    }
    Rectangle {
        id: b
        y: 60; width: 50; height: 50; color: "blue"
        XAnimator { id: slide; target: b; from: 10; to: 110; duration: 100 }
        YAnimator { id: drop; target: b; to: 160; duration: 100; easing.type: Easing.InQuad }
    }
    Rectangle {
        id: c
        x: 200; width: 50; height: 50; color: "green"
        ScaleAnimator on scale { id: grow; from: 1; to: 2; duration: 100; running: false }
        RotationAnimator { id: turn; target: c; from: 350; to: 10; duration: 100; direction: RotationAnimator.Shortest }
    }
    // With nowhere said to go, it goes to nought.
    Rectangle {
        id: d
        x: 300; y: 100; width: 50; height: 50; color: "gold"
        XAnimator { id: home; target: d; duration: 100 }
    }
    Rectangle {
        id: e
        y: 200; width: 20; height: 20; color: "black"
        SequentialAnimation {
            id: both
            XAnimator { target: e; to: 100; duration: 100 }
            OpacityAnimator { target: e; to: 0.5; duration: 100 }
        }
    }

    function read() {
        return [a.opacity, b.x, b.y, c.scale, c.rotation, d.x, e.x, e.opacity].map(n => Math.round(n * 1000) / 1000)
    }

    function running() {
        return [fade.running, slide.running, drop.running, grow.running, turn.running, home.running, both.running]
    }

    function items() {
        return [a, b, c, d, e]
    }

    function step(index) {
        if (index === 0) {
            root.shown = 0.2
            slide.start()
            drop.start()
            grow.start()
            turn.start()
            home.start()
            both.start()
        } else {
            root.shown = 1
        }
    }
}
