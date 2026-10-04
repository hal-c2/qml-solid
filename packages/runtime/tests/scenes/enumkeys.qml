import QtQuick
import QtQuick.Templates as T

// The keys of an enum, by the name of a type of the project's own and by a
// type of a namespace, with the name of the enum and without.
Item {
    id: root
    width: 400; height: 300

    property int month: T.Calendar.Month.March
    property int next: T.Calendar.April

    Swatch { id: swatch }
    Chart { id: chart; shade: Chart.Shade.Deep; elide: Chart.ElideRight }
    T.Label { id: label; elide: T.Label.ElideMiddle; wrapMode: T.Label.WrapMode.WordWrap }

    function read() {
        return [
            Swatch.Mid, Swatch.Shade.Mid, Swatch.Deep, swatch.shade, swatch.deepest,
            Chart.Mid, Chart.Shade.Deep, Chart.Gloss, Chart.Finish.Gloss, chart.shade, chart.finish, chart.inherited,
            Chart.ElideRight, Swatch.ElideRight, Chart.TextElideMode.ElideRight, chart.elide,
            T.Calendar.March, T.Calendar.Month.March, month, next,
            T.Label.ElideRight, T.Label.TextElideMode.ElideRight, label.elide, label.wrapMode,
            T.Label.Nope === undefined, Swatch.Nope === undefined
        ]
    }
}
