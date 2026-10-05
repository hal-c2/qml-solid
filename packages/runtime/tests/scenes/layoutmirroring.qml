import QtQuick
import QtQuick.Layouts

Item {
    id: root
    width: 400
    height: 200
    property bool on: false
    property bool inherit: false
    LayoutMirroring.enabled: on
    LayoutMirroring.childrenInherit: inherit

    Rectangle { id: a; anchors.left: parent.left; anchors.leftMargin: 10; width: 50; height: 10 }
    Rectangle { id: b; anchors.left: a.right; anchors.leftMargin: 5; width: 30; height: 10 }
    Rectangle {
        id: c
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.horizontalCenterOffset: 20
        width: 40; height: 10
    }
    Item { id: d; anchors.fill: parent; anchors.leftMargin: 7; anchors.rightMargin: 3 }
    Item { id: e; anchors.centerIn: parent; anchors.horizontalCenterOffset: 15; width: 20; height: 10 }
    Item {
        id: f
        anchors.left: parent.left; anchors.right: parent.horizontalCenter
        anchors.leftMargin: 4; anchors.rightMargin: 6
        height: 10
    }
    // One that says for itself is not told by what it is in.
    Item {
        id: g
        LayoutMirroring.enabled: false
        anchors.right: parent.right; width: 25; height: 10
        Item { id: g1; anchors.right: parent.right; width: 5; height: 5 }
    }
    // Saying it without `childrenInherit` is for the item alone.
    Item {
        id: h
        LayoutMirroring.enabled: true
        x: 100; width: 100; height: 20
        Item { id: h1; anchors.left: parent.left; width: 5; height: 5 }
        Item { id: h2; anchors.left: h1.right; anchors.right: parent.right; anchors.rightMargin: 9; height: 5 }
    }
    Row {
        id: row
        y: 40; spacing: 2
        Item { id: r1; width: 10; height: 10 }
        Item { id: r2; width: 20; height: 10 }
    }
    Row {
        id: wide
        y: 60; width: 200; layoutDirection: Qt.RightToLeft
        Item { id: w1; width: 10; height: 10 }
        Item { id: w2; width: 20; height: 10 }
    }
    Grid {
        id: grid
        y: 80; columns: 2
        Item { id: g2; width: 10; height: 10 }
        Item { id: g3; width: 20; height: 10 }
        Item { id: g4; width: 30; height: 10 }
    }
    Flow {
        id: flow
        y: 110; width: 100
        Item { id: f1; width: 60; height: 10 }
        Item { id: f2; width: 30; height: 10 }
        Item { id: f3; width: 50; height: 10 }
    }
    Text { id: said; y: 140; width: 100; horizontalAlignment: Text.AlignLeft; text: "a" }
    Text { id: plain; y: 160; width: 100; text: "a" }
    Text { id: middle; y: 160; width: 100; text: "a"; horizontalAlignment: Text.AlignHCenter }
    RowLayout {
        id: layout
        y: 180; width: 100; height: 10; spacing: 0
        Item { id: l1; implicitWidth: 10; implicitHeight: 10 }
        Item { id: l2; implicitWidth: 20; implicitHeight: 10; Layout.fillWidth: true }
    }
    property int changes: 0
    Item { id: told; LayoutMirroring.onEnabledChanged: root.changes++ }

    function read() {
        return [
            [a.x, b.x, c.x, d.x, d.width, e.x, f.x, f.width],
            [g.x, g1.x, h1.x, h2.x, h2.width],
            [row.effectiveLayoutDirection, r1.x, r2.x, wide.effectiveLayoutDirection, w1.x, w2.x],
            [grid.effectiveLayoutDirection, g2.x, g3.x, g4.x, flow.effectiveLayoutDirection, f1.x, f2.x, f3.x],
            [said.effectiveHorizontalAlignment, plain.effectiveHorizontalAlignment, middle.effectiveHorizontalAlignment],
            [layout.layoutDirection, l1.x, l2.x],
            [root.LayoutMirroring.enabled, a.LayoutMirroring.enabled, g.LayoutMirroring.enabled,
             h.LayoutMirroring.enabled, h1.LayoutMirroring.enabled, a.LayoutMirroring.childrenInherit, changes],
        ]
    }

    // The item that comes to say otherwise for itself, for where it is drawn.
    function late() { return b }

    function step(index) {
        if (index === 0) root.on = true
        else if (index === 1) root.inherit = true
        else if (index === 2) g.LayoutMirroring.childrenInherit = true
        else if (index === 3) b.LayoutMirroring.enabled = false
        else if (index === 4) b.LayoutMirroring.enabled = undefined
        else root.on = false
    }
}
