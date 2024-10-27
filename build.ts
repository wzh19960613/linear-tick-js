import dts from 'bun-plugin-dts'

Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    plugins: [dts({
        output: { noBanner: true },
    })],
    minify: true,
    target: "browser",
    sourcemap: "linked",
})