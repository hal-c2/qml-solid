VARYING vec3 where;

void MAIN()
{
    BASE_COLOR = vec4(where.x > 0 ? vec3(1.0) : vec3(1.0, 0.5, 0.0), 1.0);
    ROUGHNESS = 1.0;
    SPECULAR_AMOUNT = 0.0;
}
