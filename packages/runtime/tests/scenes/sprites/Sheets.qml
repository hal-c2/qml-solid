import QtQuick

// The sheet is four frames of ten by ten: red, green, blue, white.
Item {
    id: root
    width: 300; height: 200
    property var log: []
    property alias whole: whole

    AnimatedSprite { id: plain; source: "../../assets/sheet.png"; frameCount: 2 }
    AnimatedSprite {
        id: twice
        x: 50; width: 20; height: 20
        source: "../../assets/sheet.png"; frameCount: 4; frameDuration: 200; loops: 2; interpolate: false
        onFinished: root.log.push("twice " + currentFrame + " " + running)
    }
    AnimatedSprite {
        id: last
        x: 100
        source: "../../assets/sheet.png"; frameCount: 4; frameRate: 10; loops: 1; interpolate: false
        finishBehavior: AnimatedSprite.FinishAtFinalFrame
        onFinished: root.log.push("last " + currentFrame + " " + running)
    }
    AnimatedSprite {
        id: still
        x: 150
        source: "../../assets/sheet.png"; frameCount: 4; running: false; reverse: true; currentFrame: 1
    }
    AnimatedSprite { id: whole; x: 200; source: "../../assets/sheet.png"; running: false }

    SpriteSequence {
        id: chain
        y: 100; width: 20; height: 20; interpolate: false
        Sprite { name: "a"; source: "../../assets/sheet.png"; frameWidth: 10; frameDuration: 200; to: { "b": 1 } }
        Sprite { name: "b"; source: "../../assets/sheet.png"; frameX: 10; frameWidth: 10; frameDuration: 200; to: { "c": 1 } }
        Sprite { name: "c"; source: "../../assets/sheet.png"; frameX: 20; frameWidth: 10; to: { "a": 0 } }
    }
    SpriteSequence {
        id: goal
        x: 50; y: 100; width: 10; height: 10
        Sprite { name: "a"; source: "../../assets/sheet.png"; frameWidth: 10; frameDuration: 400; to: { "a": 1, "b": 0 } }
        Sprite { name: "b"; source: "../../assets/sheet.png"; frameX: 10; frameWidth: 10; frameDuration: 300; to: { "a": 1, "c": 0 } }
        Sprite { name: "c"; source: "../../assets/sheet.png"; frameX: 20; frameWidth: 10; frameDuration: 400; to: { "a": 1 } }
    }
    SpriteSequence {
        id: early
        x: 100; y: 100; width: 10; height: 10
        goalSprite: "b"
        Sprite { name: "a"; source: "../../assets/sheet.png"; frameWidth: 10; frameDuration: 400; to: { "a": 1, "b": 0 } }
        Sprite { name: "b"; source: "../../assets/sheet.png"; frameX: 10; frameWidth: 10; frameDuration: 400 }
    }
    SpriteSequence {
        id: none
        x: 150; y: 100
        Sprite { name: "a"; source: "../../assets/sheet.png"; frameX: 10; frameWidth: 10 }
    }

    function sizes(item) {
        return [item.width, item.height, item.implicitWidth, item.implicitHeight, item.frameWidth, item.frameHeight]
    }

    // What they are before anything is loaded.
    function first() {
        return [sizes(plain), sizes(whole), sizes(none).slice(0, 4), plain.loops, plain.interpolate, plain.finishBehavior,
                chain.currentSprite, chain.running, chain.interpolate, chain.goalSprite, chain.sprites.length]
    }

    // What they are at a moment.
    function sample() {
        return [plain.currentFrame, twice.currentFrame, twice.running, twice.paused, last.currentFrame, last.running,
                still.currentFrame, chain.currentSprite, goal.currentSprite, early.currentSprite]
    }

    // What happens to them, `time` milliseconds after they started.
    function step(time) {
        switch (time) {
        case 300:
            goal.goalSprite = "c"
            break
        case 600:
            chain.jumpTo("a")
            still.advance(3)
            break
        case 800:
            still.advance(-2)
            chain.jumpTo("nothing")
            early.goalSprite = ""
            break
        case 1000:
            last.restart()
            goal.goalSprite = ""
            break
        case 1300:
            // A number is a name that no sprite has.
            chain.jumpTo(1)
            break
        case 1500:
            chain.jumpTo("b")
            break
        case 1700:
            twice.restart()
            break
        case 1800:
            twice.pause()
            break
        case 2000:
            twice.resume()
            break
        }
    }

    function sized() {
        return [sizes(plain), sizes(whole), sizes(still)]
    }
}
