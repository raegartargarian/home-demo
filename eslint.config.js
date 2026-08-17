import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

/** Primitive ramps kept only for unmigrated screens. Reaching for one of these
 *  in a component means a colour decision is being made in JSX instead of in the
 *  token layer — use the semantic classes (`bg-surface`, `text-ink-muted`,
 *  `border-line`, `bg-cat-surface`, `text-verified`) declared in
 *  `src/styles/main.scss` instead. Warn, not error: ~250 call sites predate this. */
const RAW_PALETTE_CLASS =
  /(?:^|\s)(?:bg|text|border|from|to|via|ring|divide|fill|stroke)-(?:gray|blue|green|red|slate|amber|emerald)-\d{2,3}/

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/containers/**/*.{ts,tsx}', 'src/shared/components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: `Literal[value=${RAW_PALETTE_CLASS}]`,
          message:
            'Raw palette class. Use a semantic token instead (bg-surface, text-ink-muted, border-line, bg-cat-surface, text-verified) — see src/styles/main.scss.',
        },
      ],
    },
  },
)
