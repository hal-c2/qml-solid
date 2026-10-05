VARYING vec3 seen;
VARYING vec3 facing;
VARYING vec2 at;

void MAIN()
{
    at = UV0;
    POSITION = VIEWPROJECTION_MATRIX * MODEL_MATRIX * vec4(VERTEX, 1.0);
    vec4 back = INVERSE_PROJECTION_MATRIX * POSITION;
    seen = vec3(back.x, -back.y, -back.z) / vec3(100, 100, 1000);
    facing = NORMAL_MATRIX * NORMAL + (PROJECTION_MATRIX * VIEW_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz * 0.0;
}
