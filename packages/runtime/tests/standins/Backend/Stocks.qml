pragma Singleton
import QtQml
import QtQml.Models

// A list that is filled again whenever it is told what is in it, as a
// model made in C++ is reset: first as it is made.
QtObject {
    id: stocks
    property var source: []
    readonly property ListModel rows: ListModel {}
    signal wasReset()
    function refill() {
        rows.clear()
        for (const row of source) rows.append(row)
    }
    function reset(tag) {
        source = [0, 1, 2, 3].map((i) => ({ name: tag + i, change: i - 2 }))
        wasReset()
    }
    Component.onCompleted: {
        wasReset.connect(refill)
        reset("a")
    }
}
