void MAIN()
{
    FRAGCOLOR = INPUT_UV.x < 0.5 ? texture(mask, INPUT_UV * vec2(2.0, 1.0)) : texture(mask, TEXTURE_UV * vec2(2.0, 1.0) - vec2(1.0, 0.0));
}
