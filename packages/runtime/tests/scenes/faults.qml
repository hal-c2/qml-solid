import QtQuick

// Bindings that read through a value that is not there yet.
Item {
    id: root
    property var game
    property bool on: root.game.over == false
    property int n: root.game.count
    property string label: "x" + root.game.name
    width: root.game.w
    Rectangle { id: r; width: 10; visible: root.game.shown }
    states: State { name: "on"; when: root.game.over == false }

    function read() {
        return [on, n, label, width, r.visible, state]
    }

    // Where the game is, at each step.
    function step(index) {
        game = [undefined, { over: false, count: 3, w: 7, name: "n", shown: false }, undefined,
                { over: true, count: 4, w: 8, name: "m", shown: true }][index]
    }
}
