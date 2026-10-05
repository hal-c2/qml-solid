VARYING vec4 tone;

void MAIN()
{
    FRAGCOLOR = vec4(tone.rgb, 1.0);
}
