# Kleinian Group Limit Sets

## Overview

A Kleinian group Γ ⊂ PSL(2,ℂ) acts on the Riemann sphere.
Its **limit set** Λ(Γ) is the closure of the set of all limit points of orbits:

```
Λ(Γ) = closure{ accumulation points of Γ·z : z ∈ ℂ ∪ {∞} }
```

The limit set is a Γ-invariant closed set, and it's the "boundary" where the group's action
becomes non-discontinuous. In the Poincaré disk, the limit set lives on the boundary circle.

## Types of Limit Sets

### Circle (Fuchsian)

A Fuchsian group has Λ = S¹ (the unit circle). The tiling fills the interior disk.
The limit set is the entire boundary — every point is an accumulation point.

### Cantor Set (Schottky Group)

A Schottky group with 2+ generators has a Cantor-set limit set.
It looks like fractal dust sprinkled on the boundary circle.
Hausdorff dimension δ ∈ (0,1).

**Construction**: Start with the interval [0,1]. Remove the middle thirds of each interval
repeatedly. The Schottky group's limit set is an analogous process on circles.

### Jordan Curve (Quasifuchsian)

A quasifuchsian group has a limit set that is a topological circle (Jordan curve)
but not smooth — it's a fractal curve, the **quasicircle**.
Hausdorff dimension δ ∈ (1,2).

The quasicircle is the image of the unit circle under a quasiconformal map.
It bounds two "sides" — one topologically inside, one outside.

### Fractal Dust (General Kleinian)

For more general Kleinian groups, the limit set can be anything from a Cantor set
to the entire sphere. For Kleinian groups near the boundary of quasifuchsian space,
the limit set approaches a space-filling curve (dimension → 2).

## The Schottky Construction

Given:
1. Two pairs of disjoint Jordan curves (usually circles): C₁, C₁', C₂, C₂'
2. Möbius transformations: g₁ maps ext(C₁) → int(C₁'), g₂ maps ext(C₂) → int(C₂')

The group Γ = ⟨g₁, g₂⟩ is a **Schottky group** (free group of rank 2).

The limit set is:
```
Λ = ∩_{n≥1} [g₁^{±1}(C₁∪C₁') ∪ g₂^{±1}(C₂∪C₂') ∪ ... (n iterations)]
```

Each iteration produces smaller circles inside the original ones, filling the gaps
with more circles. The limit is a Cantor set.

## Rendering the Limit Set

### IFS (Iterated Function System) Method

```glsl
// For each pixel z:
// Count iterations until z "escapes" or converges
float limitSetDepth(vec2 z, ...) {
    float depth = 0.0;
    for (int i = 0; i < MAX_ITER; i++) {
        float d1 = length(z - c1), d2 = length(z - c2);
        if (d1 < r1) {
            z = c1 + r1*r1/dot(z-c1,z-c1) * (z-c1);  // invert through C1
            depth += weight;
        } else if (d2 < r2) {
            z = c2 + r2*r2/dot(z-c2,z-c2) * (z-c2);  // invert through C2
            depth += weight;
        } else break;
    }
    return depth;
}
```

The `depth` gives a measure of how deep z is in the Cantor set — used for coloring.

### Escaped Points

Points that don't converge (and don't fall into any circle) are in the **discontinuity region**.
These are colored with the background tiling.

Points that do converge are in (or near) the limit set — colored bright.

## Hausdorff Dimension

The Hausdorff dimension δ of the limit set depends on the group's geometry:

- Fuchsian (circle): δ = 1
- Quasifuchsian (quasicircle): 1 < δ < 2
- General Kleinian: 0 ≤ δ ≤ 2

For Schottky groups, the dimension can be computed from the spectral radius of a
transfer operator. For "thin" groups (small radius circles), δ ≈ 0. For "fat" groups
(large circles, nearly touching), δ → 2.

**Critical exponent**: The exponent δ equals the exponent of convergence of the Poincaré series:
```
P(s) = Σ_{g ∈ Γ} e^{-s·d(0, g·0)}
```
The series converges for s > δ and diverges for s < δ.

## The Sullivan Dictionary

Patterson-Sullivan theory connects:

| Group Theory | Ergodic Theory | Geometry |
|-------------|----------------|---------|
| Limit set Λ | Boundary of hyperbolic space | Fractal |
| Hausdorff dimension δ | Critical exponent | "Size" of group |
| Patterson measure on Λ | Harmonic measure | Equilibrium measure |
| Recurrence | Divergent Poincaré series | "Big" group |

## Connection to the {7,3} Tiling

The {7,3} tiling group is a Fuchsian group. Its limit set is ALL of the boundary circle.
Every point on S¹ is an accumulation point of the orbit of the origin.

This is why the boundary of the Poincaré disk looks "dense" with tiles — the tiles
accumulate everywhere on the boundary.

For the Schottky group example in `_limit_set_glow.frag`:
- The limit set is a Cantor set on the boundary circle
- It glows brightly as fractal dust
- The {7,3} tiling is shown in the background (the Fuchsian regime)
- The contrast shows the difference: full boundary (Fuchsian) vs. Cantor set (Schottky)

## References

- Sullivan, D. (1984). *Entropy, Hausdorff measures old and new, and limit sets of geometrically finite Kleinian groups*. Acta Mathematica.
- Patterson, S.J. (1976). *The limit set of a Fuchsian group*. Acta Mathematica.
- McMullen, C.T. (1998). *Hausdorff dimension and conformal dynamics III: Computation of dimension*. American Journal of Mathematics.
- Mumford, D., Series, C., Wright, D. (2002). *Indra's Pearls: The Vision of Felix Klein*. Cambridge University Press.
