import QtQuick
import QtQuick.Templates as T

// Button boxes: the buttons a box makes for its standard buttons, the order
// it puts them in, how it shares its width among them, and what a click on
// each says.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    // What the buttons hear of the box they are in: apart from what the
    // boxes tell, for the order between the two is not the same every time.
    property var heard: []
    property alias plain: plain
    property alias listed: listed

    T.DialogButtonBox {
        id: plain
        objectName: "plain"
        width: 320
        padding: 10
        spacing: 4
        implicitWidth: contentWidth + leftPadding + rightPadding
        implicitHeight: contentHeight + topPadding + bottomPadding
        standardButtons: T.DialogButtonBox.Ok | T.DialogButtonBox.Cancel | T.DialogButtonBox.Help
        delegate: T.Button {
            implicitWidth: 20 + text.length * 8
            implicitHeight: 30
        }
        contentItem: Item {
            implicitWidth: plain.contentWidth
            implicitHeight: plain.contentHeight
        }
        onAccepted: root.log.push("plain accepted")
        onRejected: root.log.push("plain rejected")
        onApplied: root.log.push("plain applied")
        onReset: root.log.push("plain reset")
        onDiscarded: root.log.push("plain discarded")
        onHelpRequested: root.log.push("plain help")
        onClicked: (button) => root.log.push("plain clicked " + button.text)
        onStandardButtonsChanged: root.log.push("plain buttons " + standardButtons + " " + count)
        onCountChanged: root.log.push("plain count " + count)
        onAlignmentChanged: root.log.push("plain alignment " + alignment)
        onButtonLayoutChanged: root.log.push("plain layout " + buttonLayout)
        onDefaultButtonChanged: root.log.push("plain default " + (defaultButton ? defaultButton.text : null))
        onDefaultStandardButtonChanged: root.log.push("plain default standard " + defaultStandardButton)
    }

    // As a style writes one: a view over the buttons, and a box that is as
    // wide as they are.
    T.DialogButtonBox {
        id: listed
        objectName: "listed"
        y: 100
        spacing: 2
        padding: 6
        implicitWidth: contentWidth + leftPadding + rightPadding
        implicitHeight: contentHeight + topPadding + bottomPadding
        contentWidth: (contentItem as ListView)?.contentWidth
        alignment: count === 1 ? Qt.AlignRight : undefined
        position: T.DialogButtonBox.Header
        delegate: T.Button {
            implicitWidth: 20 + text.length * 8
            implicitHeight: 24
            width: listed.count === 1 ? listed.availableWidth / 2 : undefined
        }
        contentItem: ListView {
            implicitWidth: contentWidth
            model: listed.contentModel
            spacing: listed.spacing
            orientation: ListView.Horizontal
            boundsBehavior: Flickable.StopAtBounds
        }
        T.Button {
            id: mine
            text: "Mine"
            implicitWidth: 50
            implicitHeight: 20
            T.DialogButtonBox.buttonRole: T.DialogButtonBox.HelpRole
            T.DialogButtonBox.onButtonBoxChanged: root.heard.push("mine box " + root.named(T.DialogButtonBox.buttonBox))
            T.DialogButtonBox.onButtonRoleChanged: root.heard.push("mine role " + T.DialogButtonBox.buttonRole)
        }
        T.Button {
            id: wipe
            text: "Wipe"
            implicitWidth: 70
            implicitHeight: 28
            T.DialogButtonBox.buttonRole: T.DialogButtonBox.DestructiveRole
        }
        T.Button {
            id: yes
            text: "Aye"
            implicitWidth: 40
            implicitHeight: 20
            T.DialogButtonBox.buttonRole: T.DialogButtonBox.YesRole
        }
        T.Button {
            id: none
            text: "None"
            implicitWidth: 44
            implicitHeight: 20
        }
        Item { id: stray; width: 10; height: 10 }
        onAccepted: root.log.push("listed accepted")
        onRejected: root.log.push("listed rejected")
        onDiscarded: root.log.push("listed discarded")
        onHelpRequested: root.log.push("listed help")
        onClicked: (button) => root.log.push("listed clicked " + button.text)
    }

    T.Button {
        id: loose
        y: 250
        text: "Loose"
        implicitWidth: 64
        implicitHeight: 22
        T.DialogButtonBox.buttonRole: T.DialogButtonBox.ApplyRole
        T.DialogButtonBox.onButtonBoxChanged: root.heard.push("loose box " + root.named(T.DialogButtonBox.buttonBox))
        function box() { return T.DialogButtonBox.buttonBox }
    }
    T.Button {
        id: extra
        y: 275
        text: "Extra"
        implicitWidth: 58
        implicitHeight: 26
        T.DialogButtonBox.buttonRole: T.DialogButtonBox.ActionRole
    }

    function named(box) { return box ? box.objectName : null }
    function role(button) { return button.T.DialogButtonBox.buttonRole }
    function boxOf(button) { return named(button.T.DialogButtonBox.buttonBox) }
    function tell(box) {
        const c = box.contentItem
        const items = []
        for (let i = 0; i < box.count; i++) {
            const b = box.itemAt(i)
            items.push([b.text, role(b), b.x, b.y, b.width, b.height, b.focus, b.activeFocus, b.highlighted, boxOf(b)])
        }
        return [box.count, box.contentWidth, box.contentHeight, box.implicitWidth, box.implicitHeight, box.width, box.height,
                box.availableWidth, [c.x, c.y, c.width, c.height], box.standardButtons, box.alignment, box.buttonLayout,
                box.position, box.focus, box.activeFocus, items]
    }
    function all(box) {
        const texts = []
        for (let i = 0; i < box.count; i++) texts.push(box.itemAt(i).text)
        return texts.join(" ")
    }
    function click(box) {
        for (let i = 0; i < box.count; i++) box.itemAt(i).clicked()
    }
    function found(box, button) {
        const b = box.standardButton(button)
        return b ? b.text : null
    }
    property var orders: []
    property bool gone: false
    function take(box, item) {
        for (let i = 0; i < box.count; i++) if (box.itemAt(i) === item) return box.takeItem(i)
    }
    function step(i) {
        const B = T.DialogButtonBox
        switch (i) {
        case 0: click(plain); click(listed); break
        case 1: plain.standardButtons = B.Save | B.Discard | B.Apply | B.Reset | B.Yes | B.No | B.Close; break
        case 2: click(plain); break
        case 3: plain.alignment = Qt.AlignRight; plain.standardButtons = B.Save | B.Discard | B.Yes; break
        case 4: plain.height = 80; plain.alignment = Qt.AlignHCenter | Qt.AlignBottom; break
        case 5: plain.alignment = Qt.AlignTop; plain.standardButtons = B.Save | B.Discard | B.Apply | B.Reset | B.Yes | B.No | B.Close; break
        case 6: plain.alignment = undefined; plain.width = 400; break
        case 7: plain.buttonLayout = B.MacLayout; break
        case 8: plain.buttonLayout = B.KdeLayout; break
        case 9: plain.buttonLayout = B.GnomeLayout; break
        case 10: plain.buttonLayout = B.AndroidLayout; break
        case 11: plain.buttonLayout = undefined; break
        case 12: plain.standardButtons = 0xffffc00; orders = [found(plain, B.Ok), found(plain, B.RestoreDefaults)]; break
        case 13: plain.buttonLayout = B.MacLayout; break
        case 14: plain.buttonLayout = B.WinLayout; plain.standardButtons = B.Ok | B.Cancel | B.Apply; plain.defaultStandardButton = B.Cancel; break
        case 15: plain.forceActiveFocus(); break
        case 16: plain.defaultStandardButton = B.NoButton; break
        case 17: plain.defaultButton = loose; break
        case 18: gone = true; plain.defaultButton = extra; break
        case 19: plain.itemAt(0).width = 50; break
        case 20: listed.standardButtons = B.Ok | B.Abort; break
        case 21: listed.width = 300; take(listed, mine); take(listed, wipe); take(listed, yes); take(listed, none); break
        case 22: listed.standardButtons = B.Ok; break
        case 23: listed.width = 200; break
        case 24: listed.addItem(mine); listed.addItem(stray); break
        case 25: plain.standardButtons = 0; break
        case 26: listed.forceActiveFocus(); break
        }
    }
    property int steps: 27
    function answers() {
        const l = log
        log = []
        const h = heard
        heard = []
        const B = T.DialogButtonBox
        return [tell(plain), tell(listed), l, h, orders,
                [found(plain, B.Ok), found(plain, B.Cancel), found(plain, B.Save), found(listed, B.Ok), found(listed, B.Abort)],
                gone ? null : [named(loose.box()), loose.x, loose.y, loose.width, loose.height, loose.parent === root],
                [stray.parent === root, stray.parent === null, mine.parent === null]]
    }
}
