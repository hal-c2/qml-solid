import QtQuick

// Windows that items hold.
Window {
    id: root
    width: 300; height: 200
    visible: true
    property var log: []

    WindowContainer { id: empty }
    WindowContainer {
        id: plain
        x: 10; y: 20
        window: Window {
            id: a
            width: 50; height: 30
            color: "red"
            Rectangle { x: 40; width: 10; height: 10; color: "lime" }
        }
    }
    Item {
        x: 100; y: 20
        WindowContainer {
            id: sized
            x: 5; y: 6; width: 80; height: 60
            onContainedWindowChanged: (window) => root.log.push("sized " + (window === b))
            window: Window { id: b; x: 7; y: 9; width: 50; height: 30; minimumWidth: 20; color: "blue" }
        }
    }
    Window { id: c; x: 250; y: 150; width: 40; height: 40; color: "yellow" }
    WindowContainer {
        id: late
        x: 200
        visible: false
        onContainedWindowChanged: (window) => root.log.push("late " + (window === c))
    }

    function read() {
        return [
            [empty.width, empty.height, empty.window],
            [plain.width, plain.height, plain.implicitWidth, a.x, a.y, a.width, a.height, a.visible, a.minimumWidth],
            [sized.width, sized.height, b.x, b.y, b.width, b.height, b.visible],
            [late.width, late.height, c.width, c.height, c.visible, late.window === c],
            log.join()
        ]
    }

    // Read once each has settled: Qt sizes a held window when it next draws.
    function step(index) {
        [() => { sized.width = 120; late.window = c },
         () => { late.visible = true; plain.visible = false; b.width = 33 },
         () => { late.window = null }][index]()
    }
}
