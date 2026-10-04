VARYING vec2 at;

void MAIN()
{
    at = UV0;
    POSITION = MODELVIEWPROJECTION_MATRIX * vec4(VERTEX + vec3(shift, 0.0), 1.0);
}
