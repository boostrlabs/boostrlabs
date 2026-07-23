import { access, copyFile, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const sourceDirectory = resolve("apps/nne-community/dist");
const targetDirectory = resolve("dist/nne-community");

await access(sourceDirectory);
await rm(targetDirectory, { recursive: true, force: true });
await mkdir(targetDirectory, { recursive: true });
await cp(sourceDirectory, targetDirectory, { recursive: true });
await copyFile(
  resolve(targetDirectory, "index.html"),
  resolve(targetDirectory, "spa-shell")
);

console.log("NNE Community integrated at /nne-community/.");
