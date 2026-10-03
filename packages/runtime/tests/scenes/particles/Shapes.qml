import QtQuick
import QtQuick.Particles

Item {
    id: root
    width: 400; height: 300
    property alias system: system
    property alias box: box
    property alias ellipse: ellipse
    property alias ring: ring
    property alias line: line
    property alias mask: mask
    property alias angled: angled
    property alias aimed: aimed
    property alias summed: summed
    property alias moved: moved

    component Burst: Emitter { enabled: false; lifeSpan: 5000 }

    ParticleSystem {
        id: system
        anchors.fill: parent
        Burst { id: box; group: "box"; x: 10; y: 10; width: 100; height: 60 }
        Burst { id: ellipse; group: "ellipse"; x: 150; y: 10; width: 100; height: 60; shape: EllipseShape {} }
        Burst { id: ring; group: "ring"; x: 280; y: 10; width: 100; height: 100; shape: EllipseShape { fill: false } }
        Burst { id: line; group: "line"; x: 10; y: 100; width: 100; height: 60; shape: LineShape { mirrored: true } }
        Burst { id: mask; group: "mask"; x: 150; y: 100; width: 80; height: 80; shape: MaskShape { source: "../../assets/half.png" } }
        Burst {
            id: angled; group: "angled"
            velocity: AngleDirection { angle: 90; magnitude: 50; angleVariation: 10; magnitudeVariation: 5 }
        }
        Burst {
            id: aimed; group: "aimed"; x: 100; y: 100
            velocity: TargetDirection { targetX: 30; targetY: 40; magnitude: 10 }
            acceleration: TargetDirection { targetX: 30; targetY: 40; magnitude: 2; proportionalMagnitude: true }
        }
        Burst {
            id: summed; group: "summed"
            velocity: CumulativeDirection {
                PointDirection { x: 10; y: 1 }
                AngleDirection { angle: 180; magnitude: 4 }
            }
        }
        // Inside an item that is moved and scaled: particles live in the
        // system's coordinates.
        Item {
            x: 200; y: 200; scale: 2; transformOrigin: Item.TopLeft
            Burst { id: moved; system: system; group: "moved"; x: 10; y: 5 }
        }
    }
}
