import QtQuick
import QtQuick.Templates as T

// Combo boxes: the row that is current and what it says, the popup the
// mouse and the keys open and pick from, and the text that is typed into
// one that is editable.
Item {
    id: root
    objectName: "root"
    width: 400
    height: 300
    property var log: []
    property var fruit: ["Apple", "Banana", "Cherry", "Blueberry"]
    // What the boxes say as they are made is in the order Qt completes
    // them in: nothing is noted until they all are.
    property bool made: false

    function take() { const l = log; log = []; return l }
    function note(what) { if (made) log.push(what) }

    ListModel {
        id: numbers
        ListElement { name: "One"; code: 1 }
        ListElement { name: "Two"; code: 2 }
        ListElement { name: "Three"; code: 3 }
    }
    ListModel {
        id: colours
        ListElement { colour: "red" }
        ListElement { colour: "green" }
    }

    component Combo: T.ComboBox {
        id: combo
        property string name
        implicitWidth: 100
        implicitHeight: 24
        rightPadding: 12
        delegate: T.ItemDelegate {
            id: entry
            required property int index
            width: combo.width
            implicitHeight: 20
            hoverEnabled: true
            text: combo.textAt(index)
            highlighted: combo.highlightedIndex === index
            contentItem: Text { text: entry.text }
            background: Rectangle { color: entry.highlighted ? "silver" : "white" }
        }
        indicator: Rectangle {
            x: combo.width - width
            implicitWidth: 12
            implicitHeight: 24
            color: combo.down ? "black" : "gray"
        }
        contentItem: Text { text: combo.displayText }
        background: Rectangle { border.color: combo.visualFocus ? "blue" : "black" }
        popup: T.Popup {
            y: combo.height
            width: combo.width
            implicitHeight: contentItem.implicitHeight
            contentItem: ListView {
                implicitHeight: contentHeight
                model: combo.delegateModel
                currentIndex: combo.highlightedIndex
                interactive: false
            }
            background: Rectangle { border.color: "black" }
        }
        onActivated: (index) => root.note(name + " activated " + index)
        onHighlighted: (index) => root.note(name + " highlighted " + index)
        onAccepted: root.note(name + " accepted " + editText)
        onCurrentIndexChanged: root.note(name + " current " + currentIndex)
        onPressedChanged: root.note(name + " pressed " + pressed)
    }

    MouseArea {
        anchors.fill: parent
        onPressed: root.note("under pressed")
    }

    Combo { id: words; name: "words"; x: 10; y: 10; model: root.fruit }
    Combo { id: roles; name: "roles"; x: 150; y: 10; model: numbers; textRole: "name"; valueRole: "code" }
    Combo { id: count; name: "count"; x: 290; y: 10; model: 3; wheelEnabled: true }
    // The row that is current is the one with the value it is given.
    Combo {
        id: things
        name: "things"
        x: 10
        y: 60
        model: [{ text: "Ten", value: 10 }, { text: "Twenty", value: 20 }, { text: "Thirty", value: 30 }]
        textRole: "text"
        valueRole: "value"
        currentValue: 20
    }
    // One whose text is typed.
    Combo {
        id: typed
        name: "typed"
        x: 150
        y: 60
        editable: true
        model: root.fruit
        contentItem: TextInput {
            text: typed.editable ? typed.editText : typed.displayText
            enabled: typed.editable
            readOnly: typed.down
            inputMethodHints: typed.inputMethodHints
        }
    }
    // One that says which row it starts at, and what it shows.
    Combo { id: set; name: "set"; x: 290; y: 60; model: colours; currentIndex: 1; displayText: "Pick " + currentText }
    // One with nothing in it, and one whose popup has no room under it.
    Combo { id: empty; name: "empty"; x: 10; y: 110 }
    Combo { id: low; name: "low"; x: 150; y: 250; model: [{ only: "a" }, { only: "b" }, 3, true] }

    function tell(c) {
        const p = c.popup
        // A popup that is not seen is where and as big as it last had to be.
        return [c.name, c.count, c.currentIndex, c.currentText, c.currentValue, c.displayText, c.highlightedIndex, c.pressed, c.down,
                p.visible ? [p.x, p.y, p.width, p.height] : null, p.closePolicy, c.activeFocus, c.editText]
    }
    function facts(c) {
        return [c.name, c.focusPolicy, c.editable, c.flat, c.implicitIndicatorWidth, c.implicitIndicatorHeight, c.indicator.parent === c,
                c.popup.parent === c, c.inputMethodHints, c.acceptableInput, c.implicitContentWidthPolicy, c.selectTextByMouse,
                c.delegateModel !== null, c.textRole, c.valueRole, c.wheelEnabled, c.activeFocusOnTab].join(" ")
    }
    function texts(c) {
        const all = []
        for (let i = -1; i <= c.count; i++) all.push(c.textAt(i), c.valueAt(i))
        return all
    }
    function state() {
        const input = typed.contentItem
        return [tell(words), tell(roles), tell(count), tell(things), tell(typed), tell(set), tell(empty), tell(low),
                [input.text, input.selectedText, input.activeFocus, input.cursorPosition]]
    }

    function step(i) {
        switch (i) {
        case 0: made = true; [words, roles, count, things, typed, set, empty, low].forEach((c) => note(facts(c))); break
        case 1: [words, roles, count, things, set, empty, low].forEach((c) => note(JSON.stringify(texts(c)))); break
        case 2: words.currentIndex = 2; break
        case 3: words.incrementCurrentIndex(); words.incrementCurrentIndex(); break
        case 4: words.decrementCurrentIndex(); break
        case 5: note([words.find("banana"), words.find("Banana"), words.find("banana", Qt.MatchFixedString), words.find("an", Qt.MatchContains),
                      words.find("b", Qt.MatchStartsWith), words.find("B", Qt.MatchStartsWith | Qt.MatchCaseSensitive),
                      words.find("RY", Qt.MatchEndsWith), words.find("b.*y", Qt.MatchRegularExpression), words.find("*rr*", Qt.MatchWildcard),
                      words.find("ch"), words.find("")].join(" ")); break
        case 6: note([things.indexOfValue(30), things.indexOfValue("30"), things.indexOfValue(30.0), things.indexOfValue(5),
                      roles.indexOfValue(2), count.indexOfValue(2), words.indexOfValue("Cherry"), low.indexOfValue("b"),
                      low.indexOfValue(true), low.indexOfValue(3)].join(" ")); break
        case 7: things.currentValue = 30; break
        case 8: things.currentValue = 7; break
        case 9: things.currentIndex = 0; break
        case 10: things.model = [{ text: "Seven", value: 7 }, { text: "Eight", value: 8 }]; break
        case 11: words.model = ["X", "Y", "Z"]; break
        case 12: words.model = ["X", "Y", "Z"]; words.currentIndex = 2; break
        case 13: words.model = root.fruit; break
        case 14: empty.model = ["a", "b"]; break
        case 15: empty.currentIndex = 1; empty.model = []; break
        case 16: empty.model = 2; break
        case 17: numbers.setProperty(0, "name", "Uno"); break
        case 18: numbers.insert(0, { name: "Zero", code: 0 }); break
        case 19: numbers.remove(0, 2); break
        case 20: roles.textRole = "code"; break
        case 21: roles.textRole = "name"; roles.valueRole = "name"; break
        case 22: set.displayText = "Shown"; break
        case 23: set.currentIndex = 0; break
        case 24: set.displayText = undefined; break
        case 25: count.model = 5; count.currentIndex = 4; break
        case 26: count.model = 2; break
        case 27: words.popup.open(); break
        case 28: words.incrementCurrentIndex(); break
        case 29: words.popup.close(); break
        case 30: words.down = true; break
        case 31: words.down = undefined; break
        case 32: things.popup.open(); things.currentIndex = 2; break
        case 33: things.popup.close(); break
        case 34: low.popup.open(); break
        case 35: low.popup.close(); break
        case 36: typed.editText = "Che"; break
        case 37: typed.currentIndex = 1; break
        case 38: typed.selectAll(); break
        case 39: typed.forceActiveFocus(); break
        case 40: words.forceActiveFocus(Qt.TabFocusReason); break
        case 41: typed.forceActiveFocus(Qt.TabFocusReason); break
        case 42: words.popup.open(); words.visible = false; break
        case 43: words.visible = true; break
        // For the keys: the text of the box that is typed in, all of it
        // selected, so that what is typed takes its place.
        case 50: typed.forceActiveFocus(Qt.TabFocusReason); typed.selectAll(); break
        }
    }
}
