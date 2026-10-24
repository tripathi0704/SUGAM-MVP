#!/usr/bin/env python3
"""Fix the duplicate first TOC entry: add_toc_placeholders.py injects the first
entry partially inside the TOC field-opening paragraph (hyperlink without page
number) and then again as a proper entry paragraph. Remove the hyperlink from
the field-opening paragraph so only begin+instrText+separate remain. The outer
end fldChar lives in the final paragraph and is untouched.
"""
import re
import sys
import zipfile

path = sys.argv[1]

zin = zipfile.ZipFile(path)
items = {n: zin.read(n) for n in zin.namelist()}
infos = {n: zin.getinfo(n) for n in zin.namelist()}
zin.close()

xml = items["word/document.xml"].decode("utf-8")

sdts = re.findall(r"<w:sdt>.*?</w:sdt>", xml, re.S)
toc_blocks = [b for b in sdts if "TOC" in b]
if len(toc_blocks) != 1:
    raise SystemExit(f"ERROR: expected exactly 1 TOC sdt block, found {len(toc_blocks)}")
block = toc_blocks[0]

paras = re.findall(r"<w:p\b.*?</w:p>", block, re.S)
p1 = paras[0]
if "<w:hyperlink" not in p1:
    print("No hyperlink in TOC field-opening paragraph - nothing to fix")
    raise SystemExit(0)

p1_new = re.sub(r"<w:hyperlink\b.*?</w:hyperlink>", "", p1, flags=re.S)

# sanity: field char balance inside the block after removal
new_block = block.replace(p1, p1_new, 1)
b0 = new_block.count('fldCharType="begin"')
e0 = new_block.count('fldCharType="end"')
if b0 != e0:
    raise SystemExit(f"ERROR: unbalanced fldChars after patch (begin={b0}, end={e0})")

xml = xml.replace(block, new_block, 1)
items["word/document.xml"] = xml.encode("utf-8")

with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zout:
    for name, data in items.items():
        zout.writestr(infos[name], data)
print(f"TOC_DUPLICATE_FIXED (fldChars begin={b0}, end={e0})")
