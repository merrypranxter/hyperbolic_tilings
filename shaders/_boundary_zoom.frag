// _boundary_zoom.frag
// Infinite zoom into the hyperbolic boundary: exponential distance compression
// Approaching the ideal circle from inside the Poincaré disk
//
// In the Poincaré disk, the hyperbolic distance to the boundary is infinite.
// As you move toward the boundary circle, distances expand exponentially —
// what appears as a thin sliver near the edge contains infinitely many tiles.
//
// This shader simulates "flying toward the boundary":
//   - The viewpoint moves exponentially closer to the unit circle
//   - The {7,3} tiling remains invariant under the zoom (horocycle flow)
//   - We see infinitely many copies of the tiling receding into the distance
//   - The boundary itself is never reached: Zeno's paradox in hyperbolic space
//
// The zoom is a hyperbolic translation along a geodesic:
//   z → (z - a)/(1 - ā·z)  where |a| → 1
//
// As a → 1, the map translates z toward the boundary point 1.
// With a = tanh(d/2) for d the hyperbolic distance, we get exponential zoom.

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;

const float PI     = 3.14159265358979323846;
const float TWO_PI = 6.28318530717958647692;
const int MAX_ITER = 80;

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

// Möbius translation: z → (z - a)/(1 - a̅·z) where a is real (translation along x-axis)
// This is a hyperbolic translation along the x-axis geodesic.
vec2 hypTranslate(vec2 z, float a) {
    vec2 za = vec2(z.x - a, z.y);
    vec2 denom = vec2(1.0 - a*z.x, -a*z.y);
    float d2 = dot(denom, denom);
    if (d2 < 1e-15) return vec2(1.0, 0.0);
    return vec2(dot(za,denom), za.y*denom.x - za.x*denom.y) / d2;
}

float hypDist(vec2 z) {
    float r = clamp(length(z), 0.0, 0.9999999);
    return log((1.0+r)/(1.0-r));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

    // Exponential zoom parameter: moves exponentially toward boundary
    // d(t) = initial_depth * e^(rate * t)
    // We zoom toward the boundary point at angle (pi/7) — a specific ideal vertex
    float zoom_speed = 0.3;
    float d_offset   = 0.3 * exp(zoom_speed * mod(u_time * 0.5, 8.0));
    d_offset = min(d_offset, 8.5);  // cap before it escapes disk

    // Hyperbolic translation amount: a = tanh(d/2)
    float a = tanh(d_offset / 2.0);

    // Rotate so we're zooming toward a specific boundary direction
    float zoom_angle = PI / 7.0 + u_time * 0.002;  // slight drift
    float ca = cos(zoom_angle), sa = sin(zoom_angle);
    vec2  uv_rot = vec2(ca*uv.x - sa*uv.y, sa*uv.x + ca*uv.y);

    // Apply hyperbolic translation (zoom)
    vec2 z = hypTranslate(uv_rot, a);

    // Rotate back
    float cb = cos(-zoom_angle), sb = sin(-zoom_angle);
    z = vec2(cb*z.x - sb*z.y, sb*z.x + cb*z.y);

    // Clamp to disk (floating point safety)
    float rz = length(z);
    if (rz >= 0.99999) z = z * (0.99998 / rz);

    // Now fold into {7,3} fundamental domain
    FundTri tri = makeFundTri(7.0, 3.0);
    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd_orig = hypDist(uv_rot);  // original hyperbolic distance
    float hd_zoom = hypDist(z);       // zoomed hyperbolic distance
    float depth   = clamp(1.0 - hd_zoom/6.0, 0.0, 1.0);

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));
    float d_pv  = length(fd - vec2(tri.rP, 0.0));
    float d_qv  = length(fd - vec2(0.0, tri.rQ));

    // Color: deep space blue/black — we're flying through an infinite corridor
    // Tiles fade toward the boundary direction
    vec3 even_col = vec3(0.03, 0.05, 0.18);
    vec3 odd_col  = vec3(0.07, 0.10, 0.30);
    vec3 base = (parity == 0) ? even_col : odd_col;

    // Distance "layers" — tiles at different depths get different brightness
    // Creates a tunnel-like receding effect
    float layer = mod(hd_zoom * 0.7, 1.0);
    float layer_bright = 0.5 + 0.5*cos(layer * TWO_PI);
    base *= (0.35 + 0.65*layer_bright) * (0.3 + 0.7*depth);

    // The "tunnel" effect: tiles ahead appear lighter
    float ahead = dot(normalize(z+1e-10), vec2(cos(zoom_angle), sin(zoom_angle)));
    float tunnel = 0.5 + 0.5 * ahead;
    base *= (0.6 + 0.4*tunnel);

    // {7,3} edges
    float ew   = 0.006 + 0.004*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    // Edges get brighter as we zoom toward boundary
    float edge_bright = 0.4 + 0.6*smoothstep(0.0, 1.0, 1.0 - depth);
    base = mix(base, vec3(0.7, 0.8, 1.0)*edge_bright, edge*0.9);

    float sx = 1.0-smoothstep(0.0,0.003,fd.y);
    float sy = 1.0-smoothstep(0.0,0.003,fd.x);
    base = mix(base, vec3(0.4,0.5,0.7)*depth*0.5, (sx+sy)*0.15);

    // Vertex glow
    float vq = 1.0-smoothstep(0.0, 0.016, d_qv);
    base = mix(base, vec3(0.8, 0.9, 1.0), vq*0.9);

    // The approach direction: bright glow ahead, dim behind
    float zoom_glow = exp(-dist2(uv, vec2(cos(zoom_angle),sin(zoom_angle))*0.9)*80.0)*0.8;
    base += vec3(0.1, 0.2, 0.8)*zoom_glow;

    // Boundary ring: always visible even as we zoom — infinitely far
    float glow = exp(-(1.0-r)*20.0)*0.7;
    base += vec3(0.2, 0.4, 1.0)*glow;

    // Speed lines: motion blur effect along zoom direction
    float spd = 0.02 * smoothstep(0.5, 1.0, r);
    float speed_lines = spd * sin(atan(uv.y - sin(zoom_angle)*0.1, uv.x - cos(zoom_angle)*0.1) * 28.0 + u_time * 3.0);
    base += vec3(0.1, 0.15, 0.3)*max(speed_lines, 0.0);

    base *= 1.0 - 0.05*r*r;
    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
