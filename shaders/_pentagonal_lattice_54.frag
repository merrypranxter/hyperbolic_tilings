// _pentagonal_lattice_54.frag
// Hyperbolic tiling {5,4}: pentagons meeting four at each vertex
// Triangle group (2,5,4) — Escher's Circle Limit IV inspiration
//
// The {5,4} tiling underlies Escher's famous "Angels and Demons" woodcut.
// Five-fold pentagons tile the disk with four pentagons touching at every vertex.
// The symmetry group (2,4,5) generates the tiling via three reflections.
//
// Mathematical notes:
//   Fundamental triangle angles: π/2, π/5, π/4
//   D = 1 - sin²(π/5) - sin²(π/4) = 1 - sin²36° - sin²45°
//     = 1 - 0.3455 - 0.5000 = 0.1545   [> 0, confirming hyperbolic]
//   Area of each pentagon: π(5 - 2 - 5·(2/4)) = π(3 - 2.5) = π/2
//   The {5,4} and {4,5} tilings are combinatorial duals.

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI     = 3.14159265358979323846;
const float TWO_PI = 6.28318530717958647692;
const int   MAX_ITER = 64;

// ── fundamental domain ──────────────────────────────────────────────────────
struct FundTri {
    float rP; float rQ;
    float acx; float acy; float aR2;
};

FundTri makeFundTri(float p, float q) {
    float sp = sin(PI / p), sq = sin(PI / q);
    float D  = max(1.0 - sp*sp - sq*sq, 1e-10);
    float sqD = sqrt(D);
    float sa = sqD / sp, sb = sqD / sq;
    float ca = sqrt(1.0 + sa*sa), cb = sqrt(1.0 + sb*sb);
    float rP = sa / (1.0 + ca), rQ = sb / (1.0 + cb);
    float acx = (1.0 + rP*rP) / (2.0 * rP);
    float acy = (1.0 + rQ*rQ) / (2.0 * rQ);
    return FundTri(rP, rQ, acx, acy, acx*acx + acy*acy - 1.0);
}

vec2 foldToDomain(vec2 z, FundTri tri, out int tile_parity) {
    tile_parity = 0;
    for (int i = 0; i < MAX_ITER; i++) {
        bool ch = false;
        if (z.y < 0.0) { z.y = -z.y; ch = true; }
        if (z.x < 0.0) { z.x = -z.x; ch = true; }
        vec2 dv = z - vec2(tri.acx, tri.acy);
        float d2 = dot(dv, dv);
        if (d2 < tri.aR2 - 1e-9) {
            z = vec2(tri.acx, tri.acy) + (tri.aR2 / d2) * dv;
            tile_parity ^= 1; ch = true;
        }
        if (!ch) break;
    }
    return z;
}

float hypDistFromOrigin(vec2 z) {
    float r = clamp(length(z), 0.0, 1.0 - 1e-7);
    return log((1.0 + r) / (1.0 - r));
}

// ── Escher-style color: map tile to one of four "wing" colors ───────────────
// Escher's Circle Limit IV uses two interlocking figures in a 4-coloring.
// We approximate with a 4-color scheme based on tile position.
vec3 escherColor(int parity, vec2 fd, float rP) {
    // Determine "quadrant" of fold path for 4-coloring
    // Use the fold signature to get 4 states (parity + position phase)
    float ang = atan(fd.y, fd.x);
    int quad = int(mod(floor(ang / (PI * 0.5)) + 4.0, 4.0));

    // Angel (light) / Demon (dark) alternation following {5,4} symmetry
    if (parity == 0) {
        // Light figure (angel)
        if (quad == 0) return vec3(0.88, 0.82, 0.72);   // warm ivory
        if (quad == 1) return vec3(0.82, 0.88, 0.75);   // pale sage
        if (quad == 2) return vec3(0.86, 0.80, 0.72);   // ivory gold
                       return vec3(0.78, 0.84, 0.88);   // pale blue
    } else {
        // Dark figure (demon)
        if (quad == 0) return vec3(0.15, 0.08, 0.04);   // deep brown
        if (quad == 1) return vec3(0.05, 0.12, 0.05);   // deep forest
        if (quad == 2) return vec3(0.10, 0.06, 0.15);   // deep indigo
                       return vec3(0.12, 0.10, 0.05);   // dark ochre
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
              / min(u_resolution.x, u_resolution.y);

    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.02, 0.01, 0.03, 1.0); return; }

    // {5,4}: pentagons, 4 per vertex
    FundTri tri = makeFundTri(5.0, 4.0);

    // Slow rotation of the entire disk (hyperbolic isometry)
    float a    = u_time * 0.04;
    float c    = cos(a), s = sin(a);
    vec2  z    = vec2(c*uv.x - s*uv.y, s*uv.x + c*uv.y);

    int   parity;
    vec2  fd = foldToDomain(z, tri, parity);

    float hd         = hypDistFromOrigin(z);
    float depth      = clamp(1.0 - hd / 4.5, 0.0, 1.0);
    float d_arc      = abs(length(fd - vec2(tri.acx, tri.acy)) - sqrt(tri.aR2));
    float d_pvert    = length(fd - vec2(tri.rP, 0.0));
    float d_qvert    = length(fd - vec2(0.0, tri.rQ));

    // Base tile color (Escher-inspired)
    vec3 base = escherColor(parity, fd, tri.rP);
    base *= (0.55 + 0.45 * depth);

    // Pentagon center radial shading
    float tile_fade = smoothstep(0.0, tri.rP * 0.9, d_pvert);
    base = mix(base * 1.3, base * 0.85, tile_fade);

    // {5,4} tiling edges
    float ew   = 0.007 + 0.004 * depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    base = mix(base, vec3(0.95, 0.90, 0.80) * depth, edge * 0.9);

    // Sub-lines
    float sx = 1.0 - smoothstep(0.0, 0.003, fd.y);
    float sy = 1.0 - smoothstep(0.0, 0.003, fd.x);
    base = mix(base, vec3(0.6, 0.55, 0.45) * depth * 0.7, (sx+sy) * 0.25);

    // Vertex: 4-fold star (where 4 pentagons meet)
    float vq = 1.0 - smoothstep(0.0, 0.016, d_qvert);
    base = mix(base, vec3(1.0, 0.95, 0.6), vq * 0.9);

    // Boundary glow (warm amber)
    float glow = exp(-(1.0 - r) * 15.0) * 0.7;
    base += vec3(0.5, 0.25, 0.05) * glow;
    base *= 1.0 - 0.12 * r * r;

    gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}
