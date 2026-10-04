// Stands in for FileNameProvider (filenameprovider.h), which gives QML what
// QFileInfo::fileName says: a path without its directories.
pragma Singleton
import QtQml

QtObject {
    function getFileName(p: string): string {
        return p.slice(p.lastIndexOf("/") + 1)
    }
}
