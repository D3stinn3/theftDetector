import os
from dataclasses import dataclass
from pathlib import Path

import yaml


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
MEDIA_EXTENSIONS = IMAGE_EXTENSIONS + (".mp4", ".mov", ".avi", ".mkv")
YOLO_SPLIT_KEYS = ("train", "val", "test")


@dataclass
class DatasetInspection:
    detected_format: str
    sample_count: int
    class_count: int
    yaml_path: str | None = None
    message: str | None = None


def _find_yaml_path(dataset_path: str) -> str | None:
    for name in ("data.yaml", "data.yml"):
        candidate = os.path.join(dataset_path, name)
        if os.path.exists(candidate):
            return candidate
    return None


def _count_images(directory: Path) -> int:
    if not directory.is_dir():
        return 0
    return sum(1 for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)


def _coerce_class_count(data: dict) -> int:
    names = data.get("names")
    if isinstance(names, list):
        return len(names)
    if isinstance(names, dict):
        return len(names)

    nc = data.get("nc")
    if isinstance(nc, int):
        return nc
    return 0


def _yaml_root(dataset_root: Path, data: dict) -> Path:
    yaml_root = data.get("path")
    if isinstance(yaml_root, str) and yaml_root.strip():
        path_value = Path(yaml_root.strip())
        if path_value.is_absolute():
            return path_value
        return (dataset_root / path_value).resolve()
    return dataset_root


def _resolve_split_path(dataset_root: Path, split_value: str | list[str]) -> Path | None:
    if isinstance(split_value, list):
        for value in split_value:
            resolved = _resolve_split_path(dataset_root, value)
            if resolved is not None:
                return resolved
        return None

    if not isinstance(split_value, str) or not split_value.strip():
        return None

    candidate = Path(split_value.strip())
    if candidate.is_absolute():
        return candidate

    return (dataset_root / candidate).resolve()


def inspect_yolo_dataset(dataset_path: str) -> DatasetInspection:
    dataset_root = Path(dataset_path).resolve()
    yaml_path = _find_yaml_path(str(dataset_root))
    if not yaml_path:
        sample_count = sum(
            1
            for path in dataset_root.rglob("*")
            if path.is_file() and path.suffix.lower() in MEDIA_EXTENSIONS
        )
        detected_format = "generic_media" if sample_count > 0 else "unknown"
        return DatasetInspection(detected_format, sample_count, 0, None, None)

    try:
        with open(yaml_path, "r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
    except Exception as exc:
        return DatasetInspection("unsupported", 0, 0, yaml_path, f"Failed to read dataset YAML: {exc}")

    if not isinstance(data, dict):
        return DatasetInspection("unsupported", 0, 0, yaml_path, "Dataset YAML must contain a mapping.")

    class_count = _coerce_class_count(data)
    yaml_root = _yaml_root(dataset_root, data)
    split_counts: dict[str, int] = {}
    missing: list[str] = []

    for split in YOLO_SPLIT_KEYS:
        if split not in data:
            continue
        resolved = _resolve_split_path(yaml_root, data[split])
        if resolved is None or not resolved.is_dir():
            missing.append(f"{split} path does not exist: {data[split]}")
            continue
        split_counts[split] = _count_images(resolved)

    if "train" not in data or not split_counts.get("train"):
        if "train" in data and "train path does not exist" not in " ".join(missing):
            missing.append("train split contains no images.")
        elif "train" not in data:
            missing.append("train split is missing from dataset YAML.")

    if "val" in data and not split_counts.get("val") and f"val path does not exist: {data.get('val')}" not in missing:
        missing.append("val split contains no images.")

    if missing:
        return DatasetInspection(
            "unsupported",
            sum(split_counts.values()),
            class_count,
            yaml_path,
            "YOLO dataset YAML found, but " + "; ".join(missing),
        )

    sample_count = sum(split_counts.values())
    return DatasetInspection("yolo", sample_count, class_count, yaml_path, None)


def normalize_uploaded_yolo_dataset(dataset_path: str) -> tuple[bool, str | None]:
    dataset_root = Path(dataset_path).resolve()
    yaml_path = _find_yaml_path(str(dataset_root))
    if not yaml_path:
        return False, None

    try:
        with open(yaml_path, "r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
    except Exception as exc:
        return False, f"Failed to read dataset YAML: {exc}"

    if not isinstance(data, dict):
        return False, "Dataset YAML must contain a mapping."

    changed = False
    preferred_dirs = {
        "train": "train/images",
        "val": "valid/images",
        "test": "test/images",
    }

    for split, preferred in preferred_dirs.items():
        split_value = data.get(split)
        if not isinstance(split_value, str):
            continue

        resolved = _resolve_split_path(dataset_root, split_value)
        if resolved is not None and resolved.is_dir():
            continue

        preferred_path = dataset_root / preferred
        if preferred_path.is_dir():
            data[split] = preferred
            changed = True

    if changed:
        data["path"] = str(dataset_root)
        with open(yaml_path, "w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False, allow_unicode=False)
        return True, None

    return False, None
