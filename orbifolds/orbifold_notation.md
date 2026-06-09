# Orbifold Notation

## What is an Orbifold?

An **orbifold** is a generalization of a manifold that allows isolated singularities
(cone points, reflections, etc.). Orbifolds arise naturally as quotient spaces:

```
Orbifold = (Smooth space) / (Discrete group)
```

For example:
- A sphere / (antipodal map) = projective plane (orbifold with crosscap)
- ℍ² / (triangle group (2,3,7)) = orbifold with three cone points of orders 2, 3, 7

## Thurston's Orbifold Notation

William Thurston developed a concise notation for 2-dimensional orbifolds using
characters: `*`, `×`, `°`, and integers.

### The Characters

| Symbol | Meaning |
|--------|---------|
| Integer `n` | Rotation symmetry of order n (cone point with angle 2π/n) |
| `*` | Mirror (reflection) |
| `×` | Crosscap (orientation-reversing) |
| `°` | Handle (genus) |

### How to Read the Notation

A 2D orbifold is specified as:
```
[handles][crosscaps][rotations]∗[mirror-order list]
```

Examples:
- `*237` — one mirror, with cone points of orders 2, 3, 7 inside the mirror
- `237` — no mirror, rotation points of orders 2, 3, 7 (chiral)
- `*333` — equilateral triangle orbifold (Euclidean flat!)
- `*246` — triangle orbifold for {6,4} tilings
- `*632` — hexagonal lattice (Euclidean)

### The 17 Euclidean Wallpaper Groups

The 17 wallpaper groups in orbifold notation:

| Orbifold | Name | χ |
|----------|------|---|
| `○` | p1 | 0 |
| `××` | pg | 0 |
| `*×` | pm | 0 |
| `**` | pm | 0 |
| `2222` | p2 | 0 |
| `22×` | pgg | 0 |
| `22*` | pmm | 0 |
| `2*22` | pmm | 0 |
| `*2222` | p2mm | 0 |
| `442` | p4 | 0 |
| `4*2` | p4m | 0 |
| `*442` | p4m | 0 |
| `44` | p4 | 0 |
| `333` | p3 | 0 |
| `*333` | p3m1 | 0 |
| `3*3` | p31m | 0 |
| `632` | p6 | 0 |
| `*632` | p6m | 0 |

All have Euler characteristic χ = 0 (Euclidean).

### Hyperbolic Orbifolds (χ < 0)

Any orbifold with `χ < 0` is hyperbolic:

| Orbifold | Triangle Group | Tiling | χ |
|----------|---------------|--------|---|
| `*237`   | (2,3,7)       | {7,3},{3,7} | -1/42 |
| `*245`   | (2,4,5)       | {5,4},{4,5} | -1/20 |
| `*246`   | (2,4,6)       | {6,4},{4,6} | -1/12 |
| `*248`   | (2,4,8)       | {8,4},{4,8} | -1/8 |
| `*23∞`   | (2,3,∞)       | {∞,3}  | -1/6 |

## Euler Characteristic of an Orbifold

The orbifold Euler characteristic:

```
χ(orbifold) = χ(underlying surface) - Σ(cone points)(1 - 1/n_i) - Σ(mirror orders)(1/2 - 1/2m_j)
```

For a mirror orbifold `*abc`:
```
χ(*abc) = 2 - 1 - (1 - 1/a) - (1 - 1/b) - (1 - 1/c)
         = 1/a + 1/b + 1/c - 1
```

Wait, more carefully: the underlying surface is a disk (boundary = the mirror), χ(disk) = 1.
```
χ(*abc) = 1 - (1 - 1/a) - (1 - 1/b) - (1 - 1/c)
         = 1/a + 1/b + 1/c - 2
```

For `*237`: χ = 1/2 + 1/3 + 1/7 - 2 = (21 + 14 + 6 - 84)/42 = -43/42... hmm.

Let me recount. The formula for the orbifold with mirror boundary and interior cone points:

```
χ(boundary orbifold with one mirror, cone points a,b,c on mirror) = (1/2)(1/a + 1/b + 1/c) - 1/2
```

Actually, the simplest formula: for the (l,m,n) triangle group orbifold:
```
χ = 1/l + 1/m + 1/n - 1
```

For `*237` = (2,3,7): χ = 1/2 + 1/3 + 1/7 - 1 = (21+14+6-42)/42 = -1/42 ✓

## Relationship to Tilings

Each {p,q} tiling corresponds to a specific orbifold:

The orbifold `*2pq` is the fundamental domain for the (2,p,q) triangle group,
which generates the {p,q} tiling. The orbifold has:
- Underlying topology: disk (one mirror boundary)
- Three corner cone points: orders 2, p, q
- No interior cone points

A **torsion-free** index-N subgroup of the triangle group corresponds to:
- A tiling with N fundamental triangles per period
- An N-sheeted cover of the orbifold
- A closed hyperbolic surface (if genus ≥ 2)

## Cone Points and the Fundamental Triangle

In the Poincaré disk realization:
- The **2-fold cone point** (right angle) lies at the midpoint of each {p,q} edge
- The **p-fold cone point** lies at the center of each p-gon
- The **q-fold cone point** lies at each vertex where q tiles meet

Each "cone" allows only an angle of 2π/n instead of the full 2π neighborhood,
which is why these are "cone" points — the space looks like an ice cream cone.

## References

- Thurston, W.P. (1997). *The Geometry and Topology of Three-Manifolds*, Ch. 13.
  (Available online: https://library.msri.org/books/gt3m/)
- Conway, J.H. (1992). *The Orbifold Notation for Surface Groups*. LMS Lecture Notes 165.
- Baldridge, S., Kirk, P. (2007). *A geometric approach to homology theory*. Cambridge University Press.
