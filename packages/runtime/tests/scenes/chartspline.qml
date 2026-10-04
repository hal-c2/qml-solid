import QtQuick
import QtCharts

// A bar series and a spline over it, each with its own axes, as the
// thermostat's statistics page has them.
Item {
    id: root
    width: 480
    height: 320

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ValuesAxis { id: energy; min: 0; max: 2000; labelsColor: "#203040"; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
    ValuesAxis {
        id: degrees
        min: 0
        max: 40
        tickAnchor: 5
        tickInterval: 10
        tickType: ValuesAxis.TicksDynamic
        lineVisible: false
        labelsFont.family: boxes.name
        labelsFont.pixelSize: 16
    }
    ValuesAxis { id: days; visible: false; min: 0; max: 28 }
    BarCategoryAxis {
        id: months
        gridVisible: false
        truncateLabels: false
        categories: ["Jan", "Feb", "Mar", "Apr"]
        labelsFont.family: boxes.name
        labelsFont.pixelSize: 16
    }

    ChartView {
        id: chart
        anchors.fill: parent
        margins.left: 0
        margins.right: 0
        margins.top: 0
        margins.bottom: 0
        legend.markerShape: Legend.MarkerShapeCircle
        legend.font.family: boxes.name
        legend.font.pixelSize: 16
        legend.labelColor: "#102030"
        backgroundColor: "#f0f0e0"

        BarSeries {
            id: bars
            axisX: months
            axisY: energy
            barWidth: 0.6
            BarSet { id: set; label: "Energy"; color: "#00414a"; borderWidth: 0; values: [300, 1800, 900, 1200] }
        }
        SplineSeries {
            id: spline
            name: "Heat"
            color: "#2cde85"
            width: 5
            axisX: days
            axisYRight: degrees
            Component.onCompleted: {
                const heat = [8, 30, 12, 22]
                for (let i = 0; i < heat.length; i++) spline.append(i * 7, heat[i])
            }
        }
    }

    function read() {
        return [chart.plotArea.x, chart.plotArea.y, chart.plotArea.width, chart.plotArea.height, chart.count, spline.count,
            spline.at(1).x, spline.at(1).y, String(spline.color), spline.width, set.count, set.at(3), bars.barWidth,
            months.count, months.min, months.max, degrees.min, degrees.max, degrees.alignment, degrees.orientation,
            energy.alignment, energy.orientation, months.alignment, months.orientation, days.alignment,
            chart.axisX(bars) === months, chart.axisY(bars) === energy, chart.axisX(spline) === days, chart.axisY(spline) === degrees,
            chart.series(1) === spline, chart.series("Heat") === spline]
    }

    function step(i) {
        if (i === 0) {
            spline.append(28, 35)
            set.values = [1500, 200, 600, 2400]
        } else if (i === 1) {
            bars.barWidth = 0.9
            degrees.max = 50
            energy.labelsVisible = false
            months.categories = ["One", "Two", "Three"]
        }
    }
}
