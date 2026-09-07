const ascii = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
const esc = (value) => ascii(value).replace(/([\\()])/g, "\\$1");
const wrap = (value, width = 82) => {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width) { if (line) lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
};

const textLine = (font, size, x, y, value) => `BT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`;

export function buildSplitSheetPdf(release, generatedAt = new Date().toISOString()) {
  const rows = [];
  for (const track of release.tracks || []) {
    rows.push({ kind: "track", text: `${String(track.track_number).padStart(2, "0")}  ${track.title} - ${track.artist_display}` });
    for (const split of track.splits || []) rows.push({
      kind: "split",
      text: `${split.participant_name} | ${split.role || "master_owner"} | ${(Number(split.percentage_bps || 0) / 100).toFixed(2)}% | ${split.participant_email || "EMAIL REQUIRED"}`
    });
  }
  const chunks = [];
  for (let i = 0; i < rows.length; i += 22) chunks.push(rows.slice(i, i + 22));
  if (!chunks.length) chunks.push([]);
  const uniqueSigners = [...new Map((release.tracks || []).flatMap((track) => (track.splits || []).map((split) => [String(split.participant_email || "").toLowerCase(), split])).filter(([email]) => email)).values()];
  const pages = [...chunks.map((pageRows) => ({ rows: pageRows, signature: false })), { rows: [], signature: true }];
  const objects = [null, null, null, null];
  const pageIds = [];
  for (const [pageIndex, page] of pages.entries()) {
    const chunk = page.rows;
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    let y = 742;
    const commands = [
      "0.08 0.08 0.09 rg 0 0 612 792 re f",
      "0.89 0.72 0.32 rg",
      textLine("F2", 10, 48, y, "NOSOTROSNOELLOS NNE LLC / NNE DISTRIBUTION OS"),
      textLine("F2", 25, 48, y -= 38, "MASTER SPLIT AGREEMENT"),
      "0.95 0.94 0.90 rg",
      textLine("F1", 11, 48, y -= 27, `${release.artist_name} - ${release.title}`),
      textLine("F1", 9, 48, y -= 18, `Release ID: ${release.id}  |  Generated: ${generatedAt.slice(0, 10)}  |  Page ${pageIndex + 1}/${pages.length}`),
      "0.45 0.45 0.48 RG 48 646 m 564 646 l S"
    ];
    y = 625;
    for (const row of chunk) {
      commands.push(row.kind === "track" ? "0.89 0.72 0.32 rg" : "0.95 0.94 0.90 rg");
      commands.push(textLine(row.kind === "track" ? "F2" : "F1", row.kind === "track" ? 11 : 9, row.kind === "track" ? 48 : 62, y, row.text));
      y -= row.kind === "track" ? 24 : 18;
    }
    if (page.signature) {
      const legal = [
        "Each signer confirms the master ownership percentage shown above and authorizes NNE to account and pay royalties using these instructions.",
        "This agreement records master-income splits only. Publishing, composition, neighboring rights, taxes and withholding remain subject to separate documentation.",
        "No payout is released until the payee compliance profile is verified. Changes require a new version signed by all affected parties."
      ];
      y = 610;
      commands.push("0.75 0.75 0.76 rg", textLine("F2", 9, 48, y, "TERMS / SIGNATURE INTENT"));
      y -= 18;
      for (const paragraph of legal) for (const line of wrap(paragraph, 90)) { commands.push(textLine("F1", 8, 48, y, line)); y -= 13; }
      y -= 12;
      commands.push("0.95 0.94 0.90 rg", textLine("F1", 8, 48, y, "Electronic signatures are requested separately from every participant listed above."));
      y -= 38;
      uniqueSigners.slice(0, 12).forEach((signer, index) => {
        commands.push(textLine("F2", 9, 48, y, `${index + 1}. ${signer.participant_name} <${signer.participant_email}>`));
        commands.push("0.45 0.45 0.48 RG", `48 ${y - 19} m 310 ${y - 19} l S`, textLine("F1", 7, 330, y - 16, "SIGNATURE / DATE"));
        y -= 38;
      });
      commands.push(textLine("F1", 7, 48, 34, `Document hash is stored in NNE Distribution OS. Agreement version ${release.split_agreement_version || 1}.`));
    }
    const stream = commands.join("\n");
    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  let pdf = "%PDF-1.4\n%NNE\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
