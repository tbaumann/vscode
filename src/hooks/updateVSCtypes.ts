import * as path from "path";
import { writeFileSync } from "fs";
import { compile, JSONSchema } from "json-schema-to-typescript";
import fetch from "node-fetch";

const tag = process.argv[2] ?? "latest";
const vscodeSchemasRoot = `https://raw.githubusercontent.com/wraith13/vscode-schemas/master/en/${tag}/schemas/`;

const bannerComment = `/* eslint-disable */
/**
 * This file was automatically generated.
 * DO NOT MODIFY IT BY HAND.
 * Instead, run \`yarn run updateVSCtypes\` to regenerate this file.
 */`;

const mappings = [
  {
    schema: vscodeSchemasRoot + "token-styling.json",
    name: "SemanticTokens",
    fname: "token-styling.d.ts",
    kind: "jsonschema",
  },
  {
    schema: vscodeSchemasRoot + "textmate-colors.json",
    name: "TextmateColors",
    fname: "textmate-colors.d.ts",
    kind: "jsonschema",
  },
  {
    schema: vscodeSchemasRoot + "workbench-colors.json",
    name: "WorkbenchColors",
    fname: "workbench-colors.d.ts",
    kind: "jsonschema",
  },
  {
    schema:
      "https://raw.githubusercontent.com/usernamehw/vscode-error-lens/v3.13.0/package.json",
    name: "ErrorLensColors",
    fname: "errorlens.d.ts",
    kind: "extension-packagejson",
  },
  {
    schema:
      "https://raw.githubusercontent.com/gitkraken/vscode-gitlens/v14.4.0/package.json",
    name: "GitLensColors",
    fname: "gitlens.d.ts",
    kind: "extension-packagejson",
  },
];

for (const { schema, name, fname, kind } of mappings) {
  fetch(schema)
    .then((data) => data.json())
    .then((data) => {
      switch (kind) {
        case "jsonschema":
          return compile(data as JSONSchema, name, {
            additionalProperties: false,
            bannerComment,
          });
        case "extension-packagejson":
          return fromVSIXColors(name, data);
        default:
          throw new Error(`Unknown kind: ${kind}`);
      }
    })
    .then((typeDefs) => {
      const fp = path.join(__dirname, `../types/${fname}`);
      writeFileSync(fp, typeDefs, "utf-8");
    });
}

const fromVSIXColors = (interfaceName: string, data: any) => {
  let content = `${bannerComment}
export interface ${interfaceName} {`;
  data.contributes.colors.map((color: any) => {
    content += `
  /**
   * ${color.description}
   */
  "${color.id}": string;
`;
  });
  return content + "}\n";
};
