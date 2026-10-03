// The `Material` attached type: what an object has of the style's theme and
// colours, its own or what it is in has. `answers` is asked of Qt too, and
// what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T
import QtQuick.Controls.Material

Item {
    id: root
    width: 400
    height: 300

    property int themeChanges: 0
    property int accentChanges: 0

    Item { id: plain }
    Item {
        id: dark
        Material.theme: Material.Dark
        Material.onThemeChanged: root.themeChanges++
        Item {
            id: inner
            Material.onAccentChanged: root.accentChanges++
            Item {
                id: deep
                Material.accent: Material.Teal
                Material.primary: "#123456"
            }
        }
    }
    Item {
        id: custom
        Material.accent: "#336699"
        Material.primary: Material.Green
        Material.foreground: Material.Red
        Material.background: "#204060"
        Item {
            id: child
            Item {
                id: lit
                Material.theme: Material.Light
                Material.background: Material.Lime
                Material.foreground: "#80112233"
            }
        }
    }
    Item {
        id: bar
        Material.background: Material.primary
        Item { id: tool }
    }
    Item {
        id: pale
        Material.primary: Material.Amber
        Material.background: Material.primary
        Item {
            id: over
            Material.theme: Material.Dark
        }
    }
    Item {
        id: own
        Material.primary: "#405060"
        Material.background: Material.primary
    }
    Item {
        id: same
        Material.foreground: Material.primaryTextColor
        Material.background: "#fffbfe"
        Material.accent: "nothing"
        Material.primary: 99
    }
    Item {
        id: raised
        Material.elevation: 6
        Material.roundedScale: Material.LargeScale
        Material.containerStyle: Material.Outlined
        Item { id: under }
    }
    T.ApplicationWindow {
        id: window
        width: 100
        height: 100
        Material.theme: Material.Dark
        Material.accent: Material.Orange
        Item {
            id: inside
            T.Control {
                id: control
                contentItem: Item { id: content }
            }
        }
    }

    function colours(item) {
        const m = item.Material
        return [m.theme, m.primary, m.accent, m.foreground, m.background].map(String)
    }
    function all(item) {
        const m = item.Material
        return [m.primaryColor, m.accentColor, m.backgroundColor, m.primaryTextColor, m.primaryHighlightedTextColor,
            m.secondaryTextColor, m.hintTextColor, m.textSelectionColor, m.dropShadowColor, m.dividerColor,
            m.iconColor, m.iconDisabledColor, m.frameColor, m.rippleColor, m.highlightedRippleColor,
            m.switchUncheckedTrackColor, m.switchCheckedTrackColor, m.switchUncheckedHandleColor,
            m.switchUncheckedHoveredHandleColor, m.switchDisabledUncheckedTrackColor,
            m.switchDisabledCheckedTrackColor, m.switchDisabledUncheckedTrackBorderColor,
            m.switchCheckedHandleColor, m.switchDisabledUncheckedHandleColor, m.switchDisabledCheckedHandleColor,
            m.switchDisabledCheckedIconColor, m.switchDisabledUncheckedIconColor, m.scrollBarColor,
            m.scrollBarHoveredColor, m.scrollBarPressedColor, m.dialogColor, m.backgroundDimColor,
            m.listHighlightColor, m.tooltipColor, m.toolBarColor, m.toolTextColor, m.spinBoxDisabledIconColor,
            m.sliderDisabledColor, m.textFieldFilledContainerColor].map(String)
    }
    function buttons(item) {
        const m = item.Material
        const rows = []
        for (const [enabled, flat, highlighted, checked] of [[true, false, false, false], [false, false, false, false],
                [false, true, false, false], [true, true, false, false], [true, false, true, false],
                [true, false, true, true], [true, true, true, false], [true, true, true, true]])
            rows.push(String(m.buttonColor(m.theme, m.background, m.accent, enabled, flat, highlighted, checked)))
        return rows
    }
    function shades(item, color) {
        const m = item.Material
        const rows = []
        for (let shade = Material.Shade50; shade <= Material.ShadeA700; shade++)
            rows.push(String(m.shade(color, shade)))
        return rows
    }
    function table(item) {
        const m = item.Material
        const rows = []
        for (let color = Material.Red; color <= Material.BlueGrey; color++) {
            const row = []
            for (let shade = Material.Shade50; shade <= Material.ShadeA700; shade++)
                row.push(String(m.color(color, shade)))
            rows.push(row.join(" "))
        }
        return rows
    }
    function measures(item) {
        const m = item.Material
        return [m.touchTarget, m.buttonVerticalPadding, m.buttonHeight, m.delegateHeight, m.dialogButtonBoxHeight,
            m.dialogTitleFontPixelSize, m.dialogRoundedScale, m.frameVerticalPadding, m.menuItemHeight,
            m.menuItemVerticalPadding, m.switchIndicatorWidth, m.switchIndicatorHeight, m.switchNormalHandleHeight,
            m.switchCheckedHandleHeight, m.switchLargestHandleHeight, m.switchDelegateVerticalPadding,
            m.textFieldHeight, m.textFieldHorizontalPadding, m.textFieldVerticalPadding, m.tooltipHeight,
            m.buttonLeftPadding(false, false), m.buttonLeftPadding(false, true), m.buttonLeftPadding(true, true),
            m.buttonRightPadding(false, false, false), m.buttonRightPadding(false, true, true),
            m.buttonRightPadding(true, false, true), m.buttonRightPadding(true, true, false),
            m.buttonRightPadding(true, true, true)]
    }

    function answers() {
        const rows = []
        for (const item of [plain, dark, inner, deep, custom, child, lit, bar, tool, pale, over, own, same, raised,
                under, window, inside, control, content])
            rows.push(colours(item))
        for (const item of [plain, dark, deep, custom, lit, bar, pale, over, own, same])
            rows.push(all(item))
        for (const item of [plain, dark, custom, lit, deep])
            rows.push(buttons(item))
        rows.push(shades(plain, "#336699"), shades(dark, "#336699"), shades(plain, "#80f0f8ff"), shades(dark, "black"))
        rows.push(table(plain))
        rows.push(measures(plain))
        rows.push([raised.Material.elevation, raised.Material.roundedScale, raised.Material.containerStyle,
            under.Material.elevation, under.Material.roundedScale, under.Material.containerStyle])
        rows.push([Material.Light, Material.Dark, Material.System, Material.Normal, Material.Dense, Material.Red,
            Material.BlueGrey, Material.Shade50, Material.Shade500, Material.ShadeA700, Material.NotRounded,
            Material.ExtraSmallScale, Material.SmallScale, Material.MediumScale, Material.LargeScale,
            Material.ExtraLargeScale, Material.FullScale, Material.Filled, Material.Outlined])
        rows.push(String(plain.Material.color(Material.Blue)), String(plain.Material.color(99, 0)))
        // A program that imports this style and chooses none has this one.
        rows.push([control.font.pixelSize, control.font.weight])

        // What changes above is what everything under it has, but for what
        // it was given itself.
        const themes = root.themeChanges
        const accents = root.accentChanges
        dark.Material.theme = Material.Light
        dark.Material.accent = Material.Purple
        rows.push(colours(dark), colours(inner), colours(deep))
        rows.push([root.themeChanges - themes, root.accentChanges - accents])
        dark.Material.theme = undefined
        dark.Material.accent = undefined
        deep.Material.primary = undefined
        rows.push(colours(dark), colours(inner), colours(deep))
        custom.Material.foreground = undefined
        custom.Material.background = undefined
        rows.push(colours(custom), colours(child), colours(lit))
        window.Material.theme = Material.Light
        window.Material.primary = "red"
        rows.push(colours(window), colours(content), all(content))
        return rows
    }
}
