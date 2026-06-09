# hyperbolic_tilings

A creative coding project exploring **hyperbolic tilings** — regular polygonal tessellations of the Poincaré disk and upper half-plane, where the parallel postulate fails and an infinite number of regular polygons meet at each vertex, creating fractal boundary patterns that are mathematically impossible in Euclidean space.

## What Are Hyperbolic Tilings?

In Euclidean geometry, only three regular polygons tile the plane: triangles, squares, and hexagons. In hyperbolic geometry (constant negative curvature), infinitely many regular n-gons tile with k at each vertex for any 1/n + 1/k < 1/2. The {7,3} tiling — seven triangles meeting at each vertex — fills the Poincaré disk with a flower-like pattern that becomes infinitely dense at the boundary.

The Poincaré disk model:
- Points inside the unit circle represent all of hyperbolic space
- Lines are circular arcs perpendicular to the boundary
- Distances near the boundary are exponentially compressed
- "Straight" geodesics appear as curves

## Project Structure

```
shaders/              # GLSL fragment shaders — real-time Poincaré disk renderings
tiling_types/         # {p,q} notation parameter sets: {7,3}, {5,4}, {6,4}, etc.
symmetry_groups/      # Triangle groups, reflection generators, Coxeter notation
orbifolds/            # Quotient spaces, cone points, mirrors, handles
limit_sets/           # Kleinian group limit sets as tiling boundaries
transformations/      # Möbius transformations, isometries, Fuchsian groups
quasifuchsian/        # Deformed tilings, bending, pleated surfaces
artistic_variants/    # Escher-style pattern substitutions, color symmetry
```

## Running

Shaders are written for WebGL/Three.js. Each shader is self-contained — drop it into any fragment shader environment (Shadertoy, The Book of Shaders editor, local Three.js setup). Geometric calculations use exact arithmetic for precision near boundary.

## Current Tiling Families

- [ ] _triangular_flower — {7,3}, the classic "three heptagons" Apollonian-like packing
- [ ] _pentagonal_lattice — {5,4}, Escher's "Circle Limit IV" angel-demon tiling
- [ ] _square_hyperbolic — {6,4}, four hexagons at each vertex, checkerboard potential
- [ ] _dual_tiling — {3,7}, triangles meeting at 7-fold vertices, stellated appearance
- [ ] _apeirogonal — {∞,3}, infinite-sided polygons, horocycle boundaries
- [ ] _quasiregular — alternating polygons, rhombitilings, snub constructions
- [ ] _truncated — cut vertices, Archimedean-style hyperbolic analogs
- [ ] _star_tiling — {5/2,5}, pentagram vertex figures, density > 1 regions

## Artistic Variants

- [ ] _escher_birds — animal interlocks following color symmetry groups
- [ ] _dunham_ornament — Doug Dunham's recursive pattern substitution technique
- [ ] _bending_animation — continuous deformation of Fuchsian → Quasifuchsian
- [ ] _limit_set_glow — Kleinian limit set as luminous boundary dust
- [ ] _hyperbolic_knit — yarn-like texture following geodesic curvature
- [ ] _boundary_zoom — infinite zoom into the infinitely dense circle edge

## Mathematical Properties

- **Area**: finite total area (π for ideal triangles) despite infinite extent
- **Symmetry group**: triangle groups (2,3,7), (2,4,5), etc. with hyperbolic signature
- **Dual tilings**: {p,q} and {q,p} are combinatorial duals
- **Regular maps**: quotient by subgroup yields finite surfaces of genus g ≥ 2
- **Cayley graph**: group generators as tile adjacency graph

## References

- Escher, M. C. (various). *Circle Limit I–IV* — woodcut hyperbolic tilings
- Coxeter, H. S. M. (1979). *Introduction to Geometry*. Wiley.
- Dunham, D. (1986). *Hyperbolic Symmetry*. Computers & Mathematics with Applications.
- Magnus, W. (1974). *Noneuclidean Tesselations and Their Groups*. Academic Press.
- Bourdon, M. (1995). *Structure Conforme au Bord et Flot Géodésique d'un Cat*. Ergodic Theory.
- Series, C. (2015). *The Geometry of Markoff Numbers*. The Mathematical Intelligencer.

---

*The boundary is infinitely far away, yet infinitely close. Every tile is the same size, yet near the edge they shrink forever.*