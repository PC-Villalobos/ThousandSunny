import unittest

from drive_boundary_scan import (
    FOLDER_MIME,
    GOOGLE_DOC_MIME,
    SHORTCUT_MIME,
    scan_inventory,
)


def item(item_id, name, mime_type, parents=None, shortcut_details=None):
    result = {"id": item_id, "name": name, "mimeType": mime_type, "parents": parents or []}
    if shortcut_details is not None:
        result["shortcutDetails"] = shortcut_details
    return result


class DriveBoundaryScanTests(unittest.TestCase):
    def test_shortcuts_are_resolved_but_never_followed(self):
        inventory = {"items": [
            item("root", "03_PROYECTOS", FOLDER_MIME),
            item("safe", "NEXUS", FOLDER_MIME, ["root"]),
            item("doc", "WP010", GOOGLE_DOC_MIME, ["safe"]),
            item("clinical", "NEMESIS_SISTEMA", FOLDER_MIME),
            item("shortcut", "DOCUMENTOS_FUNDACIONALES", SHORTCUT_MIME, ["safe"], {"targetId": "clinical"}),
        ]}
        report = scan_inventory(inventory, ["root"])
        self.assertEqual(report["classes"]["google_doc_requires_conversion"], 1)
        self.assertIn({"id": "shortcut", "reason": "shortcut_target_protected"}, report["blocked"])
        self.assertNotIn("clinical", report["roots"])

    def test_unresolved_shortcut_fails_closed(self):
        inventory = {"items": [
            item("root", "03_PROYECTOS", FOLDER_MIME),
            item("shortcut", "ETHICS", SHORTCUT_MIME, ["root"], {"targetId": "missing"}),
        ]}
        report = scan_inventory(inventory, ["root"])
        self.assertEqual(report["eligible_items"], 0)
        self.assertIn({"id": "shortcut", "reason": "shortcut_target_unresolved"}, report["blocked"])

    def test_missing_parent_metadata_fails_closed(self):
        inventory = {"items": [
            item("root", "03_PROYECTOS", FOLDER_MIME),
            item("orphan", "outside", GOOGLE_DOC_MIME, ["root", "missing-parent"]),
        ]}
        report = scan_inventory(inventory, ["root"])
        self.assertEqual(report["eligible_items"], 0)
        self.assertIn({"id": "orphan", "reason": "protected_or_incomplete_ancestry"}, report["blocked"])

    def test_explicit_local_denylist_blocks_a_nominal_subtree_without_its_name(self):
        inventory = {"items": [
            item("root", "04_PERSONAL", FOLDER_MIME),
            item("review", "unclassified", FOLDER_MIME, ["root"]),
            item("note", "dated-note", GOOGLE_DOC_MIME, ["review"]),
        ]}
        report = scan_inventory(inventory, ["root"], {"review"})
        self.assertEqual(report["classes"].get("google_doc_requires_conversion", 0), 0)
        self.assertEqual(report["denylist_entries"], 1)
        self.assertIn({"id": "review", "reason": "protected_or_incomplete_ancestry"}, report["blocked"])


if __name__ == "__main__":
    unittest.main()
