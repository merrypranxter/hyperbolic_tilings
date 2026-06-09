# Poincaré Disk Model: Implementation Guide

## Overview

The Poincaré disk model represents the entire hyperbolic plane as the interior of a unit disk.
This document explains how to implement hyperbolic tiling shaders using this model.

## Core Data Structures

### Points
A point in the Poincaré disk is a 2D vector with `|z| < 1`.
The boundary `|z| = 1` is the ideal boundary at infinity.

```glsl
// A valid hyperbolic point
vec2 z = vec2(0.3, 0.4);  // |z| = 0.5 < 1 ✓

// Check if inside disk
bool inDisk = length(z) < 1.0;
```

### Fundamental Triangle
For the {p,q} tiling with triangle group (2,p,q):

```glsl
// Right triangle: angles π/2 (at origin), π/p (at P), π/q (at Q)
// P on x-axis, Q on y-axis

float sp = sin(PI / p), sq = sin(PI / q);
float D  = 1.0 - sp*sp - sq*sq;  // must be > 0 for hyperbolic
float sa = sqrt(D) / sp;          // sinh(|OP|) = sqrt(D)/sin(π/p)
float sb = sqrt(D) / sq;          // sinh(|OQ|) = sqrt(D)/sin(π/q)

// Convert hyperbolic distance to Euclidean Poincaré radius:
// r = tanh(d/2) = sinh(d)/(1+cosh(d))
float rP = sa / (1.0 + sqrt(1.0 + sa*sa));  // x-coordinate of P
float rQ = sb / (1.0 + sqrt(1.0 + sb*sb));  // y-coordinate of Q

// Geodesic arc connecting P and Q (perpendicular to unit circle):
// Center: (acx, acy) where acx = (1+rP²)/(2rP), acy = (1+rQ²)/(2rQ)
// Radius²: aR2 = acx²+acy²-1
float acx = (1.0 + rP*rP) / (2.0 * rP);
float acy = (1.0 + rQ*rQ) / (2.0 * rQ);
float aR2 = acx*acx + acy*acy - 1.0;
```

## The Folding Algorithm

The key operation is folding any point in the disk into the fundamental domain via reflections.

```glsl
// Three reflections:
// 1. Across x-axis (y < 0 → flip y)
// 2. Across y-axis (x < 0 → flip x)
// 3. Across the arc geodesic (inside the arc circle → invert)

vec2 fold(vec2 z, float acx, float acy, float aR2, out int tile_parity) {
    tile_parity = 0;
    for (int i = 0; i < 64; i++) {
        bool changed = false;
        
        if (z.y < 0.0) {
            z.y = -z.y;
            changed = true;
            // Note: y-flip does NOT change tile parity
        }
        if (z.x < 0.0) {
            z.x = -z.x;
            changed = true;
            // Note: x-flip does NOT change tile parity
        }
        
        vec2 dv = z - vec2(acx, acy);
        float d2 = dot(dv, dv);
        if (d2 < aR2 - 1e-9) {
            // Inversion through the arc circle
            z = vec2(acx, acy) + (aR2 / d2) * dv;
            tile_parity ^= 1;  // crossing an edge flips tile parity
            changed = true;
        }
        
        if (!changed) break;
    }
    return z;
}
```

## Key Mathematical Derivation

### Why Does This Work?

The three geodesics bound the fundamental triangle. The (2,p,q) triangle group is generated
exactly by reflections across these three geodesics. By iteratively reflecting a point,
we "cancel out" all the group operations and arrive at the unique representative of
the orbit in the fundamental domain.

### Convergence

Each reflection strictly decreases the hyperbolic distance to the fundamental domain,
so the algorithm converges. For practical shaders, 32–64 iterations is sufficient
for any visible pixel.

### Tile Parity

- Reflections across x-axis or y-axis: preserve tile membership (these are "interior" symmetries)
- Reflection across the arc: crosses a tile boundary → flips parity

So `tile_parity` tracks whether we crossed an even or odd number of tile boundaries.
Two adjacent tiles always have opposite parities.

## Computing Distances and Drawing Features

### Distance to Edge (Arc)

```glsl
// After folding to z_fd:
float d_to_arc = abs(length(z_fd - vec2(acx, acy)) - sqrt(aR2));
// Draw edge: smoothstep(0.0, edge_width, d_to_arc)
```

### Distance to p-Vertex (Heptagon Center)

```glsl
float d_to_p = length(z_fd - vec2(rP, 0.0));
```

### Distance to q-Vertex (Where q Tiles Meet)

```glsl
float d_to_q = length(z_fd - vec2(0.0, rQ));
```

### Hyperbolic Distance from Origin

```glsl
float r = clamp(length(z), 0.0, 0.9999999);
float hd = log((1.0 + r) / (1.0 - r));  // = 2 atanh(r)
```

## Möbius Transformations for Animation

A Möbius transformation of the disk (disk isometry):
```glsl
// Translation: moves point a to the origin
// f(z) = (z - a) / (1 - ā·z)
vec2 diskTranslate(vec2 z, vec2 a) {
    vec2 num   = z - a;
    vec2 denom = vec2(1.0, 0.0) - vec2(a.x*z.x + a.y*z.y, a.y*z.x - a.x*z.y);
    float d2   = dot(denom, denom);
    return vec2(dot(num, denom), num.y*denom.x - num.x*denom.y) / d2;
}
```

For animation, slowly animate `a` in a circle:
```glsl
vec2 a = 0.15 * vec2(cos(u_time * 0.05), sin(u_time * 0.05));
vec2 z = diskTranslate(uv, a);
// Now fold z into the fundamental domain...
```

## Performance Notes

- Increase `MAX_ITER` (64→128) for higher precision near the boundary
- Near the boundary (r > 0.95), tiles are very small — many more reflections needed
- For real-time: 64 iterations is a good balance (≈1ms on modern GPU per pixel)
- The algorithm is perfectly parallelizable (each pixel is independent)
- Conformal rendering is exact — no need for antialiasing the tile boundaries themselves

## Edge Cases

1. **Exactly on an edge**: `d2 ≈ aR2`, the reflection is degenerate — use tolerance `1e-9`
2. **At the origin**: `z = (0,0)` is always in the fundamental domain
3. **Near the boundary** (`r > 0.9999`): clamp to avoid numerical overflow

## Example: {7,3} Parameters

```
p=7, q=3
sp = sin(π/7) ≈ 0.4339
sq = sin(π/3) = √3/2 ≈ 0.8660
D  ≈ 0.0617
sa ≈ 0.5727  → rP ≈ 0.2661
sb ≈ 0.2866  → rQ ≈ 0.1410
acx ≈ 2.0124, acy ≈ 3.6180, aR2 ≈ 16.128
```
