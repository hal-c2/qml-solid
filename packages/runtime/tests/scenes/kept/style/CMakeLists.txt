# A part of the program that is built by itself, as a style often is.
project(keptstyle LANGUAGES CXX)

qt_add_qml_module(keptstyle
    URI KeptStyle
    QML_FILES Mark.qml
)
