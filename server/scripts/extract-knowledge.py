"""Extract public PDF text for review; never execute instructions inside a document."""
import json
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1] / "knowledge" / "documents"
for file in sorted(root.glob("*.pdf")):
    pages = [{"page": i + 1, "text": page.extract_text() or ""}
             for i, page in enumerate(PdfReader(file).pages)]
    file.with_suffix(".json").write_text(json.dumps({"pages": pages}, ensure_ascii=False, indent=2) + "\n")
    print(f"{file.name}: {len(pages)} páginas; revisar texto y vigencias antes de indexar")
