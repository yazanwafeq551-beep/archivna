from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from docx import Document
from openpyxl import Workbook
from pptx import Presentation
import csv, json, math, struct, wave, zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps" / "api" / "uploads" / "archives" / "demo"
OUT.mkdir(parents=True, exist_ok=True)

records = [
    ("ARC-001", "وثائق يافا 1948", "Jaffa documents, 1948", "document"),
    ("ARC-002", "القدس في الثلاثينيات", "Jerusalem in the 1930s", "image"),
    ("ARC-003", "حكايات نابلس الشفوية", "Oral histories of Nablus", "audio"),
    ("ARC-004", "عمارة رام الله", "Architecture of Ramallah", "video"),
    ("ARC-005", "مجموعة مخطوطات", "Manuscript collection", "manuscript"),
    ("ARC-006", "خرائط فلسطين التاريخية", "Historical maps of Palestine", "map"),
    ("ARC-007", "سجلات المؤسسات الثقافية", "Cultural institution records", "document"),
    ("ARC-008", "الأغنية الشعبية في غزة", "Folk songs of Gaza", "audio"),
    ("ARC-009", "ذاكرة يافا الجماعية", "Collective memory of Jaffa", "video"),
    ("ARC-010", "المطبخ الفلسطيني", "Palestinian culinary heritage", "document"),
    ("ARC-011", "مهرجانات التراث", "Heritage festivals", "video"),
    ("ARC-012", "وثائق مقيدة", "Restricted documents", "document"),
    ("ARC-013", "يوميات رحلة 1935", "Journey diary, 1935", "manuscript"),
    ("ARC-014", "إذاعة فلسطين", "Palestine radio archive", "audio"),
    ("ARC-015", "مخطط مدينة غزة 1946", "Gaza city plan, 1946", "map"),
    ("ARC-016", "مجلة الأرض", "Al-Ard magazine", "document"),
]

palette = ["#0F4C45", "#C6A15B", "#8B2635", "#5F7A48"]
for i, (ref, ar, en, kind) in enumerate(records):
    accent = palette[i % len(palette)]; secondary = palette[(i + 1) % len(palette)]
    im = Image.new("RGB", (1200, 800), "#F8F4EC"); d = ImageDraw.Draw(im)
    # Every record receives a distinct collection color, reference watermark and motif.
    d.rectangle((0, 0, 1200, 800), fill=accent)
    d.polygon([(0, 510), (1200, 180 + (i % 4) * 45), (1200, 800), (0, 800)], fill="#0A3732")
    for x in range(-100, 1300, 120): d.line((x, 0, x + 380, 800), fill=secondary, width=2)
    d.rounded_rectangle((58, 55, 1142, 745), radius=34, fill="#F8F4EC", outline="#C6A15B", width=4)
    d.text((92, 82), ref, fill=accent, font=ImageFont.load_default(size=26))
    d.rounded_rectangle((900, 78, 1100, 130), radius=22, fill=accent)
    d.text((935, 92), kind.upper(), fill="white", font=ImageFont.load_default(size=20))

    # Media-specific cover illustration makes file type immediately recognizable.
    if kind == "audio":
        d.ellipse((135, 215, 365, 445), outline=accent, width=20); d.ellipse((205, 285, 295, 375), fill=accent)
        for n, h in enumerate([55,110,165,90,145,70,125]):
            x=430+n*70; d.rounded_rectangle((x,330-h//2,x+28,330+h//2),radius=12,fill=secondary)
    elif kind == "video":
        d.rounded_rectangle((130, 220, 510, 455), radius=28, fill="#122B29", outline=accent, width=10)
        d.polygon([(280,270),(280,405),(405,338)], fill="#C6A15B")
        for x in range(150,500,60): d.rectangle((x,235,x+34,255),fill="#F8F4EC")
    elif kind == "map":
        d.polygon([(130,230),(270,190),(410,235),(550,195),(550,455),(410,495),(270,450),(130,490)], outline=accent, fill="#EDE4D1")
        d.line((270,190,270,450),fill=accent,width=6); d.line((410,235,410,495),fill=accent,width=6)
        d.ellipse((326,285,370,329),fill=secondary); d.line((348,327,348,395),fill=secondary,width=8)
    elif kind == "manuscript":
        d.rounded_rectangle((135,190,505,500), radius=10, fill="#E7D5AE", outline="#6D4D31", width=8)
        for y in range(245,455,35): d.line((185,y,455,y),fill="#8B6A45",width=4)
        d.arc((215,260,425,465),20,310,fill=accent,width=10)
    elif kind == "image":
        d.rectangle((130,205,520,475),fill="#D8C8A5",outline=accent,width=10)
        d.polygon([(155,440),(270,310),(350,385),(405,330),(495,440)],fill=secondary)
        d.ellipse((390,245,455,310),fill="#C6A15B")
    else:
        d.rounded_rectangle((140,195,485,500),radius=12,fill="white",outline=accent,width=8)
        d.polygon([(395,195),(485,285),(395,285)],fill="#EDE4D1")
        for y in range(325,455,34): d.line((190,y,430,y),fill="#B7AA91",width=5)

    title = en if len(en) <= 38 else en[:36] + "…"
    d.text((600, 250), title, fill="#1D2C29", font=ImageFont.load_default(size=34), anchor="mm")
    d.text((600, 315), f"{kind.title()} collection cover", fill=accent, font=ImageFont.load_default(size=22), anchor="mm")
    d.line((525,365,1070,365),fill="#DED6C5",width=3)
    d.text((600, 410), "ARSHEEFNA", fill="#0F4C45", font=ImageFont.load_default(size=24), anchor="mm")
    d.text((600, 455), "DIGITAL ARCHIVE", fill="#716E66", font=ImageFont.load_default(size=16), anchor="mm")
    im.save(OUT / f"{ref.lower()}-thumbnail.jpg", quality=92)

# A high-resolution TIFF preservation master and PNG access copy.
master = Image.new("RGB", (1600, 1100), "#E9DFC8"); md = ImageDraw.Draw(master)
md.rectangle((100, 90, 1500, 1010), outline="#4C3729", width=10)
md.text((180, 180), "Digitized manuscript preservation master", fill="#4C3729", font=ImageFont.load_default(size=42))
for y in range(300, 900, 65): md.line((210, y, 1380, y), fill="#9A7C59", width=3)
master.save(OUT / "manuscript-master.tiff", compression="tiff_lzw")
master.resize((1000, 688)).save(OUT / "manuscript-access.png")

pdf = canvas.Canvas(str(OUT / "jaffa-collection-guide.pdf"))
pdf.setTitle("Jaffa 1948 Collection Guide"); pdf.setAuthor("Arsheefna Demo Archive")
pdf.setFont("Helvetica-Bold", 22); pdf.drawString(72, 760, "Jaffa 1948 Collection Guide")
pdf.setFont("Helvetica", 12)
for n, line in enumerate(["Reference: ARC-001", "Scope: correspondence, photographs and municipal records", "Access: public demo material", "License: CC BY 4.0 (original demonstration file)"]): pdf.drawString(72, 710-n*28, line)
pdf.save()

doc = Document(); doc.add_heading("Oral History Interview Form", 0); doc.add_paragraph("Arsheefna community archive demonstration resource.")
for label in ["Interviewee", "Interviewer", "Place", "Date", "Consent and access level", "Summary and keywords"]: doc.add_heading(label, level=2); doc.add_paragraph("____________________________________________")
doc.save(OUT / "oral-history-interview-form.docx")

wb = Workbook(); ws = wb.active; ws.title = "Archive inventory"
ws.append(["Reference", "Title", "Type", "Period", "Access", "License"])
for ref, _, en, kind in records: ws.append([ref, en, kind, "20th century", "Public demo", "CC BY 4.0"])
wb.save(OUT / "archive-inventory.xlsx")

prs = Presentation(); slide = prs.slides.add_slide(prs.slide_layouts[0]); slide.shapes.title.text = "Community Archive Workshop"; slide.placeholders[1].text = "Collect · Describe · Preserve · Share\nArsheefna demonstration slides"
for title in ["Safe handling", "Descriptive metadata", "Digitization workflow", "Rights and consent"]:
    s = prs.slides.add_slide(prs.slide_layouts[1]); s.shapes.title.text = title; s.placeholders[1].text = "Practical guidance for responsible community preservation."
prs.save(OUT / "community-archive-workshop.pptx")

with wave.open(str(OUT / "oral-history-sample.wav"), "w") as w:
    rate=22050; w.setparams((1,2,rate,rate*4,"NONE","not compressed"))
    frames=b"".join(struct.pack("<h", int(9000*math.sin(2*math.pi*440*t/rate)*math.exp(-t/(rate*5)))) for t in range(rate*4)); w.writeframes(frames)

(OUT / "collection-readme.txt").write_text("Arsheefna demonstration archive package. Original synthetic files for testing preview, download, metadata and preservation workflows.\n", encoding="utf-8")
with (OUT / "metadata.csv").open("w", newline="", encoding="utf-8-sig") as f:
    writer=csv.writer(f); writer.writerow(["reference","title","type","license"]); [writer.writerow([r,e,k,"CC BY 4.0"]) for r,a,e,k in records]
(OUT / "metadata.json").write_text(json.dumps([{"reference":r,"title_ar":a,"title_en":e,"type":k,"license":"CC BY 4.0"} for r,a,e,k in records], ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "olive-branch-catalog-mark.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#F8F4EC"/><path d="M90 320Q300 190 510 75" fill="none" stroke="#0F4C45" stroke-width="12"/><g fill="#5F7A48"><ellipse cx="180" cy="255" rx="52" ry="20" transform="rotate(-25 180 255)"/><ellipse cx="270" cy="205" rx="52" ry="20" transform="rotate(25 270 205)"/><ellipse cx="370" cy="145" rx="52" ry="20" transform="rotate(-25 370 145)"/></g></svg>', encoding="utf-8")
with zipfile.ZipFile(OUT / "community-archive-resource-pack.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for name in ["collection-readme.txt","metadata.csv","metadata.json","oral-history-interview-form.docx"]: z.write(OUT/name, name)
print(f"Created demo archive assets in {OUT}")
