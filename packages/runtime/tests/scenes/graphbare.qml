import QtQuick
import QtGraphs

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    BarCategoryAxis { id: ax }
    ValueAxis { id: ay; min: 5; max: 5 }
    GraphsTheme {
        id: dark
        colorScheme: GraphsTheme.ColorScheme.Dark
        axisXLabelFont.family: boxes.name
        axisXLabelFont.pixelSize: 16
        axisYLabelFont.family: boxes.name
        axisYLabelFont.pixelSize: 16
    }

    GraphsView {
        id: view
        anchors.fill: parent

        BarSeries {
            id: series
            BarSet { id: lone; label: "One"; values: [1, 2] }
        }
    }

    function read() {
        let said = [view.plotArea.x, view.plotArea.y, view.plotArea.width, view.plotArea.height,
                    view.marginLeft, view.marginTop, view.theme !== null, view.axisX !== null, view.axisY !== null,
                    ax.count, ax.min, ax.max, ay.min, ay.max, series.legendData.length]
        if (view.theme)
            said.push(view.theme.colorScheme, view.theme.theme, view.theme.borderWidth, view.theme.grid.mainWidth, view.theme.axisX.subWidth)
        return said
    }

    function step(i) {
        if (i === 0) {
            view.theme = dark
        } else if (i === 1) {
            view.axisY = ay
        } else if (i === 2) {
            view.axisX = ax
        } else if (i === 3) {
            ax.categories = ["a"]
            ay.max = 6
        } else if (i === 4) {
            ay.min = 8
            ax.categories = ["a", "a", "b"]
        } else if (i === 5) {
            ay.max = 2
            ay.min = 0
        }
    }
}
