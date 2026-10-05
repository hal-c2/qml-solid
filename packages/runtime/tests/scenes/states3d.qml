// A door on its hinge: a Model with states of its own, open in one of them,
// and a Node whose states change what other things in the scene are. The
// door swings to where a state has it by a transition, and is there at once
// without one.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#202020"

    property bool open: false
    property int paint: 0

    function read() {
        return {
            door: [door.state, door.eulerRotation.x, door.eulerRotation.y, door.eulerRotation.z],
            lid: [lid.state, lid.eulerRotation.x, lid.y],
            body: [body.state, String(paint.baseColor), paint.metalness, lamp.brightness, lamp.visible],
        };
    }

    // Where everything is once a state was entered and its transition is
    // over, and in the middle of one.
    function step(index) {
        if (index === 0) {
            root.open = true;
            root.paint = 1;
        } else if (index === 1) {
            root.open = false;
            root.paint = 2;
        } else if (index === 2) {
            lid.state = "raised";
        } else if (index === 3) {
            lid.state = "";
        }
        return read();
    }

    View3D {
        id: view
        anchors.fill: parent
        camera: camera
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "black"
        }

        PerspectiveCamera {
            id: camera
            z: 400
        }

        DirectionalLight {
            id: lamp
        }

        Node {
            id: body
            states: [
                State {
                    name: "red"
                    when: root.paint === 1
                    PropertyChanges {
                        target: paint
                        baseColor: "#a21010"
                        metalness: 0.5
                    }
                    PropertyChanges {
                        target: lamp
                        brightness: 2
                    }
                },
                State {
                    name: "dark"
                    when: root.paint === 2
                    PropertyChanges {
                        target: lamp
                        visible: false
                    }
                }
            ]

            Model {
                id: door
                source: "#Cube"
                x: -100
                materials: PrincipledMaterial {
                    id: paint
                    baseColor: "#a6a6a6"
                }
                states: [
                    State {
                        name: "closed"
                        when: !root.open
                    },
                    State {
                        name: "open"
                        when: root.open
                        PropertyChanges {
                            target: door
                            eulerRotation.z: 51
                            eulerRotation.y: -18
                            eulerRotation.x: 41
                        }
                    }
                ]
                transitions: Transition {
                    from: "*"
                    to: "*"
                    PropertyAnimation {
                        target: door
                        properties: "eulerRotation.x,eulerRotation.y,eulerRotation.z"
                        duration: 600
                    }
                }
            }

            Model {
                id: lid
                source: "#Cube"
                x: 100
                materials: paint
                states: State {
                    name: "raised"
                    PropertyChanges {
                        target: lid
                        eulerRotation.x: -50
                        y: 40
                    }
                }
            }
        }
    }
}
