void MAIN()
{
    vec4 c = texture(INPUT, INPUT_UV);
    FRAGCOLOR = vec4(c.rgb * 0.5, c.a);
}
