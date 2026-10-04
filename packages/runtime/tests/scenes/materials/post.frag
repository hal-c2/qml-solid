float kept = 0.25;

void MAIN()
{
    BASE_COLOR = vec4(1.0, 1.0, 1.0, 1.0);
    EMISSIVE_COLOR = vec3(0.0, 0.0, kept);
}

void POST_PROCESS()
{
    COLOR_SUM = vec4(DIFFUSE.rgb * vec3(0.5, 0.0, 0.0) + SPECULAR * 0.0 + EMISSIVE, DIFFUSE.a);
}
