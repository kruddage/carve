/**
 * The transform gizmo: what its handles are, and how they are drawn.
 *
 * Two halves, and the split is the point. `GIZMO_HANDLES` is **plain data** —
 * ids, axes, and a box each, in a unit-sized gizmo space — with no three.js in
 * sight. `GizmoOverlay` is the three.js objects built from that data. The UI
 * layer hit-tests against the same table the renderer draws from
 * (`src/ui/gizmo-drag.ts`), so a handle you can see is a handle you can grab,
 * and moving an arrow means editing one array rather than keeping a renderer
 * and a picker in agreement by hand.
 *
 * The alternative — hit-testing the drawn meshes with a raycaster — would put
 * `THREE.Object3D` in the picker's signature, which `index.ts` forbids for good
 * reasons, and would make "does clicking the X arrow start an X drag" a test
 * that needs a GPU.
 *
 * ## Unit space, scaled at draw time
 *
 * Every handle is described in a space where the gizmo is one unit long. The
 * overlay multiplies by a screen-size factor the viewport computes from camera
 * distance, so the gizmo stays the same size on screen whether you are looking
 * at a 6mm chamfer or a 600mm bracket. A gizmo that scales with the model is
 * unusable at both ends of that range.
 *
 * ## Why the ring is not a box
 *
 * Five of the six handle shapes are boxes and hit-test as boxes. A rotation
 * ring cannot: its bounding box is the entire disc, so a click anywhere near
 * the centre would grab it, including on top of the translate arrows. It gets
 * its own hit shape — a plane test plus a radius band — declared here as
 * `kind: 'ring'` and implemented in the picker.
 */

import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  TorusGeometry,
  type Material,
} from 'three';

/**
 * An axis-aligned box in gizmo space.
 *
 * Structurally identical to `Aabb` in `src/input/geometry.ts` and declared
 * separately on purpose: `src/render/` sits inside `src/input/` in the
 * dependency order (see `src/main.ts`), so importing the input layer here would
 * invert it. Same reasoning as `CameraPose` versus `ViewPose`.
 */
export interface HandleBox {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export const GIZMO_AXES = ['x', 'y', 'z'] as const;
export type GizmoAxis = (typeof GIZMO_AXES)[number];

/** How a handle is hit-tested, and therefore what it looks like. */
export type HandleKind = 'axis' | 'plane' | 'ring' | 'uniform';

export interface GizmoHandle {
  /** Stable id — `translate-x`, `rotate-y`, `scale-uniform`. Used as a map key. */
  readonly id: string;
  readonly mode: 'translate' | 'rotate' | 'scale';
  readonly kind: HandleKind;
  /**
   * The axis this handle acts along, about, or normal to. `null` for the
   * uniform-scale cube, which has no axis at all.
   */
  readonly axis: GizmoAxis | null;
  /**
   * For a `plane` handle: the two axes the drag moves in. Derived from `axis`
   * (which is the plane's normal) rather than stored, so the two can't disagree.
   */
  readonly box: HandleBox;
  /** Ring radius in gizmo space. Only meaningful for `kind: 'ring'`. */
  readonly radius?: number;
  /** 0xRRGGBB. Red/green/blue for X/Y/Z is the convention every tool shares. */
  readonly color: number;
}

const AXIS_COLORS: Readonly<Record<GizmoAxis, number>> = Object.freeze({
  x: 0xff5964,
  y: 0x6ee07a,
  z: 0x5aa9ff,
});

/** Neutral handles — uniform scale, and a plane quad's tint. */
const NEUTRAL_COLOR = 0xf0d264;

/** Highlight applied to whichever handle the cursor is over or is dragging. */
export const GIZMO_HIGHLIGHT_COLOR = 0xffe066;

/**
 * Drawn after everything else, so a gizmo inside the solid it transforms is
 * still usable. Above the selection boxes (900) and below the snap marker
 * (1100), which has to be visible even over a handle.
 */
const GIZMO_RENDER_ORDER = 1000;

/** Shaft half-thickness. Generous: a 3px arrow is a 3px click target. */
const SHAFT_HALF = 0.07;
/** Where a shaft starts, so the three axes don't overlap in a ball at the origin. */
const SHAFT_START = 0.16;
const SHAFT_END = 1;
/** Plane quad, offset along both of its axes so it sits in the corner between them. */
const PLANE_NEAR = 0.24;
const PLANE_FAR = 0.52;
const PLANE_HALF_THICKNESS = 0.04;
/** Uniform-scale cube at the origin. */
const UNIFORM_HALF = 0.12;
export const GIZMO_RING_RADIUS = 1;
/** How far off the ring a click may land and still count, in gizmo units. */
export const GIZMO_RING_TOLERANCE = 0.11;

/** `axis` → index into an `[x, y, z]` triple. */
export function axisIndex(axis: GizmoAxis): 0 | 1 | 2 {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
}

/** The two axes spanning the plane whose normal is `axis`, in x→y→z order. */
export function planeAxes(axis: GizmoAxis): readonly [GizmoAxis, GizmoAxis] {
  return GIZMO_AXES.filter((candidate) => candidate !== axis) as unknown as readonly [
    GizmoAxis,
    GizmoAxis,
  ];
}

function shaftBox(axis: GizmoAxis, from: number, to: number): HandleBox {
  const min: [number, number, number] = [-SHAFT_HALF, -SHAFT_HALF, -SHAFT_HALF];
  const max: [number, number, number] = [SHAFT_HALF, SHAFT_HALF, SHAFT_HALF];
  min[axisIndex(axis)] = from;
  max[axisIndex(axis)] = to;
  return { min, max };
}

function planeBox(normal: GizmoAxis): HandleBox {
  const min: [number, number, number] = [PLANE_NEAR, PLANE_NEAR, PLANE_NEAR];
  const max: [number, number, number] = [PLANE_FAR, PLANE_FAR, PLANE_FAR];
  min[axisIndex(normal)] = -PLANE_HALF_THICKNESS;
  max[axisIndex(normal)] = PLANE_HALF_THICKNESS;
  return { min, max };
}

/** The ring's box is the disc it lies in; the picker uses `radius`, not this. */
function ringBox(axis: GizmoAxis): HandleBox {
  const reach = GIZMO_RING_RADIUS + GIZMO_RING_TOLERANCE;
  const min: [number, number, number] = [-reach, -reach, -reach];
  const max: [number, number, number] = [reach, reach, reach];
  min[axisIndex(axis)] = -GIZMO_RING_TOLERANCE;
  max[axisIndex(axis)] = GIZMO_RING_TOLERANCE;
  return { min, max };
}

/**
 * Every handle, in hit-test priority order.
 *
 * Order matters and is not alphabetical: plane quads come **before** the axis
 * shafts they sit between, because the quad overlaps the near end of both
 * shafts and a first-match picker would otherwise never let you grab one. The
 * uniform cube comes first for the same reason — it sits at the origin where
 * all three shafts begin.
 */
export const GIZMO_HANDLES: readonly GizmoHandle[] = Object.freeze([
  {
    id: 'scale-uniform',
    mode: 'scale',
    kind: 'uniform',
    axis: null,
    box: {
      min: [-UNIFORM_HALF, -UNIFORM_HALF, -UNIFORM_HALF],
      max: [UNIFORM_HALF, UNIFORM_HALF, UNIFORM_HALF],
    },
    color: NEUTRAL_COLOR,
  },
  ...GIZMO_AXES.map((axis): GizmoHandle => ({
    id: `translate-plane-${axis}`,
    mode: 'translate',
    kind: 'plane',
    axis,
    box: planeBox(axis),
    color: AXIS_COLORS[axis],
  })),
  ...GIZMO_AXES.map((axis): GizmoHandle => ({
    id: `translate-${axis}`,
    mode: 'translate',
    kind: 'axis',
    axis,
    box: shaftBox(axis, SHAFT_START, SHAFT_END + 0.18),
    color: AXIS_COLORS[axis],
  })),
  ...GIZMO_AXES.map((axis): GizmoHandle => ({
    id: `scale-${axis}`,
    mode: 'scale',
    kind: 'axis',
    axis,
    box: shaftBox(axis, SHAFT_START, SHAFT_END + 0.1),
    color: AXIS_COLORS[axis],
  })),
  ...GIZMO_AXES.map((axis): GizmoHandle => ({
    id: `rotate-${axis}`,
    mode: 'rotate',
    kind: 'ring',
    axis,
    box: ringBox(axis),
    radius: GIZMO_RING_RADIUS,
    color: AXIS_COLORS[axis],
  })),
]);

/** The handles active in one gizmo mode, in hit-test priority order. */
export function handlesFor(mode: GizmoHandle['mode']): readonly GizmoHandle[] {
  return GIZMO_HANDLES.filter((handle) => handle.mode === mode);
}

export function findHandle(id: string): GizmoHandle | undefined {
  return GIZMO_HANDLES.find((handle) => handle.id === id);
}

/** What the viewport tells the renderer about the gizmo each frame. */
export interface GizmoState {
  /**
   * Gizmo space → world. Translation and rotation only; the caller strips the
   * selected node's scale, or a gizmo on a 10× scaled part is ten times as big
   * and its arrows point the wrong lengths.
   */
  readonly matrix: readonly number[];
  readonly mode: GizmoHandle['mode'];
  /** Uniform scale applied inside `matrix`, so the gizmo holds its screen size. */
  readonly size: number;
  /** Handle currently hovered or being dragged, drawn highlighted. */
  readonly activeId: string | null;
}

/**
 * The three.js objects for the gizmo.
 *
 * Internal to `src/render/` — the renderer's public surface takes a
 * `GizmoState` and never hands an `Object3D` out. Everything here draws with
 * `depthTest: false` and a high render order: a gizmo hidden inside the solid
 * it transforms is a gizmo you cannot use, and every modeler makes the same
 * choice.
 */
export class GizmoOverlay {
  readonly group = new Group();
  readonly #byHandle = new Map<string, { readonly node: Group; readonly materials: Material[] }>();
  readonly #owned: (BufferGeometry | Material)[] = [];
  #mode: GizmoHandle['mode'] = 'translate';

  constructor() {
    this.group.visible = false;
    for (const handle of GIZMO_HANDLES) {
      const built = this.#build(handle);
      built.node.visible = false;
      this.group.add(built.node);
      this.#byHandle.set(handle.id, built);
    }
    // `renderOrder` is per-object and does **not** inherit from a parent Group,
    // so it has to be stamped on every mesh. Setting it on the group alone
    // leaves the arrows at order 0, where they sort into the opaque pass
    // against the solid — and `depthWrite: false` means the solid then draws
    // straight over them. The symptom is a gizmo whose translucent plane quads
    // are visible (they are in the transparent pass, which runs last) while its
    // arrows are invisible whenever the selection is between them and the eye.
    this.group.traverse((child) => {
      child.renderOrder = GIZMO_RENDER_ORDER;
    });
  }

  /** Hide the gizmo entirely — nothing selected, or a drag in another surface. */
  clear(): void {
    this.group.visible = false;
  }

  update(state: GizmoState): void {
    this.group.visible = true;
    this.#mode = state.mode;

    const matrix = new Matrix4().fromArray([...state.matrix]);
    matrix.multiply(new Matrix4().makeScale(state.size, state.size, state.size));
    this.group.matrix.copy(matrix);
    this.group.matrixAutoUpdate = false;
    this.group.matrixWorldNeedsUpdate = true;

    for (const handle of GIZMO_HANDLES) {
      const built = this.#byHandle.get(handle.id);
      if (!built) continue;
      built.node.visible = handle.mode === this.#mode;
      const color = handle.id === state.activeId ? GIZMO_HIGHLIGHT_COLOR : handle.color;
      for (const material of built.materials) {
        if ('color' in material) (material as MeshBasicMaterial).color.setHex(color);
      }
    }
  }

  dispose(): void {
    for (const resource of this.#owned) resource.dispose();
    this.#owned.length = 0;
    this.#byHandle.clear();
  }

  #material(color: number, opacity: number): MeshBasicMaterial {
    const material = new MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      transparent: opacity < 1,
      opacity,
      // Two-sided because a plane quad and a ring are both routinely viewed
      // from behind, and a one-sided handle that vanishes when you orbit past
      // it reads as a bug in the gizmo rather than a property of the material.
      side: 2,
    });
    this.#owned.push(material);
    return material;
  }

  #geometry<T extends BufferGeometry>(geometry: T): T {
    this.#owned.push(geometry);
    return geometry;
  }

  #build(handle: GizmoHandle): { node: Group; materials: Material[] } {
    const node = new Group();
    const materials: Material[] = [];

    switch (handle.kind) {
      case 'axis': {
        if (!handle.axis) break;
        const material = this.#material(handle.color, 1);
        materials.push(material);
        const length = SHAFT_END - SHAFT_START;
        const shaft = new Mesh(this.#geometry(new BoxGeometry(0.022, length, 0.022)), material);
        orientAlong(shaft, handle.axis, SHAFT_START + length / 2);
        node.add(shaft);

        // A cone tip for translate, a cube tip for scale — the two modes share
        // a shaft, and the tip is the only thing that says which one you are in.
        const tip =
          handle.mode === 'translate'
            ? new Mesh(this.#geometry(new ConeGeometry(0.07, 0.22, 16)), material)
            : new Mesh(this.#geometry(new BoxGeometry(0.13, 0.13, 0.13)), material);
        orientAlong(tip, handle.axis, SHAFT_END + (handle.mode === 'translate' ? 0.11 : 0));
        node.add(tip);
        break;
      }
      case 'plane': {
        if (!handle.axis) break;
        const material = this.#material(handle.color, 0.35);
        materials.push(material);
        const size = PLANE_FAR - PLANE_NEAR;
        const quad = new Mesh(this.#geometry(new PlaneGeometry(size, size)), material);
        const centre = (PLANE_NEAR + PLANE_FAR) / 2;
        const [a, b] = planeAxes(handle.axis);
        quad.position.setComponent(axisIndex(a), centre);
        quad.position.setComponent(axisIndex(b), centre);
        // A `PlaneGeometry` lies in XY; rotate its normal onto `handle.axis`.
        if (handle.axis === 'x') quad.rotation.y = Math.PI / 2;
        if (handle.axis === 'y') quad.rotation.x = Math.PI / 2;
        node.add(quad);
        break;
      }
      case 'ring': {
        if (!handle.axis) break;
        const material = this.#material(handle.color, 1);
        materials.push(material);
        const ring = new Mesh(
          this.#geometry(new TorusGeometry(GIZMO_RING_RADIUS, 0.016, 8, 96)),
          material,
        );
        // `TorusGeometry` lies in XY with its axis on Z; rotate to `handle.axis`.
        if (handle.axis === 'x') ring.rotation.y = Math.PI / 2;
        if (handle.axis === 'y') ring.rotation.x = Math.PI / 2;
        node.add(ring);
        break;
      }
      case 'uniform': {
        const material = this.#material(handle.color, 1);
        materials.push(material);
        const size = UNIFORM_HALF * 2 * 0.8;
        node.add(new Mesh(this.#geometry(new BoxGeometry(size, size, size)), material));
        break;
      }
    }

    return { node, materials };
  }
}

/** Stand a Y-aligned primitive up along `axis`, `along` units out from the origin. */
function orientAlong(mesh: Mesh, axis: GizmoAxis, along: number): void {
  if (axis === 'x') mesh.rotation.z = -Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.position.setComponent(axisIndex(axis), along);
}

/** Brightness of a fine grid line at the origin, and of a major one. */
const GRID_MINOR = 0.1;
const GRID_MAJOR = 0.34;
/** Every tenth line is major, which at a 10mm step puts a heavy line every 100mm. */
const GRID_MAJOR_EVERY = 10;

/**
 * A ground grid, fading out with distance.
 *
 * `LineSegments` with per-vertex brightness baked into a vertex colour, rather
 * than a shader: the grid is drawn once per frame with a few thousand vertices,
 * and a bespoke material here would be a second thing #13 has to replace when
 * it arrives with the real environment.
 *
 * Deliberately dim, and deliberately **not** additively blended. Both were
 * tried the other way and both were wrong for the same reason: a grid fine
 * enough to measure against is dense enough that, at any camera angle other
 * than straight down, hundreds of lines land in a handful of pixels. Additive
 * blending sums them and the far half of the floor turns into a solid white
 * sheet with the part invisible in front of it. Normal blending at low opacity
 * saturates instead of accumulating, so distance makes the grid quieter rather
 * than brighter — which is what "fading with distance" has to mean.
 */
export function createGroundGrid(extent: number, step: number): LineSegments {
  const positions: number[] = [];
  const shades: number[] = [];
  const lines = Math.floor(extent / step);

  for (let i = -lines; i <= lines; i += 1) {
    const offset = i * step;
    // Squared falloff, so the density that builds up towards the horizon is
    // cancelled by how fast those lines dim.
    const fade = (1 - Math.abs(offset) / extent) ** 2;
    const weight = i % GRID_MAJOR_EVERY === 0 ? GRID_MAJOR : GRID_MINOR;
    for (const [ax, az, bx, bz] of [
      [offset, -extent, offset, extent],
      [-extent, offset, extent, offset],
    ] as const) {
      positions.push(ax, 0, az, bx, 0, bz);
      shades.push(fade * weight, fade * weight);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  const colors = new Float32Array(shades.length * 3);
  shades.forEach((shade, index) => {
    colors[index * 3] = shade * 0.82;
    colors[index * 3 + 1] = shade * 0.88;
    colors[index * 3 + 2] = shade;
  });
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  return new LineSegments(
    geometry,
    new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }),
  );
}
