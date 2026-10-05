import QtQuick

// The effect of a layer: what it is given, and a red rectangle that reaches
// out from under the item it is of.
Item {
    id: halo
    property var source
    property string name
    required property int rounded
    // What it was told of.
    property var seen: []
    onRoundedChanged: seen.push("rounded " + rounded)
    Rectangle { anchors.fill: parent; anchors.margins: -6; color: "red" }
    Component.onCompleted: seen.push("completed " + rounded + (source ? " of " + source.sourceItem.width : ""))
}
