// What a Buffer of an Effect is by its name, and what kind of picture an
// effect leaves: views of one scene, each through effects that say.
import QtQuick
import QtQuick3D

Rectangle {
    id: root
    width: 400
    height: 225
    color: "#206020"

    component Seen: View3D {
        property alias effects: surroundings.effects
        width: 100
        height: 75
        camera: camera
        environment: SceneEnvironment {
            id: surroundings
            backgroundMode: SceneEnvironment.Color
            clearColor: "#204060"
            tonemapMode: SceneEnvironment.TonemapModeNone
        }

        OrthographicCamera {
            id: camera
            z: 500
        }

        Model {
            source: "#Rectangle"
            scale: Qt.vector3d(0.4, 0.5, 1)
            materials: DefaultMaterial {
                lighting: DefaultMaterial.NoLighting
                diffuseColor: "#ff8040"
            }
        }
    }

    component Does: Shader {
        property string what
        stage: Shader.Fragment
        shader: "effects/" + what + ".frag"
    }

    component Halved: Effect {
        passes: Pass {
            shaders: Does { what: "half" }
        }
    }

    Grid {
        columns: 4

        // A Buffer without a name is the picture the effect leaves: of
        // whole numbers here, so that no more than all of a colour is kept.
        Seen {
            effects: [
                Effect {
                    passes: Pass {
                        shaders: Does { what: "bright" }
                        output: Buffer { format: Buffer.RGBA8 }
                    }
                },
                Halved { }
            ]
        }

        // With no output said, more is.
        Seen {
            effects: [
                Effect {
                    passes: Pass {
                        shaders: Does { what: "bright" }
                    }
                },
                Halved { }
            ]
        }

        Seen {
            effects: Effect {
                passes: Pass {
                    shaders: Does { what: "green" }
                    output: Buffer { }
                }
            }
        }

        // Read, it is the picture the effect was given.
        Seen {
            effects: Effect {
                Buffer { id: unnamed }
                passes: [
                    Pass {
                        shaders: Does { what: "green" }
                        output: unnamed
                    },
                    Pass {
                        shaders: Does { what: "same" }
                        commands: BufferInput { buffer: unnamed }
                    }
                ]
            }
        }

        // Two Buffers of one name are one.
        Seen {
            effects: Effect {
                Buffer { id: one; name: "one" }
                Buffer { id: same; name: "one" }
                passes: [
                    Pass {
                        shaders: Does { what: "green" }
                        output: one
                    },
                    Pass {
                        shaders: Does { what: "same" }
                        commands: BufferInput { buffer: same }
                    }
                ]
            }
        }

        // One that nothing drew into is seen through.
        Seen {
            effects: Effect {
                Buffer { id: full; name: "full" }
                Buffer { id: empty; name: "empty" }
                passes: [
                    Pass {
                        shaders: Does { what: "green" }
                        output: full
                    },
                    Pass {
                        shaders: Does { what: "same" }
                        commands: BufferInput { buffer: empty }
                    }
                ]
            }
        }

        // One of a name is the same to every effect of the view.
        Seen {
            effects: [
                Effect {
                    Buffer { id: theirs; name: "shared" }
                    passes: [
                        Pass {
                            shaders: Does { what: "green" }
                            output: theirs
                        },
                        Pass {
                            shaders: Does { what: "same" }
                        }
                    ]
                },
                Effect {
                    Buffer { id: ours; name: "shared" }
                    passes: Pass {
                        shaders: Does { what: "same" }
                        commands: BufferInput { buffer: ours }
                    }
                }
            ]
        }

        // One without a name is of the size of the view, whatever it says.
        Seen {
            effects: Effect {
                passes: Pass {
                    shaders: Does { what: "sizes" }
                    output: Buffer { sizeMultiplier: 0.5 }
                }
            }
        }

        // Whole numbers, once said, are what each effect after it leaves.
        Seen {
            effects: [
                Effect {
                    passes: Pass {
                        shaders: Does { what: "same" }
                        output: Buffer { format: Buffer.RGBA8 }
                    }
                },
                Effect {
                    passes: Pass {
                        shaders: Does { what: "bright" }
                    }
                },
                Halved { }
            ]
        }

        // The last pass to draw into what the effect leaves says its kind.
        Seen {
            effects: [
                Effect {
                    passes: [
                        Pass {
                            shaders: Does { what: "green" }
                            output: Buffer { format: Buffer.RGBA8 }
                        },
                        Pass {
                            shaders: Does { what: "bright" }
                        }
                    ]
                },
                Halved { }
            ]
        }

        Seen {
            effects: [
                Effect {
                    passes: [
                        Pass {
                            shaders: Does { what: "green" }
                        },
                        Pass {
                            shaders: Does { what: "bright" }
                            output: Buffer { format: Buffer.RGBA8 }
                        }
                    ]
                },
                Halved { }
            ]
        }

        // And not the kind of a Buffer read in place of the picture.
        Seen {
            effects: [
                Effect {
                    Buffer { id: whole; name: "whole"; format: Buffer.RGBA8 }
                    passes: [
                        Pass {
                            shaders: Does { what: "green" }
                            output: whole
                        },
                        Pass {
                            shaders: Does { what: "bright" }
                            commands: BufferInput { buffer: whole }
                        }
                    ]
                },
                Halved { }
            ]
        }
    }
}
