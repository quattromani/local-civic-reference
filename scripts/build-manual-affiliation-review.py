#!/usr/bin/env python3
"""Build the internal affiliation-review worksheet from the certified dataset."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    CondPageBreak,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATASET = PROJECT_ROOT / "src" / "data" / "elections" / "2026" / "election-directory.json"
DEFAULT_MARKDOWN = PROJECT_ROOT / "project-docs" / "review-materials" / "manual-affiliation-review-worksheet.md"
DEFAULT_PDF = PROJECT_ROOT / "project-docs" / "review-materials" / "manual-affiliation-review-worksheet.pdf"


@dataclass(frozen=True)
class WorksheetRow:
    candidate: str
    office: str
    status: str
    affiliation: str


@dataclass(frozen=True)
class OfficeGroup:
    office_id: str
    office_name: str
    category: str
    display_order: int
    candidate_order: str
    rows: tuple[WorksheetRow, ...]


class FooterCanvas(canvas.Canvas):
    """Add final Page X of Y footers without changing document flow."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):  # noqa: N802 - ReportLab API name
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for page_number, state in enumerate(self._saved_page_states, start=1):
            self.__dict__.update(state)
            self._draw_footer(page_number, total_pages)
            super().showPage()
        super().save()

    def _draw_footer(self, page_number: int, total_pages: int):
        width, _ = landscape(letter)
        self.saveState()
        self.setStrokeColor(colors.black)
        self.setLineWidth(0.35)
        self.line(0.4 * inch, 0.37 * inch, width - 0.4 * inch, 0.37 * inch)
        self.setFillColor(colors.black)
        self.setFont("Helvetica", 7.5)
        self.drawString(0.4 * inch, 0.22 * inch, "Internal Working Document")
        self.drawCentredString(width / 2, 0.22 * inch, "Not for Publication")
        self.drawRightString(
            width - 0.4 * inch,
            0.22 * inch,
            f"Page {page_number} of {total_pages}",
        )
        self.restoreState()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--markdown", type=Path, default=DEFAULT_MARKDOWN)
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument(
        "--generated-date",
        default=date.today().strftime("%B %-d, %Y"),
        help="Human-readable generation date printed on the worksheet.",
    )
    return parser.parse_args()


def escape_markdown(value: str) -> str:
    return value.replace("|", "\\|")


def load_dataset(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def build_office_groups(dataset: dict) -> tuple[list[str], dict[str, list[OfficeGroup]], int]:
    candidates = {item["candidateId"]: item for item in dataset["candidates"]}
    affiliations = {item["affiliationId"]: item for item in dataset["affiliations"]}
    candidacies_by_office: dict[str, list[dict]] = {}
    for candidacy in dataset["candidacies"]:
        candidacies_by_office.setdefault(candidacy["officeId"], []).append(candidacy)

    policies = sorted(
        dataset["orderingPolicy"]["categories"],
        key=lambda item: item["categoryPosition"],
    )
    categories = [item["category"] for item in policies]
    policy_by_category = {item["category"]: item for item in policies}
    groups: dict[str, list[OfficeGroup]] = {category: [] for category in categories}

    for office in dataset["offices"]:
        category = office["category"]
        office_rows: list[tuple[int, str, WorksheetRow]] = []
        for candidacy in candidacies_by_office.get(office["officeId"], []):
            candidate = candidates[candidacy["candidateId"]]
            affiliation = affiliations[candidacy["affiliationId"]]
            stage = candidacy["electionStageGroup"]
            stage_label = (
                "Current General Candidate"
                if stage == "current-general-election"
                else "Primary History"
            )
            if affiliation["verificationState"] != "Verified":
                stage_label = f"{stage_label}; Verification Pending"
            stage_position = 0 if stage == "current-general-election" else 1
            row = WorksheetRow(
                candidate=candidate["displayName"],
                office=office["officeName"],
                status=stage_label,
                affiliation=affiliation["label"],
            )
            office_rows.append((stage_position, candidate["displayName"].casefold(), row))

        office_rows.sort(key=lambda item: (item[0], item[1]))
        groups[category].append(
            OfficeGroup(
                office_id=office["officeId"],
                office_name=office["officeName"],
                category=category,
                display_order=office["displayOrder"],
                candidate_order=office["candidateOrder"],
                rows=tuple(item[2] for item in office_rows),
            )
        )

    for category, office_groups in groups.items():
        policy = policy_by_category[category]["officeOrder"]
        if policy == "alphabetical":
            office_groups.sort(key=lambda item: item.office_name.casefold())
        elif policy == "government-hierarchy":
            office_groups.sort(key=lambda item: (item.display_order, item.office_name.casefold()))
        else:
            raise ValueError(f"Unsupported office ordering policy: {policy}")

    worksheet_rows = sum(len(group.rows) for values in groups.values() for group in values)
    return categories, groups, worksheet_rows


def build_markdown(
    dataset: dict,
    categories: list[str],
    groups: dict[str, list[OfficeGroup]],
    worksheet_rows: int,
    generated_date: str,
) -> str:
    lines = [
        "# Manual Affiliation Verification Worksheet",
        "",
        "**Internal Working Document - Not for Publication**",
        "",
        f"- **Date Generated:** {generated_date}",
        f"- **Total Offices:** {len(dataset['offices'])}",
        f"- **Total Candidates:** {len(dataset['candidates'])} unique candidates",
        f"- **Worksheet Entries:** {worksheet_rows} candidate-office entries",
        "- **Reviewer:** ________________________________________________",
        "- **Review Date:** _____________________________________________",
        "",
        "**Overall Notes**",
        "",
        "________________________________________________________________________________",
        "",
        "________________________________________________________________________________",
        "",
        "________________________________________________________________________________",
        "",
        "Compare each project affiliation with Nebraska VoterCheck. If the displayed value differs, record the corrected value under Manual Verification and explain the discrepancy under Notes.",
        "",
    ]

    for category in categories:
        lines.extend([f"## {category}", ""])
        for office in groups[category]:
            lines.extend(
                [
                    f"### {office.office_name}",
                    "",
                    "| Candidate | Office | Current Status | Current Affiliation (Project) | Manual Verification | Notes |",
                    "|---|---|---|---|---|---|",
                ]
            )
            if office.rows:
                for row in office.rows:
                    lines.append(
                        "| "
                        + " | ".join(
                            [
                                escape_markdown(row.candidate),
                                escape_markdown(row.office),
                                escape_markdown(row.status),
                                escape_markdown(row.affiliation),
                                "",
                                "",
                            ]
                        )
                        + " |"
                    )
            else:
                lines.append(
                    f"| No candidate currently listed | {escape_markdown(office.office_name)} | Verification Pending | Information Not Yet Available |  |  |"
                )
            lines.extend(["", ""])

    return "\n".join(lines).rstrip() + "\n"


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    safe = (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return Paragraph(safe, style)


def build_pdf(
    path: Path,
    dataset: dict,
    categories: list[str],
    groups: dict[str, list[OfficeGroup]],
    worksheet_rows: int,
    generated_date: str,
):
    page_width, page_height = landscape(letter)
    margin = 0.4 * inch
    document = SimpleDocTemplate(
        str(path),
        pagesize=(page_width, page_height),
        leftMargin=margin,
        rightMargin=margin,
        topMargin=0.42 * inch,
        bottomMargin=0.48 * inch,
        title="Manual Affiliation Verification Worksheet",
        author="Local Civic Reference",
        subject="Internal candidate affiliation review worksheet",
    )

    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "WorksheetTitle",
        parent=base_styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=23,
        textColor=colors.black,
        alignment=TA_LEFT,
        spaceAfter=8,
    )
    subtitle_style = ParagraphStyle(
        "WorksheetSubtitle",
        parent=base_styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.black,
        spaceAfter=14,
    )
    category_style = ParagraphStyle(
        "CategoryHeading",
        parent=base_styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.black,
        spaceAfter=8,
    )
    office_style = ParagraphStyle(
        "OfficeHeading",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=9.2,
        leading=11,
        textColor=colors.black,
    )
    cell_style = ParagraphStyle(
        "WorksheetCell",
        parent=base_styles["BodyText"],
        fontName="Helvetica",
        fontSize=7.4,
        leading=9,
        textColor=colors.black,
        alignment=TA_LEFT,
    )
    header_style = ParagraphStyle(
        "WorksheetHeader",
        parent=cell_style,
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=8.3,
        alignment=TA_CENTER,
    )
    summary_label_style = ParagraphStyle(
        "SummaryLabel",
        parent=cell_style,
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
    )
    summary_value_style = ParagraphStyle(
        "SummaryValue",
        parent=cell_style,
        fontSize=9,
        leading=11,
    )
    instruction_style = ParagraphStyle(
        "Instruction",
        parent=base_styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.black,
        spaceBefore=10,
    )

    story = [
        paragraph("Manual Affiliation Verification Worksheet", title_style),
        paragraph("Internal Working Document - Not for Publication", subtitle_style),
    ]

    summary_data = [
        [paragraph("Date Generated", summary_label_style), paragraph(generated_date, summary_value_style)],
        [paragraph("Total Offices", summary_label_style), paragraph(str(len(dataset["offices"])), summary_value_style)],
        [paragraph("Total Candidates", summary_label_style), paragraph(f"{len(dataset['candidates'])} unique candidates", summary_value_style)],
        [paragraph("Worksheet Entries", summary_label_style), paragraph(f"{worksheet_rows} candidate-office entries", summary_value_style)],
        [paragraph("Reviewer", summary_label_style), paragraph("____________________________________________", summary_value_style)],
        [paragraph("Review Date", summary_label_style), paragraph("____________________________________________", summary_value_style)],
    ]
    summary_table = Table(summary_data, colWidths=[1.55 * inch, 5.4 * inch], rowHeights=[0.34 * inch] * len(summary_data))
    summary_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.45, colors.black),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend([summary_table, Spacer(1, 0.2 * inch)])

    notes_table = Table(
        [
            [paragraph("Overall Notes", summary_label_style)],
            [""],
            [""],
            [""],
        ],
        colWidths=[10.1 * inch],
        rowHeights=[0.32 * inch, 0.55 * inch, 0.55 * inch, 0.55 * inch],
    )
    notes_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.45, colors.black),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend(
        [
            notes_table,
            paragraph(
                "Compare each project affiliation with Nebraska VoterCheck. If the displayed value differs, record the corrected value under Manual Verification and explain the discrepancy under Notes.",
                instruction_style,
            ),
            PageBreak(),
        ]
    )

    column_widths = [
        1.4 * inch,
        1.65 * inch,
        1.55 * inch,
        1.25 * inch,
        1.8 * inch,
        2.45 * inch,
    ]
    column_labels = [
        "Candidate",
        "Office",
        "Current Status",
        "Current Affiliation (Project)",
        "Manual Verification",
        "Notes",
    ]

    for category_index, category in enumerate(categories):
        if category_index:
            story.append(PageBreak())
        story.extend([paragraph(category, category_style), Spacer(1, 0.02 * inch)])
        for office in groups[category]:
            story.append(CondPageBreak(1.25 * inch))
            table_data = [
                [paragraph(office.office_name, office_style)] + [""] * 5,
                [paragraph(label, header_style) for label in column_labels],
            ]
            if office.rows:
                for row in office.rows:
                    table_data.append(
                        [
                            paragraph(row.candidate, cell_style),
                            paragraph(row.office, cell_style),
                            paragraph(row.status, cell_style),
                            paragraph(row.affiliation, cell_style),
                            "",
                            "",
                        ]
                    )
            else:
                table_data.append(
                    [
                        paragraph("No candidate currently listed", cell_style),
                        paragraph(office.office_name, cell_style),
                        paragraph("Verification Pending", cell_style),
                        paragraph("Information Not Yet Available", cell_style),
                        "",
                        "",
                    ]
                )

            row_heights = [0.29 * inch, 0.4 * inch] + [0.58 * inch] * (len(table_data) - 2)
            office_table = Table(
                table_data,
                colWidths=column_widths,
                rowHeights=row_heights,
                repeatRows=2,
                splitByRow=1,
            )
            office_table.setStyle(
                TableStyle(
                    [
                        ("SPAN", (0, 0), (-1, 0)),
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 1), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
                        ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                    ]
                )
            )
            story.append(KeepTogether([office_table, Spacer(1, 0.13 * inch)]))

    document.build(story, canvasmaker=FooterCanvas)


def main():
    args = parse_args()
    dataset = load_dataset(args.dataset)
    categories, groups, worksheet_rows = build_office_groups(dataset)

    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.pdf.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.write_text(
        build_markdown(dataset, categories, groups, worksheet_rows, args.generated_date),
        encoding="utf-8",
    )
    build_pdf(args.pdf, dataset, categories, groups, worksheet_rows, args.generated_date)

    print(
        json.dumps(
            {
                "dataset": str(args.dataset),
                "schemaVersion": dataset["schemaVersion"],
                "offices": len(dataset["offices"]),
                "uniqueCandidates": len(dataset["candidates"]),
                "worksheetEntries": worksheet_rows,
                "categories": categories,
                "markdown": str(args.markdown),
                "pdf": str(args.pdf),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
