import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildSplitSheetPdf } from "../functions/_lib/nne-split-pdf.js";

const output = resolve("output/pdf/nne-split-sheet-demo.pdf");
await mkdir(resolve("output/pdf"), { recursive: true });
const release = {
  id: "nne_demo_westdetro",
  artist_name: "Janko Diorr",
  title: "WESTDETRO",
  split_agreement_version: 1,
  tracks: [
    { track_number: 1, title: "WESTDETRO (INTRO)", artist_display: "Janko Diorr", splits: [
      { participant_name: "Janko Diorr", participant_email: "artist@example.com", role: "master_owner", percentage_bps: 8000 },
      { participant_name: "NOSOTROSNOELLOS NNE LLC", participant_email: "community@westdetro.com", role: "scholarship_partner", percentage_bps: 2000 }
    ] },
    { track_number: 2, title: "PUNTO G", artist_display: "Janko Diorr", splits: [
      { participant_name: "Janko Diorr", participant_email: "artist@example.com", role: "master_owner", percentage_bps: 10000 }
    ] }
  ]
};
await writeFile(output, buildSplitSheetPdf(release, "2026-09-07T12:00:00.000Z"));
console.log(output);
