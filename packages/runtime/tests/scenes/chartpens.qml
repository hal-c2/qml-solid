import QtQuick
import QtCharts

// What a set or a line looks like before a chart has it, and which of its
// colours and widths the chart's theme then replaces: those that are as
// they were made.
Item {
    id: root
    width: 400
    height: 300

    BarSet { id: looseSet; values: [1, 2] }
    LineSeries { id: looseLine }
    SplineSeries { id: looseSpline; XYPoint { x: 1; y: 2 } }
    BarSeries { id: looseBars; BarSet { id: inLoose; values: [3] } }
    ChartView {
        id: chart
        anchors.fill: parent
        BarSeries {
            id: bars
            BarSet { id: plain; label: "plain"; values: [1, 2] }
            BarSet { id: zero; label: "zero"; borderWidth: 0; values: [1, 2] }
            BarSet { id: one; label: "one"; borderWidth: 1; values: [1, 2] }
            BarSet { id: three; label: "three"; borderWidth: 3; values: [1, 2] }
            BarSet { id: coloured; label: "coloured"; color: "red"; values: [1, 2] }
            BarSet { id: bordered; label: "bordered"; borderColor: "blue"; values: [1, 2] }
        }
        LineSeries { id: onlyColor; color: "red"; XYPoint { x: 0; y: 0 } XYPoint { x: 1; y: 1 } }
        LineSeries { id: onlyWidth; width: 4; XYPoint { x: 0; y: 0 } XYPoint { x: 1; y: 1 } }
        LineSeries { id: neither; XYPoint { x: 0; y: 0 } XYPoint { x: 1; y: 1 } }
        SplineSeries { id: empty }
    }

    function set(s) { return [String(s.color), String(s.borderColor), s.borderWidth, s.count, s.label] }
    function xy(s) { return [String(s.color), s.width, s.count, s.name, s.visible, s.opacity, s.type] }
    function read() {
        return [set(looseSet), set(inLoose), xy(looseLine), xy(looseSpline), looseBars.count, looseBars.barWidth,
            set(plain), set(zero), set(one), set(three), set(coloured), set(bordered),
            xy(onlyColor), xy(onlyWidth), xy(neither), xy(empty),
            chart.axisX(empty) === chart.axisX(neither), chart.axisX(empty) ? [chart.axisX(empty).min, chart.axisX(empty).max] : null,
            chart.axisY(bars).min, chart.axisY(bars).max, chart.axisY(neither) === chart.axisY(bars), chart.count,
            looseSpline.at(0).x, looseSpline.at(5).x, looseSet.at(7), plain.at(-1)]
    }
}
