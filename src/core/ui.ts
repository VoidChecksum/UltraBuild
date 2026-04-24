export type ColorToken = "cyan" | "violet" | "pink" | "green" | "muted" | "danger" | "text";

const codes: Record<ColorToken, string> = {
  cyan: "\x1b[36m",
  violet: "\x1b[35m",
  pink: "\x1b[95m",
  green: "\x1b[92m",
  muted: "\x1b[90m",
  danger: "\x1b[91m",
  text: "\x1b[97m",
};
const reset = "\x1b[0m";
const bold = "\x1b[1m";

export function color(text: string, token: ColorToken = "text"): string {
  return `${codes[token]}${text}${reset}`;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function renderPill(text: string, token: ColorToken = "violet"): string {
  return color(``, token) + color(` ${text} `, "text") + color(``, token);
}

export function section(title: string, body: string): string {
  return `${color(`\n${title}`, "cyan")}\n${color("─".repeat(Math.max(8, title.length)), "muted")}\n${body}`;
}

export function box(title: string, body: string): string {
  const lines = body.split("\n");
  const plainTitle = stripAnsi(title);
  const width = Math.max(plainTitle.length + 4, ...lines.map((line) => stripAnsi(line).length), 24);
  const top = `╭─ ${title} ${"─".repeat(Math.max(0, width - plainTitle.length - 3))}╮`;
  const middle = lines.map((line) => `│ ${line}${" ".repeat(Math.max(0, width - stripAnsi(line).length))} │`);
  const bottom = `╰${"─".repeat(width + 2)}╯`;
  return color(top, "violet") + "\n" + middle.join("\n") + "\n" + color(bottom, "violet");
}

export function splash(): string {
  return `${color("╭──────────────────────────────────────────────╮", "violet")}
${color("│", "violet")} ${bold}${color("UltraBuild", "cyan")}${reset} ${color("▸", "pink")} ${color("Flux forge-dragon online", "green")}     ${color("│", "violet")}
${color("│", "violet")} ${color("every model · every workflow · every OS", "muted")} ${color("│", "violet")}
${color("╰──────────────────────────────────────────────╯", "violet")}`;
}

export function renderHelp(): string {
  return box(
    `${color("UltraBuild", "cyan")} help`,
    [
      `${renderPill("interactive", "cyan")} ultrabuild`,
      `${renderPill("print", "green")}       ultrabuild --provider mock --print "hello"`,
      `${renderPill("modes", "violet")}      ultrabuild --mode plan --print "plan a feature"`,
      `${renderPill("doctor", "pink")}     ultrabuild doctor`,
      `${renderPill("vibe", "cyan")}       ultrabuild vibe status | ultrabuild vibe test`,
      `${renderPill("workers", "green")}    ultrabuild workers --count 2 "task"`,
      "",
      "Options: --provider <name> --mode <mode> --print --yes --no-vibe --count <n>",
      "Slash: /help /theme /doctor /skills /workers <n> <task> /mode <mode> /exit",
    ].join("\n"),
  );
}

export function renderStatus(items: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(items)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => renderPill(`${key}:${value}`, key === "mode" ? "pink" : "cyan"))
    .join(" ");
}
