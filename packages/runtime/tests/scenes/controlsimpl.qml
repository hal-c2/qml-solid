import QtQuick
import QtQuick.Controls.impl

// The rest of what the styles' QML is written with: pictures in one colour,
// a rectangle with paddings, the texts of a control, a group of items.
Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    Rectangle { anchors.fill: parent; color: "white" }

    // Pictures: the circle is white on nothing, the flag has no see-through
    // part, the fade is black and more see-through towards its top left.
    ColorImage { id: plain; source: "../assets/circle.png" }
    ColorImage { id: tinted; x: 60; source: "../assets/circle.png"; color: "#ff0000" }
    ColorImage { id: same; x: 120; source: "../assets/circle.png"; color: "#0000ff"; defaultColor: "#0000ff" }
    ColorImage { id: faded; x: 180; width: 50; height: 50; source: "../assets/fade.png"; color: "#0000ff" }
    ColorImage { id: clear; x: 240; source: "../assets/flag.png"; color: "#0000ff00" }
    IconImage { id: icon; x: 300; source: "../assets/flag.png"; color: "#008000" }
    IconImage { id: untinted; x: 350; source: "../assets/flag.png" }
    IconImage { id: shrunk; y: 60; width: 20; height: 30; source: "../assets/circle.png"; color: "#ff00ff" }
    IconImage { id: roomy; x: 60; y: 60; width: 70; height: 60; source: "../assets/circle.png"; color: "#ff8000" }
    IconImage { id: wide; x: 140; y: 60; width: 60; height: 30; source: "../assets/disc.svg"; sourceSize.width: 60; sourceSize.height: 30; color: "#000000" }

    // Rectangles painted inside their paddings, and beyond the item.
    PaddedRectangle { id: padded; x: 220; y: 60; width: 60; height: 40; color: "#ff0000"; padding: 5; leftPadding: 10 }
    PaddedRectangle {
        id: tab; x: 290; y: 60; width: 40; height: 30; color: "#0000ff"; radius: 12; clip: true; bottomPadding: -12
    }
    PaddedRectangle {
        id: bordered; x: 340; y: 60; width: 50; height: 40; color: "#ffff00"; border.color: "#008000"; border.width: 4
        topPadding: 10; rightPadding: 20
        Rectangle { id: inner; width: 6; height: 6; color: "#000000" }
    }
    PaddedRectangle { id: bare; x: 220; y: 110; width: 30; height: 10; color: "#00ffff" }

    // Texts.
    MnemonicLabel { id: mnemonic; y: 130; text: "&ab &&c"; font.family: boxes.name; font.pixelSize: 40; color: "#0000ff" }
    MnemonicLabel {
        id: hidden; y: 130; x: 200; text: "ab (&c)"; mnemonicVisible: false
        font.family: boxes.name; font.pixelSize: 40; color: "#0000ff"
    }
    MnemonicLabel { id: bracketed; visible: false; text: "ab (&c)"; font.family: boxes.name; font.pixelSize: 40 }
    MnemonicLabel { id: none; visible: false; text: "abc"; font.family: boxes.name; font.pixelSize: 40 }
    CheckLabel { id: check; y: 180; width: 60; height: 40; text: "abcdefgh"; font.family: boxes.name; font.pixelSize: 20 }
    ClippedText {
        id: clipped; x: 100; y: 180; width: 100; height: 40; text: "abcde"; clip: true
        clipX: 30; clipY: 10; clipWidth: 40; clipHeight: 20
        font.family: boxes.name; font.pixelSize: 40; color: "#ff0000"
    }
    ClippedText { id: unclipped; visible: false; width: 100; height: 40; text: "abcde"; clipX: 30 }
    TextInput {
        id: field; x: 220; y: 180; width: 160; height: 30; horizontalAlignment: TextInput.AlignRight
        font.family: boxes.name; font.pixelSize: 20
        PlaceholderText {
            id: placeholder; anchors.fill: parent; text: "abc"; font: field.font; color: "#008000"
        }
    }
    TextInput {
        id: usual; x: 220; y: 220; width: 160; height: 30
        font.family: boxes.name; font.pixelSize: 20
        PlaceholderText { id: usualText; anchors.fill: parent; text: "abc"; font: usual.font; color: "#008000" }
    }
    Item {
        id: holder; visible: false
        PlaceholderText { id: lone; text: "abc"; horizontalAlignment: Text.AlignHCenter }
    }

    // A group: as big as the biggest of what is in it wants to be, and
    // everything in it as big as the group.
    ItemGroup {
        id: group; y: 240
        Rectangle { id: first; implicitWidth: 30; implicitHeight: 50; color: "#ff0000" }
        Rectangle { id: second; implicitWidth: 80; implicitHeight: 20; color: "#0000ff"; opacity: 0.5 }
    }
    ItemGroup {
        id: given; x: 100; y: 240; width: 40; height: 30
        Rectangle { id: third; implicitWidth: 80; implicitHeight: 20; color: "#008000" }
    }
    ItemGroup { id: empty }

    function ready() {
        if (boxes.status !== FontLoader.Ready) return false
        for (const image of [plain, tinted, same, faded, clear, icon, untinted, shrunk, roomy, wide])
            if (image.status !== Image.Ready) return false
        return true
    }

    // What the test of what is painted changes.
    function change(step) {
        if (step === 1) {
            tinted.color = "#00ff00"
            same.defaultColor = "#ff0000"
            padded.leftPadding = 30
            mnemonic.text = "a&b"
            hidden.mnemonicVisible = true
        } else {
            tinted.color = "transparent"
            mnemonic.mnemonicVisible = false
        }
    }

    function box(item) {
        return [item.x, item.y, item.width, item.height]
    }

    function answers() {
        const rows = []
        rows.push([String(plain.color), String(plain.defaultColor), plain.fillMode, plain.implicitWidth, plain.implicitHeight])
        rows.push([String(icon.color), icon.name, icon.fillMode, icon.implicitWidth, icon.implicitHeight,
            shrunk.fillMode, shrunk.paintedWidth, shrunk.paintedHeight, roomy.fillMode, roomy.paintedWidth, roomy.paintedHeight,
            wide.fillMode, wide.implicitWidth])
        rows.push([padded.padding, padded.topPadding, padded.leftPadding, padded.rightPadding, padded.bottomPadding,
            bordered.padding, bordered.topPadding, bordered.rightPadding, bordered.leftPadding, tab.bottomPadding, box(inner)])
        rows.push([mnemonic.text, mnemonic.mnemonicVisible, mnemonic.implicitWidth, mnemonic.implicitHeight,
            hidden.text, hidden.implicitWidth, bracketed.implicitWidth, none.implicitWidth])
        rows.push([check.horizontalAlignment, check.verticalAlignment, check.elide, check.truncated, check.implicitWidth])
        rows.push([clipped.clipX, clipped.clipY, clipped.clipWidth, clipped.clipHeight,
            unclipped.clipX, unclipped.clipY, unclipped.clipWidth, unclipped.clipHeight])
        rows.push([placeholder.horizontalAlignment, usualText.horizontalAlignment, lone.horizontalAlignment,
            placeholder.effectiveHorizontalAlignment])
        rows.push([group.implicitWidth, group.implicitHeight, box(group), box(first), box(second),
            given.implicitWidth, given.implicitHeight, box(given), box(third), empty.implicitWidth, empty.implicitHeight])
        rows.push([PlatformTheme.ShowDirectoriesFirst, PlatformTheme.CursorFlashTime, PlatformTheme.ScrollSingleStepDistance,
            PlatformTheme.themeHint(PlatformTheme.ShowDirectoriesFirst), PlatformTheme.themeHint(PlatformTheme.UnderlineShortcut)])

        // What changes.
        tinted.color = "#00ff00"
        padded.padding = 2
        second.implicitWidth = 120
        mnemonic.mnemonicVisible = false
        mnemonic.text = "a&b"
        hidden.mnemonicVisible = true
        clipped.clipWidth = 0
        field.horizontalAlignment = TextInput.AlignHCenter
        rows.push([String(tinted.color), padded.topPadding, padded.leftPadding, group.implicitWidth, box(first),
            mnemonic.implicitWidth, hidden.implicitWidth, clipped.clipWidth, placeholder.horizontalAlignment])
        tinted.color = "#ff0000"
        padded.padding = 5
        second.implicitWidth = 80
        mnemonic.text = "&ab &&c"
        mnemonic.mnemonicVisible = true
        hidden.mnemonicVisible = false
        clipped.clipWidth = 40
        field.horizontalAlignment = TextInput.AlignRight
        return rows
    }
}
