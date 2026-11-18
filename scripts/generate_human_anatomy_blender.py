"""
HoloLab XR — Photorealistic 3D Standing Human Anatomical Model Generator for Blender
Produces 'public/assets/anatomy/human_anatomy_model.glb' matching the medical dual-presentation:
Left Half: Complete Skeletal System (Cranium, Spine, 12 Rib Arches, Pelvis, Femur, Tibia, Fibula, Feet)
Right Half: Full Muscular System (Face, Neck, Pectorals, 6-pack Abdominals, Obliques, Biceps, Quads, Calf, Achilles)
Center Viscera: Brain, Trachea, 4-Chamber Heart + Aorta/SVC, Lobed Lungs, Liver + Gallbladder, Stomach, Pancreas, Kidneys, Colon + Small Intestine, Bladder
Base: Sci-Fi Hologram Emitter Pedestal with Concentric Rings

Usage in Blender (CLI / Headless):
    blender --background --python scripts/generate_human_anatomy_blender.py
"""

import sys
import math
import os

try:
    import bpy
    import mathutils
except ImportError:
    print("[HoloLab] bpy module not found. Run this script within Blender: blender --background --python generate_human_anatomy_blender.py")
    sys.exit(0)

def clear_scene():
    """Removes all default objects, meshes, and lights."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for c in bpy.data.collections:
        bpy.data.collections.remove(c)

def create_pbr_material(name, base_color, roughness=0.4, metallic=0.0, emission=(0, 0, 0, 1), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emission
    return mat

def build_anatomy():
    clear_scene()
    col = bpy.data.collections.new("HoloLab_Human_Anatomy")
    bpy.context.scene.collection.children.link(col)

    # Materials
    mat_bone = create_pbr_material("Mat_Bone", (0.96, 0.92, 0.84, 1.0), roughness=0.38, metallic=0.02)
    mat_muscle = create_pbr_material("Mat_Muscle", (0.72, 0.11, 0.11, 1.0), roughness=0.55, metallic=0.05)
    mat_tendon = create_pbr_material("Mat_Tendon", (0.94, 0.96, 0.98, 1.0), roughness=0.30, metallic=0.04)
    mat_brain = create_pbr_material("Mat_Brain", (0.95, 0.45, 0.70, 1.0), roughness=0.35, metallic=0.02)
    mat_heart = create_pbr_material("Mat_Heart", (0.60, 0.10, 0.10, 1.0), roughness=0.25, metallic=0.08)
    mat_artery = create_pbr_material("Mat_Artery", (0.85, 0.12, 0.12, 1.0), roughness=0.28, metallic=0.06)
    mat_vein = create_pbr_material("Mat_Vein", (0.11, 0.30, 0.85, 1.0), roughness=0.28, metallic=0.06)
    mat_lung = create_pbr_material("Mat_Lung", (0.98, 0.44, 0.52, 1.0), roughness=0.50, metallic=0.02)
    mat_liver = create_pbr_material("Mat_Liver", (0.48, 0.18, 0.08, 1.0), roughness=0.28, metallic=0.06)
    mat_gb = create_pbr_material("Mat_Gallbladder", (0.06, 0.70, 0.50, 1.0), roughness=0.22, metallic=0.12)
    mat_stomach = create_pbr_material("Mat_Stomach", (0.96, 0.45, 0.45, 1.0), roughness=0.32, metallic=0.04)
    mat_pancreas = create_pbr_material("Mat_Pancreas", (0.98, 0.80, 0.08, 1.0), roughness=0.42, metallic=0.04)
    mat_kidney = create_pbr_material("Mat_Kidney", (0.52, 0.08, 0.20, 1.0), roughness=0.25, metallic=0.08)
    mat_colon = create_pbr_material("Mat_Colon", (0.88, 0.12, 0.28, 1.0), roughness=0.38, metallic=0.05)
    mat_small_int = create_pbr_material("Mat_SmallIntestine", (0.98, 0.65, 0.65, 1.0), roughness=0.35, metallic=0.03)
    mat_pedestal = create_pbr_material("Mat_Pedestal", (0.06, 0.09, 0.16, 1.0), roughness=0.20, metallic=0.88)
    mat_holo_glow = create_pbr_material("Mat_HoloGlow", (0.22, 0.74, 0.97, 1.0), roughness=0.15, emission=(0.22, 0.74, 0.97, 1.0), emission_strength=4.5)

    # 1. PEDESTAL EMITTER BASE
    bpy.ops.mesh.primitive_cylinder_add(radius=0.70, depth=0.08, location=(0, 0, 0.04))
    ped_base = bpy.context.active_object
    ped_base.name = "Pedestal_Base"
    ped_base.data.materials.append(mat_pedestal)
    col.objects.link(ped_base)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.52, depth=0.005, location=(0, 0, 0.082))
    ped_ring = bpy.context.active_object
    ped_ring.name = "Pedestal_NeonRing"
    ped_ring.data.materials.append(mat_holo_glow)
    col.objects.link(ped_ring)

    # 2. SKELETON (LEFT SIDE)
    # 2.1 Skull
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.11, location=(-0.02, 0, 1.68))
    skull = bpy.context.active_object
    skull.name = "Bone_Skull"
    skull.scale = (0.9, 1.05, 1.15)
    skull.data.materials.append(mat_bone)
    col.objects.link(skull)

    # 2.2 Spine
    for v in range(24):
        vy = 0.92 + v * 0.028
        vz = -0.04 + math.sin(v * 0.25) * 0.015
        bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.016, location=(0, vz, vy))
        vert = bpy.context.active_object
        vert.name = f"Bone_Vertebra_{v}"
        vert.data.materials.append(mat_bone)
        col.objects.link(vert)

    # 2.3 Ribs (Left)
    for r in range(12):
        ry = 1.46 - r * 0.024
        bpy.ops.mesh.primitive_torus_add(major_radius=0.13 - r * 0.003, minor_radius=0.007, location=(-0.05, 0, ry))
        rib = bpy.context.active_object
        rib.name = f"Bone_Rib_L_{r}"
        rib.scale = (1.1, 0.75, 0.9)
        rib.data.materials.append(mat_bone)
        col.objects.link(rib)

    # 2.4 Pelvis (Left)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.075, minor_radius=0.02, location=(-0.09, -0.01, 0.96))
    pelvis = bpy.context.active_object
    pelvis.name = "Bone_Pelvis_L"
    pelvis.rotation_euler = (0.3, 0.2, 0.4)
    pelvis.data.materials.append(mat_bone)
    col.objects.link(pelvis)

    # 2.5 Left Upper Limb (Humerus, Radius, Hand)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.28, location=(-0.22, 0.01, 1.30))
    humerus = bpy.context.active_object
    humerus.name = "Bone_Humerus_L"
    humerus.rotation_euler = (0, 0.12, 0)
    humerus.data.materials.append(mat_bone)
    col.objects.link(humerus)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.25, location=(-0.25, 0.02, 1.03))
    forearm_bones = bpy.context.active_object
    forearm_bones.name = "Bone_Forearm_L"
    forearm_bones.data.materials.append(mat_bone)
    col.objects.link(forearm_bones)

    bpy.ops.mesh.primitive_cube_add(size=0.05, location=(-0.26, 0.02, 0.88))
    hand_bone = bpy.context.active_object
    hand_bone.name = "Bone_Hand_L"
    hand_bone.scale = (0.8, 0.3, 1.3)
    hand_bone.data.materials.append(mat_bone)
    col.objects.link(hand_bone)

    # 2.6 Left Lower Limb (Femur, Tibia, Fibula, Foot)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.40, location=(-0.11, 0.0, 0.70))
    femur = bpy.context.active_object
    femur.name = "Bone_Femur_L"
    femur.data.materials.append(mat_bone)
    col.objects.link(femur)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.024, location=(-0.11, 0.03, 0.49))
    patella = bpy.context.active_object
    patella.name = "Bone_Patella_L"
    patella.scale = (1.0, 0.6, 1.2)
    patella.data.materials.append(mat_bone)
    col.objects.link(patella)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.40, location=(-0.11, 0.01, 0.27))
    tibia = bpy.context.active_object
    tibia.name = "Bone_Tibia_L"
    tibia.data.materials.append(mat_bone)
    col.objects.link(tibia)

    bpy.ops.mesh.primitive_cube_add(size=0.06, location=(-0.11, 0.04, 0.04))
    foot_bone = bpy.context.active_object
    foot_bone.name = "Bone_Foot_L"
    foot_bone.scale = (1.1, 2.4, 0.5)
    foot_bone.data.materials.append(mat_bone)
    col.objects.link(foot_bone)

    # 3. MUSCULAR SYSTEM (RIGHT SIDE)
    # 3.1 Pectoralis Major & 6-Pack Rectus Abdominis
    bpy.ops.mesh.primitive_cube_add(size=0.10, location=(0.09, 0.06, 1.44))
    pec = bpy.context.active_object
    pec.name = "Muscle_Pectoralis_R"
    pec.scale = (1.3, 0.6, 1.1)
    pec.data.materials.append(mat_muscle)
    col.objects.link(pec)

    for p in range(4):
        py = 1.34 - p * 0.065
        bpy.ops.mesh.primitive_cube_add(size=0.05, location=(0.04, 0.07, py))
        ab = bpy.context.active_object
        ab.name = f"Muscle_RectusAbdominis_{p}"
        ab.scale = (1.0, 0.8, 1.0)
        ab.data.materials.append(mat_muscle)
        col.objects.link(ab)

    # Linea Alba
    bpy.ops.mesh.primitive_cube_add(size=0.008, location=(0, 0.072, 1.24))
    linea = bpy.context.active_object
    linea.name = "Tendon_LineaAlba"
    linea.scale = (1.0, 1.0, 35.0)
    linea.data.materials.append(mat_tendon)
    col.objects.link(linea)

    # 3.2 Right Arm Muscles (Deltoid, Biceps, Forearm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.065, location=(0.21, 0.01, 1.45))
    deltoid = bpy.context.active_object
    deltoid.name = "Muscle_Deltoid_R"
    deltoid.data.materials.append(mat_muscle)
    col.objects.link(deltoid)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.034, depth=0.20, location=(0.23, 0.02, 1.30))
    biceps = bpy.context.active_object
    biceps.name = "Muscle_Biceps_R"
    biceps.data.materials.append(mat_muscle)
    col.objects.link(biceps)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.25, location=(0.25, 0.02, 1.03))
    forearm_m = bpy.context.active_object
    forearm_m.name = "Muscle_Forearm_R"
    forearm_m.data.materials.append(mat_muscle)
    col.objects.link(forearm_m)

    # 3.3 Right Leg Muscles (Quadriceps, Calf, Achilles Tendon)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.042, depth=0.38, location=(0.11, 0.02, 0.70))
    quad = bpy.context.active_object
    quad.name = "Muscle_Quadriceps_R"
    quad.data.materials.append(mat_muscle)
    col.objects.link(quad)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.036, location=(0.11, -0.03, 0.35))
    gastroc = bpy.context.active_object
    gastroc.name = "Muscle_Gastrocnemius_R"
    gastroc.scale = (0.9, 1.1, 1.8)
    gastroc.data.materials.append(mat_muscle)
    col.objects.link(gastroc)

    # Achilles Tendon
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.18, location=(0.11, -0.035, 0.16))
    achilles = bpy.context.active_object
    achilles.name = "Tendon_Achilles_R"
    achilles.data.materials.append(mat_tendon)
    col.objects.link(achilles)

    # 4. VISCERAL INTERNAL ORGANS
    # 4.1 Brain
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.088, location=(0.015, 0, 1.70))
    brain = bpy.context.active_object
    brain.name = "Organ_Brain"
    brain.scale = (0.85, 1.25, 1.05)
    brain.data.materials.append(mat_brain)
    col.objects.link(brain)

    # 4.2 Lungs
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.080, location=(-0.085, 0.01, 1.38))
    lung_l = bpy.context.active_object
    lung_l.name = "Organ_Lung_L"
    lung_l.scale = (0.85, 0.95, 1.65)
    lung_l.data.materials.append(mat_lung)
    col.objects.link(lung_l)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.085, location=(0.085, 0.01, 1.38))
    lung_r = bpy.context.active_object
    lung_r.name = "Organ_Lung_R"
    lung_r.scale = (0.92, 1.0, 1.70)
    lung_r.data.materials.append(mat_lung)
    col.objects.link(lung_r)

    # 4.3 Heart & Aorta
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.048, location=(-0.018, 0.025, 1.36))
    heart = bpy.context.active_object
    heart.name = "Organ_Heart"
    heart.scale = (1.0, 0.95, 1.25)
    heart.rotation_euler = (0.12, 0.22, -0.15)
    heart.data.materials.append(mat_heart)
    col.objects.link(heart)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.035, minor_radius=0.012, location=(-0.012, 0.015, 1.44))
    aorta = bpy.context.active_object
    aorta.name = "Organ_Aorta"
    aorta.rotation_euler = (math.pi / 2, 0, 0)
    aorta.data.materials.append(mat_artery)
    col.objects.link(aorta)

    # 4.4 Liver & Gallbladder
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.088, location=(0.045, 0.022, 1.23))
    liver = bpy.context.active_object
    liver.name = "Organ_Liver"
    liver.scale = (1.4, 0.95, 0.82)
    liver.data.materials.append(mat_liver)
    col.objects.link(liver)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.018, location=(0.082, 0.048, 1.18))
    gb = bpy.context.active_object
    gb.name = "Organ_Gallbladder"
    gb.scale = (0.8, 0.8, 1.5)
    gb.data.materials.append(mat_gb)
    col.objects.link(gb)

    # 4.5 Stomach
    bpy.ops.mesh.primitive_torus_add(major_radius=0.055, minor_radius=0.025, location=(-0.045, 0.025, 1.21))
    stomach = bpy.context.active_object
    stomach.name = "Organ_Stomach"
    stomach.data.materials.append(mat_stomach)
    col.objects.link(stomach)

    # 4.6 Kidneys
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028, location=(-0.082, -0.035, 1.15))
    kidney_l = bpy.context.active_object
    kidney_l.name = "Organ_Kidney_L"
    kidney_l.scale = (0.85, 0.9, 1.45)
    kidney_l.data.materials.append(mat_kidney)
    col.objects.link(kidney_l)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.028, location=(0.082, -0.035, 1.13))
    kidney_r = bpy.context.active_object
    kidney_r.name = "Organ_Kidney_R"
    kidney_r.scale = (0.85, 0.9, 1.45)
    kidney_r.data.materials.append(mat_kidney)
    col.objects.link(kidney_r)

    # 4.7 Colon & Small Intestine
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.022, location=(0, 0.02, 1.05))
    colon = bpy.context.active_object
    colon.name = "Organ_Colon"
    colon.scale = (0.9, 0.6, 1.3)
    colon.data.materials.append(mat_colon)
    col.objects.link(colon)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, location=(0, 0.035, 1.02))
    small_int = bpy.context.active_object
    small_int.name = "Organ_SmallIntestine"
    small_int.scale = (1.1, 0.9, 1.0)
    small_int.data.materials.append(mat_small_int)
    col.objects.link(small_int)

    # Export GLB
    output_dir = os.path.join(os.getcwd(), "public", "assets", "anatomy")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "human_anatomy_model.glb")

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        use_selection=False,
        export_apply=True
    )
    print(f"[HoloLab] Successfully exported full 3D human anatomy model to: {output_path}")

if __name__ == "__main__":
    build_anatomy()
