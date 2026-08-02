/**
 * The default solid material.
 *
 * A minimal two-light lit shader, authored in GLSL against `ShaderMaterial` —
 * not three.js's node system (`TSL`), whose only reason to exist here would
 * have been compiling one source to two backends. There is one backend (see
 * #4 and #1), so plain GLSL is the more-trodden path with the best-exercised
 * WebXR support in three.js.
 *
 * This is deliberately not #13's hard-surface shading: no PBR presets, no
 * matcap option, no crease-aware outline pass. It exists so a booleaned solid
 * is legible — lit, with a visible silhouette — the moment #4 can draw one at
 * all. #13 replaces this material; it does not need to invent the seam it
 * plugs into.
 */

import { Color, ShaderMaterial, Vector3 } from 'three';

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uKeyLightDir;
  uniform vec3 uFillLightDir;
  uniform float uAmbient;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    if (!gl_FrontFacing) normal = -normal;

    float key = max(dot(normal, uKeyLightDir), 0.0);
    float fill = max(dot(normal, uFillLightDir), 0.0) * 0.35;

    vec3 viewDir = normalize(vViewPosition);
    vec3 halfVec = normalize(uKeyLightDir + viewDir);
    float specular = pow(max(dot(normal, halfVec), 0.0), 32.0) * 0.25;

    float lighting = uAmbient + key + fill;
    vec3 color = uColor * lighting + vec3(specular);
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Machined-aluminium-ish default: readable under a two-point light rig. */
const DEFAULT_COLOR = 0x9aa4ad;

export interface SolidMaterialOptions {
  readonly color?: number;
}

/**
 * A lit `ShaderMaterial` for evaluated solids.
 *
 * The light directions are declared in view space and never transformed by
 * the view matrix, so they ride along with the camera — a "headlamp" rig
 * rather than lights fixed in world space. That is deliberate for a CAD
 * viewport: orbiting the camera must never leave you staring at the
 * unlit side of a part. There are no `THREE.Light`s in this layer's scene
 * (see `scene-graph.ts`); #13 owns the real environment lighting.
 */
export function createSolidMaterial(options: SolidMaterialOptions = {}): ShaderMaterial {
  const color = new Color(options.color ?? DEFAULT_COLOR);
  return new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uColor: { value: color },
      uKeyLightDir: { value: new Vector3(0.5, 0.8, 0.3).normalize() },
      uFillLightDir: { value: new Vector3(-0.6, 0.2, -0.4).normalize() },
      uAmbient: { value: 0.25 },
    },
  });
}
