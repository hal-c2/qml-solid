// Two squares that give light of their own, each by a vector whose members
// are set one by one: the left one's blue is bound to `lit`. The left one is
// where it is by a member of its position, and the scene's surroundings are
// turned by one of their turn's. `read()` is what each says its vector is;
// `dark()` puts `lit` out, `whole()` assigns the left one's vector as one,
// and `relit()` lights `lit` again.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 200
    height: 100
    color: "#202020"

    property bool lit: true

    function numbers(v) {
        return [v.x, v.y, v.z];
    }
    function read() {
        return { glow: numbers(glow.emissiveFactor), old: numbers(old.emissiveFactor), turned: numbers(around.probeOrientation), placed: numbers(left.position), x: left.x };
    }
    function dark() {
        lit = false;
    }
    function whole() {
        glow.emissiveFactor = Qt.vector3d(0.2, 0.4, 0.6);
    }
    function relit() {
        lit = true;
    }

    View3D {
        id: view
        anchors.fill: parent
        environment: SceneEnvironment {
            id: around
            probeOrientation.y: -70
            backgroundMode: SceneEnvironment.Color
            clearColor: "#101010"
        }

        OrthographicCamera {
            z: 500
        }

        Model {
            id: left
            source: "#Rectangle"
            position.x: -50
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: PrincipledMaterial {
                id: glow
                baseColor: "#000000"
                roughness: 1
                emissiveFactor.x: 0.5
                emissiveFactor.z: root.lit ? 1 : 0
            }
        }
        Model {
            source: "#Rectangle"
            x: 50
            scale: Qt.vector3d(0.6, 0.6, 1)
            materials: DefaultMaterial {
                id: old
                emissiveFactor.y: 0.5
            }
        }
    }
}
