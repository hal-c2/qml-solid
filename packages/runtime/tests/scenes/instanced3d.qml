// One shape drawn many times over: a Model with an instance table, which
// says where each of them is, how it is turned, how big it is and what
// colour. The tables are an InstanceList, whose entries are written out, and
// a RandomInstancing, which makes them up from a seed. An InstanceRepeater
// makes a node for each entry of a table.
import QtQuick
import QtQuick3D
import QtQuick3D.Helpers

Rectangle {
    id: root
    width: 300
    height: 200
    color: "#202020"

    function v3(v) { return [v.x, v.y, v.z] }
    function q4(q) { return [q.scalar, q.x, q.y, q.z] }
    function c4(c) { return [c.r, c.g, c.b, c.a] }
    function entry(table, i) {
        let d = table.instanceCustomData(i);
        return { position: v3(table.instancePosition(i)), scale: v3(table.instanceScale(i)), rotation: q4(table.instanceRotation(i)), color: c4(table.instanceColor(i)), data: [d.x, d.y, d.z, d.w] };
    }
    function read() {
        let made = [];
        for (let i = 0; i < random.instanceCount; i++) made.push(entry(random, i));
        let nodes = [];
        for (let i = 0; i < repeater.count; i++) {
            let n = repeater.objectAt(i);
            nodes.push({ position: v3(n.position), scale: v3(n.scale), rotation: q4(n.rotation), tone: c4(n.tone), at: n.at, where: v3(n.where) });
        }
        return {
            count: [list.instanceCount, random.instanceCount, repeater.count, rows.rowCount()],
            list: [entry(list, 0), entry(list, 1), entry(list, 2), entry(list, 3)],
            past: v3(list.instancePosition(9)),
            random: made,
            nodes: nodes,
        };
    }
    function fewer() {
        list.instanceCountOverride = 2;
    }
    function moved() {
        second.position = Qt.vector3d(-50, 20, 0);
        second.color = "#ffff00";
    }
    function sheer() {
        list.hasTransparency = true;
    }
    function sorted() {
        stack.depthSortingEnabled = true;
    }
    function seeded() {
        random.randomSeed = 11;
        random.instanceCount = 3;
    }
    function coloured() {
        random.colorModel = RandomInstancing.HSV;
        tones.proportional = true;
    }
    function lighter() {
        random.colorModel = RandomInstancing.HSL;
    }
    function gridded() {
        random.gridSpacing = Qt.vector3d(10, 10, 0);
    }
    function rooted() {
        flat.instanceRoot = flat;
    }
    function held() {
        flat.instanceRoot = holder;
    }

    InstanceModel {
        id: rows
        instancingTable: list
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#405060"
        }

        OrthographicCamera {
            id: camera
            z: 500
        }
        DirectionalLight {
            eulerRotation: Qt.vector3d(-30, -30, 0)
        }

        InstanceList {
            id: list
            InstanceListEntry {
                position: Qt.vector3d(-110, 50, 0)
                color: "#ff8040"
                customData: Qt.vector4d(1, 2, 3, 4)
            }
            InstanceListEntry {
                id: second
                position: Qt.vector3d(-50, 50, 0)
                scale: Qt.vector3d(0.5, 1, 1)
                eulerRotation: Qt.vector3d(0, 0, 30)
                color: "#40ff80"
            }
            InstanceListEntry {
                position: Qt.vector3d(10, 50, 0)
                rotation: Qt.quaternion(0.9238795, 0, 0, 0.3826834)
                color: "#4080ff"
            }
            InstanceListEntry {
                position: Qt.vector3d(70, 50, 0)
                color: "#80ffffff"
            }
        }
        InstanceList {
            id: leaning
            InstanceListEntry {
                position: Qt.vector3d(-130, -50, 0)
                eulerRotation: Qt.vector3d(30, 30, 0)
            }
            InstanceListEntry {
                position: Qt.vector3d(-75, -50, 0)
                eulerRotation: Qt.vector3d(0, 45, 45)
                color: "#ff6060"
            }
        }
        InstanceList {
            id: stack
            hasTransparency: true
            InstanceListEntry {
                position: Qt.vector3d(-8, -42, 0)
                color: "#c0ff0000"
            }
            InstanceListEntry {
                position: Qt.vector3d(8, -58, -50)
                color: "#c00000ff"
            }
        }
        RandomInstancing {
            id: random
            instanceCount: 5
            randomSeed: 3
            position: InstanceRange {
                from: Qt.vector3d(-50, -40, 0)
                to: Qt.vector3d(50, 40, 0)
            }
            scale: InstanceRange {
                from: Qt.vector3d(0.5, 0.5, 0.5)
                to: Qt.vector3d(1.5, 1.5, 1.5)
                proportional: true
            }
            rotation: InstanceRange {
                from: Qt.vector3d(0, 0, 0)
                to: Qt.vector3d(0, 0, 90)
            }
            color: InstanceRange {
                id: tones
                from: "#802020"
                to: "#20ffff"
            }
            customData: InstanceRange {
                from: Qt.vector4d(0, 0, 0, 0)
                to: Qt.vector4d(1, 10, 100, 1000)
            }
        }

        // Where each is: the table's place for it in the node the model is
        // in, moved by where the model is, and the model's own turn and
        // size inside that.
        Node {
            id: holder
            x: 5
            scale: Qt.vector3d(1.1, 1.1, 1.1)
            Model {
                id: flat
                x: 10
                y: -10
                scale: Qt.vector3d(0.4, 0.4, 0.4)
                eulerRotation.z: 10
                source: "#Rectangle"
                instancing: list
                materials: DefaultMaterial {
                    lighting: DefaultMaterial.NoLighting
                    diffuseColor: "#ffffff"
                }
            }
        }
        Model {
            x: 20
            source: "#Cube"
            scale: Qt.vector3d(0.3, 0.3, 0.3)
            instancing: leaning
            materials: PrincipledMaterial {
                baseColor: "#c0c0c0"
                roughness: 0.5
            }
        }
        Model {
            source: "#Rectangle"
            scale: Qt.vector3d(0.3, 0.3, 0.3)
            instancing: stack
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ffffff"
            }
        }
        Node {
            x: 85
            y: -50
            Model {
                source: "#Rectangle"
                scale: Qt.vector3d(0.2, 0.2, 0.2)
                instancing: random
                materials: DefaultMaterial {
                    lighting: DefaultMaterial.NoLighting
                    diffuseColor: "#ffffff"
                }
            }
        }
        Node {
            visible: false
            InstanceRepeater {
                id: repeater
                instancingTable: list
                Node {
                    property color tone: modelColor
                    property int at: index
                    property vector3d where: modelPosition
                    x: 1000
                }
            }
        }
    }
}
