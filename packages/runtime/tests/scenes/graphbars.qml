import QtQuick
import QtGraphs

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    GraphsView {
        id: view
        anchors.fill: parent
        theme: GraphsTheme {
            id: look
            colorScheme: GraphsTheme.ColorScheme.Light
            axisXLabelFont.family: boxes.name
            axisXLabelFont.pixelSize: 16
            axisYLabelFont.family: boxes.name
            axisYLabelFont.pixelSize: 16
        }
        axisX: BarCategoryAxis { id: ax; categories: ["a", "bb", "ccc"] }
        axisY: ValueAxis { id: ay }

        BarSeries {
            id: series
            BarSet { id: one; label: "One"; values: [1, 5, 3] }
            BarSet { id: two; label: "Two"; values: [4, 2, 7] }
        }
    }

    function legend() {
        let said = []
        for (let i = 0; i < series.legendData.length; i++)
            said.push(String(series.legendData[i].color), String(series.legendData[i].borderColor), series.legendData[i].label)
        return said
    }

    function read() {
        return [view.plotArea.x, view.plotArea.y, view.plotArea.width, view.plotArea.height, series.count, one.count, two.at(2), one.sum(),
            ax.count, ax.min, ax.max, String(look.backgroundColor), String(look.plotAreaBackgroundColor), String(look.grid.mainColor),
            String(look.axisX.subColor), String(look.axisY.labelTextColor), look.seriesColors.length, String(look.seriesColors[1]),
            String(look.borderColors[0])].concat(legend())
    }

    function step(i) {
        if (i === 0) {
            look.colorScheme = GraphsTheme.ColorScheme.Dark
            look.theme = GraphsTheme.Theme.MixSeries
        } else if (i === 1) {
            ay.min = -1
            ay.tickInterval = 3
            ay.subTickCount = 2
            one.replace(0, -2)
            two.color = "#40ff0000"
            two.borderColor = "white"
            two.borderWidth = 3
        } else if (i === 2) {
            series.take(one)
            series.barWidth = 0.8
            ax.append("d")
            view.marginLeft = 14
            view.marginTop = 30
            view.marginBottom = 10
        } else if (i === 3) {
            ax.visible = false
            ay.visible = false
            ay.min = -3
            ay.subGridVisible = false
            look.grid.mainColor = "red"
            look.grid.mainWidth = 4
            look.backgroundVisible = false
        } else if (i === 4) {
            ax.visible = true
            ax.labelsVisible = false
            ax.gridVisible = false
            ax.subColor = "green"
            ay.visible = true
            ay.lineVisible = false
            ay.max = 8
            ay.color = "yellow"
            look.plotAreaBackgroundVisible = false
            look.axisX.mainColor = "blue"
        }
    }
}
