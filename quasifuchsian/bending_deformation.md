# Quasifuchsian Groups and Bending Deformations

## Overview

A **quasifuchsian group** is a deformation of a Fuchsian group:
- Fuchsian: acts on the hyperbolic plane (limit set = circle S¹)
- Quasifuchsian: acts on hyperbolic 3-space ℍ³ (limit set = quasicircle)

Quasifuchsian groups are the "nearby" Kleinian groups to Fuchsian ones.
They arise by "bending" a hyperbolic surface embedded in ℍ³.

## From Surfaces to Groups

A closed hyperbolic surface S of genus g ≥ 2 can be thought of as:
```
S = ℍ² / Γ
```
where Γ ⊂ PSL(2,ℝ) is a Fuchsian group.

Now embed S in hyperbolic 3-space ℍ³. We can "bend" S along a geodesic lamination:
imagine bending a piece of paper along a crease — the surface stays hyperbolic but
its embedding in 3D changes.

After bending, the group Γ no longer fixes a plane (circle in S²) — instead it fixes
the boundary of a **convex core** with two pleated surfaces as boundary components.

## Teichmüller Space and Quasifuchsian Space

The space of all Fuchsian structures on S is **Teichmüller space** T(S).

The space of all quasifuchsian structures is the **quasifuchsian space** QF(S):
```
QF(S) ⊂ T(S) × T(S̄)
```
(parametrized by the conformal structures on the two boundary components of the convex core)

The **Bers' theorem**: QF(S) is homeomorphic to T(S) × T(S) (Teichmüller space × its mirror).

The Fuchsian locus is a submanifold: F(S) = {(X, X̄) : X ∈ T(S)} ⊂ QF(S).

## The Bending Deformation

Given a Fuchsian group Γ₀, the **bending deformation** along a measured lamination (λ,μ):
1. Start at the Fuchsian locus
2. Move in the direction specified by the bending cocycle
3. The limit set evolves from S¹ to a quasicircle

For small bending angle t:
```
Γ_t ≈ Γ₀ + t · (bending cocycle)
```

The bending cocycle encodes how the hyperbolic plane is being "bent" at each geodesic
of the lamination.

## Limit Set Evolution

As we move through quasifuchsian space:

**t = 0 (Fuchsian)**:
- Limit set = perfect circle S¹
- Group acts on two disks (upper and lower Poincaré disks)
- Both components of Ω = S² \ Λ are simply connected

**t > 0 (Quasifuchsian)**:
- Limit set = Jordan curve (quasicircle, homeomorphic to S¹ but not smooth)
- Hausdorff dimension dim_H(Λ) > 1
- Group still acts on two simply connected domains

**t → ∞ (Boundary of Quasifuchsian Space)**:
- One component of Ω collapses
- Group becomes a **b-group** (degenerate)
- Limit set becomes a dendrite or Sierpinski carpet

## The Weil-Petersson Metric

The **Weil-Petersson metric** on T(S):
```
||μ||²_{WP} = ∫_S |μ(z)|² λ(z)^{-2} dA
```
where λ(z) is the hyperbolic metric and μ is a Beltrami differential (deformation vector).

The bending deformation follows a Weil-Petersson geodesic when the lamination has
unit Weil-Petersson length.

## Visualization in the Shader

The shader `_bending_animation.frag` animates this deformation:

1. **t = 0**: Clean {7,3} tiling — the Fuchsian state
   - Perfect tile edges
   - Circular boundary
   - Blue color palette

2. **t = 0.5**: Quasifuchsian deformation
   - Tile edges wobble (geodesics in 3D bend)
   - Boundary becomes a fractal Jordan curve
   - Amber color palette

3. **t → 1**: Approaching the cusp
   - Strong distortion
   - Limit set accumulates
   - Red-orange palette

The implementation uses a simplified quasiconformal warp that approximates the
Beltrami deformation:
```glsl
// Approximately: apply a quasiconformal map f_t to the disk coordinate
// Then fold the warped coordinate using the undeformed Fuchsian tiling
vec2 z_bent = bendDeform(uv, bend_t);  // quasiconformal warp
vec2 fd     = foldToDomain(z_bent, tri, parity);  // fold the warped point
```

## Mathematical Connections

### Thurston's Bending Theorem

For any measured lamination λ on a hyperbolic surface, there is a unique quasifuchsian
group bent from the Fuchsian structure along λ.

### Holographic Principle

The quasifuchsian group acts on:
- Its limit set (the quasicircle) — the "boundary"
- Its quotient manifold (a hyperbolic 3-manifold) — the "bulk"

This parallels the holographic principle in physics: the 3D bulk is encoded in the
2D boundary conformal field theory.

### Connection to Quantum Gravity

The Teichmüller space parametrizes 2D gravity theories (Liouville field theory).
The Weil-Petersson volumes appear in the computation of string amplitudes.

## References

- Bers, L. (1960). *Simultaneous uniformization*. Bull. Amer. Math. Soc.
- Sullivan, D. (1981). *Quasiconformal homeomorphisms and dynamics I*. Ann. Math.
- Thurston, W.P. (1986). *Hyperbolic structures on 3-manifolds II: Surface groups and 3-manifolds which fiber over the circle*.
- McMullen, C.T., Sullivan, D. (1998). *Quasiconformal homeomorphisms and dynamics III*. Adv. Math.
- Brock, J.F. (2003). *The Weil-Petersson metric and volumes of 3-dimensional hyperbolic convex cores*. J. Amer. Math. Soc.
