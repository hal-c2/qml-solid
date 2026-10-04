// Stands in for ShapeAffector3D (particleAffector.h): an affector that gives
// the particles inside a sphere, a box or a cylinder of 100 across, placed
// as the affector is, a position, velocity, rotation, scale or colour.
//
// Not here: it has what the example sets and leaves the particles alone.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Affector3D {
    enum ShapeType { Sphere, Box, Cylinder }
    enum AffectFlag {
        AffectNone = 0,
        AffectPosition = 1,
        AffectVelocity = 2,
        AffectRotation = 4,
        AffectScale = 8,
        AffectColor = 16
    }

    property int shapeType: ShapeAffector3D.Sphere
    property bool inverted: false
    property vector3d targetPosition
    property vector3d targetVelocity
    property vector3d targetRotation
    property vector3d targetScale: Qt.vector3d(1, 1, 1)
    property color targetColor: "transparent"
    property int affectFlags: ShapeAffector3D.AffectColor
}
