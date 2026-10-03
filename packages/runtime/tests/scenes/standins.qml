import QtQuick
import Backend

Item {
    id: root
    width: 400
    height: 300
    property var peaks: []

    Meter {
        id: meter
        level: 4
        onPeaked: (level) => root.peaks = root.peaks.concat([level])
    }

    function read() {
        return [meter.level, meter.reading, Engine.limit, root.peaks]
    }

    function step(index) {
        if (index === 0)
            meter.raise(3)
        else if (index === 1)
            meter.raise(30)
        else
            Engine.limit = 12
    }
}
