from pathlib import Path
import fitz

source = Path("output/pdf")
target = Path("output/rendered")
target.mkdir(parents=True, exist_ok=True)
for pdf in source.glob("*.pdf"):
    document = fitz.open(pdf)
    for index, page in enumerate(document, start=1):
        page.get_pixmap(matrix=fitz.Matrix(1.2, 1.2), alpha=False).save(
            target / f"{pdf.stem}-{index}.png"
        )
    document.close()
