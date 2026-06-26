#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for funcion_de_sueno.py — Thousand Sunny
stdlib unittest only, no external dependencies.
Run: python -m unittest test_funcion_de_sueno -v
"""
import sys
import json
import unittest
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from funcion_de_sueno import Sueno, parse_frontmatter, sha


class TestParseFrontmatter(unittest.TestCase):
    def test_parses_basic_key_value(self):
        text = "---\nname: Sofia\n---\nbody"
        meta, body = parse_frontmatter(text)
        self.assertEqual(meta.get("name"), "Sofia")
        self.assertEqual(body, "body")

    def test_no_frontmatter_returns_empty_meta(self):
        text = "just a note"
        meta, body = parse_frontmatter(text)
        self.assertEqual(meta, {})
        self.assertEqual(body, "just a note")

    def test_nested_metadata_block(self):
        text = "---\nname: Nami\nmetadata:\n  type: persona\n---\ncontent"
        meta, _ = parse_frontmatter(text)
        self.assertEqual(meta.get("name"), "Nami")
        self.assertIsInstance(meta.get("metadata"), dict)
        self.assertEqual(meta["metadata"].get("type"), "persona")

    def test_unclosed_frontmatter_returns_empty_meta(self):
        text = "---\nname: broken"
        meta, body = parse_frontmatter(text)
        self.assertEqual(meta, {})
        self.assertEqual(body, text)

    def test_empty_string_returns_empty_meta(self):
        meta, body = parse_frontmatter("")
        self.assertEqual(meta, {})
        self.assertEqual(body, "")

    def test_body_stripped_of_leading_newline(self):
        text = "---\nname: x\n---\n\nhello"
        _, body = parse_frontmatter(text)
        self.assertEqual(body, "hello")


class TestSha(unittest.TestCase):
    def test_returns_12_char_hex(self):
        result = sha("hello")
        self.assertEqual(len(result), 12)
        self.assertRegex(result, r'^[0-9a-f]{12}$')

    def test_same_input_produces_same_hash(self):
        self.assertEqual(sha("consistent"), sha("consistent"))

    def test_different_inputs_produce_different_hashes(self):
        self.assertNotEqual(sha("a"), sha("b"))

    def test_empty_string_produces_hash(self):
        result = sha("")
        self.assertEqual(len(result), 12)


class TestSuenoN1Scan(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.out = self.root / "sueno"
        self.sueno = Sueno(self.root, self.out)

    def tearDown(self):
        self.tmp.cleanup()

    def test_empty_root_returns_zero_notes(self):
        count = self.sueno.n1_scan()
        self.assertEqual(count, 0)
        self.assertEqual(self.sueno.notes, [])

    def test_scans_markdown_files(self):
        (self.root / "note.md").write_text("---\nname: test\n---\nhello", encoding="utf-8")
        count = self.sueno.n1_scan()
        self.assertEqual(count, 1)
        self.assertEqual(self.sueno.notes[0]["file"], "note.md")

    def test_skips_MEMORY_md(self):
        (self.root / "MEMORY.md").write_text("# Index", encoding="utf-8")
        (self.root / "note.md").write_text("# Note", encoding="utf-8")
        count = self.sueno.n1_scan()
        self.assertEqual(count, 1)
        self.assertEqual(self.sueno.notes[0]["file"], "note.md")

    def test_skips_files_inside_out_dir(self):
        self.out.mkdir(parents=True, exist_ok=True)
        (self.out / "report.md").write_text("# Sueno report", encoding="utf-8")
        count = self.sueno.n1_scan()
        self.assertEqual(count, 0)

    def test_detects_pendiente_flag(self):
        (self.root / "p.md").write_text("PENDIENTE: do something", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertTrue(self.sueno.notes[0]["pendiente"])

    def test_non_pending_note_has_pendiente_false(self):
        (self.root / "ok.md").write_text("---\nname: x\n---\ncompleted", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertFalse(self.sueno.notes[0]["pendiente"])

    def test_extracts_wikilinks(self):
        (self.root / "note.md").write_text("links to [[Nami]] and [[Zoro]]", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertIn("Nami", self.sueno.notes[0]["links"])
        self.assertIn("Zoro", self.sueno.notes[0]["links"])

    def test_wikilinks_are_deduplicated(self):
        (self.root / "note.md").write_text("[[X]] and [[X]] again", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertEqual(self.sueno.notes[0]["links"].count("X"), 1)

    def test_note_without_frontmatter_has_frontmatter_false(self):
        (self.root / "bare.md").write_text("just text", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertFalse(self.sueno.notes[0]["has_frontmatter"])

    def test_note_with_frontmatter_has_frontmatter_true(self):
        (self.root / "meta.md").write_text("---\nname: X\n---\ntext", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertTrue(self.sueno.notes[0]["has_frontmatter"])

    def test_scans_nested_markdown_files(self):
        sub = self.root / "sub"
        sub.mkdir()
        (sub / "nested.md").write_text("# Nested", encoding="utf-8")
        count = self.sueno.n1_scan()
        self.assertEqual(count, 1)

    def test_note_hash_is_12_char_hex(self):
        (self.root / "note.md").write_text("content", encoding="utf-8")
        self.sueno.n1_scan()
        h = self.sueno.notes[0]["hash"]
        self.assertRegex(h, r'^[0-9a-f]{12}$')

    def test_stems_populated_after_scan(self):
        (self.root / "mynote.md").write_text("# x", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertIn("mynote", self.sueno.stems)

    def test_names_populated_from_frontmatter(self):
        (self.root / "x.md").write_text("---\nname: Sofia\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        self.assertIn("Sofia", self.sueno.names)


class TestSuenoN2Consolidate(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.out = self.root / "sueno"
        self.sueno = Sueno(self.root, self.out)
        self.sueno.n1_scan()

    def tearDown(self):
        self.tmp.cleanup()

    def test_writes_episodica_jsonl(self):
        (self.root / "note.md").write_text("# Note", encoding="utf-8")
        self.sueno.n1_scan()
        self.sueno.n2_consolidate(None)
        self.assertTrue((self.out / "episodica.jsonl").exists())

    def test_episodica_has_one_line_per_note(self):
        (self.root / "a.md").write_text("# A", encoding="utf-8")
        (self.root / "b.md").write_text("# B", encoding="utf-8")
        self.sueno.n1_scan()
        self.sueno.n2_consolidate(None)
        lines = (self.out / "episodica.jsonl").read_text(encoding="utf-8").strip().splitlines()
        self.assertEqual(len(lines), 2)

    def test_episodica_entries_are_valid_json(self):
        (self.root / "note.md").write_text("# Note", encoding="utf-8")
        self.sueno.n1_scan()
        self.sueno.n2_consolidate(None)
        for line in (self.out / "episodica.jsonl").read_text(encoding="utf-8").strip().splitlines():
            data = json.loads(line)
            self.assertIn("file", data)

    def test_empty_roles_ledger_when_no_rotation_file(self):
        self.sueno.n2_consolidate(None)
        ledger_path = self.out / "roles_ledger.jsonl"
        self.assertTrue(ledger_path.exists())
        self.assertEqual(ledger_path.read_text(encoding="utf-8").strip(), "")

    def test_reads_rotation_file_into_ledger(self):
        rot = self.root / "rotation.jsonl"
        entry = {"rol": "nami", "modelo": "claude", "fecha": "2024-01-01"}
        rot.write_text(json.dumps(entry), encoding="utf-8")
        _, ledger = self.sueno.n2_consolidate(str(rot))
        self.assertEqual(len(ledger), 1)
        self.assertEqual(ledger[0]["rol"], "nami")

    def test_skips_invalid_json_lines_in_rotation_file(self):
        rot = self.root / "rotation.jsonl"
        rot.write_text('{"rol":"ok"}\nnot valid json\n{"rol":"also ok"}', encoding="utf-8")
        _, ledger = self.sueno.n2_consolidate(str(rot))
        self.assertEqual(len(ledger), 2)

    def test_nonexistent_rotation_file_returns_empty_ledger(self):
        _, ledger = self.sueno.n2_consolidate("/nonexistent/path/rotation.jsonl")
        self.assertEqual(ledger, [])


class TestSuenoN3Audit(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.out = self.root / "sueno"
        self.sueno = Sueno(self.root, self.out)

    def tearDown(self):
        self.tmp.cleanup()

    def test_no_issues_for_clean_note_with_frontmatter(self):
        (self.root / "note.md").write_text("---\nname: Sofia\n---\n# Sofia", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertFalse(any(i[0] == "SIN_FRONTMATTER" for i in issues))

    def test_detects_sin_frontmatter(self):
        (self.root / "bare.md").write_text("just text, no frontmatter", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertTrue(any(i[0] == "SIN_FRONTMATTER" for i in issues))

    def test_detects_enlace_huerfano(self):
        (self.root / "note.md").write_text("---\nname: x\n---\n[[NonExistentNote]]", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertTrue(any(i[0] == "ENLACE_HUERFANO" for i in issues))

    def test_valid_wikilink_is_not_orphan(self):
        (self.root / "a.md").write_text("---\nname: Alpha\n---\nlinks to [[b]]", encoding="utf-8")
        (self.root / "b.md").write_text("---\nname: Beta\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertFalse(any(i[0] == "ENLACE_HUERFANO" for i in issues))

    def test_wikilink_resolved_by_name_field(self):
        (self.root / "a.md").write_text("---\nname: Alpha\n---\n[[Beta]]", encoding="utf-8")
        (self.root / "b.md").write_text("---\nname: Beta\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertFalse(any(i[0] == "ENLACE_HUERFANO" for i in issues))

    def test_detects_nombre_duplicado(self):
        (self.root / "a.md").write_text("---\nname: Sofia\n---\n", encoding="utf-8")
        (self.root / "b.md").write_text("---\nname: Sofia\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertTrue(any(i[0] == "NOMBRE_DUPLICADO" for i in issues))

    def test_detects_indice_fantasma(self):
        (self.root / "MEMORY.md").write_text("[Ghost Note](ghost.md)", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertTrue(any(i[0] == "INDICE_FANTASMA" for i in issues))

    def test_detects_sin_indexar(self):
        (self.root / "MEMORY.md").write_text("# Empty index", encoding="utf-8")
        (self.root / "unindexed.md").write_text("---\nname: x\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertTrue(any(i[0] == "SIN_INDEXAR" for i in issues))

    def test_no_index_issues_when_no_memory_md(self):
        (self.root / "note.md").write_text("---\nname: x\n---\n", encoding="utf-8")
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertFalse(any(i[0] in ("INDICE_FANTASMA", "SIN_INDEXAR") for i in issues))

    def test_returns_list(self):
        self.sueno.n1_scan()
        issues = self.sueno.n3_audit()
        self.assertIsInstance(issues, list)


class TestSuenoRemIntegrate(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.out = self.root / "sueno"
        self.sueno = Sueno(self.root, self.out)

    def tearDown(self):
        self.tmp.cleanup()

    def test_no_warnings_for_alternating_models(self):
        ledger = [
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-01"},
            {"rol": "nami", "modelo": "codex", "fecha": "2024-01-02"},
        ]
        warnings, _ = self.sueno.rem_integrate(ledger, max_consecutive=3)
        self.assertEqual(warnings, [])

    def test_fusion_warning_when_streak_meets_threshold(self):
        ledger = [
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-01"},
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-02"},
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-03"},
        ]
        warnings, _ = self.sueno.rem_integrate(ledger, max_consecutive=3)
        self.assertTrue(len(warnings) > 0)
        self.assertIn("FUSIÓN", warnings[0])

    def test_no_warning_below_threshold(self):
        ledger = [
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-01"},
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-02"},
        ]
        warnings, _ = self.sueno.rem_integrate(ledger, max_consecutive=3)
        self.assertEqual(warnings, [])

    def test_writes_estado_json(self):
        (self.root / "note.md").write_text("# note", encoding="utf-8")
        self.sueno.n1_scan()
        self.sueno.rem_integrate([], max_consecutive=3)
        estado = self.out / "estado.json"
        self.assertTrue(estado.exists())
        data = json.loads(estado.read_text(encoding="utf-8"))
        self.assertIn("note.md", data)

    def test_diff_detects_added_files(self):
        (self.root / "new.md").write_text("# new", encoding="utf-8")
        self.sueno.n1_scan()
        _, (added, changed, removed) = self.sueno.rem_integrate([], max_consecutive=3)
        self.assertIn("new.md", added)

    def test_diff_detects_removed_files(self):
        prev_state = {"old.md": "abc123def456"}
        self.out.mkdir(parents=True, exist_ok=True)
        (self.out / "estado.json").write_text(json.dumps(prev_state), encoding="utf-8")
        self.sueno.n1_scan()
        _, (added, changed, removed) = self.sueno.rem_integrate([], max_consecutive=3)
        self.assertIn("old.md", removed)

    def test_diff_detects_changed_files(self):
        note = self.root / "note.md"
        note.write_text("original content", encoding="utf-8")
        old_hash = sha("original content")
        self.out.mkdir(parents=True, exist_ok=True)
        # Write a different hash so the file appears modified
        (self.out / "estado.json").write_text(
            json.dumps({"note.md": old_hash[:6] + "AAAAAA"}), encoding="utf-8"
        )
        self.sueno.n1_scan()
        _, (added, changed, removed) = self.sueno.rem_integrate([], max_consecutive=3)
        self.assertIn("note.md", changed)

    def test_handles_corrupted_estado_json(self):
        self.out.mkdir(parents=True, exist_ok=True)
        (self.out / "estado.json").write_text("not valid json at all", encoding="utf-8")
        self.sueno.n1_scan()
        warnings, diff = self.sueno.rem_integrate([], max_consecutive=3)
        self.assertIsInstance(warnings, list)

    def test_empty_ledger_produces_no_warnings(self):
        warnings, _ = self.sueno.rem_integrate([], max_consecutive=3)
        self.assertEqual(warnings, [])

    def test_warnings_are_deduplicated(self):
        ledger = [
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-01"},
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-02"},
            {"rol": "nami", "modelo": "claude", "fecha": "2024-01-03"},
        ]
        warnings, _ = self.sueno.rem_integrate(ledger, max_consecutive=3)
        self.assertEqual(len(warnings), len(set(warnings)))


class TestSuenoRun(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.out = self.root / "sueno"

    def tearDown(self):
        self.tmp.cleanup()

    def test_run_produces_report_file(self):
        (self.root / "note.md").write_text("---\nname: test\n---\nhello", encoding="utf-8")
        Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        self.assertTrue((self.out / "coherencia_report.md").exists())

    def test_run_report_contains_timestamp_header(self):
        report = Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        self.assertIn("Informe de sueño", report)

    def test_run_report_contains_n3_header_when_n3_phase_active(self):
        (self.root / "note.md").write_text("# bare", encoding="utf-8")
        report = Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        self.assertIn("N3", report)

    def test_run_report_contains_rem_header_when_rem_phase_active(self):
        report = Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        self.assertIn("REM", report)

    def test_run_subset_n3_only(self):
        report = Sueno(self.root, self.out).run(None, 3, ["N1", "N3"])
        self.assertIn("N3", report)
        self.assertNotIn("## REM", report)

    def test_run_with_empty_root_succeeds(self):
        report = Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        self.assertIsInstance(report, str)
        self.assertTrue(len(report) > 0)

    def test_run_creates_out_directory(self):
        self.assertFalse(self.out.exists())
        Sueno(self.root, self.out).run(None, 3, ["N1"])
        self.assertTrue(self.out.exists())

    def test_run_n1_only_no_episodica(self):
        Sueno(self.root, self.out).run(None, 3, ["N1"])
        # N2 not in phases, so episodica.jsonl should not be written
        self.assertFalse((self.out / "episodica.jsonl").exists())

    def test_run_n2_writes_episodica(self):
        (self.root / "note.md").write_text("# x", encoding="utf-8")
        Sueno(self.root, self.out).run(None, 3, ["N1", "N2"])
        self.assertTrue((self.out / "episodica.jsonl").exists())

    def test_second_run_does_not_raise(self):
        (self.root / "note.md").write_text("---\nname: Stable\n---\ntext", encoding="utf-8")
        Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        try:
            Sueno(self.root, self.out).run(None, 3, ["N1", "N2", "N3", "REM"])
        except Exception as e:
            self.fail(f"Second run raised: {e}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
