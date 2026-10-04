VARYING vec2 at;

void MAIN()
{
    // A whole number among fractions, which Qt's shaders may have.
    vec3 c = at.x > 0.5 ? rgb : vec3(level * steps / 4, on ? 1.0 : 0.0, more.w);
    FRAGCOLOR = vec4(c, 1);
}
