import QtQuick

// The sheet is four frames of ten by ten: red, green, blue, white.
Item {
    width: 300; height: 200
    property alias mixed: mixed
    property alias synced: synced
    property alias steps: steps

    AnimatedSprite { id: mixed; source: "../../assets/sheet.png"; frameCount: 4; frameDuration: 100; loops: 1 }
    AnimatedSprite { id: synced; x: 50; source: "../../assets/sheet.png"; frameCount: 4; frameSync: true }
    SpriteSequence {
        id: steps
        x: 100; width: 10; height: 10
        Sprite { name: "pair"; source: "../../assets/sheet.png"; frameCount: 2; frameWidth: 10; frameDuration: 100; to: { "rest": 1 } }
        Sprite { name: "rest"; source: "../../assets/sheet.png"; frameCount: 2; frameX: 20; frameWidth: 10; frameDuration: 100 }
    }
}
