import QtQuick
import QtQml.Models
import Backend

// A view of a model that is filled again as the view is made, whose
// delegates are in a state from the start: making one settles what has
// changed, the view's own rows among it.
Item {
    id: root
    width: 200; height: 300
    property int made: 0
    ListView {
        anchors.fill: parent
        orientation: ListView.Horizontal
        interactive: false
        model: ObjectModel {
            Item {
                width: root.width; height: root.height
                ListView {
                    id: view
                    anchors.fill: parent
                    model: Stocks.rows
                    delegate: Text {
                        id: row
                        required property string name
                        required property real change
                        text: name; height: 30
                        state: change >= 0 ? "Rising" : "Falling"
                        states: [
                            State { name: "Rising" },
                            State { name: "Falling"; PropertyChanges { target: row; color: "#fa8a8a" } }
                        ]
                        Component.onCompleted: root.made++
                    }
                }
            }
        }
    }
    function step(i) { Stocks.reset("b") }
    property int steps: 1
    function answers() {
        const out = []
        for (let i = 0; i < view.contentItem.children.length; i++) {
            const kid = view.contentItem.children[i]
            if (kid.text !== undefined) out.push([kid.text, kid.y, "" + kid.color])
        }
        return [made, out]
    }
}
