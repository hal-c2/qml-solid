// Stands in for BackEnd (backend.cpp), the program's hand on an Android
// phone: the volume of its music, the brightness of its screen, its
// vibrator, its notifications and its wake locks, all reached through JNI.
//
// There is no phone here, so this is a made-up one: music from 0 to 15 and
// now at 7, a screen at 102 of 255. Like a phone the program was just put
// on, it does not let the program write its settings until that was allowed
// in the screen manageWriteSystemSettings opens; here asking for the screen
// is enough. Nothing vibrates, notifies or stays awake.
import QtQml

QtObject {
    id: backEnd

    readonly property bool isFixedVolume: false
    property bool canWriteSystemSettings: true
    readonly property int maxVolume: 15
    readonly property int minVolume: 0
    property int brightness: 102
    property int volume: 7

    signal showPopup(string message)
    signal manageWriteSystemSettings()

    // The phone: what its settings are, and whether the program may write
    // them.
    readonly property var d: ({ brightness: 102, volume: 7, canWrite: false })

    function vibrate() {
    }

    function notify() {
    }

    function setPartialWakeLock() {
    }

    function disablePartialWakeLock() {
    }

    function setFullWakeLock() {
        console.info("Full WakeLock set")
    }

    function disableFullWakeLock() {
        console.info("Full WakeLock released")
    }

    // The phone's settings were changed by something else than the program.
    function onVolumeChangeObserved(volume) {
        if (d.volume === volume)
            return
        d.volume = volume
        backEnd.volume = volume
    }

    function onBrightnessChangeObserved(brightness) {
        if (d.brightness === brightness)
            return
        d.brightness = brightness
        backEnd.brightness = brightness
    }

    function onManageWriteSystemSettings() {
        d.canWrite = true
    }

    onBrightnessChanged: {
        if (d.brightness === brightness)
            return
        if (!d.canWrite) {
            canWriteSystemSettings = false
            showPopup("Writing system settings is not allowed."
                      + " Please give permission to write system settings for this application")
            return
        }
        canWriteSystemSettings = true
        d.brightness = brightness
    }
    onVolumeChanged: d.volume = volume
    Component.onCompleted: manageWriteSystemSettings.connect(onManageWriteSystemSettings)
}
