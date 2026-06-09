// _truncated_tiling_73.frag
// Truncated {7,3} tiling: cutting the 3-fold vertices of {7,3}
// A hyperbolic analogue of the Archimedean truncated polyhedra
//
// Truncating the {7,3} tiling at the 3-fold vertices (where three heptagons meet)
// replaces each vertex with a triangle, turning heptagons into 14-gons
// and adding equilateral triangles. This creates an Archimedean-type tiling
// with two polygon types: 14-gons and triangles.
// In the shader we visualize this by subdividing the fundamental triangle.
//
// Truncation geometry:
//   Original {7,3}: fundamental triangle (π/2, π/7, π/3)
//   Truncation cuts off the π/3 vertex at distance 1/3 along the adjacent edges.
//   The 14-gon has 14 sides (from the original 7, each side is "doubled").
//   The triangle has 3 sides (the cut from each 3-fold vertex).
//
// The dual of truncated {7,3} is a triakis-heptagonal tiling.

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI     = 3.14159265358979323846;
const float TWO_PI = 6.28318530717958647692;
const int MAX_ITER = 64;

struct FundTri { float rP, rQ, acx, acy, aR2; };

FundTri makeFundTri(float p, float q) {
    float sp = sin(PI/p), sq = sin(PI/q);
    float D  = max(1.0 - sp*sp - sq*sq, 1e-10);
    float sa = sqrt(D)/sp, sb = sqrt(D)/sq;
    float rP = sa/(1.0+sqrt(1.0+sa*sa));
    float rQ = sb/(1.0+sqrt(1.0+sb*sb));
    float acx = (1.0+rP*rP)/(2.0*rP), acy = (1.0+rQ*rQ)/(2.0*rQ);
    return FundTri(rP, rQ, acx, acy, acx*acx+acy*acy-1.0);
}

vec2 foldToDomain(vec2 z, FundTri tri, out int tp) {
    tp = 0;
    for (int i = 0; i < MAX_ITER; i++) {
        bool ch = false;
        if (z.y < 0.0) { z.y=-z.y; ch=true; }
        if (z.x < 0.0) { z.x=-z.x; ch=true; }
        vec2 dv = z - vec2(tri.acx,tri.acy);
        float d2 = dot(dv,dv);
        if (d2 < tri.aR2-1e-9) {
            z = vec2(tri.acx,tri.acy) + tri.aR2/d2*dv;
            tp^=1; ch=true;
        }
        if(!ch) break;
    }
    return z;
}

float hypDist(vec2 z) {
    float r = clamp(length(z), 0.0, 0.9999999);
    return log((1.0+r)/(1.0-r));
}

// Classify point within fundamental triangle:
//   0 = near origin (right-angle vertex) — edge midpoint region
//   1 = near p-vertex — center of 14-gon
//   2 = near q-vertex — inside the small triangle (vertex triangle)
// The truncation cuts the 1/3 of the triangle near the q-vertex.
int classifyRegion(vec2 fd, FundTri tri) {
    // Normalized barycentric-like distances
    float d_O  = length(fd);                         // to origin
    float d_P  = length(fd - vec2(tri.rP, 0.0));     // to p-vertex
    float d_Q  = length(fd - vec2(0.0,  tri.rQ));    // to q-vertex

    // The truncation boundary: plane cutting at 1/3 from q-vertex
    float total = d_O + d_P + d_Q;
    float frac_Q = d_Q / total;   // fraction of barycentric weight at Q

    if (frac_Q < 0.38) return 2;  // inside the cut triangle
    return 1;                      // inside the 14-gon region
}

// dummy for compilation — actual classification inline below
int classRegion(vec2 fd, FundTri tri) {
    float d_O = length(fd);
    float d_P = length(fd - vec2(tri.rP, 0.0));
    float d_Q = length(fd - vec2(0.0, tri.rQ));
    float total = d_O + d_P + d_Q + 1e-8;
    return (d_Q / total < 0.38) ? 2 : 1;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    FundTri tri = makeFundTri(7.0, 3.0);

    // Slow rotation
    float a = u_time * 0.02;
    float ca = cos(a), sa = sin(a);
    vec2 z = vec2(ca*uv.x - sa*uv.y, sa*uv.x + ca*uv.y);

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/5.0, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));
    float d_ov  = length(fd);

    // Classify region
    int region = classRegion(fd, tri);

    // Truncation cut boundary: geodesic line near the q-vertex
    float d_O = length(fd), d_P = length(fd-vec2(tri.rP,0.0)), d_Q = d_qv;
    float total = d_O + d_P + d_Q + 1e-8;
    float frac_Q = d_Q / total;
    float trunc_dist = abs(frac_Q - 0.38);

    // Colors
    // 14-gon: rich teal
    vec3 col14g_even = vec3(0.05, 0.18, 0.28);
    vec3 col14g_odd  = vec3(0.02, 0.10, 0.18);
    // triangle: warm gold
    vec3 col_tri_even = vec3(0.35, 0.22, 0.06);
    vec3 col_tri_odd  = vec3(0.22, 0.14, 0.04);

    vec3 base;
    if (region == 2) {
        base = (parity == 0) ? col_tri_even : col_tri_odd;
    } else {
        base = (parity == 0) ? col14g_even : col14g_odd;
    }
    base *= (0.45 + 0.55*depth);

    // {7,3} base tiling edges
    float ew   = 0.006 + 0.004*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    vec3  ec   = (region==2) ? vec3(0.9, 0.75, 0.4) : vec3(0.5, 0.85, 0.9);
    base = mix(base, ec*depth, edge*0.85);

    // Truncation boundary line (new edges from truncation)
    float te = 1.0 - smoothstep(0.0, 0.006+0.003*depth, trunc_dist);
    base = mix(base, vec3(0.9, 0.85, 0.5)*depth, te*0.8);

    // Sub-lines
    float sx = 1.0-smoothstep(0.0, 0.003, fd.y);
    float sy = 1.0-smoothstep(0.0, 0.003, fd.x);
    base = mix(base, vec3(0.6, 0.6, 0.5)*depth*0.5, (sx+sy)*0.18);

    // Vertices
    float vq = 1.0-smoothstep(0.0, 0.016, d_qv);
    base = mix(base, vec3(1.0, 0.95, 0.6), vq*0.9);
    float vp = 1.0-smoothstep(0.0, 0.010, d_pv);
    base = mix(base, vec3(0.5, 0.9, 1.0), vp*0.7);

    float glow = exp(-(1.0-r)*16.0)*0.5;
    base += vec3(0.2, 0.35, 0.5)*glow;
    base *= 1.0 - 0.12*r*r;

    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
