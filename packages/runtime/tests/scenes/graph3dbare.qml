import QtQuick
import QtGraphs

// Graphs in space that were given nothing, and what they answer as their
// cameras, their axes and their series are assigned.
Rectangle {
    id: root
    width: 600
    height: 200
    color: "#f2f2f2"

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }
    readonly property bool loaded: boxes.status === FontLoader.Ready

    Surface3DSeries { id: one }
    Surface3DSeries { id: two }
    Surface3DSeries { id: three }
    Bar3DSeries { id: bar }
    Scatter3DSeries { id: dot }
    Value3DAxis { id: lone }
    Category3DAxis { id: named; labels: ["a", "b"] }

    Row {
        Surface3D { id: surface; width: 200; height: 200; theme: GraphsTheme { labelFont.family: boxes.name } }
        Bars3D { id: bars; width: 200; height: 200; theme: GraphsTheme { labelFont.family: boxes.name } }
        Scatter3D { id: scatter; width: 200; height: 200; theme: GraphsTheme { labelFont.family: boxes.name } }
    }

    function camera(graph) {
        return [graph.cameraPreset, graph.cameraXRotation, graph.cameraYRotation,
                graph.cameraZoomLevel, graph.minCameraZoomLevel, graph.maxCameraZoomLevel]
    }

    function axis(axis) {
        return [axis.min, axis.max, axis.autoAdjustRange, axis.orientation, axis.type, axis.labels.join(" ")]
    }

    function read() {
        return {
            graph: [surface, bars, scatter].map(graph =>
                [graph.selectionMode, graph.shadowQuality, graph.shadowStrength, graph.msaaSamples, graph.aspectRatio,
                 graph.horizontalAspectRatio, graph.margin, graph.labelMargin, graph.ambientLightStrength,
                 graph.lightStrength, graph.orthoProjection, graph.polar, graph.wrapCameraXRotation,
                 graph.wrapCameraYRotation, graph.seriesList.length, graph.theme.labelFont.pointSize]),
            camera: [camera(surface), camera(bars), camera(scatter)],
            axes: [axis(surface.axisX), axis(surface.axisY), axis(surface.axisZ),
                   axis(bars.rowAxis), axis(bars.valueAxis), axis(bars.columnAxis),
                   axis(scatter.axisX), axis(scatter.axisY), axis(scatter.axisZ), axis(lone), axis(named)],
            value: [lone.segmentCount, lone.subSegmentCount, lone.labelFormat, lone.reversed, lone.title, lone.titleVisible,
                    lone.labelsVisible, lone.labelAutoAngle, lone.labelSize],
            series: [one.shading, one.drawMode, one.visible, one.selectedPoint.x, one.selectedPoint.y, one.dataProxy.rowCount,
                     one.dataProxy.columnCount, bar.mesh, bar.selectedBar.x, bar.selectedBar.y, bar.dataProxy.rowCount,
                     bar.rowColors.length, dot.mesh, dot.itemSize, dot.selectedItem, dot.dataProxy.itemCount],
            lists: [surface.hasSeries(one), surface.hasSeries(two), surface.seriesList.indexOf(one), surface.seriesList.indexOf(two),
                    surface.seriesList.indexOf(three), bars.seriesList.length, scatter.seriesList.length],
            selected: [surface.selectedSeries === null, bars.selectedSeries === null, bars.selectedSeries === bar,
                       bars.primarySeries === bar, scatter.selectedSeries === null, scatter.selectedSeries === dot],
            bars: [bars.barSpacing.width, bars.barSpacing.height, bars.barThickness, bars.barSpacingRelative,
                   bars.barSeriesMargin.width, bars.barSeriesMargin.height, bars.floorLevel, bars.multiSeriesUniform],
        }
    }

    function step(i) {
        if (i === 0) {
            // A zoom is whatever it is assigned; an end of its range holds it.
            surface.cameraZoomLevel = 600
            bars.cameraZoomLevel = 5
            bars.minCameraZoomLevel = 120
            scatter.cameraZoomLevel = 300
            scatter.maxCameraZoomLevel = 200
        } else if (i === 1) {
            surface.maxCameraZoomLevel = 100
            bars.maxCameraZoomLevel = 100
            scatter.minCameraZoomLevel = 0.5
            surface.cameraXRotation = 200
            surface.cameraYRotation = 120
            bars.cameraXRotation = -200
            bars.cameraYRotation = -20
            scatter.wrapCameraYRotation = true
            scatter.cameraYRotation = -20
        } else if (i === 2) {
            surface.cameraPreset = Graphs3D.CameraPreset.IsometricRight
            bars.cameraPreset = Graphs3D.CameraPreset.DirectlyBelow
            scatter.cameraPreset = Graphs3D.CameraPreset.LeftHigh
            scatter.cameraXRotation = 10
        } else if (i === 3) {
            // An end of a range that reaches the other takes it along.
            surface.axisX.min = 20
            surface.axisY.max = -5
            surface.axisZ.max = 5
            surface.axisZ.min = 5
            lone.segmentCount = 0
            lone.subSegmentCount = 3
            lone.labelFormat = "%d of them"
            lone.max = 4
            scatter.axisX = lone
            bars.columnAxis = named
        } else if (i === 4) {
            surface.addSeries(two)
            surface.addSeries(one)
            surface.addSeries(two)
            bars.insertSeries(0, bar)
            scatter.addSeries(dot)
            bar.selectedBar = Qt.point(-1, -1)
            dot.selectedItem = 3
            one.selectedPoint = Qt.point(0, 0)
        } else if (i === 5) {
            surface.removeSeries(two)
            scatter.clearSelection()
            bars.orthoProjection = true
            bars.barSpacing = Qt.size(0.2, 0.4)
            bars.barSeriesMargin.width = 0.3
            bars.barThickness = 2
            bars.floorLevel = 5
        }
    }
}
