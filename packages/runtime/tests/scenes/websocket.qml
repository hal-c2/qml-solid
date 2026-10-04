import QtQuick
import QtWebSockets

Item {
    id: root

    // Where the test's server listens, and where nothing does.
    property string server
    property string nowhere
    property alias socket: socket
    property var seen: []

    WebSocket {
        id: socket
        requestedSubprotocols: ["a", "b"]
        onStatusChanged: root.seen.push(["status", socket.status, socket.active, socket.negotiatedSubprotocol])
        onActiveChanged: root.seen.push(["active", socket.active, socket.status])
        onErrorStringChanged: root.seen.push(["error", socket.errorString !== ""])
        onNegotiatedSubprotocolChanged: root.seen.push(["protocol", socket.negotiatedSubprotocol])
        onUrlChanged: root.seen.push(["url", socket.status])
        onTextMessageReceived: (message) => root.seen.push(["text", message])
        onBinaryMessageReceived: (message) => root.seen.push(["binary", message instanceof ArrayBuffer, new Uint8Array(message).join(",")])
    }

    WebSocket {
        id: idle
    }

    function read() {
        return seen.splice(0)
    }

    function step(index) {
        switch (index) {
        case 0:
            seen.push(["made", socket.status, socket.active, socket.errorString, socket.negotiatedSubprotocol])
            socket.url = server + "/one"
            socket.active = true
            seen.push(["asked", socket.status])
            break
        case 1:
            seen.push(["sent", socket.sendTextMessage("héllo"), socket.sendBinaryMessage(new Uint8Array([1, 2, 3]).buffer)])
            break
        case 2:
            socket.url = server + "/two"
            seen.push(["asked", socket.status])
            break
        case 3:
            socket.active = false
            seen.push(["asked", socket.status])
            break
        case 4:
            socket.active = true
            break
        case 5:
            // The server closes when it is told this.
            socket.sendTextMessage("bye")
            break
        case 6:
            socket.active = false
            seen.push(["asked", socket.status])
            socket.active = true
            break
        case 7:
            socket.url = ""
            seen.push(["asked", socket.status])
            break
        case 8:
            seen.push(["unsent", idle.sendTextMessage("x"), idle.status, idle.errorString])
            seen.push([WebSocket.Connecting, WebSocket.Open, WebSocket.Closing, WebSocket.Closed, WebSocket.Error])
            break
        case 9:
            socket.url = nowhere
            break
        }
    }
}
