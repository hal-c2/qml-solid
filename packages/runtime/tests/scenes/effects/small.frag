VARYING vec2 at;
void MAIN()
{
    vec4 c = texture(INPUT, INPUT_UV);
    FRAGCOLOR = at.x < 0.5 ? c : vec4(at, 0.0, 1.0);
}
