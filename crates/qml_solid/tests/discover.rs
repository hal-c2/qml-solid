//! What a project's `qmldir` and `CMakeLists.txt` files say its modules are.

use qml_solid::discover::{Module, Type, cmake, qmldir};

fn module(uri: &str, types: &[(&str, &str)]) -> Module {
    Module {
        uri: uri.to_string(),
        types: types.iter().map(|(name, path)| Type { name: (*name).to_string(), path: (*path).to_string() }).collect(),
    }
}

#[test]
fn a_qmldir_names_the_module_and_its_types() {
    let text = "module Thermostat\n\
        # what the designer sees\n\
        designersupported\n\
        plugin thermostatplugin\n\
        typeinfo plugins.qmltypes\n\
        depends QtQuick 2.0\n\
        singleton Constants 1.0 Constants.qml\n\
        internal Gauge Gauge.ui.qml\n\
        RoomView 1.0 views/RoomView.qml\n\
        Helpers 1.0 helpers.js\n";
    assert_eq!(
        qmldir(text),
        Some(module(
            "Thermostat",
            &[("Constants", "Constants.qml"), ("Gauge", "Gauge.ui.qml"), ("RoomView", "views/RoomView.qml")],
        ))
    );
    // A directory that is no module is only ever imported by its path.
    assert_eq!(qmldir("Clock 1.0 Clock.qml\n"), None);
}

#[test]
fn a_build_names_the_module_and_the_files_that_are_its_types() {
    let text = r#"
cmake_minimum_required(VERSION 3.16)
project(thermostat LANGUAGES CXX)

set(target_uri "Thermostat")
set(qml_singletons
    Constants.qml  # one object
)
list(APPEND qml_singletons "theme/Colors.qml")
set_source_files_properties(${qml_singletons} PROPERTIES QT_QML_SINGLETON_TYPE TRUE)

if (ANDROID)
    message("QML_FILES ${qml_singletons}")
endif()

qt_add_qml_module(thermostat
    URI ${target_uri}
    VERSION 1.0
    NO_PLUGIN
    QML_FILES
        Main.qml
        main.qml
        views/RoomView.ui.qml
        "${CMAKE_CURRENT_SOURCE_DIR}/views/Dial.qml"
        ${qml_singletons}
        ${generated_elsewhere}
    RESOURCES
        images/Icon.qml.png
    SOURCES backend.cpp backend.h
)

qt6_add_qml_module(controls URI Thermostat.Controls QML_FILES Knob.qml)
"#;
    assert_eq!(
        cmake(text),
        [
            module(
                "Thermostat",
                &[
                    ("Main", "Main.qml"),
                    ("RoomView", "views/RoomView.ui.qml"),
                    ("Dial", "./views/Dial.qml"),
                    ("Constants", "Constants.qml"),
                    ("Colors", "theme/Colors.qml"),
                ],
            ),
            module("Thermostat.Controls", &[("Knob", "Knob.qml")]),
        ]
    );
    // A module with no name is not one anything can import.
    assert_eq!(cmake("qt_add_qml_module(app QML_FILES Main.qml)"), []);
}
