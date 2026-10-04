// Stands in for AssetDownloader (Qt.labs.assetdownloader, which Qt links
// into the example), which downloads an archive of the example's assets and
// unpacks it into a directory of the machine. A browser has no such
// directory: what it downloads it keeps itself. So the assets stay where
// they are served from, one by one, and that is the directory: the `url` of
// the list of them, which is the one at `downloadBase` and, when that one
// cannot be had, the one the example comes with.
import QtQml

QtObject {
    id: downloader

    property url downloadBase
    property url preferredLocalDownloadDir
    property url offlineAssetsFilePath
    property string jsonFileName
    property string zipFileName
    property url localDownloadDir

    signal started()
    signal finished(bool success)
    signal progressChanged(int progressValue, int progressMaximum, string progressText)

    function read(from: url, otherwise: var) {
        const request = new XMLHttpRequest()
        request.onreadystatechange = function() {
            if (request.readyState !== XMLHttpRequest.DONE)
                return
            let assets = null
            try {
                assets = request.status === 200 ? JSON.parse(request.responseText) : null
            } catch (error) {
                assets = null
            }
            if (!assets || !assets.url) {
                if (otherwise)
                    otherwise()
                else
                    downloader.finished(false)
                return
            }
            downloader.localDownloadDir = String(assets.url).replace(/\/+$/, "")
            downloader.progressChanged(1, 1, "")
            downloader.finished(true)
        }
        request.open("GET", from)
        request.send()
    }

    function start() {
        started()
        const offline = String(offlineAssetsFilePath)
        read(downloadBase + jsonFileName, offline ? () => read(offline, null) : null)
    }
}
