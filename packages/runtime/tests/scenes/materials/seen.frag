VARYING vec3 seen;
VARYING vec3 facing;
VARYING vec2 at;

void MAIN()
{
    FRAGCOLOR = vec4(at.y > 0.5 ? seen : facing * much, 1.0);
}
