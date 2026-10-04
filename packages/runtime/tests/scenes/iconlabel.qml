import QtQuick
import QtQuick.Controls.impl

// What an IconLabel measures and where it puts its icon and its text, for
// each way of showing them. The font is one of boxes, so that Qt and a
// browser measure a text alike.
Item {
    id: root
    width: 400
    height: 300

    FontLoader { id: boxes; source: "../assets/boxes.ttf" }

    component Boxed: IconLabel { font.family: boxes.name; font.pixelSize: 16 }

    // The implicit size, nothing given.
    Boxed { id: both; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6 }
    Boxed { id: under; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: iconOnly; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.IconOnly }
    Boxed { id: textOnly; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextOnly }
    Boxed { id: noIcon; text: "Hello"; spacing: 6 }
    Boxed { id: noText; icon.source: "../assets/flag.png"; spacing: 6 }
    Boxed { id: noIconUnder; text: "Hello"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: noTextUnder; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: nothing; spacing: 6 }
    Boxed {
        id: padded; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6
        topPadding: 1; leftPadding: 2; rightPadding: 3; bottomPadding: 4
    }
    Boxed { id: sizedIcon; text: "Hello"; icon.source: "../assets/flag.png"; icon.width: 16; icon.height: 16; spacing: 6 }
    Boxed { id: bigIcon; text: "Hello"; icon.source: "../assets/circle.png"; spacing: 6 }
    Boxed { id: drawn; text: "Hello"; icon.source: "../assets/disc.svg"; icon.width: 24; icon.height: 24; spacing: 6 }
    Boxed { id: marked; text: "&Hello && (&g)" }
    Boxed { id: named; text: "Hello"; icon.name: "document-open"; spacing: 6 }

    // In more room than it asks for, and in less.
    Boxed { id: roomy; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6 }
    Boxed { id: roomyUnder; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: roomyIcon; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; display: IconLabel.IconOnly }
    Boxed { id: roomyText; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; display: IconLabel.TextOnly }
    Boxed { id: mirroredBoth; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6; mirrored: true }
    Boxed {
        id: corner; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6
        alignment: Qt.AlignLeft | Qt.AlignTop
    }
    Boxed {
        id: mirroredCorner; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6
        alignment: Qt.AlignLeft | Qt.AlignBottom; mirrored: true
    }
    Boxed {
        id: right; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6
        alignment: Qt.AlignRight
    }
    Boxed {
        id: underCorner; width: 200; height: 80; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 6
        alignment: Qt.AlignRight | Qt.AlignBottom; display: IconLabel.TextUnderIcon
        topPadding: 3; leftPadding: 5; rightPadding: 7; bottomPadding: 9
    }
    Boxed { id: lone; width: 200; height: 80; text: "Hello"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: loneIcon; width: 200; height: 81; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: tight; width: 70; height: 80; text: "Hello world"; icon.source: "../assets/flag.png"; spacing: 6 }
    Boxed { id: tightUnder; width: 30; height: 30; text: "Hello world"; icon.source: "../assets/flag.png"; spacing: 6; display: IconLabel.TextUnderIcon }
    Boxed { id: small; width: 30; height: 10; text: "Hello"; icon.source: "../assets/circle.png"; display: IconLabel.IconOnly }
    Boxed { id: odd; x: 0.25; y: 0.75; width: 201; height: 81; text: "Hello"; icon.source: "../assets/flag.png"; spacing: 5 }

    // The colour of the icon: the icon's own where it was given one, by the
    // label or by what the label's icon is taken from.
    Boxed { id: coloured; icon.source: "../assets/flag.png"; icon.color: "#ff0000"; defaultIconColor: "#0000ff" }
    Boxed { id: uncoloured; icon.source: "../assets/flag.png"; defaultIconColor: "#0000ff" }
    Boxed { id: taken; icon: coloured.icon; defaultIconColor: "#008000" }
    Boxed { id: takenPlain; icon: uncoloured.icon; defaultIconColor: "#008000" }

    // One that changes.
    Boxed { id: live; text: "Hello"; spacing: 6 }

    readonly property var labels: [both, under, iconOnly, textOnly, noIcon, noText, noIconUnder, noTextUnder, nothing, padded,
        sizedIcon, bigIcon, drawn, marked, named, roomy, roomyUnder, roomyIcon, roomyText, mirroredBoth, corner,
        mirroredCorner, right, underCorner, lone, loneIcon, tight, tightUnder, small, odd]

    function ready() {
        if (boxes.status !== FontLoader.Ready) return false
        for (const label of labels.concat([live, coloured, uncoloured, taken, takenPlain])) {
            for (const child of label.children)
                if (child.objectName === "image" && child.source != "" && child.status !== Image.Ready) return false
        }
        return true
    }

    function part(label, name) {
        for (const child of label.children)
            if (child.objectName === name) return child
        return null
    }

    function box(item) {
        return item ? [item.x, item.y, item.width, item.height] : null
    }

    function measured(label) {
        const image = part(label, "image")
        const text = part(label, "label")
        return [label.implicitWidth, label.implicitHeight, label.baselineOffset, label.children.length, box(image), box(text),
            text ? text.text : null, text ? text.truncated : null]
    }

    function answers() {
        const rows = []
        for (const label of labels) rows.push(measured(label))
        rows.push([both.alignment, corner.alignment, right.alignment, both.display, both.mirrored, both.spacing,
            String(both.color), String(both.defaultIconColor), String(both.icon.color), both.icon.width, both.icon.cache,
            IconLabel.IconOnly, IconLabel.TextOnly, IconLabel.TextBesideIcon, IconLabel.TextUnderIcon])
        const image = part(both, "image")
        const sized = part(sizedIcon, "image")
        rows.push([image.fillMode, image.sourceSize.width, image.sourceSize.height, String(image.color),
            sized.implicitWidth, sized.implicitHeight, part(small, "image").fillMode])
        const text = part(marked, "label")
        rows.push([marked.text, text.text, text.mnemonicVisible, text.elide, text.horizontalAlignment, text.verticalAlignment,
            text.implicitWidth])

        const colours = []
        for (const label of [coloured, uncoloured, taken, takenPlain])
            colours.push(String(part(label, "image").color), String(label.icon.color), label.implicitWidth)
        rows.push(colours)
        uncoloured.icon.color = "#ff00ff"
        coloured.defaultIconColor = "#00ffff"
        takenPlain.defaultIconColor = "#00ffff"
        rows.push([String(part(uncoloured, "image").color), String(part(coloured, "image").color)])
        uncoloured.icon.color = undefined
        rows.push([String(part(takenPlain, "image").color), String(takenPlain.icon.color)])

        rows.push(measured(live))
        live.icon.source = both.icon.source
        rows.push(measured(live))
        live.display = IconLabel.TextUnderIcon
        rows.push(measured(live))
        live.text = ""
        rows.push(measured(live))
        live.text = "Hello world"
        live.display = IconLabel.TextBesideIcon
        live.width = 100
        live.height = 40
        rows.push(measured(live))
        live.spacing = 10
        live.leftPadding = 4
        rows.push(measured(live))
        live.display = IconLabel.TextOnly
        rows.push(measured(live))
        live.alignment = Qt.AlignRight | Qt.AlignVCenter
        rows.push(measured(live))
        return rows
    }
}
