VARYING vec3 where;

void MAIN()
{
    where = VERTEX;
    VERTEX.y += rise;
    NORMAL = normalize(vec3(lean, 0.0, 1.0));
}
