// What Qt's own ExtendedSceneEnvironment.qml is, as far as the tests go:
// an environment with an effect of its own after the scene, which has what
// it is to do as properties by the names Qt gives them.
import QtQuick
import QtQuick3D.Helpers.impl

SceneEffectEnvironment {
    id: sceneEnvironment

    property alias exposure: sceneEffect.exposure
    property alias whitePoint: sceneEffect.white
    property alias ditheringEnabled: sceneEffect.ditheringEnabled
    property alias sharpnessAmount: sceneEffect.sharpnessAmount
    property alias fxaaEnabled: sceneEffect.applyFXAA
    property alias colorAdjustmentsEnabled: sceneEffect.colorAdjustmentsEnabled
    property alias adjustmentBrightness: sceneEffect.adjustmentBrightness
    property alias adjustmentContrast: sceneEffect.adjustmentContrast
    property alias adjustmentSaturation: sceneEffect.adjustmentSaturation
    property alias vignetteEnabled: sceneEffect.vignetteEnabled
    property alias vignetteStrength: sceneEffect.vignetteStrength
    property alias vignetteColor: sceneEffect.vignetteColor
    property alias vignetteRadius: sceneEffect.vignetteRadius

    MainSceneEffect {
        id: sceneEffect
        environment: sceneEnvironment
        property int tonemapMode: sceneEnvironment.tonemapMode
        property real exposure: 1.0
        property real white: 1.0
        property bool applyFXAA: false
        property bool ditheringEnabled: false
        property real sharpnessAmount: 0.0
        property bool colorAdjustmentsEnabled: false
        property real adjustmentBrightness: 1.0
        property real adjustmentContrast: 1.0
        property real adjustmentSaturation: 1.0
        property bool vignetteEnabled: false
        property real vignetteStrength: 15
        property color vignetteColor: "gray"
        property real vignetteRadius: 0.35
    }
}
