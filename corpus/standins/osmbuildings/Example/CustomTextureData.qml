// Stands in for CustomTextureData (manager.cpp): a picture made of the bytes
// of an image file, here the PNG a tile of the map is.
//
// In C++ QImage reads the file there and then. Here the browser does, and is
// done a little later: until then the picture is empty.
import QtQuick
import QtQuick3D

TextureData {
    id: textureData

    function setImageData(data) {
        if (!data)
            return
        const browser = globalThis
        browser.createImageBitmap(new browser.Blob([data])).then((image) => {
            const canvas = new browser.OffscreenCanvas(image.width, image.height)
            const context = canvas.getContext("2d")
            context.drawImage(image, 0, 0)
            const pixels = context.getImageData(0, 0, image.width, image.height)
            textureData.setTextureData(pixels.data)
            textureData.setSize(Qt.size(image.width, image.height))
            textureData.setHasTransparency(false)
            textureData.setFormat(TextureData.RGBA8)
        }, () => {})
    }
}
