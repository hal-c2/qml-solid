// A Loader in a layout that says how large it would be by its item:
// `Layout.preferredWidth: item ? item.width : 64`. What it loads as it is
// made is there before the layout first looks, so the layout never gives it
// the 64, and its item is not made 64. One that loads later has been given
// it, and its item is.
import QtQuick
import QtQuick.Layouts

Item {
    id: root
    width: 400
    height: 300

    property int unloaded: 64

    Component {
        id: button
        Rectangle {
            implicitWidth: 60
            implicitHeight: 60
            color: "teal"
        }
    }

    RowLayout {
        id: row
        x: 15; y: 15; height: 96
        spacing: 0
        Loader {
            id: first
            Layout.preferredWidth: item ? (item as Item).width : root.unloaded
            Layout.preferredHeight: item ? (item as Item).height : root.unloaded
            sourceComponent: button
        }
        Loader {
            id: late
            active: false
            Layout.preferredWidth: item ? (item as Item).width : root.unloaded
            Layout.preferredHeight: item ? (item as Item).height : root.unloaded
            sourceComponent: button
        }
    }

    GridLayout {
        id: grid
        y: 150; width: 300; height: 126
        columns: 2
        Item {
            id: cell
            implicitWidth: inner.implicitWidth + 30
            implicitHeight: 126
            RowLayout {
                id: inner
                anchors.fill: parent
                anchors.margins: 15
                spacing: 0
                Loader {
                    id: nested
                    Layout.preferredWidth: item ? (item as Item).width : root.unloaded
                    Layout.preferredHeight: item ? (item as Item).height : root.unloaded
                    sourceComponent: button
                }
            }
        }
        Item { Layout.fillWidth: true }
    }

    readonly property int steps: 1
    function step(index) {
        late.active = true
    }

    function box(item) {
        return item ? [item.x, item.y, item.width, item.height, item.implicitWidth, item.implicitHeight] : null
    }
    function answers() {
        return [box(row), box(first), box(first.item), box(late), box(late.item),
            box(cell), box(nested), box(nested.item)]
    }
}
