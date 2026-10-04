import QtQuick
import QtQml.Models

Item {
    id: root
    width: 200
    height: 300

    ListModel {
        id: rows
        ListElement { name: "a" }
        ListElement { name: "b" }
        ListElement { name: "c" }
    }

    // A view has a DelegateModel whether it was given one or not.
    ListView {
        id: view
        width: 200; height: 100
        model: rows
        delegate: Item {
            required property int index
            required property string name
            width: 200; height: 20
            function about() {
                return [name, DelegateModel.itemsIndex, DelegateModel.inItems, DelegateModel.inPersistedItems, "" + DelegateModel.groups,
                        DelegateModel.isUnresolved, DelegateModel.model.count, DelegateModel.model.items.count, DelegateModel.model.items.name,
                        DelegateModel.model.persistedItems.count, DelegateModel.model.model === rows,
                        DelegateModel.model.items.get(DelegateModel.itemsIndex).model.name]
            }
        }
    }
    Repeater {
        id: repeater
        model: rows
        Item {
            required property string name
            function about() { return [name, DelegateModel.itemsIndex, DelegateModel.inItems, DelegateModel.model.count] }
        }
    }
    // One written out: the view shows its model with its delegate.
    ListView {
        id: given
        y: 100; width: 200; height: 100
        model: DelegateModel {
            id: both
            model: rows
            delegate: Text {
                required property string name
                height: 20
                text: name + DelegateModel.itemsIndex
                function about() { return [text, DelegateModel.model === both, y] }
            }
        }
    }
    Item {
        id: lone
        function about() { return [DelegateModel.itemsIndex, DelegateModel.inItems, DelegateModel.model, "" + DelegateModel.groups] }
    }

    function named(of, name) {
        for (let index = 0; index < of.count; index++) {
            const item = of.itemAtIndex(index)
            if (item.name === name)
                return item.about()
        }
        return null
    }

    function read() {
        return [named(view, "a"), named(view, "c"), repeater.itemAt(1).about(), named(given, "a"), named(given, "b"), lone.about(),
                [both.count, both.items.count, given.count, DelegateModel.ReadOnly]]
    }

    function step(index) {
        switch (index) {
        case 0: rows.move(0, 2, 1); break
        case 1: rows.append({ name: "d" }); break
        }
    }
}
