import QtQuick
import QtCharts

// A chart that smooths what it draws and has a shadow under it, as the
// thermostat's statistics page asks.
Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ChartView {
        id: chart
        anchors.fill: parent
        antialiasing: true
        dropShadowEnabled: true
        backgroundColor: "#fff8e0"
        legend.markerShape: Legend.MarkerShapeCircle
        legend.font.family: boxes.name
        legend.font.pixelSize: 16

        ValuesAxis { id: up; min: 0; max: 9; tickCount: 4; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
        BarCategoryAxis { id: names; categories: ["a", "b", "c"]; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }

        BarSeries {
            id: bars
            axisX: names
            axisY: up
            BarSet { id: thin; label: "Thin"; values: [2, 7, 4] }
            BarSet { id: none; label: "None"; borderWidth: 0; color: "#00414a"; values: [5, 3, 8] }
        }
        SplineSeries {
            id: curve
            name: "Curve"
            width: 5
            color: "#2cde85"
            axisX: names
            axisY: up
            XYPoint { x: 0; y: 1 }
            XYPoint { x: 1; y: 8 }
            XYPoint { x: 2; y: 3 }
        }
        LineSeries {
            id: straight
            name: "Line"
            axisX: names
            axisY: up
            XYPoint { x: 0; y: 6 }
            XYPoint { x: 1; y: 2 }
            XYPoint { x: 2; y: 7 }
        }
    }

    function read() {
        return [chart.plotArea.x, chart.plotArea.y, chart.plotArea.width, chart.plotArea.height, chart.antialiasing,
            chart.dropShadowEnabled, String(chart.backgroundColor), chart.backgroundRoundness, chart.count,
            String(straight.color), straight.width]
    }
}
