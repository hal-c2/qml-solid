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
}
