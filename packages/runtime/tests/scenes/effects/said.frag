#define HALVES 1

/*
    What a shader says of itself before it is compiled. Or,

    #define DOUBLES 1
*/

#ifndef DOUBLES
    #define DOUBLES 0
#endif

#if (DOUBLES == 1)
    #define PAINTED(c) vec4(c.rgb * 2.0, c.a)
#endif
#if (HALVES == 1) // and not /* otherwise
    #define PAINTED(c) vec4(c.rgb * 0.5, c.a)
#endif

void MAIN()
{
    vec4 c = texture(INPUT, INPUT_UV);
    FRAGCOLOR = PAINTED(c);
}
