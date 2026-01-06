import type { Config } from "prettier";

export default {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-autocorrect",
  ],
} satisfies Config;