import QtQuick
import QtQml

// What an object's own properties and signals do, whatever its type.
Item {
    id: root
    width: 200; height: 200

    property var log: []

    // A binding read in the handler of what it depends on.
    property int a: 5
    property int b: a + 1
    property int c: 0
    onCChanged: { a = 7; log.push("b " + b) }

    // A change signal is a signal: emitted, connected to.
    property string word: "x"
    onWordChanged: log.push("word " + word)
    signal done(int n)
    onDone: (n) => log.push("done " + n)

    // A property whose value is an object.
    property QtObject held: QtObject {
        id: heldObject
        objectName: "held"
        property int n: root.a
    }
    property Connections wired: Connections {
        target: root
        function onDone(n) { root.log.push("wired " + n) }
    }

    // What an object is given where it is made is a change of what its type
    // gave it, and so is what a binding first gives.
    component Given: QtObject {
        property int n: 1
        property string s
        property int same: 4
        onNChanged: root.log.push("given n " + n)
        onSChanged: root.log.push("given s " + s)
        onSameChanged: root.log.push("given same " + same)
    }
    component Bound: QtObject {
        property int n: 1
        property string s
        onNChanged: root.log.push("bound n " + n)
        onSChanged: root.log.push("bound s " + s)
    }
    Given { id: given; n: 2; s: "two"; same: 4 }
    Bound { id: bound; n: root.a; s: root.word }

    // What is written next to the handler is where the property starts.
    property int lone: 3
    onLoneChanged: log.push("lone " + lone)

    // A default property that is a list.
    component Bag: QtObject {
        default property list<QtObject> things
        property int count: things.length
    }
    Bag {
        id: bag
        QtObject { objectName: "one" }
        QtObject { objectName: "two" }
        Timer { objectName: "three" }
    }

    ListModel {
        id: rows
        ListElement { name: "a"; n: 1 }
    }

    function listen(n) { log.push("heard " + n) }
    function heard() { log.push("heard lone " + lone) }

    function read() {
        const was = log
        log = []
        return [was, a, b, c, word, heldObject.objectName, held.n, bag.count,
                bag.things.length > 1 ? bag.things[1].objectName : null]
    }

    function step(i) {
        switch (i) {
        case 0: c = 1; break
        case 1: word = "y"; break
        case 2: root.wordChanged(); break
        case 3: root.done(3); break
        case 4: root.done.connect(listen); root.done(4); break
        case 5: root.done.disconnect(listen); root.done(5); break
        case 6: root.loneChanged.connect(heard); lone = 4; word = "z"; break
        case 7: root.loneChanged.disconnect(heard); lone = 5; word = "w"; break
        case 8: given.n = 3; given.s = "three"; break
        case 9: log.push(Qt.resolvedUrl("data/").toString().slice(-6)); break
        case 10: {
            const row = JSON.parse(JSON.stringify(rows.get(0)))
            log.push(Object.keys(row).sort().join() + " " + row.name + row.n)
            break
        }
        case 11: log.push(String([1, "b"])); break
        case 12: given.nChanged.connect(() => log.push("given heard " + given.n)); given.n = 9; break
        }
    }
}
