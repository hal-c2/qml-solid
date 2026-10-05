// What a handler throws stops that handler, and nothing else.
import QtQuick

Item {
    id: root
    signal poked()
    property var nothing: null
    property int heard: 0
    property int after: 0
    property int count: 0
    onPoked: { nothing.here() }
    onCountChanged: { nothing.there() }
    Component.onCompleted: poked.connect(() => heard++)
    Item { Component.onCompleted: root.nothing.gone() }
    function poke() { poked(); after++; count++; after++; return [heard, after] }
}
