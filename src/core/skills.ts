import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export interface Skill {
  name: string;
  path: string;
  content: string;
}

export async function loadSkills(dirs: string[]): Promise<Skill[]> {
  const skills: Skill[] = [];
  for (const dir of dirs) {
    if (!(await existsDir(dir))) continue;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const file = path.join(dir, entry.name);
        skills.push({ name: path.basename(entry.name, ".md"), path: file, content: await readFile(file, "utf8") });
      } else if (entry.isDirectory()) {
        const file = path.join(dir, entry.name, "SKILL.md");
        if (await existsFile(file)) skills.push({ name: entry.name, path: file, content: await readFile(file, "utf8") });
      }
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function renderSkillsForPrompt(skills: Skill[]): string {
  if (!skills.length) return "No skills loaded.";
  return skills.map((skill) => `## Skill: ${skill.name}\n${skill.content}`).join("\n\n---\n\n");
}

async function existsDir(dir: string): Promise<boolean> {
  return stat(dir).then((s) => s.isDirectory()).catch(() => false);
}

async function existsFile(file: string): Promise<boolean> {
  return stat(file).then((s) => s.isFile()).catch(() => false);
}
