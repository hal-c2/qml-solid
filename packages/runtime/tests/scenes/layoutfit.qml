// A button a Loader makes, in a layout that is to give the Loader the size
// its button has: Qt gives an item no size when it has that size already, so
// the Loader goes on taking its size from the button.
import QtQuick
import QtQuick.Layouts
import QtQuick.Controls.impl
import QtQuick.Templates as T

Item {
    id: root
    width: 200
    height: 200
    property Component made: null

    // The button asks for more than the layout has, or for less.
    function pad(left) {
        loader.item.leftPadding = left
    }

    function read() {
        const b = loader.item
        return [row.width, row.height, loader.x, loader.y, loader.width, loader.height, b.width, b.height, b.implicitWidth, b.implicitHeight,
                b.implicitBackgroundWidth, b.implicitContentWidth, b.contentItem.width, b.background.width, b.background.height, row.implicitWidth, row.implicitHeight]
    }

    RowLayout {
        id: row
        x: 15
        y: 15
        width: 60
        height: 96
        spacing: 0
        Loader {
            id: loader
            Layout.preferredWidth: item ? (item as Item).width : root.nothing
            Layout.preferredHeight: item ? (item as Item).height : root.nothing
            sourceComponent: root.made
        }
        Item {
            Layout.preferredWidth: 47
            Layout.fillHeight: true
            visible: false
        }
    }

    Component {
        id: button
        T.Button {
            id: control
            implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset,
                                    implicitContentWidth + leftPadding + rightPadding)
            implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset,
                                     implicitContentHeight + topPadding + bottomPadding)
            readonly property var config: ({ topPadding: 18, bottomPadding: 18, leftPadding: 18, rightPadding: 18 })
            spacing: config.spacing || 0
            topPadding: config.topPadding || 0
            bottomPadding: config.bottomPadding || 0
            leftPadding: config.leftPadding || 0
            rightPadding: config.rightPadding || 0
            topInset: -config.topInset || 0
            bottomInset: -config.bottomInset || 0
            leftInset: -config.leftInset || 0
            rightInset: -config.rightInset || 0
            icon.source: "../assets/flag.png"
            icon.width: 24
            icon.height: 24
            contentItem: IconLabel {
                spacing: control.spacing
                mirrored: control.mirrored
                display: control.display
                icon: control.icon
                text: control.text
                font: control.font
            }
            background: Item {
                id: image
                implicitWidth: 60
                implicitHeight: 60
                Rectangle {
                    x: -2
                    width: 10
                    height: 10
                    color: "teal"
                }
            }
        }
    }
    Component.onCompleted: made = button
}
