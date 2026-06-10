// _poincare_disc_73.frag
// Hyperbolic tiling {7,3}: seven triangles meeting at each vertex
// Poincaré disk model: geodesics are circular arcs perpendicular to boundary

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

// Hyperbolic distance in Poincaré disk
// d = atanh(|(z1-z2)/(1-conj(z1)*z2)|)
float hyperbolicDist(vec2 z1, vec2 z2) {
    vec2 diff = z1 - z2;
    vec2 denom = vec2(1.0, 0.0) - vec2(z1.x*z2.x + z1.y*z2.y, z1.y*z2.x - z1.x*z2.y);
    float denomLen = length(denom);
    if (denomLen < 0.001) return 100.0;
    vec2 ratio = vec2(
        (diff.x*denom.x + diff.y*denom.y) / (denomLen*denomLen),
        (diff.y*denom.x - diff.x*denom.y) / (denomLen*denomLen)
    );
    float r = length(ratio);
    return 0.5 * log((1.0 + r) / (1.0 - r));
}

// Distance from point to a hyperbolic line (circular arc)
// Line is defined by two ideal points on the unit circle
float distToLine(vec2 p, vec2 a, vec2 b) {
    // Euclidean center of the arc
    vec2 center;
    if (abs(a.x - b.x) < 0.001 && abs(a.y - b.y) < 0.001) {
        center = vec2(0.0);
    } else {
        // Perpendicular bisector of chord
        vec2 mid = (a + b) * 0.5;
        vec2 perp = normalize(vec2(a.y - b.y, b.x - a.x));
        // Center is on line through origin perpendicular to chord... wait
        // For Poincaré model, the arc is a circle perpendicular to unit circle
        // Simplified: approximate with Euclidean distance to chord for visual
        float d = abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
        d /= length(b - a);
        return d;
    }
    return length(p - center);
}

// SDF to regular {p,q} tiling edge network (simplified)
float tilingSDF(vec2 p) {
    float d = 100.0;
    
    // For {7,3}, we place 7-fold vertices and connect
    // Simplified: use regular polygon approximation in Poincaré disk
    
    // Central vertex at origin
    float dCenter = length(p);
    
    // First ring of vertices: 7 vertices at distance r from center
    // For {7,3}, vertex distance is determined by hyperbolic law of cosines
    // Approximate with Euclidean placement for visual starter
    float r1 = 0.45;
    for (int i = 0; i < 7; i++) {
        float angle = float(i) * 2.0 * 3.14159265 / 7.0 + u_time * 0.05;
        vec2 v = vec2(cos(angle), sin(angle)) * r1;
        float dv = length(p - v);
        d = min(d, dv);
        
        // Edges from center to first ring
        float edgeD = abs(length(p) - r1 * 0.5); // very crude approximation
        // Better: distance to line segment from 0 to v
        vec2 lineDir = normalize(v);
        float proj = dot(p, lineDir);
        float perp = length(p - lineDir * clamp(proj, 0.0, r1));
        d = min(d, perp);
    }
    
    return d;
}

// Color by hyperbolic distance from center
vec3 colorByDistance(vec2 p) {
    float dist = length(p); // Euclidean proxy for hyperbolic distance
    // In Poincaré model, hyperbolic distance grows faster near boundary
    float hDist = 0.5 * log((1.0 + dist) / (1.0 - dist));
    
    // Color gradient: deep center to bright boundary
    float t = clamp(hDist / 3.0, 0.0, 1.0);
    vec3 centerColor = vec3(0.05, 0.02, 0.15);
    vec3 midColor = vec3(0.2, 0.4, 0.6);
    vec3 boundaryColor = vec3(0.9, 0.7, 0.3);
    
    if (t < 0.5) {
        return mix(centerColor, midColor, t * 2.0);
    } else {
        return mix(midColor, boundaryColor, (t - 0.5) * 2.0);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Clip to unit disk
    if (length(uv) > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Hyperbolic tiling pattern
    float edge = tilingSDF(uv);
    
    // Base color by distance
    vec3 color = colorByDistance(uv);
    
    // Edge lines
    float line = smoothstep(0.02, 0.0, edge);
    color = mix(color, vec3(0.9, 0.9, 0.8), line * 0.7);
    
    // Vertex points
    float vertex = smoothstep(0.03, 0.0, edge);
    color += vec3(0.5, 0.3, 0.1) * vertex;
    
    // Boundary glow
    float boundary = 1.0 - length(uv);
    color += vec3(0.2, 0.15, 0.1) * exp(-boundary * 10.0) * 0.5;
    
    gl_FragColor = vec4(color, 1.0);
}
