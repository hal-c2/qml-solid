import QtQuick
import QtGraphs

// The graph of a stock's day in Qt's stocqt demo: a point for each price,
// from a list model that is filled from JavaScript, the newest first.
Rectangle {
    id: root
    width: 600
    height: 400
    color: "#101010"

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    property int counted: 0
    property int kept: -1

    ListModel { id: priceModel }

    function fill(prices) {
        root.kept = live.selectedItem
        priceModel.clear()
        for (let i = 0; i < prices.length; i++)
            priceModel.insert(0, { "row": 0, "column": 34200 + 3600 * i, "value": prices[i] })
    }

    Component.onCompleted: fill([181.25, 183.5, 182, 186.75, 185, 188.5])

    Scatter3D {
        id: graph
        width: parent.width
        height: parent.height
        cameraZoomLevel: 140
        maxCameraZoomLevel: 400
        minCameraZoomLevel: 80
        orthoProjection: true

        axisX: Value3DAxis {
            id: ax
            title: "Times"
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
            Scatter3DSeries {
                id: live
                baseColor: "green"
                meshSmooth: true
                itemLabelFormat: "@xLabel: @yLabel$"
                // The label of what is selected is not drawn here, and Qt puts
                // it where no rule was found for.
                itemLabelVisible: false
                ItemModelScatterDataProxy {
                    id: proxy
                    itemModel: priceModel
                    xPosRole: "column"
                    yPosRole: "value"
                    zPosRole: "row"
                    onItemCountChanged: {
                        root.counted++
                        live.selectedItem = root.kept
                    }
                }
            }
        ]
    }

    function read() {
        return [ax.min, ax.max, ax.orientation, ax.labels.join(" "),
                graph.axisY.min, graph.axisY.max, graph.axisY.labels.join(" "),
                graph.axisZ.min, graph.axisZ.max, graph.axisZ.labels.join(" "),
                proxy.itemCount, proxy.xPosRole, proxy.yPosRole, proxy.zPosRole,
                live.selectedItem, live.itemSize, live.meshSmooth, root.counted > 0,
                graph.selectedSeries === live, graph.selectedSeries === null,
                graph.cameraXRotation, graph.cameraYRotation, graph.cameraZoomLevel, graph.orthoProjection]
    }

    function step(i) {
        if (i === 0) {
            live.selectedItem = 2
        } else if (i === 1) {
            // The one that was selected is, again, once the points are others.
            fill([181, 184, 183, 187, 186, 189, 190, 188])
        } else if (i === 2) {
            look.labelFont.pointSize = 20
            graph.cameraXRotation = 25
            graph.cameraYRotation = 25
            graph.cameraZoomLevel = 100
        } else if (i === 3) {
            graph.orthoProjection = false
            live.selectedItem = 40
            graph.axisY.min = 183.5
            graph.cameraXRotation = -40
        } else if (i === 4) {
            graph.clearSelection()
            live.baseColor = "#3060ff"
            graph.ambientLightStrength = 0.25
            graph.axisY.autoAdjustRange = true
        }
    }
}
