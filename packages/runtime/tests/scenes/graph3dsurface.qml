import QtQuick
import QtGraphs

// The graph of a stock's history in Qt's stocqt demo: two surfaces through
// the rows of list models that are filled from JavaScript.
Rectangle {
    id: root
    width: 600
    height: 400
    color: "#101010"

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    ListModel { id: highModel }
    ListModel { id: lowModel }

    function point(model, time, value) {
        model.append({ "row": 0, "column": time, "value": value })
        model.append({ "row": 2, "column": time, "value": value })
    }

    function fill(prices) {
        highModel.clear()
        lowModel.clear()
        for (let i = 0; i < prices.length; i++) {
            point(highModel, 10 + i, prices[i])
            point(lowModel, 10 + i, prices[i] - 3 - i % 2)
        }
    }

    Component.onCompleted: fill([12, 14, 13, 17])

    Surface3D {
        id: graph
        width: parent.width
        height: parent.height
        cameraZoomLevel: 170
        maxCameraZoomLevel: 400
        minCameraZoomLevel: 80

        axisX: Value3DAxis {
            id: ax
            autoAdjustRange: true
            title: "Dates"
            labelFormat: "dd-MM-yyyy"
            titleVisible: true
        }
        axisZ: Value3DAxis { id: az; segmentCount: 1 }
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
            Surface3DSeries {
                id: high
                baseColor: "green"
                shading: Surface3DSeries.Shading.Flat
                drawMode: Surface3DSeries.DrawSurface
                itemLabelFormat: "Time: @xLabel High:@yLabel$"
                ItemModelSurfaceDataProxy {
                    id: proxy
                    itemModel: highModel
                    rowRole: "row"
                    columnRole: "column"
                    yPosRole: "value"
                }
            },
            Surface3DSeries {
                id: low
                baseColor: "red"
                shading: Surface3DSeries.Shading.Flat
                drawMode: Surface3DSeries.DrawSurface
                ItemModelSurfaceDataProxy {
                    itemModel: lowModel
                    rowRole: "row"
                    columnRole: "column"
                    yPosRole: "value"
                }
            }
        ]
    }

    function read() {
        return [ax.min, ax.max, ax.autoAdjustRange, ax.orientation, ax.labels.join(" "),
                graph.axisY.min, graph.axisY.max, graph.axisY.orientation, graph.axisY.labels.join(" "),
                az.min, az.max, az.orientation, az.labels.join(" "),
                proxy.rowCount, proxy.columnCount, proxy.rowRole, proxy.columnRole, proxy.yPosRole, proxy.xPosRole,
                graph.cameraXRotation, graph.cameraYRotation, graph.cameraZoomLevel, graph.orthoProjection,
                graph.seriesList.length, high.shading, high.drawMode, low.visible]
    }

    function step(i) {
        if (i === 0) {
            graph.cameraXRotation = 30
            graph.cameraYRotation = 30
            graph.cameraZoomLevel = 100
        } else if (i === 1) {
            // As stocqt gives its dates: a range the data goes beyond.
            graph.axisX.min = 10.5
            graph.axisX.max = 12.2
        } else if (i === 2) {
            fill([9, 12, 16, 11, 13, 15])
            ax.autoAdjustRange = true
            look.labelFont.pointSize = 20
            graph.cameraXRotation = -60
            graph.cameraYRotation = 10
        } else if (i === 3) {
            graph.orthoProjection = true
            graph.cameraXRotation = 150
            graph.cameraYRotation = 50
            graph.axisY.title = "Price"
            graph.axisY.titleVisible = true
        } else if (i === 4) {
            high.shading = Surface3DSeries.Shading.Smooth
            low.visible = false
            graph.ambientLightStrength = 0.25
            graph.cameraXRotation = -20
            graph.cameraYRotation = 40
        }
    }
}
