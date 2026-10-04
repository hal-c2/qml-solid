// The round shapes Qt has of its own, each with a picture of eight colours
// on it, seen flat: above, a sphere from its front, a cylinder and a cone
// from their sides and a cone from under it; below, a cylinder from over it
// and from under it, a cone from over it and a sphere from over it.
// `read()` is what the view finds at places on each.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 200
    color: "#202020"

    readonly property var places: [
        [35, 35], [65, 35], [35, 65], [65, 65],
        [135, 30], [165, 30], [135, 70], [165, 70],
        [225, 70], [242, 70], [258, 70], [275, 70], [243, 40], [257, 40],
        [335, 35], [365, 35], [335, 65], [365, 65],
        [35, 135], [65, 135], [35, 165], [65, 165],
        [135, 135], [165, 135], [135, 165], [165, 165],
        [232, 138], [268, 138], [232, 162], [268, 162],
        [335, 135], [365, 135], [335, 165], [365, 165], [352, 148]
    ]

    function numbers(v) {
        return [v.x, v.y, v.z];
    }
    function read() {
        return places.map(place => {
            const result = view.pick(place[0], place[1]);
            return {
                hit: result.objectHit ? result.objectHit.objectName : null,
                distance: result.distance,
                uv: [result.uvPosition.x, result.uvPosition.y],
                local: numbers(result.position),
                normal: numbers(result.normal)
            };
        });
    }

    View3D {
        id: view
        anchors.fill: parent
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#101010"
        }

        OrthographicCamera {
            z: 500
        }

        component Pictured: Model {
            pickable: true
            scale: Qt.vector3d(0.8, 0.8, 0.8)
            materials: PrincipledMaterial {
                lighting: PrincipledMaterial.NoLighting
                baseColorMap: Texture { source: "../assets/sky.png" }
            }
        }

        Pictured { objectName: "sphere"; source: "#Sphere"; x: -150; y: 50 }
        Pictured { objectName: "cylinder"; source: "#Cylinder"; x: -50; y: 50 }
        Pictured { objectName: "cone"; source: "#Cone"; x: 50; y: 10 }
        Pictured { objectName: "foot"; source: "#Cone"; x: 150; y: 50; eulerRotation.x: -90 }
        Pictured { objectName: "top"; source: "#Cylinder"; x: -150; y: -50; eulerRotation.x: 90 }
        Pictured { objectName: "bottom"; source: "#Cylinder"; x: -50; y: -50; eulerRotation.x: -90 }
        Pictured { objectName: "point"; source: "#Cone"; x: 50; y: -50; eulerRotation.x: 90 }
        Pictured { objectName: "pole"; source: "#Sphere"; x: 150; y: -50; eulerRotation.x: 90 }
    }
}
