import { readFile, writeFile } from "node:fs/promises"
import { OPENAPI_DOCUMENT_PATH, generateOpenApiDocument } from "../src/http/openApiDocument.ts"

const isCheckMode = process.argv.includes("--check")
const document = await generateOpenApiDocument()

async function committedDocument(): Promise<string | undefined> {
  try {
    return await readFile(OPENAPI_DOCUMENT_PATH, "utf8")
  } catch {
    return undefined
  }
}

if (isCheckMode) {
  if ((await committedDocument()) !== document) {
    console.error("apps/api/openapi.json is out of date. Run: pnpm openapi:write")
    process.exitCode = 1
  }
} else {
  await writeFile(OPENAPI_DOCUMENT_PATH, document)
  console.log(`Wrote ${OPENAPI_DOCUMENT_PATH}`)
}
