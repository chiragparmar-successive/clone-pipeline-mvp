import fs from "node:fs/promises";
import path from "node:path";

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(filePath, data, options = {}) {
  const spaces = options.spaces ?? 2;
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, spaces)}\n`, "utf8");
}

async function outputFile(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

async function outputJson(filePath, data, options = {}) {
  await writeJson(filePath, data, options);
}

async function remove(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

export default {
  ensureDir,
  readJson,
  writeJson,
  outputFile,
  outputJson,
  remove,
  readFile: fs.readFile.bind(fs),
  writeFile: fs.writeFile.bind(fs),
};
