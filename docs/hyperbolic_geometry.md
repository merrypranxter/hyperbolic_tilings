# Hyperbolic Geometry: An Introduction

## What Is Hyperbolic Geometry?

Hyperbolic geometry is a non-Euclidean geometry where Euclid's parallel postulate fails.
Instead of exactly one parallel through a point to a given line, there are *infinitely many*.
The geometry has constant negative Gaussian curvature K = -1.

## The Five Postulates — and One That Breaks

Euclid's parallel postulate (5th postulate) states: *given a line L and a point P not on L,
exactly one line through P is parallel to L.*

In hyperbolic geometry, there are infinitely many such parallels. This single change
cascades into a radically different geometry:

- The sum of angles in any triangle is **less than** π
- Similar triangles must be congruent (no scaling without distortion)
- Area is proportional to angular defect: A = π - (α + β + γ)
- Regular {p,q} tilings exist for infinitely many (p,q) with 1/p + 1/q < 1/2

## The Poincaré Disk Model

The Poincaré disk is a *model* of the hyperbolic plane: all of infinite hyperbolic space
is represented inside the unit disk. Points on the boundary circle are at infinite distance.

### Metric

The Poincaré metric is conformal (angle-preserving):

```
ds² = 4(dx² + dy²) / (1 - x² - y²)²
```

The conformal factor `4/(1-r²)²` grows to infinity as r → 1.
A small Euclidean disk near the boundary represents much more hyperbolic space than
the same disk near the center.

### Geodesics

Geodesics (shortest paths) in the Poincaré disk appear as:
- **Diameters** of the unit disk (straight lines through the center)
- **Circular arcs** perpendicular to the unit circle boundary

All geodesics in both cases end at the boundary circle (the *absolute* or *ideal boundary*).

### Distances

The hyperbolic distance from the origin to a point at Euclidean radius r is:
```
d(0, r) = 2 atanh(r) = log((1+r)/(1-r))
```

This grows logarithmically: to reach r = 0.9, 0.99, 0.999 requires hyperbolic distances
of about 2.2, 4.6, 6.9 — an exponential compression of space.

Between two arbitrary points z₁, z₂:
```
d(z₁, z₂) = 2 atanh |z₁ - z₂| / |1 - z̄₁z₂|
```

## Tilings

A regular tiling {p,q} tiles the hyperbolic plane with regular p-gons, q meeting at each vertex.

The condition for hyperbolicity: `1/p + 1/q < 1/2`

Compare:
| Geometry | Condition | Examples |
|----------|-----------|---------|
| Spherical | 1/p + 1/q > 1/2 | {3,3},{3,4},{3,5},{4,3},{5,3} (Platonic solids) |
| Euclidean | 1/p + 1/q = 1/2 | {3,6},{4,4},{6,3} (flat tilings) |
| Hyperbolic | 1/p + 1/q < 1/2 | {5,4},{7,3},{3,7},… (infinitely many) |

### Area Formula

The area of a hyperbolic regular p-gon with q meeting at each vertex:
```
A = (p - 2)π - p · (2π/q) = π(p(1 - 2/q) - 2)
```

Example: {7,3} heptagon: A = π(7(1 - 2/3) - 2) = π(7/3 - 2) = π/3

The total area of the hyperbolic plane is infinite, yet each tile has finite area.

## The Ideal Boundary

The boundary circle of the Poincaré disk is the *ideal boundary* ∂ℍ² = S¹.
Points on this circle are not in the hyperbolic plane itself — they are at infinite distance.

- **Ideal points** (or *ideal vertices*, *points at infinity*): points on ∂ℍ²
- **Ideal triangle**: triangle with all three vertices on ∂ℍ²; has finite area = π
- **Ideal polygon**: polygon with all vertices on ∂ℍ²; unbounded in hyperbolic sense

As you approach the boundary, tile sizes appear to shrink (in Euclidean screen space),
but in hyperbolic space, all tiles are the same size.

## Curvature

Hyperbolic geometry has constant Gaussian curvature K = -1 (in the normalized model).
The Gauss-Bonnet theorem applies:

For a compact surface S without boundary:
```
∫_S K dA = 2πχ(S)
```

where χ(S) is the Euler characteristic. For K = -1:
```
Area(S) = -2πχ(S) = 2π(2g - 2)
```

for a closed surface of genus g ≥ 2. This means every closed hyperbolic surface has genus ≥ 2.

## References

- Cannon, J.W., Floyd, W.J., Kenyon, R., Parry, W.R. (1997). *Hyperbolic Geometry*. MSRI Publications 31.
- Thurston, W.P. (1997). *Three-Dimensional Geometry and Topology*. Princeton University Press.
- Anderson, J.W. (2005). *Hyperbolic Geometry* (2nd ed.). Springer Undergraduate Mathematics Series.
- Ratcliffe, J.G. (2006). *Foundations of Hyperbolic Manifolds* (2nd ed.). Springer.
