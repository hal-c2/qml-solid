void MAIN()
{
    FRAGCOLOR = INPUT_UV.x < 0.5 ? texture(INPUT, INPUT_UV) : texture(dim, INPUT_UV) + vec4(0.0, 0.0, much, 0.0);
}
