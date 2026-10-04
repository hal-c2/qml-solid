import QtQuick
import QtGraphs

// The graph of several stocks' volumes in Qt's stocqt demo: bars in a row
// for each stock and a column for each day, from a list model that is
// filled from JavaScript.
Rectangle {
    id: root
    width: 600
    height: 400
    color: "#101010"

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ListModel { id: volumeModel }

    function fill(stocks, days) {
        volumeModel.clear()
        for (let s = 0; s < stocks.length; s++)
            for (let d = 0; d < days; d++)
                volumeModel.append({ "row": stocks[s], "column": "1/" + (d + 2) + "/24", "volume": 12 + (7 * d + 11 * s) % 9 * 4 })
    }

    Component.onCompleted: fill(["AAPL", "MSFT", "NVDA"], 5)

    Bars3D {
        id: graph
        width: parent.width
        height: parent.height
        multiSeriesUniform: true
        cameraZoomLevel: 150
        maxCameraZoomLevel: 400
        minCameraZoomLevel: 80
        orthoProjection: true

        valueAxis: Value3DAxis {
            id: value
            labelFormat: "%.1f M"
            title: "Volume"
            titleVisible: true
        }
        columnAxis: Category3DAxis {
            id: column
            title: "Days"
            titleVisible: true
        }
        rowAxis: Category3DAxis {
            id: row
            title: "Stock"
            titleVisible: true
        }

        ambientLightStrength: 1

        theme: GraphsTheme {
            id: look
            theme: GraphsTheme.Theme.QtGreen
            backgroundColor: "#101010"
            backgroundVisible: false
            grid.mainColor: Qt.rgba(0.2, 0.2, 0.2, 1)
            labelTextColor: "white"
            labelBackgroundColor: "black"
            labelFont.pointSize: 9
            labelFont.family: boxes.name
        }

        seriesList: [
            Bar3DSeries {
                id: volume
                baseColor: "red"
                itemLabelFormat: "@rowLabel Date:@colLabel: Volume:@valueLabel"
                ItemModelBarDataProxy {
                    id: proxy
                    itemModel: volumeModel
                    rowRole: "row"
                    columnRole: "column"
                    valueRole: "volume"
                }
                rowColors: [
                    Color { color: "red" },
                    Color { color: "green" },
                    Color { color: "blue" }
                ]
            }
        ]
    }

    function read() {
        return [value.min, value.max, value.orientation, value.labels.join(" "),
                column.min, column.max, column.orientation, column.labels.join(" "),
                row.min, row.max, row.orientation, row.labels.join(" "),
                proxy.rowCount, proxy.colCount, proxy.rowRole, proxy.columnRole, proxy.valueRole,
                volume.rowLabels.join(" "), volume.columnLabels.join(" "), volume.rowColors.length,
                graph.barSpacing.width, graph.barSpacing.height, graph.barThickness, graph.barSpacingRelative,
                graph.cameraXRotation, graph.cameraYRotation, graph.cameraZoomLevel, graph.orthoProjection,
                graph.primarySeries === volume, graph.selectedSeries === null, graph.shadowQuality]
    }

    function step(i) {
        if (i === 0) {
            // As stocqt spaces the rows for a month of days.
            graph.barSpacing.height = 3
        } else if (i === 1) {
            look.labelFont.pointSize = 24
            graph.cameraXRotation = 20
            graph.cameraYRotation = 20
            graph.cameraZoomLevel = 80
        } else if (i === 2) {
            graph.orthoProjection = false
            graph.cameraXRotation = -30
            graph.cameraYRotation = 30
        } else if (i === 3) {
            fill(["QT"], 3)
            volume.rowColors = []
            graph.barSpacing = Qt.size(0.5, 0.5)
            graph.cameraZoomLevel = 100
        } else if (i === 4) {
            look.labelFont.pointSize = 9
            graph.cameraPreset = Graphs3D.CameraPreset.IsometricLeftHigh
            graph.ambientLightStrength = 0.25
            value.min = 10
            value.max = 30
        }
    }
}
