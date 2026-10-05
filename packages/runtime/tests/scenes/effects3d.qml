// What an Effect does to the picture of a scene: sixteen views of the same
// scene, each brought to the screen through shaders of its own.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 300
    color: "#206020"

    component Seen: View3D {
        id: view
        property alias effects: surroundings.effects
        property alias tonemap: surroundings.tonemapMode
        property alias lit: lamp.visible
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

    Grid {
        columns: 4

        Seen {
        }

        Seen {
            effects: Through {
            }
        }

        Seen {
            effects: Through {
                by: "effects/half.frag"
            }
        }

        Seen {
            effects: Through {
                by: "effects/uv.frag"
            }
        }

        Seen {
            effects: Through {
                by: "effects/tint.frag"
                property color tint: "#336699"
                property real much: 0.5
                property vector2d shift: Qt.vector2d(0.25, 0)
                property vector3d rgb: Qt.vector3d(0, 0, 1)
                property bool on: true
            }
        }

        Seen {
            effects: Through {
                by: "effects/sizes.frag"
            }
        }

        Seen {
            effects: Effect {
                passes: Pass {
                    shaders: [
                        Shader {
                            stage: Shader.Vertex
                            shader: "effects/small.vert"
                        },
                        Shader {
                            stage: Shader.Fragment
                            shader: "effects/small.frag"
                        }
                    ]
                }
            }
        }

        Seen {
            effects: Through {
                by: "effects/picture.frag"
                property TextureInput mask: TextureInput {
                    texture: Texture {
                        source: "../assets/flag.png"
                        magFilter: Texture.Nearest
                    }
                }
            }
        }

        // Into a picture of its own, a quarter the size, and from that.
        Seen {
            effects: Effect {
                Buffer {
                    id: little
                    name: "little"
                    sizeMultiplier: 0.25
                    textureFilterOperation: Buffer.Nearest
                }
                Shader {
                    id: same
                    stage: Shader.Fragment
                    shader: "effects/same.frag"
                }
                Shader {
                    id: sizes
                    stage: Shader.Fragment
                    shader: "effects/sizes.frag"
                }
                passes: [
                    Pass {
                        shaders: same
                        output: little
                    },
                    Pass {
                        shaders: same
                        commands: BufferInput {
                            buffer: little
                        }
                    }
                ]
            }
        }

        Seen {
            effects: Effect {
                Buffer {
                    id: sized
                    name: "sized"
                    sizeMultiplier: 0.5
                }
                Shader {
                    id: same2
                    stage: Shader.Fragment
                    shader: "effects/same.frag"
                }
                Shader {
                    id: sizes2
                    stage: Shader.Fragment
                    shader: "effects/sizes.frag"
                }
                passes: [
                    Pass {
                        shaders: sizes2
                        output: sized
                    },
                    Pass {
                        shaders: same2
                        commands: BufferInput {
                            buffer: sized
                        }
                    }
                ]
            }
        }

        // The picture it was given and one it made, both.
        Seen {
            effects: Effect {
                property TextureInput dim: TextureInput {
                    texture: Texture {
                    }
                }
                property real much: 0
                Buffer {
                    id: dimmed
                    name: "dimmed"
                }
                Shader {
                    id: half
                    stage: Shader.Fragment
                    shader: "effects/half.frag"
                }
                Shader {
                    id: both
                    stage: Shader.Fragment
                    shader: "effects/both.frag"
                }
                passes: [
                    Pass {
                        shaders: half
                        output: dimmed
                    },
                    Pass {
                        shaders: both
                        commands: [
                            BufferInput {
                                buffer: dimmed
                                sampler: "dim"
                            },
                            SetUniformValue {
                                target: "much"
                                value: 0.25
                            }
                        ]
                    }
                ]
            }
        }

        // One after another.
        Seen {
            effects: [
                Through {
                    by: "effects/half.frag"
                },
                Through {
                    by: "effects/flip.frag"
                }
            ]
        }

        Seen {
            effects: Through {
                by: "effects/depth.frag"
            }
        }

        Seen {
            tonemap: SceneEnvironment.TonemapModeFilmic
            lit: true
        }

        Seen {
            tonemap: SceneEnvironment.TonemapModeFilmic
            lit: true
            effects: Through {
                by: "effects/half.frag"
            }
        }

        Seen {
            effects: Through {
                by: "effects/sheer.frag"
            }
        }
    }
}
