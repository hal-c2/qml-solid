void MAIN()
{
    BASE_COLOR = vec4(0.2, 0.2, 0.2, 1.0);
    ROUGHNESS = 0.4;
}

void SPECULAR_LIGHT()
{
    SPECULAR += LIGHT_COLOR * vec3(0.0, 0.1, 0.0) * LIGHT_ATTENUATION;
}
