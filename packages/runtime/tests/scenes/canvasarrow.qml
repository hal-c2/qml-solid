import QtQuick

// The arrow of the thermostat example's combo box, as the compiler makes it
// and on a clock that runs.
Item {
    id: control
    property bool pressed: false
    property alias canvas: canvas
    width: 400; height: 300

    Canvas {
        id: canvas

        contextType: "2d"
        x: 20; y: 20
        height: 8
        width: 12

        onPaint: {
            context.reset();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.lineTo(width / 2, height);
            context.closePath();
            context.fillStyle = control.pressed ? "#ff0000" : "#898989";
            context.fill();
        }

        Connections {
            target: control
            function onPressedChanged() {
                canvas.requestPaint();
            }
        }
    }
}
