from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
SOURCES = {
    "MidSem_Project_Report": "docs/01_Report/MidSem_Project_Report.md",
    "SRS": "docs/02_Requirements/SRS.md",
    "Use_Cases_or_User_Stories": "docs/02_Requirements/Use_Cases_or_User_Stories.md",
    "Architecture_Diagram": "docs/03_Design/Architecture_Diagram.md",
    "Database_Design": "docs/03_Design/Database_Design.md",
    "UML_Diagrams": "docs/03_Design/UML_Diagrams.md",
    "Wireframes": "docs/03_Design/Wireframes.md",
    "Test_Cases": "docs/05_Testing/Test_Cases.md",
    "Contribution_Record": "docs/06_Project_Management/Contribution_Record.md",
    "Meeting_Log": "docs/06_Project_Management/Meeting_Log.md",
    "Project_Plan": "docs/06_Project_Management/Project_Plan.md",
    "Risk_Register": "docs/06_Project_Management/Risk_Register.md",
    "Task_Allocation": "docs/06_Project_Management/Task_Allocation.md",
    "Weekly_Progress": "docs/06_Project_Management/Weekly_Progress.md",
    "Demo_Script": "docs/07_Demo/Demo_Script.md",
}

def esc(value):
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def table_rows(lines):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if not all(re.fullmatch(r"[-: ]+", cell) for cell in cells): rows.append(cells)
    return rows

def build(source, target):
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("H1x", parent=styles["Heading1"], fontSize=18, leading=22, textColor=colors.HexColor("#00685f"), spaceBefore=12, spaceAfter=8))
    styles.add(ParagraphStyle("H2x", parent=styles["Heading2"], fontSize=13, leading=16, textColor=colors.HexColor("#00685f"), spaceBefore=10, spaceAfter=6))
    styles.add(ParagraphStyle("Bodyx", parent=styles["BodyText"], fontSize=9.5, leading=13, spaceAfter=6))
    story, lines, i, in_code = [], source.read_text(encoding="utf-8").splitlines(), 0, False
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            code, i = [], i + 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i]); i += 1
            story += [Preformatted("\n".join(code), styles["Code"]), Spacer(1, 6)]
        elif line.startswith("|") and i + 1 < len(lines) and lines[i + 1].startswith("|"):
            block = []
            while i < len(lines) and lines[i].startswith("|"):
                block.append(lines[i]); i += 1
            rows = table_rows(block)
            if rows:
                width = 17.5 * cm / max(len(row) for row in rows)
                table = Table([[Paragraph(esc(c), styles["Bodyx"]) for c in row] for row in rows], colWidths=[width] * max(len(row) for row in rows), repeatRows=1)
                table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#dce9ff")), ("GRID", (0,0), (-1,-1), .25, colors.HexColor("#bcc9c6")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5), ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
                story += [table, Spacer(1, 8)]
        elif line.startswith("# "):
            story += [Paragraph(esc(line[2:]), styles["Title"]), Spacer(1, 10)]
            i += 1
        elif line.startswith("## "):
            story.append(Paragraph(esc(line[3:]), styles["H1x"])); i += 1
        elif line.startswith("### "):
            story.append(Paragraph(esc(line[4:]), styles["H2x"])); i += 1
        elif not line.strip(): i += 1
        else:
            cleaned = re.sub(r"`([^`]+)`", r"\1", line).replace("**", "")
            story.append(Paragraph(esc(cleaned), styles["Bodyx"])); i += 1
    doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=1.75*cm, leftMargin=1.75*cm, topMargin=1.6*cm, bottomMargin=1.6*cm, title=target.stem)
    doc.build(story)

OUT.mkdir(parents=True, exist_ok=True)
for name, relative in SOURCES.items(): build(ROOT / relative, OUT / f"{name}.pdf")
print(f"Exported {len(SOURCES)} PDFs to {OUT}")
