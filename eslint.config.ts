import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import type { Linter } from "eslint"
import { defineConfig, includeIgnoreFile } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

interface RestrictedImportPattern {
  regex: string
  message: string
}

function forbidPackage(packageName: string, message: string): RestrictedImportPattern {
  return { regex: `^${RegExp.escape(packageName)}(/|$)`, message }
}

function forbidPathSegment(segment: string, message: string): RestrictedImportPattern {
  return { regex: `(^|/)${RegExp.escape(segment)}(/|$)`, message }
}

function forbidModuleSuffix(suffix: string, message: string): RestrictedImportPattern {
  return { regex: `${RegExp.escape(suffix)}(\\.ts)?$`, message }
}

function restrictImports(...patterns: RestrictedImportPattern[]): Linter.RulesRecord {
  return { "no-restricted-imports": ["error", { patterns }] }
}

const SIBLING_APP_RELATIVE_IMPORT: RestrictedImportPattern = {
  regex: "^(\\.\\./)+(api|web)/src(/|$)",
  message: "Apps must not import each other; share code through @school-portal/contract.",
}

const CONTRACT_DEPENDS_ONLY_ON_ZOD: RestrictedImportPattern = {
  regex: "^(?!zod(/|$)|\\.{1,2}/)",
  message: "The contract may import only zod and its own files.",
}

const API_BOUNDARY = [
  forbidPackage("@school-portal/web", "The API must not depend on the web app."),
  SIBLING_APP_RELATIVE_IMPORT,
]

const SERVICE_BOUNDARY = [
  forbidPackage("fastify", "Services hold business rules; HTTP belongs to handlers and routes."),
  forbidPackage("@fastify", "Services hold business rules; HTTP belongs to handlers and routes."),
  forbidPackage("kysely", "Services reach the database only through a repository."),
  forbidPackage("pg", "Services reach the database only through a repository."),
  forbidPathSegment("db", "Services reach the database only through a repository."),
]

const REPOSITORY_BOUNDARY = [
  forbidPackage("fastify", "Repositories hold queries only; HTTP belongs to handlers and routes."),
  forbidPackage("@fastify", "Repositories hold queries only; HTTP belongs to handlers and routes."),
  forbidModuleSuffix("Handlers", "Repositories must not depend on handlers."),
  forbidModuleSuffix("Routes", "Repositories must not depend on routes."),
]

const HANDLER_BOUNDARY = [
  forbidPathSegment("db", "Handlers call services, never the database."),
  forbidModuleSuffix("Repository", "Handlers call services, never repositories."),
]

const ERRORS_BOUNDARY = [
  forbidPathSegment("modules", "Error handling must not depend on feature modules."),
]

const WEB_APP_BOUNDARY = [
  forbidPackage("@school-portal/api", "The web app talks to the API over HTTP, not by import."),
  SIBLING_APP_RELATIVE_IMPORT,
]

const UI_LIBRARY_CONFINED_TO_COMPONENTS_UI = [
  forbidPackage("antd", "Import antd only inside src/components/ui."),
  forbidPackage("@ant-design", "Import @ant-design packages only inside src/components/ui."),
]

const COMPONENTS_BOUNDARY = [
  forbidPathSegment("features", "Shared components must not depend on features."),
  forbidPathSegment("pages", "Shared components must not depend on pages."),
  forbidPathSegment("api", "Shared components must not call the API."),
]

const FEATURES_BOUNDARY = [
  forbidPathSegment("pages", "Features must not depend on pages."),
  forbidPathSegment("shell", "Features must not depend on the app shell."),
]

const API_CLIENT_BOUNDARY = [
  forbidPackage("react", "The API client must stay free of React."),
  forbidPackage("react-dom", "The API client must stay free of React."),
]

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url))

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["packages/contract/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: restrictImports(CONTRACT_DEPENDS_ONLY_ON_ZOD),
  },
  {
    files: ["apps/api/**/*.ts"],
    rules: restrictImports(...API_BOUNDARY),
  },
  {
    files: ["apps/api/src/**/*Service.ts"],
    rules: restrictImports(...API_BOUNDARY, ...SERVICE_BOUNDARY),
  },
  {
    files: ["apps/api/src/**/*Repository.ts"],
    rules: restrictImports(...API_BOUNDARY, ...REPOSITORY_BOUNDARY),
  },
  {
    files: ["apps/api/src/**/*Handlers.ts"],
    rules: restrictImports(...API_BOUNDARY, ...HANDLER_BOUNDARY),
  },
  {
    files: ["apps/api/src/errors/**/*.ts"],
    rules: restrictImports(...API_BOUNDARY, ...ERRORS_BOUNDARY),
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    rules: restrictImports(...WEB_APP_BOUNDARY, ...UI_LIBRARY_CONFINED_TO_COMPONENTS_UI),
  },
  {
    files: ["apps/web/src/features/**/*.{ts,tsx}"],
    rules: restrictImports(
      ...WEB_APP_BOUNDARY,
      ...UI_LIBRARY_CONFINED_TO_COMPONENTS_UI,
      ...FEATURES_BOUNDARY,
    ),
  },
  {
    files: ["apps/web/src/components/**/*.{ts,tsx}"],
    rules: restrictImports(
      ...WEB_APP_BOUNDARY,
      ...UI_LIBRARY_CONFINED_TO_COMPONENTS_UI,
      ...COMPONENTS_BOUNDARY,
    ),
  },
  {
    files: ["apps/web/src/components/ui/**/*.{ts,tsx}"],
    rules: restrictImports(...WEB_APP_BOUNDARY, ...COMPONENTS_BOUNDARY),
  },
  {
    files: ["apps/web/src/api/**/*.ts"],
    rules: restrictImports(
      ...WEB_APP_BOUNDARY,
      ...UI_LIBRARY_CONFINED_TO_COMPONENTS_UI,
      ...API_CLIENT_BOUNDARY,
    ),
  },
)
