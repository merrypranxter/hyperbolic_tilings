# Shaders — GLSL Fragment Shaders for Hyperbolic Tilings

Each shader is self-contained and targets WebGL (Shadertoy-compatible).
Uniforms: `u_time` (float, seconds), `u_resolution` (vec2, pixels).
Output: `gl_FragColor` (vec4 RGBA).

## Tiling Shaders (mathematically exact {p,q} tilings)

| File | Tiling | Description |
|------|--------|-------------|
| `_poincare_disc_73.frag` | {7,3} | Starter shader (approximate) |
| `_poincare_disc_73_exact.frag` | {7,3} | Exact triangle group (2,3,7) reduction |
| `_pentagonal_lattice_54.frag` | {5,4} | Escher's Circle Limit IV basis |
| `_square_hyperbolic_64.frag` | {6,4} | Hexagons meeting 4 at each vertex |
| `_dual_tiling_37.frag` | {3,7} | Dual of {7,3}: triangles meeting 7 |
| `_apeirogonal_inf3.frag` | {∞,3} | Infinite-sided polygons, horocycles |
| `_quasiregular_64_dual.frag` | {6,4}+{4,6} | Dual pair superimposed |
| `_truncated_tiling_73.frag` | t{7,3} | Truncated {7,3}: 14-gons and triangles |
| `_star_tiling_52.frag` | {5/2} star | Pentagram star polygon pattern |

## Artistic Variant Shaders

| File | Style | Description |
|------|-------|-------------|
| `_escher_birds.frag` | Escher | Bird interlocks with 4-fold color symmetry |
| `_limit_set_glow.frag` | Kleinian | Schottky fractal dust on {7,3} background |
| `_bending_animation.frag` | Animation | Fuchsian → Quasifuchsian deformation |
| `_boundary_zoom.frag` | Animation | Exponential zoom toward the ideal boundary |

## Usage

### Shadertoy

Copy and paste any shader into [shadertoy.com](https://www.shadertoy.com/new).
Replace `u_time` → `iTime`, `u_resolution` → `iResolution.xy`,
and change `void main()` → `void mainImage(out vec4 fragColor, in vec2 fragCoord)`.

### Three.js / WebGL

```javascript
const uniforms = {
  u_time:       { value: 0 },
  u_resolution: { value: new THREE.Vector2(width, height) }
};
// Use the .frag file as the fragment shader source
```

### Local WebGL

Open any WebGL shader editor (e.g. glslCanvas, The Book of Shaders) and paste the code.

## Mathematical Core

All exact shaders implement the **fundamental domain reduction algorithm**:

1. Compute the fundamental triangle for {p,q}: right triangle with angles π/2, π/p, π/q
2. Locate the three geodesic mirrors bounding this triangle
3. For each pixel, iteratively reflect until in the fundamental domain
4. Color based on: (a) tile parity, (b) distance to edges/vertices, (c) hyperbolic depth

The tiling parameters are derived from exact hyperbolic trigonometry:
```
D = 1 - sin²(π/p) - sin²(π/q)      [discriminant, must be > 0]
sinh(OP) = sqrt(D) / sin(π/p)       [leg length from origin to p-vertex]
rP = sinh(OP) / (1 + cosh(OP))      [Euclidean Poincaré-disk radius]
```

See `docs/poincare_disk_model.md` for the full derivation.
