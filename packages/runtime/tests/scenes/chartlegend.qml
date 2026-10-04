import QtQuick
import QtCharts

// The legend on each side of the chart, and what its markers look like.
Item {
    id: root
    width: 420
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ChartView {
        id: chart
        anchors.fill: parent
        legend.font.family: boxes.name
        legend.font.pixelSize: 16

        ValuesAxis { id: ay; min: 0; max: 10; tickCount: 3; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
        ValuesAxis { id: ax; min: 0; max: 4; tickCount: 5; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
        BarCategoryAxis { id: names; categories: ["a", "b", "c", "d"]; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }

        BarSeries {
            id: bars
            axisXTop: names
            axisY: ay
            BarSet { id: one; label: "One"; values: [1, 6, 3, 2] }
            BarSet { id: two; label: "Second set"; values: [2, 4, 8, 5] }
        }
        LineSeries {
            id: line
            name: "Line"
            axisX: ax
            axisY: ay
            XYPoint { x: 0; y: 9 }
            XYPoint { x: 2; y: 5 }
            XYPoint { x: 4; y: 7 }
        }
    }

    function read() {
        return [chart.plotArea.x, chart.plotArea.y, chart.plotArea.width, chart.plotArea.height, chart.legend.alignment,
            chart.legend.markerShape, chart.legend.visible, String(chart.legend.labelColor), names.alignment, ax.alignment]
    }

    function step(i) {
        const legend = chart.legend
        if (i === 0) {
            legend.alignment = Qt.AlignBottom
            legend.markerShape = Legend.MarkerShapeCircle
        } else if (i === 1) {
            legend.alignment = Qt.AlignLeft
            legend.markerShape = Legend.MarkerShapeFromSeries
            legend.labelColor = "#aa0000"
        } else if (i === 2) {
            legend.alignment = Qt.AlignRight
            legend.markerShape = Legend.MarkerShapeRectangle
            legend.reverseMarkers = true
            two.label = "A second set with a long name"
        } else if (i === 3) {
            legend.alignment = Qt.AlignTop
            line.name = "A line with a long name too"
        } else if (i === 4) {
            legend.visible = false
        }
    }
}
