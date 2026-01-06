import type { Config } from "prettier";

export default {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-autocorrect",
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
} satisfies Config;