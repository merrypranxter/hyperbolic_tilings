// _apeirogonal_inf3.frag
// Hyperbolic tiling {∞,3}: apeirogons meeting three at each vertex
// Limit case p→∞ — polygons with infinitely many sides, bounded by horocycles
//
// The apeirogonal tiling {∞,3} is the limit of {p,3} as p→∞.
// The "polygon" becomes a horodisc: a disk tangent to the boundary of the Poincaré
// disk from the inside. Three such horodiscs share each vertex.
// Vertices lie on the boundary circle (ideal points); edges are geodesics between
// ideal points; the tiles are bounded by horocycles (Euclidean circles internally
// tangent to the unit circle).
//
// We approximate the limit by using a large p = 50 in the triangle group algorithm,
// which places the p-vertex very close to the unit circle.
//
// Mathematical notes:
//   As p→∞: sin(π/p)→0, so sinh(OP) = sqrt(D)/sin(π/p) → ∞, rP→1
//   The p-vertex reaches the boundary: vertex becomes an ideal point
//   The geodesic edges are "ultra-parallel" lines converging at the ideal point
//   Horocycles are the orthogonal circles to all the geodesics through an ideal point
//   Area per ideal polygon: infinite, but each ideal triangle = π (Gauss-Bonnet)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI      = 3.14159265358979323846;
const float TWO_PI  = 6.28318530717958647692;
const int   MAX_ITER = 80;

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

// Horocycle distance: the "height" in a horocycle strip
// A horoycle through ideal point (1,0) at height h is a circle tangent to unit
// circle at (1,0) with Euclidean center ((1-h)/2, 0) + small rotation.
// For our approximation we measure the Euclidean distance to the near boundary.
float horocycleDist(vec2 z, vec2 ideal_pt) {
    // Horosphere level: in the upper half-plane, this is the y-coordinate.
    // In the disk model, we transform to upper half-plane coordinates.
    // Cayley map: w = i(1+z)/(1-z) transforms disk to upper half-plane.
    // But we approximate: horocycle is Euclidean circle tangent at ideal_pt.
    float d_to_ideal = length(z - ideal_pt);
    float d_boundary = 1.0 - length(z);  // distance to boundary
    // Euclidean circle through z tangent to unit circle at ideal_pt has
    // radius ≈ d_to_ideal²/(2*d_boundary) for points far from ideal_pt
    return d_to_ideal * d_to_ideal;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // Use p=50 to approximate {∞,3}
    // The p-vertices are very close to the boundary
    float p_approx = 50.0;
    FundTri tri = makeFundTri(p_approx, 3.0);

    // Very slow drift toward boundary — "zooming in" on the limit
    float t = u_time * 0.04;
    vec2 z = uv;

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/6.0, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));

    // Color: deep ocean blues — the horocycle strips feel like layers of water
    vec3 even_col = vec3(0.02, 0.08, 0.25);   // deep midnight blue
    vec3 odd_col  = vec3(0.06, 0.18, 0.40);   // ocean blue
    vec3 base = (parity == 0) ? even_col : odd_col;

    // Banding by hyperbolic distance — reveals horocycle structure
    float band = 0.5 + 0.5*sin(hd * 0.9 + u_time * 0.15);
    base = mix(base, base * 1.5 + vec3(0.0, 0.05, 0.1), band * 0.25);

    // Near-boundary region: bright horocycles appear as bands of light
    float near_boundary = smoothstep(0.9, 1.0, r);
    base = mix(base, vec3(0.6, 0.8, 1.0), near_boundary * 0.4);

    // Strip shading showing the horocycle level sets
    float h_level = mod(hd * 1.5 + u_time*0.1, 1.0);
    float horo_band = smoothstep(0.45, 0.5, h_level) * smoothstep(0.55, 0.5, h_level);
    base = mix(base, vec3(0.3, 0.6, 0.9), horo_band * 0.3 * depth);

    // {∞,3} edges (the geodesics — very fine near boundary)
    float ew   = 0.005 + 0.004*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    base = mix(base, vec3(0.7, 0.85, 1.0)*depth, edge*0.9);

    // x-axis geodesics (ideal vertex directions)
    float sx = 1.0-smoothstep(0.0, 0.003, fd.y);
    float sy = 1.0-smoothstep(0.0, 0.003, fd.x);
    base = mix(base, vec3(0.5, 0.7, 0.9)*depth*0.7, (sx+sy)*0.2);

    // 3-fold vertex glow
    float vq = 1.0-smoothstep(0.0, 0.016, d_qv);
    base = mix(base, vec3(0.8, 0.95, 1.0), vq*0.9);

    // Near ideal boundary: bright glowing accumulation
    float ideal_glow = exp(-(1.0-r)*12.0)*0.8;
    base += vec3(0.1, 0.3, 0.9)*ideal_glow;

    // The infinite density at the boundary: shimmer
    float shimmer = 0.05*sin(atan(uv.y,uv.x)*50.0 + u_time*2.0) * smoothstep(0.75, 1.0, r);
    base += vec3(0.2, 0.4, 0.8)*shimmer;

    base *= 1.0 - 0.08*r*r;
    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
