VARYING vec2 at;
void MAIN()
{
    VERTEX.xy *= 0.5;
    at = INPUT_UV;
    INPUT_UV = INPUT_UV * 0.5;
}
