import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface WorkerResult {
  id: number;
  text: string;
  logFile: string;
}

export async function runMockWorkers(options: { count: number; prompt: string; home: string }): Promise<WorkerResult[]> {
  const dir = path.join(options.home, "workers");
  await mkdir(dir, { recursive: true });
  const results: WorkerResult[] = [];
  for (let index = 1; index <= options.count; index++) {
    const text = `UltraBuild worker ${index} mock summary for: ${options.prompt}`;
    const logFile = path.join(dir, `worker-${Date.now()}-${index}.log`);
    await writeFile(logFile, `${text}\n`, "utf8");
    results.push({ id: index, text, logFile });
  }
  return results;
}

export async function readWorkerLog(file: string): Promise<string> {
  return readFile(file, "utf8");
}
