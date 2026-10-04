// What an application's settings say of the styles (the
// `qtquickcontrols2.conf` here, which Qt is given, and the build as its
// `controls`): what an object that nothing gave anything has. `answers` is
// asked of Qt too, and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Material
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
        Material.theme: Material.Light
        Universal.theme: Universal.Light
        Item { id: under }
    }
    Item {
        id: given
        Material.accent: Material.Blue
        Material.foreground: "#336699"
        Material.background: Material.Lime
        Universal.accent: Universal.Orange
        Universal.background: "white"
    }
    T.Control { id: control }

    function material(item) {
        return [item.Material.theme, item.Material.primary, item.Material.accent, item.Material.foreground, item.Material.background,
            item.Material.primaryColor, item.Material.accentColor, item.Material.backgroundColor, item.Material.primaryTextColor,
            item.Material.secondaryTextColor, item.Material.hintTextColor, item.Material.dividerColor, item.Material.dialogColor,
            item.Material.toolBarColor, item.Material.toolTextColor].map(String)
    }
    function universal(item) {
        return [item.Universal.theme, item.Universal.accent, item.Universal.foreground, item.Universal.background,
            item.Universal.altHighColor, item.Universal.baseHighColor, item.Universal.chromeMediumColor, item.Universal.listLowColor].map(String)
    }
    // What is smaller in the dense variant, which only the settings choose.
    function measures(item) {
        return [item.Material.touchTarget, item.Material.buttonVerticalPadding, item.Material.buttonHeight, item.Material.delegateHeight,
            item.Material.dialogButtonBoxHeight, item.Material.dialogTitleFontPixelSize, item.Material.frameVerticalPadding,
            item.Material.menuItemHeight, item.Material.menuItemVerticalPadding, item.Material.switchDelegateVerticalPadding,
            item.Material.textFieldHeight, item.Material.textFieldVerticalPadding, item.Material.tooltipHeight]
    }

    function answers() {
        const rows = []
        for (const item of [plain, inner, light, under, given])
            rows.push(material(item))
        for (const item of [plain, inner, light, under, given])
            rows.push(universal(item))
        rows.push(measures(plain))
        rows.push([control.font.pixelSize, control.font.weight])
        // Taking back what an object was given leaves it what the settings say.
        light.Material.theme = undefined
        given.Material.accent = undefined
        given.Material.foreground = undefined
        given.Material.background = undefined
        given.Universal.accent = undefined
        given.Universal.background = undefined
        rows.push(material(light), material(given), universal(given))
        return rows
    }
}
