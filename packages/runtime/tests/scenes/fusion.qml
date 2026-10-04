// The `Fusion` singleton: the colours the Fusion style makes of a palette.
// `answers` is asked of Qt too, and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Fusion

Item {
    id: root
    width: 400
    height: 300

    T.Control { id: plain }
    T.Control {
        id: dark
        palette.window: "#2d2d2d"
        palette.windowText: "#f0f0f0"
        palette.button: "#3a3a3a"
        palette.highlight: "#1e90ff"
        palette.highlightedText: "#000000"
    }
    T.Control {
        id: vivid
        palette.window: "#ffe4b5"
        palette.button: "#cc3366"
        palette.highlight: "#00cc44"
    }
    T.Control {
        id: pale
        palette.window: "#ffffff"
        palette.button: "#fafafa"
        palette.highlight: "#80ffff00"
    }
    T.Control {
        id: off
        enabled: false
    }

    function colours(p) {
        const rows = [Fusion.highlight(p), Fusion.highlightedText(p), Fusion.outline(p), Fusion.highlightedOutline(p),
            Fusion.tabFrameColor(p), Fusion.grooveColor(p), Fusion.buttonColor(p)]
        for (const highlighted of [false, true])
            for (const down of [false, true])
                for (const hovered of [false, true])
                    rows.push(Fusion.buttonColor(p, highlighted, down, hovered))
        for (const highlighted of [false, true])
            for (const enabled of [false, true])
                rows.push(Fusion.buttonOutline(p, highlighted, enabled))
        rows.push(Fusion.buttonOutline(p), Fusion.buttonOutline(p, true))
        return rows.map(String)
    }

    function answers() {
        const rows = []
        rows.push([Fusion.lightShade, Fusion.darkShade, Fusion.topShadow, Fusion.innerContrastLine].map(String))
        rows.push(Fusion.highContrast)
        for (const control of [plain, dark, vivid, pale, off])
            rows.push(colours(control.palette))
        const made = []
        for (const base of ["#3a3a3a", "#efefef", "#cc3366", "#80123456", "white", "black"])
            made.push(Fusion.gradientStart(base), Fusion.gradientStop(base))
        rows.push(made.map(String))
        rows.push([Fusion.mergedColors("#cc3366", "#102030"), Fusion.mergedColors("#cc3366", "#102030", 90),
            Fusion.mergedColors("#80ffffff", "#000000", 33), Fusion.mergedColors(Fusion.buttonColor(dark.palette),
            Fusion.highlight(dark.palette), 15)].map(String))
        // A program that imports this style and chooses none has this one.
        rows.push([plain.font.pixelSize, plain.font.weight])
        return rows
    }
}
