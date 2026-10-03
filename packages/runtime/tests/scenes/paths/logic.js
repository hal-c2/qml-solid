.pragma library
.import QtQuick as QQ

var made = 0;
var block = Qt.createComponent("Block.qml");

function add(a, b) {
    return a + b;
}

// What `kind` names is only known when it is asked for.
function component(kind) {
    return Qt.createComponent(kind + ".qml");
}

function make(kind, parent, x) {
    var found = component(kind);
    if (found.status !== QQ.Component.Ready) {
        return null;
    }
    made += 1;
    return found.createObject(parent, { x: x });
}
