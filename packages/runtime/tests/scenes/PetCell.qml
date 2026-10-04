import QtQuick
import QtQuick.Templates as T

// A delegate as a style writes one: what it requires of the table is said
// here, and in the type of its root.
T.TableViewDelegate {
    implicitWidth: 60; implicitHeight: 20
    required property int row
    required property int column
    required property var model
}
