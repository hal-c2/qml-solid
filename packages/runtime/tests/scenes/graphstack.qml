import QtQuick
import QtGraphs

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    Component {
        id: setMaker
        BarSet {}
    }

    GraphsView {
        id: view
        anchors.fill: parent
        theme: GraphsTheme {
            id: look
            colorScheme: GraphsTheme.ColorScheme.Light
            theme: GraphsTheme.Theme.BlueSeries
            axisXLabelFont.family: boxes.name
            axisXLabelFont.pixelSize: 16
            axisYLabelFont.family: boxes.name
            axisYLabelFont.pixelSize: 16
        }
        axisX: BarCategoryAxis { id: ax; categories: ["a", "b"] }
        axisY: ValueAxis { id: ay; min: -10; max: 10 }

        BarSeries {
            id: stack
            barsType: BarSeries.BarsType.Stacked
            barWidth: 0.6
            BarSet { label: "A"; values: [2, -2] }
            BarSet { label: "B"; values: [4, 2] }
            BarSet { label: "C"; values: [-2, 4] }
        }
        BarSeries {
            id: beside
            barWidth: 1
            seriesColors: ["orange", "#336699"]
            borderColors: ["black"]
            BarSet { id: lone; label: "D"; values: [6, -8] }
        }
    }

    function legend(series) {
        let said = [series.count, series.barsType]
        for (let i = 0; i < series.legendData.length; i++)
            said.push(String(series.legendData[i].color), String(series.legendData[i].borderColor), series.legendData[i].label)
        return said
    }

    function read() {
        let said = [view.plotArea.x, view.plotArea.y, view.plotArea.width, view.plotArea.height].concat(legend(stack), legend(beside))
        for (let i = 0; i < stack.count; i++)
            said.push(stack.at(i).label, stack.at(i).count, stack.at(i).sum(), stack.find(stack.at(i)))
        said.push(lone.borderWidth, look.borderWidth)
        return said
    }

    function step(i) {
        if (i === 0) {
            stack.barsType = BarSeries.BarsType.StackedPercent
            ay.min = -50
            ay.max = 50
        } else if (i === 1) {
            stack.valuesMultiplier = 0.5
            ay.min = -25
            ay.max = 25
            lone.values = [5, -10]
        } else if (i === 2) {
            stack.remove(0)
            stack.insert(1, setMaker.createObject(stack, { label: "E", values: [1, 1] }))
            stack.barsType = BarSeries.BarsType.Groups
            stack.barWidth = 1
            stack.valuesMultiplier = 1
            lone.borderWidth = 0
            ay.min = -10
            ay.max = 10
        } else if (i === 3) {
            stack.clear()
            beside.seriesColors = []
            beside.borderColors = []
            look.seriesColors = ["#008080"]
            look.borderColors = ["#800000", "#000080"]
            look.borderWidth = 3
            lone.borderWidth = -1
        } else if (i === 4) {
            beside.insert(0, setMaker.createObject(beside, { label: "F", values: [3, 4, 5] }))
            beside.append(setMaker.createObject(beside, { label: "G", values: [-3], borderWidth: 1.5 }))
        }
    }
}
