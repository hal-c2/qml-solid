import QtQuick

// Items that shaders paint. flag.png is red on the left and blue on the right.
Item {
    id: root
    width: 400; height: 300

    ShaderEffect {
        id: tinted
        width: 100; height: 50
        property color tint: "red"
        property real level: 0.5
        property point shift: Qt.point(0.25, 0)
        fragmentShader: "shaders/tint.frag.qsb"
    }
    Image { id: flag; visible: false; source: "/assets/flag.png" }
    ShaderEffect {
        id: swapped
        y: 60; width: 100; height: 50
        property var source: flag
        fragmentShader: "shaders/swap.frag.qsb"
    }
    ShaderEffect {
        id: shown
        y: 120; width: 100; height: 50
        property var source: ShaderEffectSource { sourceItem: tinted }
    }
    ShaderEffect {
        id: squeezed
        y: 180; width: 100; height: 50
        property color tint: "#00ff00"
        property real level: 2
        property real squeeze: 0.5
        mesh: GridMesh { resolution: Qt.size(1, 8) }
        vertexShader: "shaders/squeeze.vert.qsb"
        fragmentShader: "shaders/tint.frag.qsb"
    }
    ShaderEffect { id: wrong; y: 240; width: 20; height: 20; fragmentShader: "/scenes/shaders/wrong.frag" }
    ShaderEffect { id: missing; y: 240; x: 30; width: 20; height: 20; fragmentShader: "/scenes/shaders/none.frag" }

    function statuses() {
        return [tinted, swapped, shown, squeezed, wrong, missing].map((effect) => effect.status)
    }
    function logs() {
        return [tinted.log, wrong.log, missing.log]
    }
    function step(index) {
        [() => { tinted.level = 0; tinted.tint = Qt.rgba(0, 1, 0, 1) },
         () => { tinted.width = 200; squeezed.squeeze = 1; squeezed.opacity = 0.5 }][index]()
    }
}
