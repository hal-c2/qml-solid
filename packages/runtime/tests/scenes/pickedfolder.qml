// The pictures of a folder the user picks: a dialog that gives the folder,
// a model of what is in it, and an Image for each.
import QtQuick
import QtQuick.Dialogs
import Qt.labs.folderlistmodel

Item {
    id: root
    width: 200
    height: 100

    property alias dialog: dialog
    property alias model: model

    function shown() {
        const found = [];
        for (let i = 0; i < pictures.count; i++) {
            const item = pictures.itemAt(i);
            found.push([item.fileName, item.status === Image.Ready, item.implicitWidth, item.fileSize, item.filePath, item.fileModified.getTime()]);
        }
        return found;
    }

    FolderDialog {
        id: dialog
        onAccepted: model.folder = selectedFolder
    }

    Repeater {
        id: pictures
        model: FolderListModel {
            id: model
            showDirs: false
            nameFilters: ["*.png"]
        }
        delegate: Image {
            required property string fileName
            required property url fileUrl
            required property string filePath
            required property int fileSize
            required property date fileModified
            source: fileUrl
        }
    }
}
