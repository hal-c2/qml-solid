// Stands in for SvgPathItem of Qt Design Studio's QtQuick.Studio.Components,
// which is not part of Qt: a Shape of one path, given as SVG path data.
import QtQuick
import QtQuick.Shapes

Shape {
    id: root

    width: 200
    height: 200

    property alias gradient: shape.fillGradient
    property alias strokeStyle: shape.strokeStyle
    property alias strokeWidth: shape.strokeWidth
    property alias strokeColor: shape.strokeColor
    property alias dashPattern: shape.dashPattern
    property alias joinStyle: shape.joinStyle
    property alias fillColor: shape.fillColor
    property alias path: svg.path
    property alias dashOffset: shape.dashOffset
    property alias capStyle: shape.capStyle

    ShapePath {
        id: shape

        strokeWidth: 4
        strokeColor: "red"

        PathSvg {
            id: svg
        }
    }
}
