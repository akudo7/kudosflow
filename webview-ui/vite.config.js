"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = require("@vitejs/plugin-react");
// https://vitejs.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    build: {
        outDir: "build",
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
    },
});
//# sourceMappingURL=vite.config.js.map