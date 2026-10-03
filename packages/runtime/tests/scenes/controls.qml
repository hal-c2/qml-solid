// What QtQuick.Templates is under a style: the controls here are given
// their backgrounds and sizes as a style's QML gives them. `answers` is
// asked of Qt too, and what Qt says is what the test expects.
import QtQuick
import QtQuick.Templates as T

Item {
    id: root
    width: 400
    height: 300

    T.Control {
        id: control
        x: 10
        y: 20
        width: 200
        height: 100
        padding: 10
        leftPadding: 4
        verticalPadding: 6
        topInset: 2
        leftInset: 3
        rightInset: 5
        bottomInset: 7
        spacing: 8
        font.pixelSize: 20
        font.family: "Serif"
        background: Rectangle {
            id: back
            implicitWidth: 50
            implicitHeight: 30
            color: "red"
        }
        contentItem: Item {
            id: inner
            implicitWidth: 40
            implicitHeight: 24

            T.Control {
                id: nested
                font.bold: true
                implicitWidth: implicitContentWidth + leftPadding + rightPadding
                implicitHeight: implicitContentHeight + topPadding + bottomPadding
                padding: 3
                contentItem: Rectangle {
                    id: leaf
                    implicitWidth: 9
                    implicitHeight: 7
                }
            }
            T.Label {
                id: label
                text: "hi"
                font.italic: true
                leftInset: 1
                bottomInset: 2
                width: 60
                height: 30
                background: Rectangle {
                    id: under
                    implicitWidth: 11
                    color: "yellow"
                }
            }
            Text {
                id: words
                text: "hi"
            }
        }
    }

    T.Control {
        id: fixed
        width: 100
        height: 50
        enabled: false
        palette.button: "#010203"
        background: Rectangle {
            id: narrow
            y: 5
            z: 2
            width: 20
        }
        contentItem: Item {
            id: within
        }
    }

    T.Pane {
        id: pane
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        padding: 12
        font.pointSize: 15
        background: Rectangle {
            id: paper
            color: pane.palette.window
        }

        Rectangle {
            id: only
            implicitWidth: 70
            implicitHeight: 30

            T.Label {
                id: inPane
                text: "hi"
            }
        }
    }

    T.Frame {
        id: frame
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding)
        implicitHeight: Math.max(implicitBackgroundHeight + topInset + bottomInset, implicitContentHeight + topPadding + bottomPadding)
        padding: 5

        Rectangle {
            id: first
            implicitWidth: 70
            implicitHeight: 30
        }
        Rectangle {
            id: second
            implicitWidth: 20
            implicitHeight: 10
        }
    }

    T.Pane {
        id: given
        width: 120
        height: 80
        padding: 4
        contentItem: Column {
            id: column
        }

        Rectangle {
            id: one
            width: 30
            height: 10
        }
        Rectangle {
            id: other
            width: 50
            height: 15
        }
    }

    T.Page {
        id: page
        width: 200
        height: 150
        padding: 2
        spacing: 3
        title: "Page"
        implicitWidth: Math.max(implicitBackgroundWidth + leftInset + rightInset, implicitContentWidth + leftPadding + rightPadding, implicitHeaderWidth, implicitFooterWidth)
        header: T.ToolBar {
            id: head
            implicitWidth: 90
            implicitHeight: 40
            position: T.ToolBar.Footer
        }
        footer: Rectangle {
            id: foot
            implicitWidth: 60
            height: 20
        }

        Item {
            id: body
            anchors.fill: parent
        }
    }

    T.GroupBox {
        id: box
        title: "Box"
        width: 100
        height: 60
        label: Rectangle {
            id: tag
            implicitWidth: 33
            implicitHeight: 12
        }
    }

    T.ApplicationWindow {
        id: app
        width: 300
        height: 200
        font.family: "Serif"
        font.weight: 600
        palette.window: "#112233"
        palette.disabled.text: "#445566"
        background: Rectangle {
            id: wall
        }
        header: Rectangle {
            id: top
            height: 30
        }
        footer: Rectangle {
            id: bottom
            height: 25
        }

        T.Label {
            id: inApp
            text: "hi"
        }
        Item {
            id: plain
            enabled: false
            anchors.fill: parent

            T.Control {
                id: deep
                font.pixelSize: 30
            }
        }
    }

    function answers() {
        return [
            // A control's paddings and what is left inside them.
            [control.topPadding, control.leftPadding, control.rightPadding, control.bottomPadding],
            [control.horizontalPadding, control.verticalPadding, control.availableWidth, control.availableHeight],
            // Its content item fills that, its background what the insets leave.
            [inner.x, inner.y, inner.width, inner.height, inner.parent === control],
            [back.x, back.y, back.width, back.height, back.z, back.parent === control],
            [control.implicitContentWidth, control.implicitContentHeight],
            [control.implicitBackgroundWidth, control.implicitBackgroundHeight],
            [control.implicitWidth, control.implicitHeight, control.spacing],
            // A style says how big a control is from those.
            [nested.implicitWidth, nested.implicitHeight, nested.width, nested.height, leaf.x, leaf.y, leaf.width, leaf.height],
            // A background that says how wide it is, is.
            [narrow.x, narrow.y, narrow.width, narrow.height, narrow.z],
            [within.x, within.y, within.width, within.height],
            // The font is the control's around, where it was given none.
            [control.font.pixelSize, control.font.family, control.font.bold, control.font.weight, control.font.italic],
            [nested.font.pixelSize, nested.font.family, nested.font.bold, nested.font.weight],
            [label.font.pixelSize, label.font.family, label.font.bold, label.font.italic],
            [words.font.pixelSize, words.font.family],
            [fixed.font.pixelSize, fixed.font.family, fixed.font.weight],
            [pane.font.pixelSize, pane.font.pointSize, inPane.font.pixelSize, inPane.font.pointSize],
            // A label has a background too.
            [under.x, under.y, under.width, under.height, under.z, label.implicitBackgroundWidth, label.implicitBackgroundHeight],
            // What is in a pane is in its content item.
            [only.parent === pane.contentItem, pane.contentItem.parent === pane, pane.contentChildren.length, pane.contentChildren[0] === only],
            [pane.contentWidth, pane.contentHeight, pane.implicitContentWidth, pane.implicitContentHeight],
            [pane.implicitWidth, pane.implicitHeight, pane.width, pane.height],
            [pane.contentItem.x, pane.contentItem.y, pane.contentItem.width, pane.contentItem.height],
            [paper.x, paper.y, paper.width, paper.height, String(paper.color)],
            // With more than one item in it, the content item says how big.
            [frame.contentWidth, frame.contentHeight, frame.implicitWidth, frame.implicitHeight, frame.contentChildren.length],
            [first.parent === frame.contentItem, second.parent === frame.contentItem],
            // The content item a pane is given takes what is in the pane.
            [one.parent === column, other.y, column.x, column.y, column.width, column.height],
            [given.contentWidth, given.contentHeight, given.contentChildren.length],
            // A page has a header over its content and a footer under it.
            [head.x, head.y, head.width, head.height, head.parent === page],
            [foot.x, foot.y, foot.width, foot.height, foot.parent === page],
            [page.contentItem.x, page.contentItem.y, page.contentItem.width, page.contentItem.height],
            [body.x, body.y, body.width, body.height],
            [page.implicitHeaderWidth, page.implicitHeaderHeight, page.implicitFooterWidth, page.implicitFooterHeight],
            [page.implicitWidth, page.title, head.position, T.ToolBar.Header, T.ToolBar.Footer],
            // A group box has a label, which its style places.
            [box.title, box.implicitLabelWidth, box.implicitLabelHeight, tag.parent === box, tag.x, tag.y, tag.width, tag.height],
            // An application's window gives what is in it its font.
            [app.font.family, app.font.weight, app.font.bold, app.font.pixelSize],
            [inApp.font.family, inApp.font.weight, inApp.font.bold, deep.font.family, deep.font.weight, deep.font.pixelSize],
            // Its header and footer are over and under its content.
            [top.x, top.y, top.width, top.height, bottom.x, bottom.y, bottom.width, bottom.height],
            [app.contentItem.x, app.contentItem.y, app.contentItem.width, app.contentItem.height],
            [plain.width, plain.height, inApp.parent === app.contentItem, top.parent === app.contentItem],
            [wall.x, wall.y, wall.width, wall.height, wall.z],
            // A colour set on a palette is that of everything inside.
            [String(app.palette.window), String(inApp.palette.window), String(deep.palette.window)],
            [String(app.palette.text), String(plain.palette.text), String(deep.palette.text), String(inApp.palette.text)],
            [String(fixed.palette.button), String(within.palette.button), String(narrow.palette.button), String(control.palette.button)],
            [String(fixed.palette.buttonText), String(fixed.palette.active.buttonText), String(control.palette.buttonText)],
        ]
    }
}
