// A page whose properties are those of what is in it.
import QtQuick

Item {
    id: page
    property alias index: inner.index
    property alias names: inner.names
    property alias seen: inner.seen
    property string own: ""
    Component.onCompleted: own = index + ":" + inner.chosen

    PushedInner {
        id: inner
        names: page.names
    }
}
