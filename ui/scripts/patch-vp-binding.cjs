// Patch: copy rolldown native binding into vite-plus-core's shared dir.
// Needed because pnpm v11 doesn't install @voidzero-dev/vite-plus-core's
// optional native deps correctly. Remove when vite-plus fixes this upstream.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function findStoreLinks() {
    const dirs = [];
    try {
        const storePath = execSync("pnpm store path", { encoding: "utf8" }).trim();
        const linksDir = path.join(path.dirname(storePath), "links");
        const cores = fs.readdirSync(linksDir).filter(function (d) {
            return d.startsWith("@voidzero-dev");
        });
        for (const core of cores) {
            const coreDir = path.join(linksDir, core);
            const versions = fs.readdirSync(coreDir);
            for (const v of versions) {
                const inner = fs.readdirSync(path.join(coreDir, v))[0];
                const shared = path.join(
                    coreDir,
                    v,
                    inner,
                    "node_modules",
                    core,
                    "dist",
                    "rolldown",
                    "shared",
                );
                if (fs.existsSync(shared)) dirs.push(shared);
            }
        }
    } catch {}
    return dirs;
}

try {
    // Only patch if the native binding is installed (macOS ARM64 only)
    const binding = require.resolve(
        "@rolldown/binding-darwin-arm64/rolldown-binding.darwin-arm64.node",
    );
    const sharedDirs = findStoreLinks();
    for (const sharedDir of sharedDirs) {
        const dest = path.join(sharedDir, "rolldown-binding.darwin-arm64.node");
        if (!fs.existsSync(dest)) {
            fs.copyFileSync(binding, dest);
            console.log("vp binding patched:", sharedDir);
        }
    }
} catch {
    // Non-fatal: binding not available on this platform (Linux/x86_64, etc.)
}
