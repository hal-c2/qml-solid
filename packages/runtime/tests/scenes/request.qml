// An XMLHttpRequest that sets a header no program may set, as Qt's examples
// do: it is dropped, and nothing is said of it.
import QtQuick

Item {
    id: root
    width: 100
    height: 100

    property string got: ""
    property int status: -1

    Component.onCompleted: {
        const request = new XMLHttpRequest()
        request.open("GET", Qt.resolvedUrl("request.txt"), true)
        request.setRequestHeader("Accept", "text/plain")
        request.setRequestHeader("Connection", "close")
        request.setRequestHeader("Sec-Fetch-Mode", "cors")
        request.onreadystatechange = function() {
            if (request.readyState !== XMLHttpRequest.DONE)
                return
            root.status = request.status
            root.got = request.responseText.trim()
        }
        request.send()
    }
}
