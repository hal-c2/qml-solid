// The calendar's types in a layout, as a program has them: a row of names
// that is as high as its names over a grid that takes what is left. `read`
// is asked of Qt too, before and after each `step`.
import QtQuick
import QtQuick.Layouts
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 5

    ColumnLayout {
        id: column
        width: 360
        height: 240
        spacing: 10

        T.AbstractDayOfWeekRow {
            id: days
            Layout.fillWidth: true
            implicitWidth: implicitContentWidth + leftPadding + rightPadding
            implicitHeight: implicitContentHeight + topPadding + bottomPadding
            locale: grid.locale
            spacing: 6
            padding: 6
            delegate: Text {
                required property string narrowName
                text: narrowName
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
            }
            contentItem: Row {
                spacing: days.spacing
                Repeater {
                    id: dayCells
                    model: days.source
                    delegate: days.delegate
                }
            }
        }

        T.AbstractMonthGrid {
            id: grid
            Layout.fillWidth: true
            Layout.fillHeight: true
            implicitWidth: implicitContentWidth + leftPadding + rightPadding
            implicitHeight: implicitContentHeight + topPadding + bottomPadding
            month: T.Calendar.December
            year: 2015
            locale: Qt.locale("en_US")
            spacing: 6
            delegate: Rectangle {
                implicitWidth: 20
                implicitHeight: 14
                color: "#dddddd"
                required property var model
            }
            contentItem: Grid {
                rows: 6
                columns: 7
                rowSpacing: grid.spacing
                columnSpacing: grid.spacing
                Repeater {
                    id: cells
                    model: grid.source
                    delegate: grid.delegate
                }
            }
        }

        // A row that is no wider than it says it is.
        T.AbstractDayOfWeekRow {
            id: narrow
            implicitWidth: implicitContentWidth + leftPadding + rightPadding
            implicitHeight: implicitContentHeight + topPadding + bottomPadding
            locale: grid.locale
            spacing: 2
            delegate: Rectangle {
                implicitWidth: 10 + model.index
                implicitHeight: 8
                color: "#dddddd"
                required property var model
            }
            contentItem: Row {
                spacing: narrow.spacing
                Repeater {
                    id: narrowCells
                    model: narrow.source
                    delegate: narrow.delegate
                }
            }
        }
    }

    function step(index) {
        switch (index) {
        case 0:
            column.width = 300
            break
        case 1:
            column.height = 200
            break
        case 2:
            days.padding = 2
            break
        case 3:
            narrow.Layout.preferredHeight = 20
            break
        case 4:
            grid.Layout.fillHeight = false
            break
        }
    }

    function box(item) {
        return item ? [item.x, item.y, item.width, item.height].map((value) => Math.round(value * 100) / 100) : null
    }

    function shown(control, repeater) {
        return [box(control), Math.round(control.implicitWidth * 100) / 100, Math.round(control.implicitHeight * 100) / 100,
                box(control.contentItem), box(repeater.itemAt(0)), box(repeater.itemAt(1)), box(repeater.itemAt(repeater.count - 1))]
    }

    function read() {
        return [
            [column.implicitWidth, column.implicitHeight].map((value) => Math.round(value * 100) / 100),
            shown(days, dayCells),
            shown(grid, cells),
            shown(narrow, narrowCells)
        ]
    }
}
