// _poincare_disc_73_exact.frag
// Hyperbolic tiling {7,3}: heptagons meeting three at each vertex
// Poincaré disk model — exact computation via triangle group (2,7,3)
//
// The {7,3} tiling is the most celebrated hyperbolic tiling.
// Seven heptagons surround each vertex. The triangle group (2,3,7) generates
// all symmetries by reflections across three geodesic mirrors.
//
// Mathematical basis:
//   Fundamental domain: right hyperbolic triangle with angles π/2, π/7, π/3
//   The three mirror geodesics bound this triangle.
//   Iterative reflection reduces any disk point into the fundamental domain.
//   Parity of arc-reflections gives the two-coloring of heptagons.

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

// ── constants ──────────────────────────────────────────────────────────────
const float PI      = 3.14159265358979323846;
const float TWO_PI  = 6.28318530717958647692;
const int   MAX_ITER = 64;

// ── hyperbolic helpers ──────────────────────────────────────────────────────

// Euclidean distance² (avoids sqrt)
float dist2(vec2 a, vec2 b) { vec2 d = a - b; return dot(d, d); }

// Hyperbolic distance in Poincaré disk: d_h(z1,z2)
float hypDist(vec2 z1, vec2 z2) {
    float num = length(z1 - z2);
    vec2  denom_vec = vec2(1.0, 0.0) -
        vec2(z1.x*z2.x + z1.y*z2.y,  z1.y*z2.x - z1.x*z2.y);
    float den = length(denom_vec);
    if (den < 1e-9) return 100.0;
    float r = num / den;
    r = clamp(r, 0.0, 1.0 - 1e-7);
    return log((1.0 + r) / (1.0 - r));   // = 2 atanh(r)
}

// Hyperbolic distance from origin to point z (simpler form)
float hypDistFromOrigin(vec2 z) {
    float r = length(z);
    r = clamp(r, 0.0, 1.0 - 1e-7);
    return log((1.0 + r) / (1.0 - r));   // 2 atanh(|z|)
}

// Inversive reflection across circle (center c, radius² R2)
vec2 invertCircle(vec2 z, vec2 c, float R2) {
    vec2 d = z - c;
    return c + R2 / dot(d, d) * d;
}

// ── fundamental domain for {p,q} — compute from p,q ────────────────────────
// Right-angle vertex at origin; p-vertex at (rP,0); q-vertex at (0,rQ).
// Third side: geodesic arc with Euclidean center (acx,acy), radius² aR2.
//
// Derivation (hyperbolic law of sines for right triangle):
//   D = 1 - sin²(π/p) - sin²(π/q)     [> 0 iff hyperbolic]
//   sinh(OP) = sqrt(D) / sin(π/p)      OP = hyperbolic length of x-axis leg
//   sinh(OQ) = sqrt(D) / sin(π/q)      OQ = hyperbolic length of y-axis leg
//   rP = tanh(OP/2) = sinh(OP)/(1+cosh(OP))
//   rQ = tanh(OQ/2)
//   arc center: acx = (1+rP²)/(2 rP),  acy = (1+rQ²)/(2 rQ)

struct FundTri {
    float rP;   // Euclidean x of p-vertex
    float rQ;   // Euclidean y of q-vertex
    float acx;  // arc center x
    float acy;  // arc center y
    float aR2;  // arc radius²
};

FundTri makeFundTri(float p, float q) {
    float sp = sin(PI / p);
    float sq = sin(PI / q);
    float D  = 1.0 - sp*sp - sq*sq;
    D = max(D, 1e-10);                   // guard (should be > 0 if hyperbolic)

    float sqD  = sqrt(D);
    float sa   = sqD / sp;               // sinh(OP)
    float sb   = sqD / sq;               // sinh(OQ)
    float ca   = sqrt(1.0 + sa*sa);
    float cb   = sqrt(1.0 + sb*sb);
    float rP   = sa / (1.0 + ca);
    float rQ   = sb / (1.0 + cb);
    float acx  = (1.0 + rP*rP) / (2.0 * rP);
    float acy  = (1.0 + rQ*rQ) / (2.0 * rQ);
    float aR2  = acx*acx + acy*acy - 1.0;

    return FundTri(rP, rQ, acx, acy, aR2);
}

// ── fold point into fundamental domain ────────────────────────────────────
// Returns reduced point; tile_parity counts arc crossings (gives {p,q} coloring).
vec2 foldToDomain(vec2 z, FundTri tri, out int tile_parity) {
    tile_parity = 0;
    for (int i = 0; i < MAX_ITER; i++) {
        bool changed = false;
        if (z.y < 0.0)                { z.y = -z.y;  changed = true; }
        if (z.x < 0.0)                { z.x = -z.x;  changed = true; }
        vec2  dv = z - vec2(tri.acx, tri.acy);
        float d2 = dot(dv, dv);
        if (d2 < tri.aR2 - 1e-9) {
            z = vec2(tri.acx, tri.acy) + (tri.aR2 / d2) * dv;
            tile_parity ^= 1;
            changed = true;
        }
        if (!changed) break;
    }
    return z;
}

// ── color palette ──────────────────────────────────────────────────────────
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TWO_PI * (c * t + d));
}

// ── main ───────────────────────────────────────────────────────────────────
void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
              / min(u_resolution.x, u_resolution.y);

    // Outside unit disk → black border
    float r = length(uv);
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // {7,3}: p=7 heptagons, q=3 meeting at each vertex
    FundTri tri = makeFundTri(7.0, 3.0);

    // Optionally animate: slow rotation in hyperbolic plane
    // (Möbius transformation: shift disk center over time)
    float t   = u_time * 0.07;
    vec2  mob_a = vec2(cos(t), sin(t)) * 0.15;   // small shift
    vec2  num  = uv - mob_a;
    vec2  den  = vec2(1.0, 0.0)
               - vec2(mob_a.x*uv.x + mob_a.y*uv.y,  mob_a.y*uv.x - mob_a.x*uv.y);
    float den2 = dot(den, den);
    vec2  z    = den2 > 1e-12 ? vec2(dot(num,den), num.x*den.y - num.y*den.x) / den2 : uv;

    // Fold into fundamental domain
    int   tile_parity;
    vec2  fd = foldToDomain(z, tri, tile_parity);

    // Distance to each side in screen space
    float d_arc   = abs(length(fd - vec2(tri.acx, tri.acy)) - sqrt(tri.aR2));
    float d_xside = fd.y;               // distance to x-axis side (OQ side)
    float d_yside = fd.x;               // distance to y-axis side (OP side)

    // Distances to the three special vertices
    float d_origin = length(fd);                        // right-angle vertex (edge midpoint)
    float d_pvert  = length(fd - vec2(tri.rP, 0.0));   // p=7 vertex (heptagon center)
    float d_qvert  = length(fd - vec2(0.0, tri.rQ));   // q=3 vertex (where 3 tiles meet)

    // Hyperbolic distance from origin (for radial gradient)
    float hd = hypDistFromOrigin(z);

    // ── base tile color ─────────────────────────────────────────────────────
    // Two-tone heptagons: deep indigo / warm amber
    vec3 col_even = vec3(0.06, 0.04, 0.22);
    vec3 col_odd  = vec3(0.28, 0.15, 0.05);
    vec3 base = (tile_parity == 0) ? col_even : col_odd;

    // Subtle interior gradient by distance from tile center (p-vertex)
    float tile_fade = smoothstep(0.0, tri.rP * 0.8, d_pvert);
    base = mix(base * 1.4, base, tile_fade);

    // Radial depth: tiles near boundary appear to recede
    float depth = clamp(1.0 - hd / 5.0, 0.0, 1.0);
    base *= (0.5 + 0.5 * depth);

    // ── edge lines ─────────────────────────────────────────────────────────
    // {7,3} tiling edges (the arc hypotenuses)
    float edge_w  = 0.006 + 0.004 * depth;              // thinner near boundary
    float edge    = 1.0 - smoothstep(0.0, edge_w, d_arc);
    vec3  edge_col = vec3(0.9, 0.85, 0.6) * (0.6 + 0.4 * depth);
    base = mix(base, edge_col, edge * 0.85);

    // Sub-tile lines (the x/y-axis legs — triangle sub-division)
    float sub_w   = 0.003;
    float sub_x   = 1.0 - smoothstep(0.0, sub_w, d_xside);
    float sub_y   = 1.0 - smoothstep(0.0, sub_w, d_yside);
    base = mix(base, vec3(0.5, 0.45, 0.35) * depth, (sub_x + sub_y) * 0.3);

    // ── vertex markers ──────────────────────────────────────────────────────
    // q-vertex: yellow-white star (where 3 heptagons meet)
    float vq = 1.0 - smoothstep(0.0, 0.014, d_qvert);
    base = mix(base, vec3(1.0, 0.9, 0.5), vq * 0.9);

    // p-vertex: small blue dot (heptagon center — invisible unless zoomed)
    float vp = 1.0 - smoothstep(0.0, 0.008, d_pvert);
    base = mix(base, vec3(0.4, 0.7, 1.0), vp * 0.6);

    // ── boundary glow ──────────────────────────────────────────────────────
    float boundary_dist = 1.0 - r;
    float glow = exp(-boundary_dist * 18.0) * 0.6;
    base += vec3(0.4, 0.2, 0.05) * glow;

    // Subtle disk vignette
    base *= 1.0 - 0.15 * r * r;

    gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}
