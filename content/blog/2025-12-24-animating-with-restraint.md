---
title: Animating with Restraint
date: 2025-12-24
tags: [motion]
pinned: false
description: Why most UI animation fails, and a practical framework for motion that earns its place.
---

## Why Most Animation Fails

The common failure mode of UI animation is not technical — it's philosophical. Animations fail because they exist to impress the developer, not to help the user.

A loading spinner that spins for 300ms on a 50ms operation. A page transition that takes longer than the attention span it's meant to hold. A card hover effect that makes every card feel equally special, which means none of them are.

Restraint is not the absence of animation. It's the discipline of animating only when motion communicates something that static design cannot.

## The Three Legitimate Uses

After surveying dozens of production interfaces, motion serves exactly three legitimate purposes:

**1. Orientation** — telling the user where they are and how they got there. A modal sliding in from the right implies it came from a right-side trigger. A list item expanding in place implies it contains the content that was revealed.

**2. Causality** — connecting cause to effect. When a button click causes a drawer to open, the transition that links them helps the user's mental model: pressing this caused that.

**3. Feedback** — confirming that an action was received. A button that briefly scales down on press, a form field that shakes on invalid input. These are motion as error message.

Everything else is decoration. Decoration has a cost: it draws attention, consumes processing, and after the first viewing, delays the user.

## Duration as a Design Decision

```css
/* System-level duration tokens */
:root {
  --duration-instant: 80ms;   /* state changes: checked, focused */
  --duration-fast: 150ms;     /* micro-interactions: hover, press */
  --duration-standard: 250ms; /* component transitions: modal, drawer */
  --duration-deliberate: 400ms; /* page-level transitions */
}
```

These are not arbitrary values. They're derived from the perceptual threshold research: below 100ms feels instantaneous, 100–300ms feels responsive, 300–500ms is noticeable, above 500ms is slow.

Most UI transitions should live in the 150–250ms range. Page transitions can reach 300–400ms when they establish strong spatial metaphors. Beyond 500ms requires exceptional justification.

## Easing Communicates Character

A linear ease says: this system doesn't understand physics. An ease-out says: this object has momentum and decelerates naturally. An ease-in-out says: this transition is smooth in both directions.

For most UI transitions, `ease-out` is correct. Objects entering the screen carry momentum from outside the viewport; they should decelerate as they arrive. Objects leaving should accelerate (ease-in) — they're departing, gathering speed.

```css
.enter { animation: slideIn 200ms cubic-bezier(0.0, 0.0, 0.2, 1); }
.leave { animation: slideOut 150ms cubic-bezier(0.4, 0.0, 1, 1); }
```

Note the asymmetry: entrances are slightly slower (200ms) and use ease-out; exits are faster (150ms) and use ease-in. Users spend more time watching things arrive than depart. Give them time to orient.

## `prefers-reduced-motion`

Every animation system should respect the operating system's accessibility setting:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is not optional. Some users experience vestibular disorders that make motion literally nauseating. The reduce variant should collapse transitions to instant rather than removing them — state still needs to change, just without the motion.

## Summary

Animation earns its place by communicating orientation, causality, or feedback. Everything else should be cut. When you do animate, match duration to perception (150–250ms for most transitions), match easing to physics (ease-out for entries), and always respect `prefers-reduced-motion`. The goal is an interface where users never consciously notice the animations — only their absence.
