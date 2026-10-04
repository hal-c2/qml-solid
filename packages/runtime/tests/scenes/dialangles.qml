// The angles a dial turns between: the start before the end, and the two
// less than a turn apart. Qt says so of what it is given otherwise.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 200
    height: 200

    property var log: []
    function note(what) { log.push(what) }
    function take() { const was = log; log = []; return was }

    property alias dial: dial
    property alias da: da
    property alias db: db
    property alias dc: dc

    T.Dial {
        id: dial
        value: 0.25
        onAngleChanged: root.note("dial.angle " + angle.toFixed(1))
        onStartAngleChanged: root.note("dial.startAngle " + startAngle)
        onEndAngleChanged: root.note("dial.endAngle " + endAngle)
    }
    // Angles that cannot be, and angles too far apart.
    T.Dial { id: da; startAngle: 200; endAngle: 100; value: 0.5 }
    T.Dial { id: db; startAngle: -300; endAngle: 300; value: 2 }
    T.Dial { id: dc; startAngle: 90; endAngle: 800 }

    function answers() {
        return [
            [da.startAngle, da.endAngle, da.value, da.position, da.angle],
            [db.startAngle, db.endAngle, db.value, db.position, db.angle],
            [dc.startAngle, dc.endAngle, dc.angle],
        ]
    }
}
