void MAIN()
{
    vec4 c = texture(INPUT, INPUT_UV);
    FRAGCOLOR = INPUT_UV.x < 0.5 ? tint : vec4(c.rgb * much + vec3(shift, 0.0) + rgb * 0.1, on ? 1.0 : 0.0);
}
