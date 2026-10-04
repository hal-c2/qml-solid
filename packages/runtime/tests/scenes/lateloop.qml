import QtQuick

// Loops that close only once everything was evaluated: a property bound
// again, from a handler, to what depends on it.
Item {
    id: root
    width: 200; height: 200

    // As Qt's thermostat has it: nothing changes on the way round.
    QtObject {
        id: steady
        property int layout: 0
        readonly property bool mobile: layout === 1
        property int least: mobile ? 364 : 484
        property int given: 300
        readonly property int side: Math.max(given, least)
    }
    // Once round, and there it rests.
    QtObject {
        id: once
        property int layout: 0
        readonly property bool mobile: layout === 1
        property int least: mobile ? 364 : 484
        property int given: 300
        readonly property int side: Math.max(given, least)
    }
    // Round and round.
    QtObject {
        id: ever
        property int layout: 0
        readonly property bool mobile: layout === 1
        property int least: mobile ? 364 : 484
        property int given: 300
        readonly property int side: Math.max(given, least)
    }
    // The same of a property declared in a script's scope.
    property int count: 0
    readonly property int twice: count * 2
    property int base: 3

    Component.onCompleted: {
        steady.layout = Qt.binding(() => steady.side < 400 ? 1 : 0)
        once.layout = Qt.binding(() => once.side > 300 ? 1 : 0)
        ever.layout = Qt.binding(() => ever.side > 400 ? 1 : 0)
        root.count = Qt.binding(() => root.base + (root.twice > 100 ? root.twice : 1))
    }

    function step(i) {
        if (i === 0) { steady.given = 380; once.given = 250; ever.given = 600; root.base = 7 }
        if (i === 1) { steady.given = 500; once.given = 500; ever.given = 380; root.base = 60 }
        if (i === 2) { steady.given = 100; once.given = 100; ever.given = 100; root.base = 1 }
    }
    function read() {
        return [[steady.layout, steady.mobile, steady.least, steady.side],
                [once.layout, once.mobile, once.least, once.side],
                [ever.layout, ever.mobile, ever.least, ever.side],
                [root.count, root.twice]]
    }
}
