// Sprites turned about all three axes, and a model for each particle: one
// tinted, turned and in a system that is turned; one seen through, put
// aside and turned in its delegate, and moving; one that fades; models
// under another node in a system that is not of a size with the scene;
// one turned towards a point; and one that grows as it comes.
import QtQuick
import QtQuick3D
import QtQuick3D.Particles3D

Item {
    id: root
    width: 400
    height: 300
    property int t: 0

    component Cell: ParticleSystem3D {
        id: cell
        property alias kind: sprite
        property alias emitter: emitter
        running: false
        time: root.t

        SpriteParticle3D {
            id: sprite
            color: "#ffffff"
            fadeInDuration: 0
            fadeOutDuration: 0
            maxAmount: 4
        }
        ParticleEmitter3D {
            id: emitter
            particle: sprite
            particleScale: 10
            lifeSpan: 1000
            emitBursts: EmitBurst3D {
                amount: 1
            }
        }
    }

    component Box: Model {
        source: "#Cube"
        scale: Qt.vector3d(0.4, 0.3, 0.2)
        materials: DefaultMaterial {
            lighting: DefaultMaterial.NoLighting
            diffuseMap: Texture {
                source: "../assets/flag.png"
            }
        }
    }

    View3D {
        anchors.fill: parent
        environment: SceneEnvironment {
            backgroundMode: SceneEnvironment.Color
            clearColor: "#808080"
        }

        OrthographicCamera {
            z: 500
        }

        Cell {
            x: -150
            y: 75
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            emitter.particleRotation: Qt.vector3d(40, 50, 30)
        }
        Cell {
            x: -50
            y: 75
            kind.sprite: Texture {
                source: "../assets/flag.png"
            }
            kind.billboard: true
            emitter.particleRotation: Qt.vector3d(40, 50, 30)
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: 50
            y: 75
            eulerRotation.y: 20

            ModelParticle3D {
                id: model1
                fadeInDuration: 0
                fadeOutDuration: 0
                maxAmount: 4
                color: "#ff8000"
                delegate: Box {}
            }
            ParticleEmitter3D {
                particle: model1
                lifeSpan: 1000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
                particleRotation: Qt.vector3d(40, 50, 30)
            }
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: 150
            y: 75

            ModelParticle3D {
                id: model2
                fadeInDuration: 0
                fadeOutDuration: 0
                maxAmount: 4
                color: "#8000ff00"
                delegate: Box {
                    y: 20
                    eulerRotation.z: 45
                }
            }
            ParticleEmitter3D {
                particle: model2
                lifeSpan: 1000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
                particleScale: 1.5
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(30, 0, 0)
                }
            }
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: -150
            y: -75

            ModelParticle3D {
                id: model3
                fadeOutDuration: 0
                maxAmount: 4
                fadeInDuration: 500
                delegate: Box {}
            }
            ParticleEmitter3D {
                particle: model3
                lifeSpan: 1000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: -50
            y: -75
            scale: Qt.vector3d(1.5, 1, 1)

            ModelParticle3D {
                id: model4
                fadeInDuration: 0
                fadeOutDuration: 0
                maxAmount: 4
                delegate: Node {
                    Box {
                        x: 15
                    }
                    Box {
                        x: -15
                        y: 20
                        scale: Qt.vector3d(0.1, 0.1, 0.1)
                    }
                }
            }
            ParticleEmitter3D {
                particle: model4
                lifeSpan: 1000
                velocity: VectorDirection3D {
                    direction: Qt.vector3d(0, -30, 0)
                }
                particleScale: 0.8
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: 50
            y: -75

            ModelParticle3D {
                id: model5
                fadeInDuration: 0
                fadeOutDuration: 0
                maxAmount: 4
                alignMode: Particle3D.AlignTowardsTarget
                alignTargetPosition: Qt.vector3d(100, 100, 100)
                delegate: Box {}
            }
            ParticleEmitter3D {
                particle: model5
                lifeSpan: 1000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
            }
        }
        ParticleSystem3D {
            running: false
            time: root.t
            x: 150
            y: -75

            ModelParticle3D {
                id: model6
                fadeOutDuration: 0
                maxAmount: 4
                fadeInDuration: 500
                fadeInEffect: Particle3D.FadeScale
                delegate: Box {}
            }
            ParticleEmitter3D {
                particle: model6
                lifeSpan: 1000
                emitBursts: EmitBurst3D {
                    amount: 1
                }
                particleEndScale: 2
            }
        }
    }

    property var acts: [
        function () { root.t = 375 },
        function () { root.t = 625 }
    ]

    function act(index) {
        acts[index]()
    }
}
