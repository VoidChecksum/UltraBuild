export interface ReleaseTarget {
  os: "linux" | "macos" | "windows";
  arch: "x64" | "arm64";
  archive: "tar.gz" | "zip";
  artifact: string;
}

export const releaseTargets: ReleaseTarget[] = [
  { os: "linux", arch: "x64", archive: "tar.gz", artifact: "ultrabuild-linux-x64.tar.gz" },
  { os: "linux", arch: "arm64", archive: "tar.gz", artifact: "ultrabuild-linux-arm64.tar.gz" },
  { os: "macos", arch: "x64", archive: "tar.gz", artifact: "ultrabuild-macos-x64.tar.gz" },
  { os: "macos", arch: "arm64", archive: "tar.gz", artifact: "ultrabuild-macos-arm64.tar.gz" },
  { os: "windows", arch: "x64", archive: "zip", artifact: "ultrabuild-windows-x64.zip" },
  { os: "windows", arch: "arm64", archive: "zip", artifact: "ultrabuild-windows-arm64.zip" },
];
