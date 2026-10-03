pragma Singleton
import QtQuick

QtObject {
    property int grid: 10
    property int twice: Theme.grid * 2
    enum Density { Roomy, Dense = 3 }
}
