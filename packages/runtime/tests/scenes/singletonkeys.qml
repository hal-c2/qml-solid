import QtQuick
import QtQuick.Templates as T

// A singleton whose root is a type with enums, as the `Calendar` of
// QtQuick.Controls is the one `T.Calendar`: its name has the type's keys.
Item {
    id: root
    width: 400; height: 300

    property int year: 2024
    property int month: Almanac.November
    property int last: Almanac.December
    property var march: Almanac.Month.March

    function nextMonth() {
        if (month === Almanac.December) {
            month = Almanac.January
            ++year
        } else {
            ++month
        }
    }

    function previousMonth() {
        if (month === Almanac.January) {
            month = Almanac.December
            --year
        } else {
            --month
        }
    }

    function step(i) {
        if (i < 2)
            nextMonth()
        else
            previousMonth()
    }

    function read() {
        return [year, month, last, march, Almanac.January, Almanac.December === T.Calendar.December,
                Almanac.After, Almanac.Era.After, Almanac.firstYear]
    }
}
