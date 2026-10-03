// Stands in for LightningProvider (lightningprovider.cpp): the client of the
// service that tells of lightning strikes over a WebSocket.
//
// As in C++ it looks every second whether it is connected and connects when
// it is not, asks for the data once connected, and announces each strike it
// is told of. With no network it keeps trying and announces nothing.
import QtQuick
import QtWebSockets

QtObject {
    id: provider

    // A strike: its latitude and longitude, and its timestamp in seconds.
    signal dataReady(var data)

    readonly property string request: "{\"action\": \"simulatelightningdata\"}"
    readonly property WebSocket socket: WebSocket {
        url: "wss://ewea0y4bn0.execute-api.eu-north-1.amazonaws.com/production/"
        onTextMessageReceived: (message) => provider.onSocketMessageReceived(message)
        onStatusChanged: provider.requestSocket()
    }
    readonly property Timer timer: Timer {
        interval: 1000
        repeat: true
        onTriggered: provider.openSocket()
    }

    function onSocketMessageReceived(message) {
        let object
        try {
            object = JSON.parse(message)
        } catch (error) {
            return
        }
        if (object === null || typeof object !== "object" || Array.isArray(object))
            return
        if (!("time" in object) || !("lat" in object) || !("lon" in object))
            return
        // The time is in nanoseconds.
        dataReady({
            timestamp: Number.isInteger(object.time) ? Math.trunc(object.time / 1000000000) : 0,
            latitude: typeof object.lat === "number" ? object.lat : 0,
            longitude: typeof object.lon === "number" ? object.lon : 0
        })
    }

    function requestSocket() {
        if (socket.status === WebSocket.Open)
            socket.sendTextMessage(request)
    }

    // A WebSocket of QML's is opened by being made active, and stays active
    // when the connection is lost.
    function openSocket() {
        if (socket.status !== WebSocket.Closed && socket.status !== WebSocket.Error)
            return
        socket.active = false
        socket.active = true
    }

    Component.onCompleted: timer.start()
}
