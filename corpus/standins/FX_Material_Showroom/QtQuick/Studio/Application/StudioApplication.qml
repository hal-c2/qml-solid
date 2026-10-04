// Stands in for StudioApplication (quickstudioapplication.cpp), which gives
// the application every font file under `fontPath`. A browser cannot ask
// what is in a directory, and the example's has no fonts in it.
import QtQml

QtObject {
    property url fontPath
}
