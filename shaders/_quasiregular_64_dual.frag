// _quasiregular_64_dual.frag
// Quasiregular tiling: superimposed {6,4} and {4,6} dual tilings
// Shows both tilings simultaneously with color-coded overlay
//
// A quasiregular tiling is formed by overlaying a tiling with its dual.
// The {6,4} tiling (hexagons) and its dual {4,6} (squares) share vertices:
// the vertices of {6,4} become face-centers of {4,6} and vice versa.
// The compound creates an Archimedean-like hyperbolic tiling.
//
// This shader renders both tilings simultaneously:
//   - Blue: {6,4} hexagonal edges
//   - Red:  {4,6} square edges
//   - Green nodes: shared vertices (where both lattices cross)
//
// Mathematical notes:
//   {6,4} and {4,6} share the same triangle group (2,6,4) = (2,4,6).
//   D = 1 - sin²(π/6) - sin²(π/4) = 0.25
//   The two tilings are related by swapping p-vertex and q-vertex roles.

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

// Returns (tile_parity, edge distances for both {6,4} and its dual)
void analyzeDual(vec2 z, out int p64, out float d_64, out int p46, out float d_46,
                  out float d_shared_vertex) {
    // {6,4} tiling
    FundTri tri64 = makeFundTri(6.0, 4.0);
    {
        vec2 z2 = z; p64 = 0;
        for (int i = 0; i < MAX_ITER; i++) {
            bool ch = false;
            if (z2.y<0.0){z2.y=-z2.y;ch=true;}
            if (z2.x<0.0){z2.x=-z2.x;ch=true;}
            vec2 dv=z2-vec2(tri64.acx,tri64.acy);
            float d2=dot(dv,dv);
            if(d2<tri64.aR2-1e-9){z2=vec2(tri64.acx,tri64.acy)+tri64.aR2/d2*dv;p64^=1;ch=true;}
            if(!ch) break;
        }
        d_64 = abs(length(z2 - vec2(tri64.acx,tri64.acy)) - sqrt(tri64.aR2));
        d_shared_vertex = length(z2 - vec2(0.0, tri64.rQ));
    }

    // {4,6} tiling (dual — swap p and q)
    FundTri tri46 = makeFundTri(4.0, 6.0);
    {
        vec2 z2 = z; p46 = 0;
        for (int i = 0; i < MAX_ITER; i++) {
            bool ch = false;
            if (z2.y<0.0){z2.y=-z2.y;ch=true;}
            if (z2.x<0.0){z2.x=-z2.x;ch=true;}
            vec2 dv=z2-vec2(tri46.acx,tri46.acy);
            float d2=dot(dv,dv);
            if(d2<tri46.aR2-1e-9){z2=vec2(tri46.acx,tri46.acy)+tri46.aR2/d2*dv;p46^=1;ch=true;}
            if(!ch) break;
        }
        d_46 = abs(length(z2 - vec2(tri46.acx,tri46.acy)) - sqrt(tri46.aR2));
    }
}

float hypDist(vec2 z) {
    float r = clamp(length(z), 0.0, 0.9999999);
    return log((1.0+r)/(1.0-r));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // Gentle orbit animation
    float t = u_time * 0.04;
    float ca = cos(t), sa = sin(t);
    vec2 z = vec2(ca*uv.x-sa*uv.y, sa*uv.x+ca*uv.y);

    int p64, p46;
    float d_64, d_46, d_shared;
    analyzeDual(z, p64, d_64, p46, d_46, d_shared);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/5.5, 0.0, 1.0);

    // Background: {6,4} tile coloring
    vec3 hex_even = vec3(0.06, 0.06, 0.22);
    vec3 hex_odd  = vec3(0.15, 0.12, 0.04);
    vec3 base = (p64 == 0) ? hex_even : hex_odd;
    base *= (0.4 + 0.6*depth);

    // Overlay {4,6} tile shading (subtle)
    vec3 sq_even = vec3(0.0, 0.08, 0.04);
    vec3 sq_odd  = vec3(0.08, 0.04, 0.0);
    vec3 sq_col  = (p46 == 0) ? sq_even : sq_odd;
    base = mix(base, sq_col, 0.3);

    // {6,4} hexagonal edges — blue-white
    float ew64 = 0.007 + 0.004*depth;
    float e64  = 1.0 - smoothstep(0.0, ew64, d_64);
    base = mix(base, vec3(0.3, 0.5, 1.0)*depth, e64*0.9);

    // {4,6} square edges — red-orange
    float ew46 = 0.006 + 0.003*depth;
    float e46  = 1.0 - smoothstep(0.0, ew46, d_46);
    base = mix(base, vec3(1.0, 0.4, 0.15)*depth, e46*0.85);

    // Shared vertices (where both lattices intersect) — bright green
    float vsv = 1.0 - smoothstep(0.0, 0.016, d_shared);
    base = mix(base, vec3(0.4, 1.0, 0.5), vsv*0.95);

    // Edge-edge intersection glow (where {6,4} and {4,6} edges cross)
    float joint = e64 * e46;
    base = mix(base, vec3(1.0, 0.95, 0.5), joint*0.8);

    // Animate: crossfade between {6,4}-dominant and {4,6}-dominant views
    float crossfade = 0.5 + 0.5*sin(u_time * 0.25);
    base = mix(base, base + vec3(0.05, 0.0, 0.1)*crossfade, 0.3);

    float glow = exp(-(1.0-r)*18.0)*0.5;
    base += vec3(0.15, 0.3, 0.5)*glow;
    base *= 1.0 - 0.1*r*r;

    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
