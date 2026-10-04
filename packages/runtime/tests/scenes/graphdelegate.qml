import QtQuick
import QtGraphs

Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    // What the delegates made, in the order they were.
    property var names: []
    property var marks: []
    property var made: []

    Component {
        id: nameMaker
        Rectangle {
            id: name
            property string text
            color: "#ffe0e0"
            Rectangle { anchors.centerIn: parent; width: name.text.length * 8; height: 6; color: "purple" }
            Component.onCompleted: root.names.push(name)
        }
    }

    Component {
        id: markMaker
        Text {
            id: mark
            color: "blue"
            Component.onCompleted: root.marks.push(mark)
        }
    }

    Component {
        id: barMaker
        Rectangle {
            id: bar
            property color barColor
            property color barBorderColor
            property real barBorderWidth
            property bool barSelected: true
            property real barValue
            property string barLabel
            property int barIndex: -1
            color: barColor
            Component.onCompleted: root.made.push(bar)
        }
    }

    Component {
        id: plainMaker
        Rectangle {
            id: plain
            property color barColor
            color: Qt.darker(barColor)
            Component.onCompleted: root.made.push(plain)
        }
    }

    GraphsView {
        id: view
        anchors.fill: parent
        marginLeft: 31.25
        marginTop: 7
        theme: GraphsTheme {
            id: look
            colorScheme: GraphsTheme.ColorScheme.Light
            axisXLabelFont.family: boxes.name
            axisXLabelFont.pixelSize: 16
            axisYLabelFont.family: boxes.name
            axisYLabelFont.pixelSize: 16
            axisY.labelTextColor: "#102030"
        }
        axisX: BarCategoryAxis { id: ax; categories: ["a", "bb", "ccc"]; labelDelegate: nameMaker }
        axisY: ValueAxis { id: ay; min: -2; max: 7; labelDelegate: markMaker }

        BarSeries {
            id: series
            barDelegate: barMaker
            opacity: 0.5
            BarSet { id: one; label: "One"; values: [1, 5, -1.5] }
            BarSet { id: two; label: "Two"; values: [4, 2.5, 7]; color: "red"; borderColor: "#80008000"; borderWidth: 2.5 }
        }
    }

    function round(value) { return Math.round(value * 1000) / 1000 }

    function placed(item) { return [round(item.x), round(item.y), round(item.width), round(item.height), item.rotation] }

    function read() {
        let said = [view.plotArea.x, view.plotArea.y, view.plotArea.width, view.plotArea.height]
        // Qt makes one label more than it places.
        for (const name of names)
            if (name.visible && name.width > 0)
                said.push(name.text, ...placed(name))
        for (const mark of marks)
            if (mark.visible && mark.width > 0)
                said.push(mark.text, ...placed(mark), mark.horizontalAlignment, mark.verticalAlignment, String(mark.color), mark.font.pixelSize)
        for (const bar of made)
            if (bar && bar.width !== undefined)
                said.push(...placed(bar), bar.visible, String(bar.barColor), String(bar.barBorderColor), bar.barBorderWidth, bar.barSelected,
                    bar.barValue, bar.barLabel, bar.barIndex)
        return said
    }

    function step(i) {
        if (i === 0) {
            ax.labelsAngle = 30
            ax.labelPosition = BarCategoryAxis.LabelPosition.OnValue
            ay.labelsAngle = -15
            ay.labelDecimals = 2
            ay.tickAnchor = 0.5
            ay.tickInterval = 2
            series.barsType = BarSeries.BarsType.Stacked
            series.valuesMultiplier = 0.5
        } else if (i === 1) {
            ax.remove("bb")
            ay.labelsVisible = false
            series.visible = false
            series.barsType = BarSeries.BarsType.StackedPercent
            series.valuesMultiplier = 1
            ay.min = -100
            ay.max = 100
            ay.tickInterval = 50
        } else if (i === 2) {
            root.made = []
            series.barDelegate = plainMaker
            series.visible = true
        }
    }
}
