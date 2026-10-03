// The animators: animations of one property each, which Qt runs on the
// thread that draws. There is no such thread here, so each is the animation
// of its property, which reads as it moves and not only once it has arrived.
import { defineType } from "../../object.js";
import { PropertyAnimation, RotationAnimation } from "./PropertyAnimation.js";

export const Animator = defineType("Animator", PropertyAnimation, {});

const animator = (name, property) => defineType(name, Animator, { methods: { $defaults: [property] } });

export const XAnimator = animator("XAnimator", "x");
export const YAnimator = animator("YAnimator", "y");
export const ScaleAnimator = animator("ScaleAnimator", "scale");
export const OpacityAnimator = animator("OpacityAnimator", "opacity");

export const RotationAnimator = defineType("RotationAnimator", RotationAnimation, {
  methods: { $defaults: ["rotation"] },
});
