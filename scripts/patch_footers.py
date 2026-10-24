#!/usr/bin/env python3
"""Post-process footers for WPS compatibility (docx skill toc.md rules):
1. Footer PAGE fields get explicit format switches: front matter -> \\* ROMAN,
   body -> \\* arabic (never \\* decimal).
2. Remove empty <w:pgNumType/> emitted for the cover section.
Maps footers to sections via sectPr footerReference order in document.xml.
"""
import re
import sys
import zipfile

path = sys.argv[1]

zin = zipfile.ZipFile(path)
items = {n: zin.read(n) for n in zin.namelist()}
infos = {n: zin.getinfo(n) for n in zin.namelist()}
zin.close()

doc = items["word/document.xml"].decode("utf-8")
rels = items["word/_rels/document.xml.rels"].decode("utf-8")

# sectPr blocks in document order (last body-level sectPr included)
sects = re.findall(r"<w:sectPr\b.*?</w:sectPr>", doc, re.S)
print(f"sections found: {len(sects)}")

footer_of_section = []
for s in sects:
    m = re.search(r'<w:footerReference w:type="default" r:id="(rId\d+)"', s)
    footer_of_section.append(m.group(1) if m else None)
print(f"footer refs per section: {footer_of_section}")


def target_of(rid):
    m = re.search(r'Id="%s"[^>]*Target="([^"]+)"' % rid, rels)
    return ("word/" + m.group(1).lstrip("/")) if m else None


def patch_footer(name, fmt):
    xml = items[name].decode("utf-8")
    # complex field: <w:instrText ...>PAGE</w:instrText>
    xml2, n1 = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        r"\1 PAGE \\* %s \\* MERGEFORMAT \2" % fmt,
        xml,
    )
    # simple field fallback: <w:fldSimple w:instr="PAGE">
    xml2, n2 = re.subn(
        r'(<w:fldSimple[^>]*w:instr=")\s*PAGE\s*(")',
        r"\1 PAGE \\* %s \\* MERGEFORMAT \2" % fmt,
        xml2,
    )
    items[name] = xml2.encode("utf-8")
    print(f"patched {name} -> {fmt} (instrText: {n1}, fldSimple: {n2})")


# Expected layout: section 1 = cover (no footer), section 2 = front matter
# (Roman), section 3 = body (arabic). Fallback: treat last as body.
non_cover = [(i, r) for i, r in enumerate(footer_of_section) if r]
if len(non_cover) >= 2:
    roman_rid = non_cover[0][1]
    arabic_rid = non_cover[-1][1]
elif len(non_cover) == 1:
    arabic_rid = non_cover[0][1]
    roman_rid = None
else:
    raise SystemExit("ERROR: no footer references found")

if roman_rid and roman_rid != arabic_rid:
    patch_footer(target_of(roman_rid), "ROMAN")
patch_footer(target_of(arabic_rid), "arabic")

# Remove empty pgNumType (docx-js emits it for the cover section)
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
items["word/document.xml"] = doc.encode("utf-8")
print(f"removed {before} empty <w:pgNumType/>")

with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zout:
    for name, data in items.items():
        zout.writestr(infos[name], data)
print("FOOTER_PATCH_DONE")
