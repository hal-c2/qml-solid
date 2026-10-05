void MAIN()
{
    vec2 uv = FRAGCOORD.xy / vec2(textureSize(SCREEN_TEXTURE, 0));
    vec4 behind = texture(SCREEN_TEXTURE, uv);
    FRAGCOLOR = vec4(behind.gbr * shade, much);
}
