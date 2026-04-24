import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type SessionEntryType = "user" | "assistant" | "tool" | "approval" | "system";

export interface SessionEntry {
  id: string;
  sessionId: string;
  type: SessionEntryType;
  timestamp: string;
  data: unknown;
}

export class SessionStore {
  readonly sessionId: string;
  readonly file: string;

  private constructor(home: string, sessionId: string) {
    this.sessionId = sessionId;
    this.file = path.join(home, "sessions", `${sessionId}.jsonl`);
  }

  static async create(home: string, sessionId = randomUUID()): Promise<SessionStore> {
    await mkdir(path.join(home, "sessions"), { recursive: true });
    return new SessionStore(home, sessionId);
  }

  async append(type: SessionEntryType, data: unknown): Promise<SessionEntry> {
    const entry: SessionEntry = {
      id: randomUUID(),
      sessionId: this.sessionId,
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    await appendFile(this.file, `${JSON.stringify(entry)}\n`, "utf8");
    return entry;
  }

  async readAll(): Promise<SessionEntry[]> {
    try {
      const text = await readFile(this.file, "utf8");
      return text.trim().split(/\n+/).filter(Boolean).map((line) => JSON.parse(line) as SessionEntry);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}
