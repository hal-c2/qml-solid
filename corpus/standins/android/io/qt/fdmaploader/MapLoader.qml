// Stands in for MapLoader (feature-delivery/fdmaploader/maploader.cpp),
// which has Google Play deliver a part of the program left out when it was
// installed: fdwintermapmodule, with the winter map and a word about the
// maps.
//
// There is no Play Store here, so the example's own directory is one: the
// part is its fdwintermapmodule, and delivering it is reading the map from
// there. What the program is told is what the C++ tells it as Play goes from
// downloading to installed and loaded, only sooner. A part that is removed is
// gone at once, where a phone removes it when it sees fit.
import QtQml

QtObject {
    id: loader

    enum ErrorResult { Continue, ExitApp }

    signal showToast(string message)
    signal showMapInfoPopup(string message)
    signal showDownloadPopup()
    signal hideDownloadPopup()
    signal updateDownloadProgress(int bytes, int total)
    signal moduleLoaded()
    signal errorOccured(string error, int result)
    signal installCanceled()

    // The store: the parts it has, each with the pictures it brings and what
    // its loadMapInfo says.
    readonly property var modules: ({
        fdwintermapmodule: { images: ["wintermap.jpeg"], info: "Maps generated with AI" }
    })
    // Private in C++: the delivery there is now, if any; and here the parts
    // that were delivered.
    readonly property var d: ({ request: null, installed: [] })

    function loadModuleFromStore(moduleName) {
        if (d.request)
            return
        if (!modules[moduleName]) {
            console.warn("Error: ", -2, " ", "Module unavailable")
            errorOccured("Module unavailable", MapLoader.Continue)
            return
        }

        const request = new XMLHttpRequest()
        let downloading = false
        request.onreadystatechange = () => {
            if (d.request !== request || request.readyState < XMLHttpRequest.HEADERS_RECEIVED)
                return
            const found = request.status === 200 || request.status === 0 && request.readyState === XMLHttpRequest.DONE
                    && request.response && request.response.byteLength > 0
            if (found && !downloading) {
                downloading = true
                showDownloadPopup()
            }
            if (request.readyState !== XMLHttpRequest.DONE)
                return
            d.request = null
            if (!found) {
                console.warn("Error: ", -6, " ", "Network error")
                errorOccured("Network error", MapLoader.Continue)
                return
            }
            const total = request.response.byteLength
            updateDownloadProgress(total, total)
            showToast("Installing")
            hideDownloadPopup()
            showToast("Installed")
            if (!d.installed.includes(moduleName))
                d.installed.push(moduleName)
            moduleLoaded()
        }
        d.request = request
        request.open("GET", Qt.resolvedUrl("../../../../../qtdoc/examples/demos/android/feature-delivery/"
                                           + moduleName + "/images/" + modules[moduleName].images[0]))
        request.responseType = "arraybuffer"
        request.send()
    }

    // The pictures the program has: its own, and those of the parts
    // delivered.
    function getImageNames() {
        return ["summermap.jpeg"].concat(...d.installed.map((moduleName) => modules[moduleName].images))
    }

    function showMapInfo() {
        if (d.installed.includes("fdwintermapmodule")) {
            showMapInfoPopup(modules.fdwintermapmodule.info)
        } else {
            console.warn("Failed to load library")
            showMapInfoPopup("Information not loaded")
        }
    }

    function removeModule(moduleName) {
        const at = d.installed.indexOf(moduleName)
        if (at >= 0)
            d.installed.splice(at, 1)
    }

    function cancelDownload() {
        if (!d.request) {
            console.warn("No valid handler")
            return
        }
        const request = d.request
        d.request = null
        request.abort()
        installCanceled()
    }
}
