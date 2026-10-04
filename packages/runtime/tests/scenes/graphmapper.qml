import QtQuick
import QtGraphs

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    // Qt numbers the roles of elements that are appended in the order they
    // are written, and the mapper reads the first.
    ListModel {
        id: rows
        Component.onCompleted: {
            append({ amount: 3, other: 9 })
            append({ amount: 1, other: 8 })
            append({ amount: 4, other: 7 })
            append({ amount: 2, other: 6 })
        }
    }

    GraphsView {
        id: view
        anchors.fill: parent
        theme: GraphsTheme {
            colorScheme: GraphsTheme.ColorScheme.Dark
            theme: GraphsTheme.Theme.OrangeSeries
            axisXLabelFont.family: boxes.name
            axisXLabelFont.pixelSize: 16
            axisYLabelFont.family: boxes.name
            axisYLabelFont.pixelSize: 16
        }
        axisX: BarCategoryAxis { categories: ["a", "b", "c", "d"] }
        axisY: ValueAxis { max: 5 }

        BarSeries {
            id: series
            barWidth: 1
        }
    }

    BarModelMapper {
        id: mapper
        model: rows
        series: series
        firstBarSetSection: 0
        lastBarSetSection: 0
    }

    function read() {
        let said = [mapper.first, mapper.count, mapper.orientation, mapper.firstBarSetSection, mapper.lastBarSetSection, series.count]
        for (let i = 0; i < series.count; i++) {
            const set = series.at(i)
            said.push(set.label, set.count)
            for (let k = 0; k < set.count; k++)
                said.push(set.at(k))
        }
        for (let i = 0; i < series.legendData.length; i++)
            said.push(String(series.legendData[i].color), series.legendData[i].label)
        return said
    }

    function step(i) {
        if (i === 0) {
            mapper.first = 1
            mapper.count = 2
        } else if (i === 1) {
            mapper.orientation = Qt.Horizontal
            mapper.first = 0
            mapper.count = -1
            mapper.lastBarSetSection = 2
        } else if (i === 2) {
            rows.append({ amount: 5, other: 1 })
            rows.setProperty(0, "amount", 2)
        } else if (i === 3) {
            mapper.orientation = Qt.Vertical
            rows.remove(1)
        } else if (i === 4) {
            rows.setProperty(2, "amount", 0.5)
            rows.setProperty(1, "other", 3)
            rows.move(0, 3, 1)
        } else if (i === 5) {
            mapper.firstBarSetSection = -5
            mapper.count = -7
            mapper.first = -2
        } else if (i === 6) {
            mapper.firstBarSetSection = 0
            mapper.lastBarSetSection = 3
            rows.insert(0, { amount: 1.5, other: 2 })
        } else if (i === 7) {
            mapper.model = null
            rows.append({ amount: 5, other: 1 })
        }
    }
}
