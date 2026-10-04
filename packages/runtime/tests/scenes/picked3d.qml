// Shapes to pick among: a turned cube with a rectangle behind it, a globe
// behind a pane that is not for picking, a rectangle that faces away, one
// that is not shown, one that is shown through wholly, one drawn twice by
// a table, and two strips of a shape of their own, of which the one for
// picking is not shown. `read()` is what the view finds at places in it
// and along rays; `deep()` has it look through a camera with depth, and
// `shown()` shows what was not and has the pane and the strip be for
// picking.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 300
    height: 200
    color: "#202020"

    function numbers(v) {
        return [v.x, v.y, v.z];
    }
    function told(result) {
        return {
            hit: result.objectHit ? result.objectHit.objectName : null,
            type: result.hitType,
            distance: result.distance,
            uv: [result.uvPosition.x, result.uvPosition.y],
            scene: numbers(result.scenePosition),
            local: numbers(result.position),
            normal: numbers(result.normal),
            sceneNormal: numbers(result.sceneNormal),
            instance: result.instanceIndex,
            item: result.itemHit ? true : false
        };
    }
    function read() {
        const places = [[70, 100], [30, 150], [226, 64], [220, 160], [150, 160], [150, 90], [50, 20], [250, 20], [290, 190], [-5, 10], [300, 100], [90, 90], [130, 90], [170, 70], [250, 150]];
        return {
            picks: places.map(place => told(view.pick(place[0], place[1]))),
            all: view.pickAll(70, 100).map(told),
            none: view.pickAll(290, 190).length,
            ray: told(view.rayPick(Qt.vector3d(-80, 10, 300), Qt.vector3d(0, 0, -1))),
            swept: swept(),
            rays: view.rayPickAll(Qt.vector3d(-200, 5, -10), Qt.vector3d(2, 0, 0)).map(told)
        };
    }
    // What is found at every twentieth pixel, a row of the view to a line:
    // the first letter of its name, and which of a table's entries it is.
    function swept() {
        const rows = [];
        for (let y = 10; y < 200; y += 20) {
            let row = "";
            for (let x = 10; x < 300; x += 20) {
                const result = view.pick(x, y);
                row += result.objectHit ? result.objectHit.objectName[0] + (result.objectHit.instancing ? result.instanceIndex : "") : ".";
            }
            rows.push(row);
        }
        return rows;
    }
    function deep() {
        view.camera = depth;
    }
    function shown() {
        unseen.visible = true;
        hidden.visible = true;
        pane.pickable = true;
        strip.pickable = true;
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: flat
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#101010"
        }

        OrthographicCamera {
            id: flat
            z: 500
        }
        PerspectiveCamera {
            id: depth
            position: Qt.vector3d(40, 60, 400)
            eulerRotation.x: -10
        }

        DirectionalLight {
            eulerRotation: Qt.vector3d(-20, -30, 0)
        }

        Model {
            objectName: "cube"
            pickable: true
            source: "#Cube"
            x: -80
            scale: Qt.vector3d(0.6, 0.8, 0.5)
            eulerRotation: Qt.vector3d(20, 30, 0)
            materials: PrincipledMaterial { baseColor: "#c04040"; roughness: 1 }
        }
        Model {
            objectName: "behind"
            pickable: true
            source: "#Rectangle"
            x: -80
            z: -200
            scale: Qt.vector3d(1.2, 1.2, 1)
            materials: PrincipledMaterial { baseColor: "#4040c0"; roughness: 1 }
        }
        Model {
            objectName: "globe"
            pickable: true
            source: "#Sphere"
            x: 70
            y: 30
            materials: PrincipledMaterial { baseColor: "#40c040"; roughness: 1 }
        }
        Model {
            id: pane
            objectName: "pane"
            source: "#Rectangle"
            x: 70
            y: 30
            z: 100
            scale: Qt.vector3d(0.3, 0.3, 1)
            materials: PrincipledMaterial { baseColor: "#c0c040"; roughness: 1 }
        }
        Model {
            objectName: "away"
            pickable: true
            source: "#Rectangle"
            x: 70
            y: -60
            eulerRotation.y: 180
            scale: Qt.vector3d(0.4, 0.4, 1)
            materials: PrincipledMaterial { baseColor: "#c040c0"; roughness: 1; cullMode: Material.NoCulling }
        }
        Model {
            id: unseen
            objectName: "unseen"
            pickable: true
            visible: false
            source: "#Rectangle"
            y: -60
            scale: Qt.vector3d(0.3, 0.3, 1)
            materials: PrincipledMaterial { baseColor: "#40c0c0"; roughness: 1 }
        }
        Model {
            objectName: "faint"
            pickable: true
            opacity: 0
            source: "#Rectangle"
            y: 10
            scale: Qt.vector3d(0.25, 0.25, 1)
            materials: PrincipledMaterial { baseColor: "#ffffff"; roughness: 1 }
        }
        Model {
            id: strip
            objectName: "strip"
            source: "../assets/bar.mesh"
            x: 120
            y: -95
            scale: Qt.vector3d(0.4, 0.4, 1)
            materials: PrincipledMaterial { baseColor: "#808080"; roughness: 1 }
        }
        Model {
            id: hidden
            objectName: "hidden"
            pickable: true
            visible: false
            source: "../assets/bar.mesh"
            x: 100
            y: -95
            scale: Qt.vector3d(0.4, 0.4, 1)
            materials: PrincipledMaterial { baseColor: "#806040"; roughness: 1 }
        }
        Model {
            objectName: "many"
            pickable: true
            source: "#Rectangle"
            y: 80
            scale: Qt.vector3d(0.3, 0.3, 1)
            instancing: InstanceList {
                InstanceListEntry { position: Qt.vector3d(-100, 0, 0) }
                InstanceListEntry { position: Qt.vector3d(100, 0, 0); scale: Qt.vector3d(0.5, 1, 1) }
            }
            materials: PrincipledMaterial { baseColor: "#c08040"; roughness: 1 }
        }
    }
}
