// A node for every row of a model: of a number, of a ListModel and of an
// array.
import QtQuick
import QtQuick3D

Rectangle {
    id: win
    width: 400
    height: 300
    color: "#202020"
    property var log: []

    function read() {
        return {
            count: [rep.count, listed.count, arrayed.count],
            objectAt: [rep.objectAt(1).x, rep.objectAt(5), rep.objectAt(-1)],
            parent: [rep.objectAt(1).parent === holder, rep.parent === holder, listed.objectAt(0).parent === view.scene, listed.objectAt(0).parent === listed],
            holder: kinds(holder),
            scenePosition: [listed.objectAt(1).scenePosition, rep.objectAt(2).scenePosition].map((v) => [v.x, v.y, v.z]),
            log: log,
        };
    }

    function grow(n) {
        log = [];
        rep.n = n;
        return { count: rep.count, log: log, holder: kinds(holder) };
    }

    function swap() {
        names.append({ tone: "#ffffff" });
        names.remove(0);
        return { count: listed.count, x: listed.objectAt(0).x };
    }

    function kinds(node) { let out = []; for (let i = 0; i < node.children.length; i++) { let c = node.children[i]; out.push(c === rep ? "rep" : c === before ? "before" : c === after ? "after" : c === listed ? "listed" : c === arrayed ? "arrayed" : c === camera ? "camera" : c === holder ? "holder" : "x" + c.x) } return out.join(",") }
    ListModel { id: names; ListElement { tone: "#ffff00" } ListElement { tone: "#00ffff" } }
    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        OrthographicCamera { id: camera; z: 500 }
        Node {
            id: holder
            y: 80
            Model { id: before; source: "#Cube"; x: -170; scale: Qt.vector3d(0.2, 0.2, 0.2); materials: DefaultMaterial { lighting: DefaultMaterial.NoLighting; diffuseColor: "#ffffff" } }
            Repeater3D {
                id: rep
                property int n: 3
                model: n
                onObjectAdded: (index, object) => win.log.push("added " + index + " " + object.x)
                onObjectRemoved: (index, object) => win.log.push("removed " + index + " " + object.x)
                Model { source: "#Cube"; x: index * 60 - 100; scale: Qt.vector3d(0.4, 0.4, 0.4); materials: DefaultMaterial { lighting: DefaultMaterial.NoLighting; diffuseColor: ["#ff0000", "#00ff00", "#0000ff", "#ff00ff"][index] } }
            }
            Model { id: after; source: "#Cube"; x: 170; scale: Qt.vector3d(0.2, 0.2, 0.2); materials: DefaultMaterial { lighting: DefaultMaterial.NoLighting; diffuseColor: "#808080" } }
        }
        Repeater3D {
            id: listed
            y: -80
            model: names
            delegate: Model { source: "#Cube"; x: index * 60 - 100; y: -80; scale: Qt.vector3d(0.4, 0.4, 0.4); materials: DefaultMaterial { lighting: DefaultMaterial.NoLighting; diffuseColor: tone } }
        }
        Repeater3D {
            id: arrayed
            model: ["#ff8000", "#8000ff"]
            Model { source: "#Cube"; x: index * 60 + 60; y: -80; scale: Qt.vector3d(0.4, 0.4, 0.4); materials: DefaultMaterial { lighting: DefaultMaterial.NoLighting; diffuseColor: modelData } }
        }
    }
}
