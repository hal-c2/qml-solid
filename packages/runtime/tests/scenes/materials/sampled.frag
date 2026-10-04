void MAIN()
{
    vec4 read = texture(base, UV0);
    BASE_COLOR = vec4(read.rgb * 0.5, 1.0);
    ROUGHNESS = 1.0;
    SPECULAR_AMOUNT = 0.0;
    EMISSIVE_COLOR = vec3(0.0, 0.0, 0.1);
}
