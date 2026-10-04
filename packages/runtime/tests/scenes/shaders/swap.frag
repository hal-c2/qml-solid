#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;
layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
};
layout(binding = 1) uniform sampler2D source;

// The picture with its red and its blue changed over.
void main() {
    fragColor = texture(source, qt_TexCoord0).bgra * qt_Opacity;
}
