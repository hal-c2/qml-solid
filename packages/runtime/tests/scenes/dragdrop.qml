import QtQuick

Item {
    id: root
    width: 400
    height: 300
    property var log: []

    function say(what) {
        log.push(what)
    }

    function about(drag) {
        return drag.x + "," + drag.y + " " + (drag.source === thing ? "thing" : drag.source) + " [" + drag.keys + "] " + drag.accepted
    }

    DropArea {
        id: left
        objectName: "left"
        width: 100; height: 100
        onEntered: drag => root.say("left entered " + root.about(drag))
        onExited: root.say("left exited")
        onPositionChanged: drag => root.say("left moved " + root.about(drag))
        onDropped: drop => root.say("left dropped " + root.about(drop) + " " + drop.action + " " + drop.proposedAction)
        onContainsDragChanged: root.say("left contains " + containsDrag)
    }
    // One over another: the one in front is asked first.
    DropArea {
        id: over
        objectName: "over"
        x: 50; z: 1; width: 100; height: 100
        onEntered: drag => root.say("over entered " + root.about(drag))
        onExited: root.say("over exited")
        onPositionChanged: drag => root.say("over moved " + drag.x + "," + drag.y)
        onDropped: drop => root.say("over dropped")
    }
    // One that takes only what has one of its keys.
    DropArea {
        id: keyed
        objectName: "keyed"
        x: 200; width: 100; height: 100
        keys: ["red"]
        onEntered: drag => root.say("keyed entered " + root.about(drag))
        onExited: root.say("keyed exited")
        onDropped: drop => { root.say("keyed dropped " + drop.keys + " " + drop.proposedAction); drop.accept(Qt.CopyAction) }
    }
    // One that will not have it.
    DropArea {
        id: shy
        objectName: "shy"
        x: 200; y: 150; width: 100; height: 100
        onEntered: drag => { drag.accepted = false; root.say("shy entered") }
        onExited: root.say("shy exited")
        onDropped: root.say("shy dropped")
    }
    Item {
        id: off
        x: 300; y: 150; width: 100; height: 100
        DropArea { id: disabled; objectName: "disabled"; anchors.fill: parent; enabled: false; onEntered: root.say("disabled entered") }
    }

    Rectangle {
        id: thing
        x: 300; y: 250; width: 20; height: 20; color: "red"
        Drag.hotSpot.x: 10
        Drag.hotSpot.y: 10
        Drag.onActiveChanged: root.say("active " + Drag.active)
        Drag.onTargetChanged: root.say("target " + (Drag.target ? Drag.target.objectName : null))
        Drag.onDragStarted: root.say("started")
        Drag.onDragFinished: action => root.say("finished " + action)
    }

    function read() {
        const said = log
        log = []
        return [said, [left.containsDrag, left.drag.x, left.drag.y, left.drag.source === thing, over.containsDrag, keyed.containsDrag],
                [thing.Drag.active, thing.Drag.target ? thing.Drag.target.objectName : null, thing.Drag.source === thing,
                 thing.Drag.dragType, thing.Drag.supportedActions, thing.Drag.proposedAction, Drag.YAxis, Drag.XAndYAxis, Drag.Internal]]
    }

    function step(index) {
        switch (index) {
        case 0: thing.Drag.active = true; break
        case 1: thing.x = 20; thing.y = 20; break
        case 2: thing.x = 30; break
        case 3: thing.x = 70; break
        case 4: thing.x = 120; break
        case 5: thing.x = 220; break
        case 6: thing.Drag.keys = ["blue", "red"]; break
        case 7: thing.x = 230; break
        case 8: say("drop " + thing.Drag.drop()); break
        case 9: thing.Drag.active = true; break
        case 10: thing.y = 190; break
        case 11: thing.x = 20; thing.y = 20; break
        case 12: say("drop " + thing.Drag.drop()); break
        case 13: thing.Drag.active = true; thing.Drag.active = false; break
        case 14: thing.x = 300; thing.y = 250; thing.Drag.active = true; say("drop " + thing.Drag.drop()); break
        case 15: thing.x = 340; thing.y = 190; thing.Drag.start(); thing.Drag.cancel(); break
        }
    }
}
