// _bending_animation.frag
// Continuous deformation: Fuchsian → Quasifuchsian → Kleinian
// Animating the bending of a hyperbolic surface in 3-space
//
// A Fuchsian group acts on the hyperbolic plane (Poincaré disk).
// A quasifuchsian group is a deformation: the group still acts on
// a 3-manifold but the limit set deforms from a circle to a Jordan curve.
// A Kleinian group is the most general discrete Möbius group.
//
// This shader visualizes the "bending deformation":
//   t=0:   Perfect Fuchsian — clean {7,3} tiling in Poincaré disk
//   t=0.5: Quasifuchsian — tiling warped by a quasiconformal map
//   t=1:   Kleinian transition — limit set becomes a fractal Jordan curve
//
// The deformation is achieved by composing the tiling with a family of
// quasiconformal maps interpolating between identity (Fuchsian) and
// a Beltrami coefficient deformation (quasifuchsian).
//
// Practical implementation:
//   We animate a Möbius transformation parameter that "bends" the disk.
//   The tiling structure is maintained but the metric is warped.
//   Near t=1, the boundary circle warps into a Weil-Petersson geodesic.

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI     = 3.14159265358979323846;
const float TWO_PI = 6.28318530717958647692;
const int MAX_ITER = 64;

vec2 cmul(vec2 a, vec2 b) { return vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x); }
vec2 cdiv(vec2 a, vec2 b) {
    float d = dot(b,b);
    return d < 1e-20 ? vec2(1e10) : vec2(dot(a,b), a.y*b.x-a.x*b.y)/d;
}

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
            z=vec2(tri.acx,tri.acy)+tri.aR2/d2*dv;
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

// Quasiconformal deformation: map disk to disk with a Beltrami-like warp
// mu(z): Beltrami coefficient — controls how much the map differs from conformal
// We approximate with a holomorphic perturbation parametrized by bend_t
vec2 bendDeform(vec2 z, float bend_t) {
    if (bend_t < 0.001) return z;

    // Warp: apply a series of small Möbius deformations
    // Each represents "infinitesimal bending" of the surface in 3D
    float r   = length(z);
    float ang = atan(z.y, z.x);

    // Beltrami-inspired: stretch in real direction, compress in imaginary
    float stretch = 1.0 + bend_t * 0.6 * sin(ang * 2.0 + u_time * 0.2);
    float compress = 1.0 - bend_t * 0.3 * cos(ang * 3.0 + u_time * 0.15);

    // Warp angle: creates the "Jordan curve" deformation of the boundary
    float ang_warp = ang + bend_t * 0.8 * sin(ang * 5.0 + u_time * 0.1) * (r * r);

    vec2 warped = r * vec2(cos(ang_warp), sin(ang_warp));
    warped *= (stretch + compress) * 0.5;

    // Blend: at bend_t=1 the boundary becomes fractal-like
    warped = clamp(length(warped), 0.0, 0.9999) * normalize(warped + 1e-10);
    return mix(z, warped, bend_t * bend_t);
}

// Boundary deformation visualization: how much the "circle" deforms
float boundaryDeform(vec2 z, float bend_t) {
    float ang = atan(z.y, z.x);
    // The deformed boundary radius as a function of angle
    float r_boundary = 1.0 + bend_t * 0.15 * sin(ang * 7.0 + u_time * 0.3)
                           + bend_t * 0.08 * cos(ang * 11.0 - u_time * 0.2);
    return abs(length(z) - r_boundary);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // Bending parameter: oscillate between Fuchsian (0) and quasi-Kleinian (0.9)
    float bend_t = 0.45 + 0.45*sin(u_time * 0.18);

    // Apply deformation to get the "bent" coordinate
    vec2 z_bent = bendDeform(uv, bend_t);

    // Now fold this warped coordinate using the {7,3} tiling
    FundTri tri = makeFundTri(7.0, 3.0);
    int parity;
    vec2 fd = foldToDomain(z_bent, tri, parity);

    float hd    = hypDist(z_bent);
    float depth = clamp(1.0 - hd/5.0, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));

    // Color transitions: cool blue (Fuchsian) → warm amber (quasifuchsian) → red-orange (Kleinian)
    vec3 fuchsian_even  = vec3(0.05, 0.08, 0.30);
    vec3 fuchsian_odd   = vec3(0.02, 0.04, 0.18);
    vec3 kleinian_even  = vec3(0.32, 0.10, 0.04);
    vec3 kleinian_odd   = vec3(0.18, 0.06, 0.02);

    vec3 base_even = mix(fuchsian_even, kleinian_even, bend_t);
    vec3 base_odd  = mix(fuchsian_odd,  kleinian_odd,  bend_t);
    vec3 base = (parity == 0) ? base_even : base_odd;
    base *= (0.45 + 0.55*depth);

    // Tiling edges (warp with deformation — geodesics bend in quasifuchsian)
    float ew   = 0.007 + 0.004*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    // Edge color: white-blue (Fuchsian) → white-amber (quasifuchsian)
    vec3 ec = mix(vec3(0.7,0.8,1.0), vec3(1.0,0.85,0.4), bend_t) * depth;
    base = mix(base, ec, edge * 0.88);

    // Sub-triangle lines
    float sx = 1.0-smoothstep(0.0,0.003,fd.y);
    float sy = 1.0-smoothstep(0.0,0.003,fd.x);
    base = mix(base, ec*0.6, (sx+sy)*0.2);

    // Vertex glow
    float vq = 1.0-smoothstep(0.0, 0.016, d_qv);
    base = mix(base, mix(vec3(0.6,0.8,1.0), vec3(1.0,0.9,0.4), bend_t), vq*0.9);

    // Deforming boundary line (the Jordan curve / quasicircle)
    float bd = boundaryDeform(uv, bend_t);
    float bl = 1.0 - smoothstep(0.0, 0.02+bend_t*0.03, bd);
    base = mix(base, mix(vec3(0.2,0.5,1.0), vec3(1.0,0.4,0.1), bend_t), bl*0.7);

    // Quasifuchsian "fog": limit set beginning to form
    float qf_fog = bend_t * bend_t * exp(-(1.0-r)*8.0)*0.5;
    base += mix(vec3(0.0,0.1,0.5), vec3(0.8,0.2,0.0), bend_t) * qf_fog;

    // Label the phase with a color accent
    // (Blue = Fuchsian regime, Amber = transition, Red = Kleinian)
    float phase_accent = bend_t * 0.12;
    base += mix(vec3(0.0,0.0,phase_accent), vec3(phase_accent,phase_accent*0.3,0.0), bend_t);

    base *= 1.0 - 0.1*r*r;
    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
