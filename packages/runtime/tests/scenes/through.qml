import QtQuick
import QtQuick.Layouts

// What an object says of the object one of its properties holds.
Item {
    id: root
    width: 300; height: 200
    property var log: []
    property bool wide: true

    ThroughPanel {
        id: panel
        // A handler of its signal, and of what it holds in turn.
        bar.onBackClicked: (times) => root.log.push("back " + times)
        bar.button.onWidthChanged: root.log.push("width " + bar.button.width)
        // A binding of its property. A script is worth its last statement.
        bar.label.text: if (root.wide) { "wide" } else { "narrow" }
        box.color: { var name = root.wide ? "red" : "blue"; name }
        box.border.width: root.wide ? 2 : 1
        states: State {
            name: "small"
            // A change of its property, and of what a type attaches.
            PropertyChanges { target: panel.bar; button.width: 4 }
            PropertyChanges { target: panel; box.border.width: 5 }
            PropertyChanges { target: laid; Layout.preferredWidth: root.wide ? 80 : 60 }
        }
    }
    RowLayout {
        spacing: 0
        Item { id: laid; Layout.preferredWidth: 30; Layout.preferredHeight: 10 }
        Item { Layout.preferredWidth: 10; Layout.preferredHeight: 10 }
    }

    function read() {
        return [panel.bar.label.text, String(panel.box.color), panel.box.border.width,
                panel.bar.button.width, laid.Layout.preferredWidth, log.join(",")]
    }
    function step(index) {
        switch (index) {
        case 0: panel.bar.backClicked(2); break
        case 1: root.wide = false; break
        case 2: panel.state = "small"; break
        case 3: root.wide = true; break
        case 4: panel.state = ""; break
        }
    }
}
