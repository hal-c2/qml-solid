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
        return [item.Material.theme, item.Material.primary, item.Material.accent, item.Material.foreground, item.Material.background].map(String)
    }
    function all(item) {
        return [item.Material.primaryColor, item.Material.accentColor, item.Material.backgroundColor, item.Material.primaryTextColor, item.Material.primaryHighlightedTextColor,
            item.Material.secondaryTextColor, item.Material.hintTextColor, item.Material.textSelectionColor, item.Material.dropShadowColor, item.Material.dividerColor,
            item.Material.iconColor, item.Material.iconDisabledColor, item.Material.frameColor, item.Material.rippleColor, item.Material.highlightedRippleColor,
            item.Material.switchUncheckedTrackColor, item.Material.switchCheckedTrackColor, item.Material.switchUncheckedHandleColor,
            item.Material.switchUncheckedHoveredHandleColor, item.Material.switchDisabledUncheckedTrackColor,
            item.Material.switchDisabledCheckedTrackColor, item.Material.switchDisabledUncheckedTrackBorderColor,
            item.Material.switchCheckedHandleColor, item.Material.switchDisabledUncheckedHandleColor, item.Material.switchDisabledCheckedHandleColor,
            item.Material.switchDisabledCheckedIconColor, item.Material.switchDisabledUncheckedIconColor, item.Material.scrollBarColor,
            item.Material.scrollBarHoveredColor, item.Material.scrollBarPressedColor, item.Material.dialogColor, item.Material.backgroundDimColor,
            item.Material.listHighlightColor, item.Material.tooltipColor, item.Material.toolBarColor, item.Material.toolTextColor, item.Material.spinBoxDisabledIconColor,
            item.Material.sliderDisabledColor, item.Material.textFieldFilledContainerColor].map(String)
    }
    function buttons(item) {
        const rows = []
        for (const [enabled, flat, highlighted, checked] of [[true, false, false, false], [false, false, false, false],
                [false, true, false, false], [true, true, false, false], [true, false, true, false],
                [true, false, true, true], [true, true, true, false], [true, true, true, true]])
            rows.push(String(item.Material.buttonColor(item.Material.theme, item.Material.background, item.Material.accent, enabled, flat, highlighted, checked)))
        return rows
    }
    function shades(item, color) {
        const rows = []
        for (let shade = Material.Shade50; shade <= Material.ShadeA700; shade++)
            rows.push(String(item.Material.shade(color, shade)))
        return rows
    }
    function table(item) {
        const rows = []
        for (let color = Material.Red; color <= Material.BlueGrey; color++) {
            const row = []
            for (let shade = Material.Shade50; shade <= Material.ShadeA700; shade++)
                row.push(String(item.Material.color(color, shade)))
            rows.push(row.join(" "))
        }
        return rows
    }
    function measures(item) {
        return [item.Material.touchTarget, item.Material.buttonVerticalPadding, item.Material.buttonHeight, item.Material.delegateHeight, item.Material.dialogButtonBoxHeight,
            item.Material.dialogTitleFontPixelSize, item.Material.dialogRoundedScale, item.Material.frameVerticalPadding, item.Material.menuItemHeight,
            item.Material.menuItemVerticalPadding, item.Material.switchIndicatorWidth, item.Material.switchIndicatorHeight, item.Material.switchNormalHandleHeight,
            item.Material.switchCheckedHandleHeight, item.Material.switchLargestHandleHeight, item.Material.switchDelegateVerticalPadding,
            item.Material.textFieldHeight, item.Material.textFieldHorizontalPadding, item.Material.textFieldVerticalPadding, item.Material.tooltipHeight,
            item.Material.buttonLeftPadding(false, false), item.Material.buttonLeftPadding(false, true), item.Material.buttonLeftPadding(true, true),
            item.Material.buttonRightPadding(false, false, false), item.Material.buttonRightPadding(false, true, true),
            item.Material.buttonRightPadding(true, false, true), item.Material.buttonRightPadding(true, true, false),
            item.Material.buttonRightPadding(true, true, true)]
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
