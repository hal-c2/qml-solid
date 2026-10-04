// A SplitView as a style makes one: the handle is as thick as the style
// says and as long as the view.
import QtQuick
import QtQuick.Templates as T

T.SplitView {
    id: control

    // What a style does not say: Qt asks the platform, which says no where
    // nothing is shown.
    hoverEnabled: true

    implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset,
                            implicitContentWidth + leftPadding + rightPadding)
    implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset,
                             implicitContentHeight + topPadding + bottomPadding)

    handle: Rectangle {
        implicitWidth: control.orientation === Qt.Horizontal ? 6 : control.width
        implicitHeight: control.orientation === Qt.Horizontal ? control.height : 6
        color: T.SplitHandle.pressed ? "red" : T.SplitHandle.hovered ? "blue" : "gray"
    }
}
