# Dunham's Recursive Pattern Substitution for Hyperbolic Tilings

## Overview

Doug Dunham's algorithm (1981) is the foundational technique for generating
computer graphics of Escher-style hyperbolic patterns. It uses recursive pattern
substitution guided by the triangle group structure.

## The Core Idea

Instead of iterating the fold algorithm (which works backward — starting from the screen pixel),
Dunham's algorithm works forward: start from a known tile and recursively generate
all visible tiles within a given view frustum.

### Algorithm Sketch

```python
def render_tiling(view_disk, group_generators):
    visited = {identity}
    queue   = [identity]  # Start with the identity tile
    
    while queue:
        g = queue.pop()
        tile_polygon = apply_group_element(g, fundamental_tile)
        
        if tile_polygon.intersects(view_disk) and tile_polygon.area() > min_pixel_area:
            draw_pattern(tile_polygon, parity(g))
            
            for generator in group_generators:
                neighbor = g * generator
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
```

This generates tiles outward from the center in breadth-first order.

## Pattern Substitution Specifically

Dunham's key contribution: **pattern substitution** allows automatic generation of
interlocking animal patterns without manually designing each tile.

### Step 1: Fundamental Domain Design

Design a motif that fills the fundamental triangle (right triangle with angles π/2, π/p, π/q).
The motif must:
- Touch but not overlap itself at the mirror boundaries
- Have the correct symmetry at the three corner angles

### Step 2: Reflection Rules

When tiling adjacent triangles:
- **x-axis reflection** (across OP): reflect the motif's y-coordinate (flip vertically)
- **y-axis reflection** (across OQ): reflect the motif's x-coordinate (flip horizontally)
- **Arc reflection** (across PQ): apply the inversive map and reflect appropriately

The composition of reflections automatically produces the correct rotations at each vertex.

### Step 3: Color Assignment

Colors are assigned based on parity (or a more complex coloring function):
- Even parity → "light" motif
- Odd parity → "dark" motif
- For k-colorings: use modular arithmetic on the generator word

## Substitution for Different Tilings

### {7,3}: Three Heptagons Pattern

For a 3-coloring (3 colors, one per heptagon at each vertex):
- The 3-fold rotation at the q-vertex cycles through the 3 colors
- The 7-fold rotation at the p-vertex stays within one color class
- Adjacent heptagons always have different colors

### {5,4}: Escher's Angels and Demons

For a 4-coloring (the Escher pattern):
- 4-fold rotation at q-vertex cycles through 4 colors
- Light/dark two-coloring from the arc reflection parity
- Together: 8 distinct tile "types" (4 colors × 2 chiralities)

## The Fish Pattern of Circle Limit I

Circle Limit I uses a {6,4}-inspired pattern but NOT a strict {6,4} tiling —
the fish swim along four families of geodesics:
- Dorsal fin edges on one family
- Tail edges on a perpendicular family

This is actually based on the {6,4} tiling where two fish (head-to-tail) make one hexagonal tile.

## Computational Efficiency

Dunham's original algorithm ran in O(N) time where N is the number of tiles visible.
Each tile is generated exactly once from its parent.

Key optimization: **early termination**. Once a tile is smaller than 1 pixel, all its
descendants are also sub-pixel. The hyperbolic area of a tile is fixed (constant),
but its Euclidean screen area → 0 exponentially near the boundary.

Stopping criterion:
```
if (euclidean_area(tile) < min_area_threshold) continue;
```

In practice, this means the depth of recursion grows logarithmically with resolution.

## Differences from the Fold Algorithm

| Dunham's Forward Algorithm | Fold Algorithm (used in shaders) |
|---------------------------|----------------------------------|
| Forward: generates tiles | Backward: reduces pixels |
| Object-based (tiles as objects) | Pixel-based (per-pixel) |
| CPU-friendly, not parallelizable | GPU-friendly, massively parallel |
| Clean sharp boundaries | AA-friendly via SDF |
| Arbitrary resolution | Limited by MAX_ITER |
| Original Escher algorithm | Modern GPU approach |

The shaders in this project use the fold (backward) algorithm for GPU compatibility.

## Resources and Implementations

- Dunham, D. (1981). Hyperbolic symmetry. *Comput. Math. Appl.* 12B(1-2), 139-153.
- Dunham, D. (1986). Creating hyperbolic Escher patterns. In *M.C. Escher: Art and Science*, 241-247.
- Dunham, D. (2007). A "Circle Limit III" Calculation. *Bridges Proceedings*, 2007.
- Java applet: http://www.d.umn.edu/~ddunham/hyperbolic.html (Dunham's own implementation)
- HyperRogue game (Zeno Rogue, 2012): uses {7,3} tiling with Dunham-style rendering
