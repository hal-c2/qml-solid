import QtQuick

Item {
    width: 400
    height: 300

    QtObject {
        id: small
        property int size: 30
    }

    QtObject {
        id: large
        property int size: 80
    }

    Framed {
        id: framed
        subject: small
    }

    function read() {
        return [framed.width, framed.subject === small, framed.subject === large]
    }

    function step(index) {
        if (index === 0)
            small.size = 40
        else
            framed.subject = large
    }
}
