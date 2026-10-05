void MAIN()
{
    vec2 uv = FRAGCOORD.xy / vec2(textureSize(DEPTH_TEXTURE, 0));
    float far = texture(DEPTH_TEXTURE, uv).x;
    FRAGCOLOR = vec4(far * 10, far, 1.0 - far, 1.0);
}
