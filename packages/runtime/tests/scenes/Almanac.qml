pragma Singleton
import QtQuick
import QtQuick.Templates as T

T.Calendar {
    property int firstYear: 1970
    enum Era { Before, After = 7 }
}
