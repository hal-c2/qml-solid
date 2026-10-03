// The `Universal` attached type: what an object has of the style's theme
// and colours, its own or what it is in has. `answers` is asked of Qt too,
// and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Universal

Item {
    id: root
    width: 400
    height: 300

    property int themeChanges: 0
    property int accentChanges: 0

    Item { id: plain }
    Item {
        id: dark
        Universal.theme: Universal.Dark
        Universal.onThemeChanged: root.themeChanges++
        Item {
            id: inner
            Universal.onAccentChanged: root.accentChanges++
            Item {
                id: deep
                Universal.accent: Universal.Teal
                Universal.foreground: "#123456"
            }
        }
    }
    Item {
        id: custom
        Universal.accent: "#336699"
        Universal.foreground: Universal.Red
        Universal.background: "#80204060"
        Item {
            id: child
            Item {
                id: lit
                Universal.theme: Universal.Dark
                Universal.background: "Olive"
            }
        }
    }
    Item {
        id: wrong
        Universal.accent: "nothing"
        Universal.foreground: 99
    }
    T.ApplicationWindow {
        id: window
        width: 100
        height: 100
        Universal.theme: Universal.Dark
        Universal.accent: Universal.Orange
        Item {
            id: inside
            T.Control {
                id: control
                contentItem: Item { id: content }
            }
        }
    }

    function colours(item) {
        const u = item.Universal
        return [u.theme, u.accent, u.foreground, u.background].map(String)
    }
    function all(item) {
        const u = item.Universal
        return [u.altHighColor, u.altLowColor, u.altMediumColor, u.altMediumHighColor, u.altMediumLowColor,
            u.baseHighColor, u.baseLowColor, u.baseMediumColor, u.baseMediumHighColor, u.baseMediumLowColor,
            u.chromeAltLowColor, u.chromeBlackHighColor, u.chromeBlackLowColor, u.chromeBlackMediumLowColor,
            u.chromeBlackMediumColor, u.chromeDisabledHighColor, u.chromeDisabledLowColor, u.chromeHighColor,
            u.chromeLowColor, u.chromeMediumColor, u.chromeMediumLowColor, u.chromeWhiteColor, u.listLowColor,
            u.listMediumColor].map(String)
    }

    function answers() {
        const rows = []
        for (const item of [plain, dark, inner, deep, custom, child, lit, wrong, window, inside, control, content])
            rows.push(colours(item))
        for (const item of [plain, dark, lit, content])
            rows.push(all(item))
        const accents = []
        for (let accent = Universal.Lime; accent <= Universal.Taupe; accent++)
            accents.push(String(plain.Universal.color(accent)))
        rows.push(accents)
        rows.push([Universal.Light, Universal.Dark, Universal.System, Universal.Lime, Universal.Cobalt,
            Universal.Taupe])
        // A program that imports this style and chooses none has this one.
        rows.push([control.font.pixelSize, control.font.weight])

        // What changes above is what everything under it has, but for what
        // it was given itself.
        const themes = root.themeChanges
        const changes = root.accentChanges
        dark.Universal.theme = Universal.Light
        dark.Universal.accent = Universal.Violet
        dark.Universal.background = "yellow"
        rows.push(colours(dark), colours(inner), colours(deep))
        rows.push([root.themeChanges - themes, root.accentChanges - changes])
        dark.Universal.theme = undefined
        dark.Universal.accent = undefined
        dark.Universal.background = undefined
        deep.Universal.foreground = undefined
        rows.push(colours(dark), colours(inner), colours(deep))
        window.Universal.theme = Universal.Light
        window.Universal.foreground = "red"
        rows.push(colours(window), colours(content), all(content))
        return rows
    }
}
