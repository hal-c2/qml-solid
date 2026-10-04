// The same settings (`qtquickcontrols2.conf`) where Universal is the style: Qt has
// it read its own only there. `answers` is asked of Qt too.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Universal

Item {
    id: root
    width: 400
    height: 300

    Item {
        id: plain
        Item { id: inner }
    }
    Item {
        id: light
        Universal.theme: Universal.Light
        Item { id: under }
    }
    Item {
        id: given
        Universal.accent: Universal.Orange
        Universal.background: "white"
        Universal.foreground: Universal.Lime
    }
    T.Control { id: control }

    function universal(item) {
        return [item.Universal.theme, item.Universal.accent, item.Universal.foreground, item.Universal.background,
            item.Universal.altHighColor, item.Universal.baseHighColor, item.Universal.chromeMediumColor, item.Universal.listLowColor].map(String)
    }

    function answers() {
        const rows = []
        for (const item of [plain, inner, light, under, given])
            rows.push(universal(item))
        rows.push([control.font.pixelSize, control.font.weight])
        // Taking back what an object was given leaves it what the settings say.
        light.Universal.theme = undefined
        given.Universal.accent = undefined
        given.Universal.background = undefined
        given.Universal.foreground = undefined
        rows.push(universal(light), universal(given))
        return rows
    }
}
