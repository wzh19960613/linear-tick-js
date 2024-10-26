import dts from 'bun-plugin-dts'

Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    plugins: [dts()],
    minify: true,
    target: "browser",
    sourcemap: "linked",
})