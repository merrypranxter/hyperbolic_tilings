# Escher-Style Color Symmetry in Hyperbolic Tilings

## M.C. Escher and Hyperbolic Geometry

M.C. Escher encountered hyperbolic tilings through the work of H.S.M. Coxeter.
In 1954, Coxeter showed Escher a diagram of a hyperbolic tiling at the International
Congress of Mathematicians, and Escher was immediately captivated.

Between 1958 and 1960, Escher produced four woodcuts in his "Circle Limit" series:
- **Circle Limit I** (1958): fish pattern, {6,4} inspired
- **Circle Limit II** (1959): crosses pattern
- **Circle Limit III** (1959): fish swimming along geodesics (not quite regular {p,q})
- **Circle Limit IV** (1960): Angels and Demons, {5,4} symmetry

Escher described Circle Limit IV as his most successful:
*"No single component of all the series of white animals...
has ever been used as such outside of the decorative use..."*

## Color Symmetry

A **color symmetry** is a symmetry of the tiling that permutes the colors of a
multi-colored pattern. If we have k colors, a color symmetry is an automorphism
of the tiling that acts as a permutation of {1,...,k}.

### Example: Two-Coloring of {5,4}

In Circle Limit IV, angels and demons form a two-coloring:
- Light: angels (wings up)
- Dark: demons (wings out)

The two-coloring is preserved by the orientation-preserving subgroup of (2,4,5).
Any rotation or translation maps angels to angels and demons to demons.
The *reflections* (odd elements) swap angels and demons.

### Four-Coloring

The {5,4} tiling supports a four-coloring (since q=4 at each vertex, 4 tiles meet).
A rotation of order 4 around each vertex cycles through the 4 colors.

In the shader `_escher_birds.frag`, we implement a 4-coloring by:
1. Computing the tile parity (even/odd) from arc reflections
2. Computing the "species" (0-3) from the angle around the q-vertex
3. Looking up the species-specific color palette

## Dunham's Technique

Douglas Dunham (University of Minnesota Duluth) developed the first computer algorithm
for generating Escher-style hyperbolic patterns in 1981.

### The Algorithm

1. **Design pattern in fundamental domain**: Draw a motif that fills the fundamental triangle
2. **Designate "colors"**: Assign each motif to a color (species/type)
3. **Map to group operations**: Each color transformation corresponds to a group element
4. **Tile the disk**: Apply group operations to fill the Poincaré disk
5. **Boundary handling**: Near the boundary, patterns become too small to render — clip

The key insight: if the motif in the fundamental domain tiles correctly with its mirror images,
then the full group action automatically produces a valid tiling pattern.

### Pattern Design Rules

For a valid Escher-style {p,q} pattern:
1. The motif must fill the p-gon (the fundamental tile)
2. Adjacent tiles (sharing an edge) should have contrasting colors
3. The motif should have q-fold symmetry at each tiling vertex
4. The motif should have 2-fold symmetry at edge midpoints (if using full group)

### Implementation in Shader

```glsl
// Pattern map: maps fundamental domain coordinates to pattern value
// Returns: (color_index, feature_type)
// feature_type: 0=background, 1=wing, 2=body, 3=head, 4=beak

vec2 patternMap(vec2 fd, FundTri tri) {
    // Distance from p-vertex (bird's head is near p-vertex)
    float d_head = length(fd - vec2(tri.rP * 0.85, tri.rQ * 0.08));
    // ... etc.
}
```

## Color Symmetry Groups

The mathematical theory of color symmetry extends the crystallographic groups:

A **perfect k-coloring** is a coloring where:
- There are k colors
- Every symmetry of the tiling maps each color to another specific color
- The map from symmetries to color permutations is a group homomorphism

For the {7,3} tiling with the group G = (2,3,7):
- A **2-coloring** corresponds to a subgroup of index 2 (orientation-preserving)
- A **7-coloring** corresponds to an index-7 subgroup related to the rotation subgroup
- A **3-coloring** corresponds to an index-3 subgroup (if it exists)

## Technical Implementation

### The Dunham Pattern Substitution

The most faithful Escher reproduction uses **pattern substitution**:
1. Start with a template motif in the fundamental domain
2. At each group iteration, apply the corresponding rigid motion
3. Color the motif based on the word length (parity) in the generators

In GLSL, this is exactly the fold algorithm:
- Count arc reflections (= word length in the tile boundary generator)
- Apply modular arithmetic to determine the "color label"

### Anti-Aliasing Near the Boundary

The hardest challenge for Escher-style shaders: near the boundary, tiles become very
small (smaller than a pixel). Options:

1. **Pixel clamping**: don't render below a minimum tile size
2. **Mip-mapping**: pre-compute lower-resolution patterns
3. **Adaptive sampling**: more samples per pixel near the boundary
4. **SDF-based rendering**: render edges as signed distance fields (always sharp)

The shaders in this project use option (1) + implicit SDF-based edge rendering.

## References

- Dunham, D. (1981). *Hyperbolic Symmetry*. Computers & Mathematics with Applications.
- Dunham, D. (2003). *More "Circle Limit III" Patterns*. Proc. Bridges 2003.
- Escher, M.C. (1971). *M.C. Escher: His Life and Complete Graphic Work*. Harry N. Abrams.
- Coxeter, H.S.M. (1979). *The non-Euclidean symmetry of Escher's picture 'Circle Limit III'*.
  Leonardo 12(1), 19-25.
- Rigby, J.F. (1998). *Escher's Circle Limit III: The Mathematical Structure*. Math. Intelligencer.
