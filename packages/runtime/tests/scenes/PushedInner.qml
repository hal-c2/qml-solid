// What a page has in it: it says what it was given when it is complete.
import QtQuick

Item {
    id: inner
    property int index: -1
    property var names
    property var chosen: names ? (names[index] ?? null) : null
    property string seen: ""
    Component.onCompleted: seen = index + ":" + chosen
}
