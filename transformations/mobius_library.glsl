// mobius_library.glsl
// Möbius transformation toolkit for hyperbolic tiling shaders
//
// A Möbius transformation is a map of the form:
//   f(z) = (az + b) / (cz + d)
// where a, b, c, d are complex numbers and ad - bc ≠ 0.
//
// For hyperbolic isometries (disk-preserving Möbius maps):
//   f(z) = e^(iθ) · (z - a) / (1 - ā·z)
// where |a| < 1 and θ is a rotation angle.
//
// The Möbius group PSL(2,C) acts on the Riemann sphere.
// Its subgroup PSU(1,1) acts isometrically on the Poincaré disk.
// PSL(2,R) acts isometrically on the upper half-plane.
//
// This library provides:
//   - Complex arithmetic helpers
//   - Möbius transformation evaluation
//   - Specific disk isometries (rotation, translation, reflection)
//   - Composition and inversion
//   - Conjugacy classification (elliptic/parabolic/loxodromic)

// ── Complex arithmetic ─────────────────────────────────────────────────────

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y,  a.x*b.y + a.y*b.x);
}

vec2 conj(vec2 z) {
    return vec2(z.x, -z.y);
}

vec2 cdiv(vec2 a, vec2 b) {
    float d = dot(b, b);
    if (d < 1e-20) return vec2(1e10, 0.0);
    return vec2(dot(a, b), a.y*b.x - a.x*b.y) / d;
}

vec2 csqrt(vec2 z) {
    float r = length(z);
    float phi = atan(z.y, z.x) * 0.5;
    return sqrt(r) * vec2(cos(phi), sin(phi));
}

vec2 cexp(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 clog(vec2 z) {
    return vec2(log(length(z)), atan(z.y, z.x));
}

vec2 cpow(vec2 z, vec2 w) {
    return cexp(cmul(w, clog(z)));
}

// ── General Möbius transformation ──────────────────────────────────────────
// f(z) = (az + b) / (cz + d)
// Parameters passed as complex pairs: (a_re, a_im), (b_re, b_im), etc.

vec2 mobius(vec2 z, vec2 a, vec2 b, vec2 c, vec2 d) {
    return cdiv(cmul(a, z) + b, cmul(c, z) + d);
}

// ── Disk isometry: rotation ────────────────────────────────────────────────
// z → e^(iθ) · z   (rotation around origin)
vec2 diskRotate(vec2 z, float theta) {
    return vec2(z.x*cos(theta) - z.y*sin(theta),
                z.x*sin(theta) + z.y*cos(theta));
}

// ── Disk isometry: translation ─────────────────────────────────────────────
// z → (z - a) / (1 - ā·z)  translates 0 → -a, hence a → 0
vec2 diskTranslate(vec2 z, vec2 a) {
    vec2 num  = z - a;
    vec2 denom = vec2(1.0, 0.0) - cmul(conj(a), z);
    return cdiv(num, denom);
}

// ── Disk isometry: rotation about point p ─────────────────────────────────
// Conjugate the standard rotation by a translation:
//   T_p ∘ R_θ ∘ T_p^{-1}
vec2 diskRotateAbout(vec2 z, vec2 p, float theta) {
    z = diskTranslate(z, p);          // move p to origin
    z = diskRotate(z, theta);         // rotate about origin
    z = diskTranslate(z, -p);         // move back
    return z;
}

// ── Disk isometry: reflection across geodesic ──────────────────────────────
// Geodesic specified by two ideal points a, b on the unit circle.
// For a geodesic that is a diameter: reflection = Euclidean reflection.
// For a geodesic arc: inversion in the orthogonal circle.
vec2 reflectGeodesic(vec2 z, vec2 a, vec2 b) {
    if (abs(a.x*b.y - a.y*b.x) < 1e-8) {
        // Degenerate or parallel — just return z
        return z;
    }
    // Center of the geodesic circle (perpendicular to unit circle)
    // For ideal points a, b on unit circle, the center is:
    float acx = (1.0 + dot(a, a) - dot(a, b)) / (2.0*(a.x - b.x) + 1e-10);
    float acy = (1.0 + dot(b, b) - dot(a, b)) / (2.0*(a.y - b.y) + 1e-10);
    // Simple version for general case via Möbius construction:
    // Move a to 0, reflect across real axis, move back
    vec2 w = diskTranslate(z, a);
    w = vec2(w.x, -w.y);  // conjugate (reflection across real axis)
    return diskTranslate(w, -a);
}

// ── Inversive reflection across Euclidean circle ───────────────────────────
// z → c + R² · (z - c) / |z - c|²
vec2 invertCircle(vec2 z, vec2 center, float R2) {
    vec2 d = z - center;
    return center + (R2 / dot(d, d)) * d;
}

// ── Möbius composition ─────────────────────────────────────────────────────
// Compose f2 ∘ f1: first apply f1, then f2.
// Each Möbius map is stored as a 2×2 complex matrix [a,b; c,d].
// Composition = matrix multiplication.
void composeM(vec2 a1, vec2 b1, vec2 c1, vec2 d1,
              vec2 a2, vec2 b2, vec2 c2, vec2 d2,
              out vec2 a, out vec2 b, out vec2 c, out vec2 d) {
    a = cmul(a2, a1) + cmul(b2, c1);
    b = cmul(a2, b1) + cmul(b2, d1);
    c = cmul(c2, a1) + cmul(d2, c1);
    d = cmul(c2, b1) + cmul(d2, d1);
}

// ── Möbius inverse ─────────────────────────────────────────────────────────
// If f(z) = (az+b)/(cz+d), then f^{-1}(z) = (dz-b)/(-cz+a).
// For normalized (det=1): inverse is [d,-b; -c, a].
void invertM(vec2 a_in, vec2 b_in, vec2 c_in, vec2 d_in,
             out vec2 a, out vec2 b, out vec2 c, out vec2 d) {
    a =  d_in;
    b = -b_in;
    c = -c_in;
    d =  a_in;
}

// ── Classification of Möbius transformation ────────────────────────────────
// trace = a + d
// |trace|² < 4: elliptic (rotation-like)
// |trace|² = 4: parabolic (has one fixed point)
// |trace|² > 4: hyperbolic or loxodromic (two fixed points)
float mobiusTrace2(vec2 a, vec2 d) {
    vec2 trace = a + d;
    return dot(trace, trace);
}

// ── Hyperbolic distance ────────────────────────────────────────────────────
float hypDist(vec2 z1, vec2 z2) {
    vec2  diff  = z1 - z2;
    vec2  denom = vec2(1.0, 0.0) - cmul(conj(z1), z2);
    float r     = length(diff) / (length(denom) + 1e-12);
    r = clamp(r, 0.0, 1.0 - 1e-7);
    return log((1.0 + r) / (1.0 - r));
}

float hypDistFromOrigin(vec2 z) {
    float r = clamp(length(z), 0.0, 1.0 - 1e-7);
    return log((1.0 + r) / (1.0 - r));
}

// ── Conformal factor ───────────────────────────────────────────────────────
// The Poincaré metric: ds² = 4|dz|²/(1-|z|²)²
// Conformal factor at z: λ(z) = 2/(1 - |z|²)
float conformalFactor(vec2 z) {
    float r2 = dot(z, z);
    return 2.0 / max(1.0 - r2, 1e-8);
}

// ── Geodesic midpoint ──────────────────────────────────────────────────────
// Midpoint of the geodesic segment from z1 to z2 (in Poincaré disk).
// Move z1 to origin, find midpoint on real axis, move back.
vec2 geodesicMidpoint(vec2 z1, vec2 z2) {
    vec2 w2 = diskTranslate(z2, z1);  // move z1 to 0, z2 to w2
    float r = length(w2);
    float mid_r = tanh(0.5 * hypDistFromOrigin(w2));
    vec2  w_mid = (mid_r / (r + 1e-12)) * w2;
    return diskTranslate(w_mid, -z1);  // move back
}

// ── Perpendicular from point to geodesic ──────────────────────────────────
// The foot of the perpendicular from z to the geodesic through a and b.
// Move the geodesic to the real axis, drop perpendicular (set Im=0), move back.
vec2 geodesicFoot(vec2 z, vec2 a, vec2 b) {
    vec2 b2 = diskTranslate(b, a);     // move a to 0
    vec2 z2 = diskTranslate(z, a);     // move z too
    // Now the geodesic passes through 0 in direction b2.
    // Rotate so geodesic is the real axis.
    float ang = -atan(b2.y, b2.x);
    vec2  z3  = diskRotate(z2, ang);
    // Foot is at (z3.x, 0) on the real axis
    vec2  foot2 = vec2(z3.x, 0.0);
    // Rotate back
    vec2  foot1 = diskRotate(foot2, -ang);
    // Translate back
    return diskTranslate(foot1, -a);
}
