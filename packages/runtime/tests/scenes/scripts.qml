import QtQuick

Item {
    id: root
    width: 400; height: 300

    property int count: 0
    property var seen: []
    property var given: () => root.seen.push("given called")

    SequentialAnimation {
        id: once
        // Run for what they do: what they are worth is nothing to anybody.
        ScriptAction { script: root.count = root.count + 5 }
        ScriptAction { script: { root.seen.push("block") } }
        ScriptAction { script: root.given }
        ScriptAction { script: root.given() }
    }

    SequentialAnimation {
        id: thrice
        loops: 3
        ScriptAction { script: { root.seen.push("lap " + ++root.count) } }
        PauseAnimation { duration: 100 }
    }

    states: State {
        name: "entered"
        StateChangeScript { script: { root.seen.push("entered at " + root.count) } }
    }

    function read() {
        return [count, seen.splice(0)]
    }

    function step(index) {
        switch (index) {
        case 0:
            once.start()
            break
        case 1:
            thrice.start()
            break
        case 2:
            state = "entered"
            break
        }
    }
}
