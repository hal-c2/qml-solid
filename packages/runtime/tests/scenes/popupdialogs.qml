import QtQuick
import QtQuick.Templates as T

// Dialogs: the button box a dialog has for a footer or a header, what a
// click on a button, Escape and a press outside say, and what `accept()`,
// `reject()` and `done()` do.
Item {
    id: root
    width: 400
    height: 300
    property var log: []
    property alias plain: plain
    property alias wide: wide
    property alias topped: topped

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }

    MouseArea {
        anchors.fill: parent
        onPressed: root.note("under pressed")
    }

    T.Dialog {
        id: plain
        objectName: "plain"
        x: 20
        y: 20
        width: 300
        padding: 6
        spacing: 3
        title: "Plain"
        implicitHeight: contentHeight + topPadding + bottomPadding
                        + (implicitHeaderHeight > 0 ? implicitHeaderHeight + spacing : 0)
                        + (implicitFooterHeight > 0 ? implicitFooterHeight + spacing : 0)
        standardButtons: T.Dialog.Ok | T.Dialog.Cancel | T.Dialog.Apply | T.Dialog.Help | T.Dialog.Discard | T.Dialog.Reset
        contentItem: Item { implicitWidth: 120; implicitHeight: 40 }
        background: Rectangle { color: "white" }
        header: Rectangle { implicitWidth: 80; implicitHeight: 16; color: "silver" }
        footer: T.DialogButtonBox {
            id: plainBox
            objectName: "plainBox"
            padding: 4
            spacing: 2
            implicitWidth: contentWidth + leftPadding + rightPadding
            implicitHeight: contentHeight + topPadding + bottomPadding
            delegate: T.Button { implicitWidth: 40; implicitHeight: 20 }
            contentItem: ListView {
                model: plainBox.contentModel
                spacing: plainBox.spacing
                orientation: ListView.Horizontal
            }
            onStandardButtonsChanged: root.note("plainBox buttons " + standardButtons + " " + count)
        }
        onAccepted: root.note("plain accepted " + result)
        onRejected: root.note("plain rejected " + result)
        onApplied: root.note("plain applied")
        onReset: root.note("plain reset")
        onDiscarded: root.note("plain discarded")
        onHelpRequested: root.note("plain help")
        onResultChanged: root.note("plain result " + result)
        onAboutToShow: root.note("plain aboutToShow")
        onOpened: root.note("plain opened")
        onAboutToHide: root.note("plain aboutToHide")
        onClosed: root.note("plain closed")
        onTitleChanged: root.note("plain title " + title)
        onStandardButtonsChanged: root.note("plain buttons " + standardButtons + " " + (footer as T.DialogButtonBox).count)
        onFooterChanged: root.note("plain footer " + (footer ? footer.objectName : null))
    }

    // As a style writes one: as wide as the widest of what it has, which is
    // its footer here, a box as wide as the view its buttons are in.
    T.Dialog {
        id: wide
        objectName: "wide"
        x: 10
        y: 150
        modal: true
        padding: 5
        implicitWidth: Math.max(contentWidth + leftPadding + rightPadding, implicitHeaderWidth, implicitFooterWidth)
        implicitHeight: contentHeight + topPadding + bottomPadding + implicitFooterHeight
        standardButtons: T.Dialog.Yes | T.Dialog.No
        contentItem: Item { implicitWidth: 60; implicitHeight: 30 }
        background: Rectangle { color: "white" }
        footer: T.DialogButtonBox {
            id: wideBox
            objectName: "wideBox"
            padding: 8
            spacing: 1
            implicitWidth: implicitContentWidth + leftPadding + rightPadding
            implicitHeight: implicitContentHeight + topPadding + bottomPadding
            contentWidth: (contentItem as ListView)?.contentWidth
            delegate: T.Button { implicitWidth: 30; implicitHeight: 18 }
            contentItem: ListView {
                implicitWidth: contentWidth
                model: wideBox.contentModel
                spacing: wideBox.spacing
                orientation: ListView.Horizontal
            }
        }
        onAccepted: root.note("wide accepted")
        onRejected: root.note("wide rejected")
        onClosed: root.note("wide closed")
    }

    // A box over the content, with buttons of its own, and one under it
    // that says which standard buttons it has itself.
    T.Dialog {
        id: topped
        objectName: "topped"
        x: 200
        y: 150
        width: 180
        height: 100
        focus: false
        closePolicy: T.Popup.NoAutoClose
        background: Rectangle { color: "white" }
        header: T.DialogButtonBox {
            id: toppedBox
            objectName: "toppedBox"
            implicitHeight: contentHeight
            contentItem: ListView {
                model: toppedBox.contentModel
                orientation: ListView.Horizontal
            }
            T.Button {
                text: "Go"
                implicitWidth: 30
                implicitHeight: 20
                T.DialogButtonBox.buttonRole: T.DialogButtonBox.AcceptRole
            }
            T.Button {
                text: "Wipe"
                implicitWidth: 30
                implicitHeight: 20
                T.DialogButtonBox.buttonRole: T.DialogButtonBox.DestructiveRole
            }
        }
        footer: T.DialogButtonBox {
            id: underBox
            objectName: "underBox"
            implicitHeight: contentHeight
            standardButtons: T.DialogButtonBox.Close | T.DialogButtonBox.Retry
            delegate: T.Button { implicitWidth: 30; implicitHeight: 22 }
            contentItem: ListView {
                model: underBox.contentModel
                orientation: ListView.Horizontal
            }
        }
        onAccepted: root.note("topped accepted")
        onRejected: root.note("topped rejected")
        onDiscarded: root.note("topped discarded")
        onClosed: root.note("topped closed")
    }

    T.DialogButtonBox {
        id: spare
        objectName: "spare"
        y: 262
        padding: 2
        implicitWidth: contentWidth + leftPadding + rightPadding
        implicitHeight: contentHeight + topPadding + bottomPadding
        delegate: T.Button { implicitWidth: 50; implicitHeight: 24 }
        contentItem: ListView {
            model: spare.contentModel
            orientation: ListView.Horizontal
        }
        T.Button {
            text: "Own"
            implicitWidth: 50
            implicitHeight: 24
            T.DialogButtonBox.buttonRole: T.DialogButtonBox.ApplyRole
        }
    }

    function rect(item) { return item ? [item.x, item.y, item.width, item.height] : null }
    function box(b) {
        if (!(b instanceof T.DialogButtonBox)) return rect(b)
        const items = []
        for (let i = 0; i < b.count; i++) {
            const one = b.itemAt(i)
            items.push([one.text, one.width, one.height, one.focus, one.activeFocus, one.highlighted])
        }
        return [b.objectName, rect(b), b.position, b.standardButtons, b.visible, b.focus, b.activeFocus, items]
    }
    function found(dialog, button) {
        const b = dialog.standardButton(button)
        return b ? b.text : null
    }
    function tell(d) {
        return [d.visible, d.opened, d.result, d.standardButtons, d.title, d.x, d.y, d.width, d.height,
                d.implicitHeaderWidth, d.implicitHeaderHeight, d.implicitFooterWidth, d.implicitFooterHeight,
                d.activeFocus, d.focus, rect(d.contentItem), box(d.header), box(d.footer),
                found(d, T.Dialog.Ok), found(d, T.Dialog.Close), found(d, T.Dialog.Yes)]
    }
    function state() { return [tell(plain), tell(wide), tell(topped), box(spare), box(plainBox)] }

    function step(i) {
        const D = T.Dialog
        switch (i) {
        case 0: plain.open(); break
        case 1: plain.accept(); break
        case 2: plain.reject(); break
        case 3: plain.done(7); break
        case 4: plain.result = 1; plain.title = "Renamed"; break
        case 5: plain.standardButtons = D.Ok | D.Cancel; break
        case 6: plain.footer = spare; break
        case 7: plainBox.itemAt(0).clicked(); spare.itemAt(0).clicked(); break
        case 8: plain.standardButtons = D.Save | D.Close; break
        case 9: plain.footer = null; break
        case 10: wide.open(); break
        case 11: wide.standardButtons = D.Yes | D.No | D.Abort; break
        case 12: topped.open(); break
        case 13: toppedBox.itemAt(0).clicked(); break
        case 14: toppedBox.itemAt(1).clicked(); break
        case 15: underBox.standardButtons = T.DialogButtonBox.Close; topped.open(); break
        case 16: underBox.itemAt(0).clicked(); break
        case 17: topped.standardButtons = D.Ok; break
        case 18: plain.standardButtons = D.Yes | D.No; break
        }
    }
}
