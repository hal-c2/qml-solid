import QtQuick
import QtQuick.Templates as T

// Combo boxes in what a property holds and in the first page of a stack,
// with a model that is said through an alias of the component they are in.
Item {
    id: root
    objectName: "root"
    width: 400
    height: 300
    property var log: []
    property int held: 0
    property int paged: 0

    function take() { const l = log; log = []; return l }
    function note(what) { log.push(what) }

    component Picker: Item {
        id: picker
        property alias rows: box.model
        property alias box: box
        T.ComboBox {
            id: box
            implicitWidth: 100
            implicitHeight: 24
            model: picker.rows
            delegate: T.ItemDelegate {
                required property string modelData
                width: box.width
                implicitHeight: 20
                text: modelData
            }
            contentItem: Text { text: box.displayText }
            popup: T.Popup {
                y: box.height
                width: box.width
                height: contentItem.implicitHeight
                contentItem: ListView {
                    implicitHeight: contentHeight
                    model: box.delegateModel
                }
            }
        }
    }
    component Words: Picker {
        rows: [qsTr("Apple"), qsTr("Banana")]
    }

    property Item keeper: Item {
        Component.onCompleted: root.held++
        Words { id: kept }
    }
    T.StackView {
        id: stack
        anchors.fill: parent
        initialItem: Item {
            Component.onCompleted: root.paged++
            Words { id: shown; visible: false }
        }
    }

    function tell(c) {
        return [c.count, c.currentIndex, c.currentText, c.currentValue, c.displayText, c.contentItem.text]
    }
    function state() {
        const page = stack.currentItem
        return [held, paged, tell(kept.box), tell(shown.box), stack.depth, page.width, page.height, page.parent === stack]
    }

    function step(i) {
        switch (i) {
        case 0: kept.box.currentIndex = 1; shown.box.incrementCurrentIndex(); break
        }
    }
}
