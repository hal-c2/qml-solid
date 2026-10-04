// The calendar's types as a style writes them: a row of the days of the
// week, a grid of the days of a month, a column of the numbers of its weeks,
// and the model of the months between two dates. `read` is asked of Qt too,
// before and after each `step`, and what they say is noted.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    property int steps: 14
    property var notes: []
    property alias days: days
    property alias grid: grid
    property alias weeks: weeks
    property alias months: months
    property alias bare: bare
    property alias whole: whole

    T.AbstractDayOfWeekRow {
        id: days
        x: 30
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        locale: Qt.locale("en_US")
        spacing: 4
        topPadding: 3
        bottomPadding: 5
        delegate: Rectangle {
            implicitWidth: 20 + model.index
            implicitHeight: 12
            color: "#dddddd"
            required property var model
            required property int day
            required property string shortName
            required property string longName
            required property string narrowName
        }
        contentItem: Row {
            spacing: days.spacing
            Repeater {
                id: dayCells
                model: days.source
                delegate: days.delegate
            }
        }
        onSourceChanged: root.note("days.source")
    }

    T.AbstractMonthGrid {
        id: grid
        x: 30
        y: 30
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        month: T.Calendar.December
        year: 2015
        locale: Qt.locale("en_US")
        spacing: 3
        padding: 2
        delegate: Rectangle {
            implicitWidth: 20
            implicitHeight: 14 + model.index % 7
            color: model.today ? "#ffaaaa" : model.month === grid.month ? "#cccccc" : "#eeeeee"
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
        background: Rectangle { color: "#f8f8f8" }
        onMonthChanged: root.note("month " + month)
        onYearChanged: root.note("year " + year)
        onTitleChanged: root.note("title " + title)
        onSourceChanged: root.note("source")
        onPressed: (date) => root.note("pressed " + root.day(date))
        onReleased: (date) => root.note("released " + root.day(date))
        onClicked: (date) => root.note("clicked " + root.day(date))
        onPressAndHold: (date) => root.note("held " + root.day(date))
    }

    T.AbstractWeekNumberColumn {
        id: weeks
        y: 30
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        height: grid.height
        month: grid.month
        year: grid.year
        locale: grid.locale
        spacing: 3
        padding: 2
        delegate: Rectangle {
            implicitWidth: 24
            implicitHeight: 10
            color: "#dddddd"
            required property int weekNumber
        }
        contentItem: Column {
            spacing: weeks.spacing
            Repeater {
                id: weekCells
                model: weeks.source
                delegate: weeks.delegate
            }
        }
        onMonthChanged: root.note("weeks.month " + month)
        onYearChanged: root.note("weeks.year " + year)
    }

    T.CalendarModel {
        id: months
        from: new Date(2015, 10, 20)
        to: new Date(2016, 2, 1)
        onCountChanged: root.note("count " + count)
        onFromChanged: root.note("from " + root.utc(from))
        onToChanged: root.note("to " + root.utc(to))
    }

    Row {
        x: 250
        Repeater {
            id: monthCells
            model: months
            delegate: Rectangle {
                width: 10
                height: 10
                color: "#dddddd"
                required property int index
                required property int month
                required property int year
            }
        }
    }

    // What they are with nothing given.
    T.AbstractMonthGrid { id: bare; x: 250; y: 30 }
    T.AbstractDayOfWeekRow { id: bareDays; x: 250; y: 40 }
    T.AbstractWeekNumberColumn { id: bareWeeks; x: 250; y: 50 }
    T.CalendarModel { id: whole }

    // What is said while the scene is made is how a program is made, not
    // what a calendar does.
    property bool begun: false

    function note(text) {
        if (begun) notes.push(text)
    }

    function take() {
        const taken = notes
        notes = []
        return taken
    }

    // A day of the grid is the midnight it begins with, here.
    function day(date) {
        return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-") + (date.getHours() || date.getMinutes() ? "T" + date.getHours() : "")
    }

    // And a date of the model is the midnight it begins with in Greenwich.
    function utc(date) {
        return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].join("-") + (date.getUTCHours() || date.getUTCMinutes() ? "T" + date.getUTCHours() : "")
    }

    function step(index) {
        begun = true
        switch (index) {
        case 0:
            grid.month = T.Calendar.January
            break
        case 1:
            grid.year = 2016
            break
        case 2:
            // Neither is a month or a year: they are refused.
            grid.month = 12
            grid.year = 300000
            weeks.month = -1
            break
        case 3:
            // A week that begins on a Monday.
            grid.locale = Qt.locale("de_DE")
            days.locale = Qt.locale("de_DE")
            break
        case 4:
            // The first of the month is the first day of the week: the week
            // before is shown.
            grid.month = T.Calendar.February
            break
        case 5:
            weeks.width = 40
            weeks.rightPadding = 6
            break
        case 6:
            grid.width = 200
            grid.height = 150
            days.width = 200
            break
        case 7:
            grid.spacing = 0
            grid.leftPadding = 20
            weeks.spacing = 1
            days.spacing = 0
            break
        case 8:
            months.from = new Date(2015, 11, 31)
            break
        case 9:
            months.to = new Date(2017, 0, 1)
            break
        case 10:
            months.to = new Date(2015, 10, 30)
            break
        case 11:
            // The years before 100 are years.
            grid.year = 99
            grid.month = T.Calendar.March
            months.from = new Date(2015, 10, 1)
            break
        case 12:
            // A week that begins on a Saturday.
            days.locale = Qt.locale("ar_EG")
            grid.locale = Qt.locale("ar_EG")
            break
        case 13:
            grid.title = "Mine"
            break
        }
    }

    function box(item) {
        return item ? [item.x, item.y, item.width, item.height].map((value) => Math.round(value * 1000) / 1000) : null
    }

    function shown(control) {
        return [control.implicitWidth, control.implicitHeight, control.width, control.height,
                control.implicitContentWidth, control.implicitContentHeight].map((value) => Math.round(value * 1000) / 1000)
            .concat([box(control.contentItem), control.focusPolicy, control.activeFocusOnTab, control.source !== null && control.source !== undefined])
    }

    function cell(index) {
        const item = cells.itemAt(index)
        return item ? [box(item), item.model.day, item.model.month, item.model.year, item.model.weekNumber, day(item.model.date), item.model.index] : null
    }

    function row(count, of) {
        const out = []
        for (let index = 0; index < count; index++) out.push(of(index))
        return out
    }

    function today() {
        const now = new Date()
        const found = row(cells.count, (index) => cells.itemAt(index).model).filter((model) => model.today)
        const inside = now.getFullYear() === grid.year && now.getMonth() === grid.month
        return [found.length === (inside ? 1 : 0), found.every((model) => day(model.date) === day(now))]
    }

    function read() {
        const now = new Date()
        return [
            [T.Calendar.January, T.Calendar.February, T.Calendar.June, T.Calendar.December],
            shown(days),
            row(dayCells.count, (index) => {
                const item = dayCells.itemAt(index)
                return [box(item), item.day, item.shortName, item.longName, item.narrowName, item.model.index]
            }),
            [grid.month, grid.year, grid.title, cells.count],
            shown(grid),
            row(cells.count, (index) => cells.itemAt(index).model.day).join(" "),
            [cell(0), cell(1), cell(7), cell(20), cell(41)],
            today(),
            [weeks.month, weeks.year],
            shown(weeks),
            row(weekCells.count, (index) => [box(weekCells.itemAt(index)), weekCells.itemAt(index).weekNumber]),
            [months.count, utc(months.from), utc(months.to)],
            row(monthCells.count, (index) => [monthCells.itemAt(index).month, monthCells.itemAt(index).year].join("/")).join(" "),
            [months.monthAt(0), months.yearAt(0), months.monthAt(3), months.yearAt(3), months.monthAt(-1), months.yearAt(-1), months.monthAt(40), months.yearAt(40)],
            [months.indexOf(new Date(2016, 0, 15)), months.indexOf(2016, 1), months.indexOf(new Date(2015, 9, 31)), months.indexOf(2020, 0),
             months.indexOf(new Date(NaN)), months.indexOf(2015, T.Calendar.December)],
            [bare.month === now.getMonth(), bare.year === now.getFullYear(), bare.title === Qt.locale().standaloneMonthName(now.getMonth()) + " " + now.getFullYear(),
             bare.delegate, bare.contentItem],
            shown(bare),
            shown(bareDays),
            [bareWeeks.month === now.getMonth(), bareWeeks.year === now.getFullYear()],
            shown(bareWeeks),
            [whole.count, utc(whole.from), utc(whole.to),
             whole.monthAt(0), whole.yearAt(0), whole.monthAt(3309104), whole.yearAt(3309104), whole.indexOf(2026, 9)],
            take().sort()
        ]
    }
}
