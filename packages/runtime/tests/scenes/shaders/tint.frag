#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec4 tint;
    float level;
    vec2 shift;
    float squeeze;
} ubuf;

// The tint left of where `level` and `shift` say, blue right of it.
void main() {
    bool left = qt_TexCoord0.x < ubuf.level + ubuf.shift.x;
    fragColor = (left ? ubuf.tint : vec4(0.0, 0.0, 1.0, 1.0)) * ubuf.qt_Opacity;
}
