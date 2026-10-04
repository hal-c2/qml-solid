// An item, and a node in space, is where its `parent` says: given another by
// a binding or by an assignment, it is among that one's children and no more
// among those of the one it was declared in.
import QtQuick
import QtQuick3D

Item {
    id: root
    width: 400
    height: 300

    property Item where: a

    Rectangle {
        id: a
        objectName: "a"
        x: 10; y: 20; width: 100; height: 100
    }
    Rectangle {
        id: b
        objectName: "b"
        x: 200; y: 50; width: 100; height: 100
        Rectangle {
            id: bound
            objectName: "bound"
            parent: root.where
            x: 5; y: 5; width: 10; height: 10
        }
        Rectangle {
            id: moved
            objectName: "moved"
            x: 30; y: 30; width: 10; height: 10
        }
    }

    View3D {
        id: view
        anchors.fill: parent
        Node {
            id: one
            objectName: "one"
            x: 100
            Node {
                id: child
                objectName: "child"
                y: 7
            }
        }
        Node {
            id: two
            objectName: "two"
            x: -50
            eulerRotation.z: 90
        }
    }

    readonly property int steps: 4
    function step(index) {
        if (index === 0) moved.parent = a
        else if (index === 1) root.where = b
        else if (index === 2) child.parent = two
        else moved.parent = null
    }

    function names(list) {
        const all = []
        for (let i = 0; i < list.length; i++) all.push(list[i].objectName)
        return all
    }
    function at(item) {
        const p = item.mapToItem(root, 0, 0)
        return [item.parent ? item.parent.objectName : null, p.x, p.y]
    }
    function answers() {
        const s = child.scenePosition
        return [names(a.children), names(b.children), at(bound), at(moved),
            names(one.children), names(two.children), child.parent.objectName,
            [Math.round(s.x), Math.round(s.y), Math.round(s.z)]]
    }
}
