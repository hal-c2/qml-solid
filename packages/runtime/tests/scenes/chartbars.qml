import QtQuick
import QtCharts

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ChartView {
        id: chart
        anchors.fill: parent
        legend.font.family: boxes.name
        legend.font.pixelSize: 16

        ValuesAxis { id: ay; min: 0; max: 2000; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
        BarCategoryAxis { id: ax; categories: ["Jan", "Feb", "Mar"]; labelsFont.family: boxes.name; labelsFont.pixelSize: 16 }
        BarSeries {
            id: bars
            axisX: ax
            axisY: ay
            BarSet { id: set; label: "Energy"; values: [100, 1500, 700] }
        }
    }

    function read() {
        return [chart.plotArea.x, chart.plotArea.y, chart.plotArea.width, chart.plotArea.height, chart.count, bars.count, set.count,
            set.at(1), String(set.color), String(set.borderColor), set.borderWidth, ay.tickCount, ax.count, ax.min, ax.max, ay.min, ay.max]
    }
}
