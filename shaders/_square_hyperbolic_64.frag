// _square_hyperbolic_64.frag
// Hyperbolic tiling {6,4}: hexagons meeting four at each vertex
// Triangle group (2,6,4) — a hyperbolic analogue of the square grid
//
// The {6,4} tiling places four hexagons at every vertex.
// In Euclidean space, three hexagons tile (the familiar honeycomb {6,3}).
// In hyperbolic space we can push it to four, creating a denser packing.
//
// Mathematical notes:
//   D = 1 - sin²(π/6) - sin²(π/4) = 1 - 0.25 - 0.5 = 0.25   [cleanly = 1/4]
//   sinh(OP) = sqrt(1/4)/sin(π/6) = (1/2)/(1/2) = 1.0
//   sinh(OQ) = sqrt(1/4)/sin(π/4) = (1/2)/(√2/2) = 1/√2 ≈ 0.7071
//   Area per hexagon: π(6-2 - 6·(2/4)) = π(4 - 3) = π
//   The {6,4} and {4,6} tilings are dual to each other.

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
        vec2 dv = z - vec2(tri.acx, tri.acy);
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

// 6-fold color gradient — hexagonal color symmetry
vec3 hexColor(int parity, vec2 fd, float time) {
    float ang = atan(fd.y, fd.x) / (PI / 3.0);
    float sector = floor(mod(ang, 6.0));

    if (parity == 0) {
        // Six pastel hues for light hexagons
        if (sector < 1.0) return vec3(0.15, 0.08, 0.38);   // violet
        if (sector < 2.0) return vec3(0.05, 0.15, 0.35);   // deep blue
        if (sector < 3.0) return vec3(0.05, 0.25, 0.25);   // teal
        if (sector < 4.0) return vec3(0.08, 0.25, 0.08);   // forest
        if (sector < 5.0) return vec3(0.30, 0.18, 0.04);   // amber
                           return vec3(0.28, 0.08, 0.08);   // crimson
    } else {
        // Lighter mirror hues for dark hexagons
        if (sector < 1.0) return vec3(0.55, 0.45, 0.80);
        if (sector < 2.0) return vec3(0.40, 0.55, 0.82);
        if (sector < 3.0) return vec3(0.40, 0.72, 0.72);
        if (sector < 4.0) return vec3(0.45, 0.72, 0.45);
        if (sector < 5.0) return vec3(0.82, 0.62, 0.32);
                           return vec3(0.80, 0.40, 0.40);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

    FundTri tri = makeFundTri(6.0, 4.0);

    // Gentle oscillating Möbius drift
    float t = u_time * 0.05;
    vec2 mob = vec2(sin(t)*0.1, cos(t*0.7)*0.08);
    vec2 num = uv - mob;
    vec2 den = vec2(1.0,0.0) - vec2(dot(mob,uv), mob.x*uv.y - mob.y*uv.x);
    float den2 = dot(den,den);
    vec2 z = den2 > 1e-12 ? vec2(dot(num,den), num.x*den.y-num.y*den.x)/den2 : uv;

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/5.0, 0.0, 1.0);

    float d_arc  = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv   = length(fd - vec2(tri.rP, 0.0));
    float d_qv   = length(fd - vec2(0.0, tri.rQ));

    vec3 base = hexColor(parity, fd, u_time);
    base *= (0.4 + 0.6*depth);

    // Hexagon interior: radial shading from center
    float fade = smoothstep(0.0, tri.rP*0.85, d_pv);
    base = mix(base*1.35, base*0.9, fade);

    // {6,4} edge lines
    float ew   = 0.006 + 0.003*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    base = mix(base, vec3(0.95,0.90,0.85)*depth, edge*0.85);

    // Chequerboard accent: sub-triangle lines
    float sxa = 1.0-smoothstep(0.0, 0.003, fd.y);
    float sya = 1.0-smoothstep(0.0, 0.003, fd.x);
    base = mix(base, vec3(0.95,0.90,0.85)*depth*0.5, (sxa+sya)*0.2);

    // 4-fold vertex glow (white-gold)
    float vq = 1.0-smoothstep(0.0, 0.015, d_qv);
    base = mix(base, vec3(1.0,0.95,0.7), vq*0.9);

    // Boundary glow (electric blue-white)
    float glow = exp(-(1.0-r)*20.0)*0.6;
    base += vec3(0.3, 0.5, 0.9)*glow;

    // Animate: pulse tiles slightly
    float pulse = 0.02*sin(u_time*0.8 + hd*1.5);
    base += vec3(pulse*0.3, pulse*0.5, pulse);

    base *= 1.0 - 0.1*r*r;
    gl_FragColor = vec4(clamp(base,0.0,1.0), 1.0);
}
