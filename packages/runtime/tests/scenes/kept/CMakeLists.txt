# What a build says of the files it puts into the program: the ones that go
# with a module, and the ones it keeps by themselves.
project(kept LANGUAGES CXX)

add_subdirectory(style)

qt_add_qml_module(kept
    URI Kept
    RESOURCES
        flag.png
        marks/disc.svg
        marks/mark.svg
)

qt_add_resources(kept "pictures"
    PREFIX "/pictures"
    FILES alone.png
)
