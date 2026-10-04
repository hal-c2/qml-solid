// A ScrollView with its bars where a style puts them: declared with the
// type, so that they are there before what is put in the view, and as thick
// as a binding says, as a style's are.
import QtQuick
import QtQuick.Templates
import QtQuick.Templates as T

T.ScrollView {
    id: control

    property alias down: down
    property alias across: across
    property real thick: 12

    ScrollBar.vertical: T.ScrollBar {
        id: down
        parent: control
        x: control.width - width
        y: control.topPadding
        width: control.thick
        height: control.availableHeight
        active: across.active
        contentItem: Item {}
    }

    ScrollBar.horizontal: T.ScrollBar {
        id: across
        parent: control
        x: control.leftPadding
        y: control.height - height
        width: control.availableWidth
        height: control.thick - 3
        active: down.active
        contentItem: Item {}
    }
}
