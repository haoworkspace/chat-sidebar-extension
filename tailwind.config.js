/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  // 只扫描这两个地方，速度会快100倍
  content: ["./popup.tsx", "./contents/**/*.tsx"],
  theme: {
    extend: {},
  },
  plugins: [],
}