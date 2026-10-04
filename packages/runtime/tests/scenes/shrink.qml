import QtQuick

// A delegate's binding reads the list its Repeater counts: when the list
// shrinks, the delegates that go are gone before their bindings are asked.
Item {
    id: root
    width: 200; height: 100
    property var list: [{ label: "a" }, { label: "b" }, { label: "c" }]
    Row {
        id: row
        Repeater {
            model: root.list.length
            delegate: Text {
                required property int index
                text: root.list[index].label
            }
        }
    }
    function shrink() { list = [{ label: "x" }] }
    function grow() { list = [{ label: "p" }, { label: "q" }] }
    function read() {
        let texts = []
        for (let i = 0; i < row.children.length; i++)
            if (row.children[i].text !== undefined) texts.push(row.children[i].text)
        return texts
    }
}
