// _dual_tiling_37.frag
// Hyperbolic tiling {3,7}: triangles meeting seven at each vertex
// Triangle group (2,3,7) — dual of the {7,3} tiling
//
// The {3,7} tiling is the combinatorial dual of {7,3}: swap p and q.
// Instead of heptagons meeting 3 at each vertex, we have triangles meeting 7.
// The visual effect is a stellated, seven-pronged star-like burst at each vertex,
// with triangular faces filling the disk.
//
// Mathematical notes:
//   The (2,3,7) and (2,7,3) triangle groups use the SAME fundamental triangle!
//   Just the labelling of the p- and q-vertex switches.
//   D = 1 - sin²(π/3) - sin²(π/7) = same as {7,3}
//   sinh(OP) = sqrt(D)/sin(π/3)    [shorter leg for the 3-vertex now]
//   sinh(OQ) = sqrt(D)/sin(π/7)    [longer leg for the 7-vertex]
//   Area per triangle: π(3-2 - 3·(2/7)) = π(1 - 6/7) = π/7
//   Gauss-Bonnet: (3-2)π - 3·(2π/7) = π - 6π/7 = π/7  ✓

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI      = 3.14159265358979323846;
const float TWO_PI  = 6.28318530717958647692;
const int   MAX_ITER = 64;

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
        if (d2 < tri.aR2 - 1e-9) {
            z = vec2(tri.acx,tri.acy) + tri.aR2/d2*dv;
            tp ^= 1; ch=true;
        }
        if (!ch) break;
    }
    return z;
}

float hypDist(vec2 z) {
    float r = clamp(length(z), 0.0, 0.9999999);
    return log((1.0+r)/(1.0-r));
}

// 7-fold color: seven arms radiate from each 7-vertex, alternating warm/cool
vec3 dualColor(int parity, vec2 fd, float rQ) {
    // Angle about the q-vertex (7-fold symmetry)
    vec2 toQ = fd - vec2(0.0, rQ);
    float ang = atan(toQ.y, toQ.x);
    float sector = floor(mod(ang/(TWO_PI/7.0) + 10.5, 7.0));

    float h = sector / 7.0;  // 0..1 hue parameter

    vec3 light = vec3(0.9, 0.85, 0.6) + 0.1*vec3(sin(h*TWO_PI), sin(h*TWO_PI+2.09), sin(h*TWO_PI+4.19));
    vec3 dark  = vec3(0.08, 0.05, 0.18) + 0.07*vec3(sin(h*TWO_PI+1.0), sin(h*TWO_PI+3.09), sin(h*TWO_PI+5.19));

    return (parity == 0) ? dark : light;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // {3,7}: triangles (p=3), 7 per vertex (q=7)
    FundTri tri = makeFundTri(3.0, 7.0);

    // Slow counter-rotation to contrast {7,3}
    float a = -u_time * 0.03;
    float c = cos(a), s = sin(a);
    vec2 z = vec2(c*uv.x - s*uv.y, s*uv.x + c*uv.y);

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/4.5, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));

    vec3 base = dualColor(parity, fd, tri.rQ);
    base *= (0.45 + 0.55*depth);

    // Triangle interior shading toward centroid
    vec2 centroid = vec2(tri.rP, tri.rQ) / 3.0;
    float d_centroid = length(fd - centroid);
    float tile_fade = smoothstep(0.0, length(centroid)*1.2, d_centroid);
    base = mix(base*1.2, base*0.9, tile_fade);

    // {3,7} tiling edges
    float ew   = 0.007 + 0.005*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    base = mix(base, vec3(0.95,0.85,0.65)*depth, edge*0.88);

    // Sub-triangle lines (lighter)
    float sx = 1.0-smoothstep(0.0, 0.003, fd.y);
    float sy = 1.0-smoothstep(0.0, 0.003, fd.x);
    base = mix(base, vec3(0.7,0.65,0.55)*depth*0.6, (sx+sy)*0.2);

    // 7-fold vertex: bright star (where 7 triangles converge)
    float vq = 1.0-smoothstep(0.0, 0.018, d_qv);
    base = mix(base, vec3(1.0, 0.97, 0.7), vq*0.95);

    // 3-fold vertex: smaller dot
    float vp = 1.0-smoothstep(0.0, 0.010, d_pv);
    base = mix(base, vec3(0.7, 0.9, 1.0), vp*0.7);

    // Boundary glow (cool violet)
    float glow = exp(-(1.0-r)*16.0)*0.5;
    base += vec3(0.2, 0.1, 0.5)*glow;

    base *= 1.0 - 0.12*r*r;
    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
