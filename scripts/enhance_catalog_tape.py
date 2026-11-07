"""Add realistic blue gel adhesive tape to the back of every catalog 3D model.

Run in the preview build only. Preserve approved card art, dimensions and text.
All models are checked before modification to avoid silently skipping products.
"""
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "src/models"
EXPECTED = {
    "review-standard", "review-branded", "beauty", "beauty-branded",
    "restaurant", "restaurant-branded", "review-acrylic", "instagram",
    "menu-square-black", "menu-square-white", "menu-round-black",
    "menu-round-white",
}
OLD_RIBBON_MESHES = {
    "Smooth rear ribbons", "Soft bevel and perimeter glint",
    "Continuous ribbon top sheen",
}


def gel_texture():
    """Blue protective film: translucent-looking satin reflection and fine grain."""
    height, width = 768, 256
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float32)
    u, v = xx / (width - 1), yy / (height - 1)
    glow = np.exp(-((u - 0.54) / 0.19) ** 2)
    edge = np.clip(np.minimum(u, 1-u) / 0.16, 0, 1)
    wave = 4.0 * np.sin(v * np.pi * 12 + u * 4.3)
    rng = np.random.default_rng(36)
    grain = rng.normal(0, 1.8, (height, width))
    pixels = np.empty((height, width, 3), dtype=np.uint8)
    for channel, base, highlight in ((0, 23, 34), (1, 119, 39), (2, 196, 29)):
        val = base + highlight * glow - (1-edge) * (30 if channel else 14) + wave + grain
        pixels[:, :, channel] = np.clip(val, 0, 255).astype(np.uint8)
    return Image.fromarray(pixels, "RGB")


def outline(cx, cy, width, height, radius, divisions=12):
    """Rounded rectangle, in the local plane of the original card."""
    hw, hh = width/2, height/2
    corners = [
        (cx+hw-radius, cy+hh-radius, 0, 90),
        (cx-hw+radius, cy+hh-radius, 90, 180),
        (cx-hw+radius, cy-hh+radius, 180, 270),
        (cx+hw-radius, cy-hh+radius, 270, 360),
    ]
    points = []
    for x, y, start, stop in corners:
        for a in np.linspace(start, stop, divisions, endpoint=False):
            theta = np.deg2rad(a)
            points.append([x+radius*np.cos(theta), y+radius*np.sin(theta)])
    return np.asarray(points, dtype=float)


def prism(points, z_inner, z_outer, material):
    """Raised foam-backed tape with continuous rounded edge walls."""
    n = len(points)
    outer = np.column_stack([points, np.full(n, z_outer)])
    inner = np.column_stack([points, np.full(n, z_inner)])
    center = [[outer[:, 0].mean(), outer[:, 1].mean(), z_outer]]
    vertices = np.vstack([outer, inner, center])
    faces = []
    for i in range(n):
        j = (i+1) % n
        faces.extend([[2*n, j, i], [i, j, n+j], [i, n+j, n+i]])
    return trimesh.Trimesh(
        vertices=vertices, faces=np.asarray(faces),
        visual=TextureVisuals(material=material), process=False,
    )


def top_film(points, z, cx, cy, width, height, texture):
    n = len(points)
    vertices = np.vstack([
        np.column_stack([points, np.full(n, z)]),
        [[cx, cy, z]],
    ])
    faces = [[n, (i+1) % n, i] for i in range(n)]
    uv = np.column_stack([
        (vertices[:, 0]-cx) / width + 0.5,
        (vertices[:, 1]-cy) / height + 0.5,
    ])
    material = PBRMaterial(
        name="Satin protective gel surface",
        baseColorTexture=texture,
        metallicFactor=0.05,
        roughnessFactor=0.31,
        doubleSided=True,
    )
    return trimesh.Trimesh(
        vertices=vertices,
        faces=np.asarray(faces),
        visual=TextureVisuals(uv=uv, material=material),
        process=False,
    )


def enhance_model(path, texture):
    scene = trimesh.load(path, force="scene", process=False)
    legacy = set(scene.geometry) & OLD_RIBBON_MESHES
    if legacy != OLD_RIBBON_MESHES:
        raise RuntimeError(f"{path.name}: original tape meshes missing: {OLD_RIBBON_MESHES-legacy}")
    scene.delete_geometry(sorted(legacy))
    if not scene.geometry:
        raise RuntimeError(f"{path.name}: no card geometry left")
    # The original card face points toward +Z; adhesive must face -Z.
    bounds = scene.bounds
    width = bounds[1, 0] - bounds[0, 0]
    height = bounds[1, 1] - bounds[0, 1]
    cx, cy = (bounds[1, :2] + bounds[0, :2]) / 2
    back_z = bounds[0, 2]
    if not (0.04 < width < 0.2 and 0.04 < height < 0.2 and back_z < 0):
        raise RuntimeError(f"{path.name}: unexpected geometry bounds: {bounds}")
    side_material = PBRMaterial(
        name="Deep blue foam adhesive edge",
        baseColorFactor=[0.028, 0.20, 0.36, 1],
        roughnessFactor=0.64,
        metallicFactor=0,
        doubleSided=True,
    )
    strip_width = width * 0.195
    strip_height = height * 0.845
    radius = min(strip_width * 0.19, 0.0035)
    for side, sign in (("left", -1), ("right", 1)):
        x = cx + sign * width * 0.24
        profile = outline(x, cy, strip_width, strip_height, radius)
        scene.add_geometry(
            prism(profile, back_z-0.00007, back_z-0.00094, side_material),
            geom_name=f"Realistic {side} adhesive ribbon",
            node_name=f"Realistic {side} adhesive ribbon",
        )
        film_width = strip_width * 0.94
        film_height = strip_height * 0.976
        sheet = outline(x, cy, film_width, film_height, radius*0.91)
        scene.add_geometry(
            top_film(sheet, back_z-0.000966, x, cy, film_width, film_height, texture),
            geom_name=f"Satin gel film {side}",
            node_name=f"Satin gel film {side}",
        )
    if scene.bounds[0, 2] >= back_z-0.0009:
        raise RuntimeError(f"{path.name}: adhesive strips did not protrude")
    path.write_bytes(scene.export(file_type="glb"))
    return width, height


def main():
    found = {p.stem: p for p in MODELS.glob("*.glb")}
    if set(found) != EXPECTED:
        raise RuntimeError(
            f"Model list mismatch: missing={EXPECTED-set(found)}, extra={set(found)-EXPECTED}"
        )
    texture = gel_texture()
    for name in sorted(found):
        width, height = enhance_model(found[name], texture)
        print(f"Realistic adhesive tape: {name} ({width*1000:.1f} x {height*1000:.1f} mm)")
    print(f"Refined rear ribbon geometry for all {len(found)} catalog 3D models")


if __name__ == "__main__":
    main()
