// What the passes of an Effect read and draw into: views of the same scene
// as `effects3d.qml` has, each through an effect of several passes.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 150
    color: "#206020"

    component Seen: View3D {
        id: view
        property alias effects: surroundings.effects
        property alias tonemap: surroundings.tonemapMode
        property alias lit: lamp.visible
        property alias behind: surroundings.backgroundMode
        width: 100
        height: 75
        camera: camera
        environment: SceneEnvironment {
            id: surroundings
            backgroundMode: SceneEnvironment.Color
            clearColor: "#204060"
        }

        OrthographicCamera {
            id: camera
            z: 500
            clipNear: 100
            clipFar: 900
        }

        DirectionalLight {
            id: lamp
            visible: false
        }

        Model {
            source: "#Rectangle"
            x: -20
            scale: Qt.vector3d(0.4, 0.5, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ff8040"
            }
        }

        Model {
            source: "#Rectangle"
            x: 30
            y: 10
            z: 200
            scale: Qt.vector3d(0.2, 0.3, 1)
            materials: PrincipledMaterial {
                lighting: view.lit ? PrincipledMaterial.FragmentLighting : PrincipledMaterial.NoLighting
                baseColor: "#80c0ff"
            }
        }
    }

    component Through: Effect {
        property url by: "effects/same.frag"
        passes: Pass {
            shaders: Shader {
                stage: Shader.Fragment
                shader: by
            }
        }
    }

    // Says how many rows a picture so much the size has: one more than
    // `base` is a tenth.
    component Rows: Effect {
        id: rows
        property real base: 0
        property real span: 10
        property real by: 1
        Buffer {
            id: counted
            name: "counted"
            sizeMultiplier: rows.by
            format: Buffer.RGBA16F
        }
        passes: [
            Pass {
                shaders: Shader {
                    stage: Shader.Fragment
                    shader: "effects/rows.frag"
                }
                output: counted
            },
            Pass {
                shaders: Shader {
                    stage: Shader.Fragment
                    shader: "effects/same.frag"
                }
                commands: BufferInput {
                    buffer: counted
                }
            }
        ]
    }

    Grid {
        columns: 4

        // What a pass reads in place of the picture, the next does not.
        Seen {
            effects: Effect {
                Buffer {
                    id: first
                    name: "first"
                }
                Buffer {
                    id: second
                    name: "second"
                }
                Shader {
                    id: half3
                    stage: Shader.Fragment
                    shader: "effects/half.frag"
                }
                Shader {
                    id: same3
                    stage: Shader.Fragment
                    shader: "effects/same.frag"
                }
                passes: [
                    Pass {
                        shaders: half3
                        output: first
                    },
                    Pass {
                        shaders: same3
                        commands: BufferInput {
                            buffer: first
                        }
                        output: second
                    },
                    Pass {
                        shaders: same3
                    }
                ]
            }
        }

        // How big what is read is, where that is a smaller picture.
        Seen {
            effects: Effect {
                Buffer {
                    id: halved
                    name: "halved"
                    sizeMultiplier: 0.5
                }
                Shader {
                    id: same4
                    stage: Shader.Fragment
                    shader: "effects/same.frag"
                }
                Shader {
                    id: sizes4
                    stage: Shader.Fragment
                    shader: "effects/sizes.frag"
                }
                passes: [
                    Pass {
                        shaders: same4
                        output: halved
                    },
                    Pass {
                        shaders: sizes4
                        commands: BufferInput {
                            buffer: halved
                        }
                    }
                ]
            }
        }

        // How many rows half of 75 is, and 0.35 of it.
        Seen {
            effects: Rows {
                base: 30
                by: 0.5
            }
        }

        Seen {
            effects: Rows {
                base: 20
                by: 0.35
            }
        }

        // What a pass sets a property to, the next does not have.
        Seen {
            effects: Effect {
                property real much: 0
                Buffer {
                    id: added
                    name: "added"
                    format: Buffer.RGBA16F
                }
                Shader {
                    id: add
                    stage: Shader.Fragment
                    shader: "effects/add.frag"
                }
                passes: [
                    Pass {
                        shaders: add
                        output: added
                        commands: SetUniformValue {
                            target: "much"
                            value: 0.25
                        }
                    },
                    Pass {
                        shaders: add
                        commands: BufferInput {
                            buffer: added
                        }
                    }
                ]
            }
        }

        // The picture read past its edges.
        Seen {
            effects: Through {
                by: "effects/wrap.frag"
            }
        }

        // Nothing behind the scene.
        Seen {
            behind: SceneEnvironment.Transparent
            effects: Through {
                by: "effects/sheer.frag"
            }
        }

        // What a shader says before it is compiled, and does not say where
        // that is only written about.
        Seen {
            effects: Through {
                by: "effects/said.frag"
            }
        }
    }
}
