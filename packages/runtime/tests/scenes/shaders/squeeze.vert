#version 440

layout(location = 0) in vec4 qt_Vertex;
layout(location = 1) in vec2 qt_MultiTexCoord0;
layout(location = 0) out vec2 qt_TexCoord0;
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec4 tint;
    float level;
    vec2 shift;
    float squeeze;
} ubuf;

// The item, as wide as `squeeze` of it, and bowed at the middle rows.
void main() {
    qt_TexCoord0 = qt_MultiTexCoord0;
    vec4 at = qt_Vertex;
    at.x *= ubuf.squeeze * (1.0 - 0.5 * sin(qt_MultiTexCoord0.y * 3.14159265));
    gl_Position = ubuf.qt_Matrix * at;
}
