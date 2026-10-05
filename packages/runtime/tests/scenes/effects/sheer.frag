void MAIN()
{
    vec4 c = texture(INPUT, INPUT_UV);
    FRAGCOLOR = INPUT_UV.y < 0.5 ? vec4(c.rgb * 0.5, 0.5) : vec4(c.a, c.a, c.a, 1.0);
}
