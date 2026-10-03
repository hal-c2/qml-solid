// Stands in for the calendar main.cpp makes (a QCalendarWidget where the
// platform has no calendar of its own): this month, today marked.
import QtQuick

Window {
    id: root
    width: 200
    height: 220
    minimumWidth: 200
    minimumHeight: 220
    color: "white"

    readonly property date today: new Date()
    readonly property date first: new Date(today.getFullYear(), today.getMonth(), 1)
    // Monday is the first column.
    readonly property int offset: (first.getDay() + 6) % 7

    Rectangle {
        id: header
        width: parent.width
        height: 32
        color: "#f0f0f0"

        Text {
            anchors.centerIn: parent
            text: root.today.toLocaleDateString(Qt.locale("en_US"), "MMMM yyyy")
            font.bold: true
        }
    }

    Grid {
        anchors.top: header.bottom
        anchors.bottom: parent.bottom
        width: parent.width
        columns: 7

        Repeater {
            model: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

            Text {
                required property string modelData
                width: root.width / 7
                height: 22
                text: modelData
                color: "#606060"
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
        }

        Repeater {
            model: 42

            Rectangle {
                id: day
                required property int index
                readonly property date date: new Date(root.first.getFullYear(), root.first.getMonth(), index - root.offset + 1)
                readonly property bool isToday: date.getTime() === new Date(root.today.getFullYear(), root.today.getMonth(), root.today.getDate()).getTime()
                width: root.width / 7
                height: (root.height - header.height - 22) / 6
                color: isToday ? "#308cc6" : "transparent"

                Text {
                    anchors.centerIn: parent
                    text: day.date.getDate()
                    color: day.isToday ? "white" : day.date.getMonth() === root.first.getMonth() ? "black" : "#b0b0b0"
                }
            }
        }
    }
}
