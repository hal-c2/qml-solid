import QtQuick
import QtCharts

// Series that are given no axis: the chart makes them, and colours what was
// given no colour.
Item {
    id: root
    width: 480
    height: 320

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ValuesAxis { id: loose }

    ChartView {
        id: chart
        anchors.fill: parent
        legend.font.family: boxes.name
        legend.font.pixelSize: 16

        LineSeries {
            id: first
            name: "a"
            XYPoint { x: 0; y: 1 }
            XYPoint { x: 4; y: 9 }
        }
        LineSeries {
            id: second
            name: "b"
            XYPoint { x: 2; y: -3 }
            XYPoint { x: 10; y: 5 }
            XYPoint { x: 6; y: 2 }
        }
        BarSeries {
            id: bars
            BarSet { id: one; label: "one"; values: [1, 2, 3] }
            BarSet { id: two; label: "two"; values: [2, 12] }
        }
        BarSeries {
            id: more
            BarSet { id: three; label: "three"; values: [4, 4, 4] }
        }
    }

    function axis(a) {
        return [a.min, a.max, a.orientation, a.alignment, String(a.color), String(a.labelsColor), String(a.gridLineColor),
            a.labelsFont.family, a.labelsFont.pixelSize, a.labelsFont.pointSize, a.labelsFont.bold]
    }

    function read() {
        return [chart.plotArea.x, chart.plotArea.y, chart.plotArea.width, chart.plotArea.height,
            axis(chart.axisX(first)), axis(chart.axisY(first)), axis(chart.axisX(bars)), axis(loose),
            chart.axisX(first) === chart.axisX(second), chart.axisY(first) === chart.axisY(second),
            chart.axisY(first) === chart.axisY(bars), chart.axisX(first) === chart.axisX(bars), chart.axisX(bars) === chart.axisX(more),
            chart.axisX(bars).count, chart.axisX(bars).categories, chart.axisY(first).tickCount,
            String(first.color), String(second.color), first.width, first.count, second.at(2).x, second.at(2).y,
            String(one.color), String(two.color), String(three.color), String(one.borderColor), String(three.borderColor),
            chart.count, bars.count, more.count, two.count, two.at(1), two.label, chart.legend.alignment, chart.legend.font.pixelSize]
    }

    // The axes the chart made have its font; the tests' is one whose
    // letters are as wide here as in Qt.
    function step(i) {
        if (i === 0) {
            for (const made of [chart.axisX(first), chart.axisY(first), chart.axisX(bars)])
                made.labelsFont = Qt.font({ family: boxes.name, pixelSize: 16 })
        } else if (i === 1) {
            second.append(20, 20)
            first.remove(0)
            two.append(7)
            bars.append("late", [5, 6, 7])
        }
    }
}
