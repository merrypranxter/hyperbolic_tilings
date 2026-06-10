// _escher_birds.frag
// Escher-style animal interlocks: color symmetry following {4,6} group operations
// Inspired by M.C. Escher's Circle Limit series (1958–1960)
//
// Escher discovered hyperbolic tilings through H.S.M. Coxeter's work in 1954.
// His Circle Limit woodcuts show fish, angels, and demons interlocking in perfect
// {p,q} symmetry, with each "animal" being a fundamental domain of a symmetry group.
//
// This shader creates an Escher-style {4,6} tiling where:
//   - Light birds fly clockwise (even-parity fundamental triangles)
//   - Dark birds fly counterclockwise (odd-parity)
//   - Wing patterns are derived from the fundamental domain geometry
//   - Color follows the 4-fold symmetry at each vertex
//
// Technique (after Doug Dunham, 1981):
//   1. Reduce pixel to fundamental domain via reflections
//   2. Apply a "pattern map" to the fundamental domain coordinates
//   3. Color based on a stylized "wing/body/beak" subdivision
//   4. The group operations automatically tile the pattern correctly

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

// Bird pattern inside fundamental triangle
// Returns: 0=background, 1=wing, 2=body, 3=head, 4=beak
// The fundamental triangle has corners at (0,0), (rP,0), (0,rQ)
// We parametrize the bird along these corners.
int birdPart(vec2 fd, FundTri tri) {
    // Normalized barycentric-like coordinates
    float lx = fd.x / (tri.rP + 1e-8);   // 0 at origin, 1 at p-vertex
    float ly = fd.y / (tri.rQ + 1e-8);   // 0 at origin, 1 at q-vertex

    // Head near p-vertex (front of bird)
    float d_head = length(fd - vec2(tri.rP * 0.85, tri.rQ * 0.08));
    if (d_head < tri.rP * 0.12) return 3;

    // Beak (tip beyond p-vertex direction)
    float d_beak = length(fd - vec2(tri.rP * 0.97, tri.rQ * 0.12));
    if (d_beak < tri.rP * 0.06) return 4;

    // Body: central mass
    float d_body = length(fd - vec2(tri.rP * 0.55, tri.rQ * 0.20));
    if (d_body < tri.rP * 0.30) return 2;

    // Wing: swept area near the arc side
    vec2  to_arc  = fd - vec2(tri.acx, tri.acy);
    float d_arc   = abs(length(to_arc) - sqrt(tri.aR2));
    if (d_arc < tri.rP * 0.22 && lx > 0.15 && ly < 0.85) return 1;

    return 0;
}

// Four-coloring based on {4,6} symmetry: four bird "species" at each 4-fold vertex
int birdSpecies(vec2 z_original) {
    float ang = atan(z_original.y, z_original.x);
    return int(mod(floor(ang / (PI * 0.5)) + 4.0, 4.0));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5*u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r >= 1.0) { gl_FragColor = vec4(0.02,0.01,0.03,1.0); return; }

    // {4,6}: squares meeting 6 at each vertex — good for bird-like subdivision
    FundTri tri = makeFundTri(4.0, 6.0);

    // Slow rotation evoking the endless circling of birds
    float a = u_time * 0.035;
    float ca = cos(a), sa = sin(a);
    vec2  z  = vec2(ca*uv.x - sa*uv.y, sa*uv.x + ca*uv.y);

    int parity;
    vec2 fd = foldToDomain(z, tri, parity);

    float hd    = hypDist(z);
    float depth = clamp(1.0 - hd/4.5, 0.0, 1.0);

    int part    = birdPart(fd, tri);
    int species = birdSpecies(uv);  // 0-3 for 4-fold symmetry

    float d_arc = abs(length(fd - vec2(tri.acx,tri.acy)) - sqrt(tri.aR2));

    // Bird palette: two families, four species each
    // Light birds: warm tones — ivory, gold, orange, rose
    // Dark birds: cool tones — slate, navy, forest, violet
    vec3[4] light_body  = vec3[4](
        vec3(0.90, 0.84, 0.68),   // ivory
        vec3(0.86, 0.72, 0.30),   // gold
        vec3(0.88, 0.55, 0.25),   // orange
        vec3(0.82, 0.65, 0.70)    // rose
    );
    vec3[4] dark_body = vec3[4](
        vec3(0.15, 0.18, 0.28),   // slate
        vec3(0.06, 0.10, 0.30),   // navy
        vec3(0.08, 0.20, 0.10),   // forest
        vec3(0.18, 0.08, 0.24)    // violet
    );
    vec3[4] wing_accent = vec3[4](
        vec3(0.70, 0.60, 0.40),
        vec3(0.72, 0.55, 0.12),
        vec3(0.65, 0.35, 0.10),
        vec3(0.65, 0.42, 0.50)
    );
    vec3[4] dark_wing = vec3[4](
        vec3(0.25, 0.28, 0.40),
        vec3(0.10, 0.18, 0.48),
        vec3(0.12, 0.32, 0.18),
        vec3(0.30, 0.14, 0.36)
    );

    bool light = (parity == 0);
    vec3 body_col = light ? light_body[species]  : dark_body[species];
    vec3 wing_col = light ? wing_accent[species] : dark_wing[species];
    vec3 head_col = light ? body_col * 1.15      : body_col * 1.2;
    vec3 beak_col = vec3(0.85, 0.65, 0.15);
    vec3 bg_col   = light ? body_col * 0.92      : body_col * 0.85;

    vec3 base;
    if      (part == 4) base = beak_col;
    else if (part == 3) base = head_col;
    else if (part == 2) base = body_col;
    else if (part == 1) base = wing_col;
    else                base = bg_col;

    base *= (0.5 + 0.5*depth);

    // Subtle feather texture (sine bands following bird direction)
    float feather = 0.5 + 0.5*sin(fd.x * 80.0 + fd.y * 40.0);
    base += 0.04 * feather * base;

    // Tiling boundary lines (light between dark birds, dark between light)
    float ew   = 0.005 + 0.003*depth;
    float edge = 1.0 - smoothstep(0.0, ew, d_arc);
    vec3  line_col = light ? vec3(0.3,0.25,0.15)*depth : vec3(0.6,0.6,0.5)*depth;
    base = mix(base, line_col, edge * 0.5);

    // 6-fold vertex: bright node (wing-tip convergence point)
    float vq = 1.0 - smoothstep(0.0, 0.014, length(fd - vec2(0.0, tri.rQ)));
    base = mix(base, vec3(0.95, 0.90, 0.70), vq * 0.8);

    float glow = exp(-(1.0-r)*20.0)*0.5;
    base += vec3(0.4, 0.3, 0.15)*glow;
    base *= 1.0 - 0.1*r*r;

    gl_FragColor = vec4(clamp(base,0.0,1.0),1.0);
}
