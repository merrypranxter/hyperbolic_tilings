// _star_tiling_52.frag
// Hyperbolic star tiling based on {5,5/2} and pentagram motifs
// Non-convex polygons: pentagram (five-pointed star polygon) vertices
//
// Star polygons {p/k} connect every k-th vertex of a regular p-gon.
// The pentagram {5/2} connects alternate vertices of a pentagon.
// In hyperbolic space, star tilings {p/k, q} can exist with density > 1:
// the star polygon winds around the center k times.
//
// This shader renders a pentagram-inspired hyperbolic star tiling using
// the {5,4} fundamental domain with star polygon coloring:
//   - The interior of each pentagon is subdivided into star arms and center
//   - Five-pointed stars appear as the dominant visual motif
//   - The "density" winding is visualized by overlapping color bands
//
// Mathematical notes:
//   True {5/2, 5} tiling requires extended analysis beyond {p,q} triangle groups.
//   We approximate by taking a {5,4} tiling and applying a 5/2-winding
//   angle map inside each fundamental domain.
//   The Schläfli symbol {5/2} has an angular defect: sum of interior angles
//   at a pentagram vertex = π/5 * 2 = 2π/5 per winding.

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
        vec2 dv = z - vec2(tri.acx, tri.acy);
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

// Pentagram SDF in 2D: distance to the {5/2} star outline
// Uses 5-fold symmetry, then tests arm geometry
float pentagramSDF(vec2 p, float r_outer) {
    float a = atan(p.y, p.x) - PI/2.0;
    float s = mod(a, TWO_PI/5.0) - PI/5.0;  // fold into one sector
    vec2  fp = vec2(length(p)*cos(s), length(p)*sin(s));

    // Outer pentagram tip and inner notch
    float r_inner = r_outer * 0.382;  // golden ratio geometry
    float tip_y   = r_outer;
    float notch_y = r_inner * cos(PI/5.0) / cos(PI/10.0) * 0.5;

    // Distance to the star arm (simplified)
    float arm_width = r_outer * 0.18;
    float d = abs(fp.x) - arm_width * (1.0 - fp.y / tip_y);
    d = max(d, fp.y - tip_y);
    d = max(d, -fp.y - notch_y);
    return d;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // Use {5,4} as the base tiling for pentagonal geometry
    FundTri tri = makeFundTri(5.0, 4.0);

    // Animate: pulse and rotate
    float t    = u_time * 0.06;
    float ca   = cos(t), sa = sin(t);
    vec2  z    = vec2(ca*uv.x - sa*uv.y, sa*uv.x + ca*uv.y);

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/4.5, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));

    // Pentagram inside each fundamental domain
    // Center at p-vertex (tri.rP, 0), scale by rP
    vec2  star_pos = (fd - vec2(tri.rP, 0.0)) / (tri.rP * 0.9 + 0.001);
    float star_d   = pentagramSDF(star_pos, 0.9);
    float star_mask = smoothstep(0.05, -0.05, star_d);

    // Density winding: angle mod 2pi/5 gives star "density" layers
    float arm_angle = atan(fd.y - 0.0, fd.x - tri.rP);
    float winding   = mod(arm_angle * 2.5 / PI, 1.0);
    float density   = 0.5 + 0.5*cos(winding * TWO_PI * 2.0 + u_time*0.5);

    // Background tile colors — dark purple/gold two-tone
    vec3 even_col = vec3(0.08, 0.04, 0.22);
    vec3 odd_col  = vec3(0.25, 0.14, 0.04);
    vec3 base     = (parity == 0) ? even_col : odd_col;
    base *= (0.4 + 0.6*depth);

    // Star arm coloring — golden star on dark background
    vec3 star_col = vec3(1.0, 0.85, 0.2) * (0.7 + 0.3*density);
    vec3 star_body = vec3(0.6, 0.3, 0.05);
    // star interior gradient
    float star_depth = smoothstep(-0.3, 0.3, star_d);
    vec3 star_full = mix(star_col, star_body, star_depth);
    base = mix(base, star_full, star_mask * depth);

    // {5,4} tiling edges — silver
    float ew   = 0.007 + 0.004*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    base = mix(base, vec3(0.8, 0.8, 0.9)*depth, edge*0.8);

    // Star outline glow
    float star_edge = 1.0 - smoothstep(0.0, 0.03, abs(star_d));
    base = mix(base, vec3(1.0, 0.9, 0.3)*depth, star_edge*0.7);

    // 4-fold vertex (where 4 pentagons meet)
    float vq = 1.0-smoothstep(0.0, 0.016, d_qv);
    base = mix(base, vec3(1.0, 0.97, 0.5), vq*0.9);

    // Pulsing glow at star tips
    float pulse = 0.5 + 0.5*sin(u_time * 1.2);
    float star_tip = 1.0-smoothstep(0.0, 0.025, d_pv);
    base += vec3(1.0, 0.7, 0.1)*star_tip*pulse*0.5*depth;

    float glow = exp(-(1.0-r)*15.0)*0.7;
    base += vec3(0.6, 0.3, 0.05)*glow;
    base *= 1.0 - 0.1*r*r;

    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
