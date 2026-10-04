import QtQuick

Item {
    id: root
    property alias subject: holder.subject
    // Read as soon as the item is made, before `holder` is.
    width: subject.size * 2
    height: 20

    QtObject {
        id: holder
        property QtObject subject: null
    }

    // What is named is a Component, not an object it makes.
    property alias made: made
    Component {
        id: made
        Item { width: 7 }
    }
}
