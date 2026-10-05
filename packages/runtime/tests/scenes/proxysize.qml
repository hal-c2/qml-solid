import QtQuick
import QtQuick.Layouts

// How big a LayoutItemProxy is implicitly when it says so itself: what its
// target is, unless what it says is said after the target last said.
Item {
    id: root
    width: 600
    height: 300

    property real scale: 1
    function twice(size) {
        return size * 2
    }

    Rectangle { id: plain; implicitWidth: 40; implicitHeight: 100 }
    Rectangle { id: plain2; implicitWidth: 40; implicitHeight: 100 }
    Rectangle { id: bound; implicitWidth: 40; implicitHeight: root.twice(50) }
    Rectangle { id: scaled; implicitWidth: 40; implicitHeight: 100 * root.scale }
    Text { id: text; text: "Hello" }

    RowLayout {
        anchors.fill: parent

        LayoutItemProxy { id: after; target: plain; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: before; implicitHeight: root.twice(100); target: plain2 }
        LayoutItemProxy { id: earlier; target: bound; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: later; target: boundLater; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: laterBefore; implicitHeight: root.twice(100); target: boundLater2 }
        LayoutItemProxy { id: laterPlain; target: plainLater; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: written; target: plainLater2; implicitHeight: 200 }
        LayoutItemProxy { id: computed; target: text; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: alone; implicitHeight: root.twice(100) }
        LayoutItemProxy { id: both; target: scaled; implicitHeight: root.twice(100) * root.scale }
    }

    Rectangle { id: boundLater; implicitWidth: 40; implicitHeight: root.twice(50) }
    Rectangle { id: boundLater2; implicitWidth: 40; implicitHeight: root.twice(50) }
    Rectangle { id: plainLater; implicitWidth: 40; implicitHeight: 100 }
    Rectangle { id: plainLater2; implicitWidth: 40; implicitHeight: 100 }

    function sizes() {
        const all = [after, before, earlier, later, laterBefore, laterPlain, written, alone, both]
        return all.map(proxy => proxy.implicitHeight + "/" + proxy.height + "/" + proxy.implicitWidth).join(" ")
            + " " + (computed.implicitHeight === text.implicitHeight)
    }

    function read() {
        const said = [sizes()]
        // Both say something else: the target says it last.
        root.scale = 2
        said.push(both.implicitHeight)
        scaled.implicitHeight = 77
        said.push(both.implicitHeight)
        both.implicitHeight = 210
        said.push(both.implicitHeight)
        scaled.implicitHeight = 140
        said.push(both.implicitHeight)
        // Given another target, it is as big as that.
        after.target = scaled
        said.push(after.implicitHeight)
        return said
    }
}
