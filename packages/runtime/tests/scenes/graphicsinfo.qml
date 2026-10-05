// What an item says it is drawn with, and the names Qt has for the ways
// there are.
import QtQuick

Rectangle {
    id: root
    width: 100
    height: 100

    property bool upright: GraphicsInfo.api != GraphicsInfo.OpenGL

    function read() {
        return {
            api: GraphicsInfo.api,
            same: GraphicsInfo.api == GraphicsInfo.OpenGL,
            upright: root.upright,
            shader: [GraphicsInfo.shaderType, GraphicsInfo.shaderCompilationType, GraphicsInfo.shaderSourceType],
            version: [GraphicsInfo.majorVersion, GraphicsInfo.minorVersion, GraphicsInfo.profile, GraphicsInfo.renderableType],
            apis: [GraphicsInfo.Unknown, GraphicsInfo.Software, GraphicsInfo.OpenVG, GraphicsInfo.OpenGL, GraphicsInfo.Direct3D11, GraphicsInfo.Vulkan, GraphicsInfo.Metal, GraphicsInfo.Null, GraphicsInfo.Direct3D12],
            shaders: [GraphicsInfo.UnknownShadingLanguage, GraphicsInfo.GLSL, GraphicsInfo.HLSL, GraphicsInfo.RhiShader],
            compilations: [GraphicsInfo.RuntimeCompilation, GraphicsInfo.OfflineCompilation],
            sources: [GraphicsInfo.ShaderSourceString, GraphicsInfo.ShaderSourceFile, GraphicsInfo.ShaderByteCode],
            profiles: [GraphicsInfo.OpenGLNoProfile, GraphicsInfo.OpenGLCoreProfile, GraphicsInfo.OpenGLCompatibilityProfile],
            renderables: [GraphicsInfo.SurfaceFormatUnspecified, GraphicsInfo.SurfaceFormatOpenGL, GraphicsInfo.SurfaceFormatOpenGLES],
        };
    }
}
