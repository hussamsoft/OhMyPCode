#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const vendor = path.join(root, "vendor", "oh-my-pi");
const codingAgentSrc = path.join(vendor, "packages", "coding-agent", "src");
const tuiSrc = path.join(vendor, "packages", "tui", "src");

const files = {
  flagTables: path.join(codingAgentSrc, "cli", "flag-tables.ts"),
  cliCommands: path.join(codingAgentSrc, "cli-commands.ts"),
  slashModes: path.join(codingAgentSrc, "slash-commands", "builtin-modes.ts"),
  slashCollab: path.join(codingAgentSrc, "slash-commands", "builtin-collaboration.ts"),
  slashSession: path.join(codingAgentSrc, "slash-commands", "builtin-session.ts"),
  slashLifecycle: path.join(codingAgentSrc, "slash-commands", "builtin-lifecycle.ts"),
  slashMarketplace: path.join(codingAgentSrc, "slash-commands", "builtin-marketplace.ts"),
  slashSkills: path.join(codingAgentSrc, "slash-commands", "builtin-skills.ts"),
  slashControl: path.join(codingAgentSrc, "slash-commands", "builtin-control.ts"),
  toolsBuiltin: path.join(codingAgentSrc, "tools", "builtin-names.ts"),
  toolsVibe: path.join(codingAgentSrc, "tools", "vibe.ts"),
  rpcTypes: path.join(codingAgentSrc, "modes", "rpc", "rpc-types.ts"),
  // v18.3.1 replaced the static `config/settings-schema.ts` object literal with a
  // runtime registry (`config/registry.ts`). Settings are now declared by
  // `register({ id, type, ui, ... })` calls spread across ~35 domain modules, so the
  // surface is read by AST-scanning those modules. Every domain module is discovered
  // from its registry import, so a new one cannot be silently missed.
  settingsRegistry: path.join(codingAgentSrc, "config", "registry.ts"),
  tuiKeybindings: path.join(tuiSrc, "keybindings.ts"),
  appKeybindings: path.join(tuiSrc, "app-keybindings.ts"),
  statusSchema: path.join(tuiSrc, "status-line", "schema.ts"),
};

function collectTypeScriptFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTypeScriptFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Modules that import the settings registry; these are where `register()` lives.
 * Resolution is done through real import specifiers rather than a text match, so a
 * new domain is picked up whether it sits beside the registry (`./registry`) or above
 * it (`../../config/registry`) without editing this script.
 */
function findSettingsDomainFiles() {
  const target = path.resolve(files.settingsRegistry);
  const domainFiles = [];
  for (const filePath of collectTypeScriptFiles(codingAgentSrc)) {
    if (filePath === files.settingsRegistry) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const match of text.matchAll(/from\s+"(\.[^"]*)"/g)) {
      if (resolveRelativeModule(path.dirname(filePath), match[1]) === target) {
        domainFiles.push(filePath);
        break;
      }
    }
  }
  if (domainFiles.length === 0) {
    throw new Error(
      `No settings domain modules import ${files.settingsRegistry}; the settings surface would read as empty`,
    );
  }
  return domainFiles;
}

// Every module that imports the settings registry, discovered from source text so a
// newly added settings domain is picked up without editing this script.
const settingsDomainFiles = findSettingsDomainFiles();

for (const [key, filePath] of Object.entries(files)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required OMP source file missing for ${key}: ${filePath}`);
  }
}

const program = ts.createProgram([...Object.values(files), ...settingsDomainFiles], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
});

function getSourceFile(filePath) {
  const sf = program.getSourceFile(filePath);
  if (!sf) throw new Error(`Could not load source file into AST: ${filePath}`);
  return sf;
}

// Followed modules are only read for literals, so they are parsed standalone rather
// than pulled into the program; that keeps the program root set to the named surfaces.
const standaloneSourceFiles = new Map();

function parseStandalone(filePath) {
  const cached = standaloneSourceFiles.get(filePath);
  if (cached) return cached;
  const sf = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
  );
  standaloneSourceFiles.set(filePath, sf);
  return sf;
}

function unwrapExpression(expr) {
  let cur = expr;
  while (
    cur &&
    (ts.isAsExpression(cur) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(cur)))
  ) {
    cur = cur.expression;
  }
  return cur;
}

function findVariableDeclaration(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name) {
          return decl;
        }
      }
    }
  }
  return null;
}

// -------------------------------------------------------------
// 1. Flags: STRING_SETTERS, OPTIONAL_FLAGS, VALUELESS_FLAGS
// -------------------------------------------------------------
function extractObjectLiteralFlags(sf, varName, kind) {
  const decl = findVariableDeclaration(sf, varName);
  if (!decl?.initializer) throw new Error(`${varName} not found in flag-tables.ts`);
  const init = unwrapExpression(decl.initializer);
  if (!ts.isObjectLiteralExpression(init))
    throw new Error(`${varName} initializer is not an ObjectLiteral`);

  const flags = [];
  for (const prop of init.properties) {
    if (!prop.name) continue;
    const text =
      ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name)
        ? prop.name.text
        : prop.name.getText(sf).replace(/['"]/g, "");
    flags.push({ name: text, kind, source: varName });
  }
  return flags;
}

function extractSetFlags(sf, varName, kind) {
  const decl = findVariableDeclaration(sf, varName);
  if (!decl?.initializer) throw new Error(`${varName} not found in flag-tables.ts`);
  const init = unwrapExpression(decl.initializer);
  if (!ts.isNewExpression(init)) throw new Error(`${varName} initializer is not a NewExpression`);
  const arg = init.arguments?.[0];
  if (!arg || !ts.isArrayLiteralExpression(arg))
    throw new Error(`${varName} Set argument is not an ArrayLiteral`);

  const flags = [];
  for (const elem of arg.elements) {
    if (ts.isStringLiteral(elem)) {
      flags.push({ name: elem.text, kind, source: varName });
    }
  }
  return flags;
}

function extractFlags() {
  const sf = getSourceFile(files.flagTables);
  const flags = [
    ...extractObjectLiteralFlags(sf, "STRING_SETTERS", "string"),
    ...extractObjectLiteralFlags(sf, "OPTIONAL_FLAGS", "optional"),
    ...extractSetFlags(sf, "VALUELESS_FLAGS", "valueless"),
  ];

  if (flags.length === 0) throw new Error("Extracted 0 CLI flags from flag-tables.ts");
  return flags;
}

// -------------------------------------------------------------
// 2. Subcommands: commands array in cli-commands.ts
// -------------------------------------------------------------
function getCommandNameFromObject(elem) {
  for (const prop of elem.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === "name" &&
      ts.isStringLiteral(prop.initializer)
    ) {
      return prop.initializer.text;
    }
  }
  return null;
}

function extractSubcommands() {
  const sf = getSourceFile(files.cliCommands);
  const subcommands = [];

  const decl = findVariableDeclaration(sf, "commands");
  if (!decl?.initializer) throw new Error("commands variable not found in cli-commands.ts");
  const init = unwrapExpression(decl.initializer);
  if (!ts.isArrayLiteralExpression(init))
    throw new Error("commands initializer is not an ArrayLiteral");

  for (const elem of init.elements) {
    if (!ts.isObjectLiteralExpression(elem)) continue;
    const name = getCommandNameFromObject(elem);
    if (name) subcommands.push({ name });
  }

  if (subcommands.length === 0) throw new Error("Extracted 0 subcommands from cli-commands.ts");
  return subcommands;
}

// -------------------------------------------------------------
// 3. Builtin Slash Commands: top-level commands and their aliases
// -------------------------------------------------------------
function parseCommandObject(elem) {
  let name = "";
  let description = "";
  const aliases = [];
  let hasHandle = false;

  for (const prop of elem.properties) {
    if (!ts.isPropertyAssignment(prop) && !ts.isMethodDeclaration(prop)) continue;
    const propName =
      prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))
        ? prop.name.text
        : "";
    if (
      propName === "name" &&
      ts.isPropertyAssignment(prop) &&
      ts.isStringLiteral(prop.initializer)
    ) {
      name = prop.initializer.text;
    } else if (
      propName === "description" &&
      ts.isPropertyAssignment(prop) &&
      ts.isStringLiteral(prop.initializer)
    ) {
      description = prop.initializer.text;
    } else if (
      propName === "aliases" &&
      ts.isPropertyAssignment(prop) &&
      ts.isArrayLiteralExpression(prop.initializer)
    ) {
      for (const a of prop.initializer.elements) {
        if (ts.isStringLiteral(a)) aliases.push(a.text);
      }
    } else if (propName === "handle") {
      hasHandle = true;
    }
  }

  return name ? { name, description, aliases, hasHandle } : null;
}

function extractSlashCommands() {
  const groups = [
    { file: files.slashModes, varName: "BUILTIN_MODE_SLASH_COMMANDS" },
    { file: files.slashCollab, varName: "BUILTIN_COLLABORATION_SLASH_COMMANDS" },
    { file: files.slashSession, varName: "BUILTIN_SESSION_SLASH_COMMANDS" },
    { file: files.slashLifecycle, varName: "BUILTIN_LIFECYCLE_SLASH_COMMANDS" },
    { file: files.slashMarketplace, varName: "BUILTIN_MARKETPLACE_SLASH_COMMANDS" },
    { file: files.slashSkills, varName: "BUILTIN_SKILLS_SLASH_COMMANDS" },
    { file: files.slashControl, varName: "BUILTIN_CONTROL_SLASH_COMMANDS" },
  ];

  const commands = [];
  const allNames = new Set();

  for (const { file, varName } of groups) {
    const sf = getSourceFile(file);
    const decl = findVariableDeclaration(sf, varName);
    if (!decl?.initializer) throw new Error(`${varName} not found in ${file}`);
    const init = unwrapExpression(decl.initializer);
    if (!ts.isArrayLiteralExpression(init)) throw new Error(`${varName} is not an ArrayLiteral`);

    for (const elem of init.elements) {
      if (!ts.isObjectLiteralExpression(elem)) continue;
      const cmd = parseCommandObject(elem);
      if (!cmd) continue;
      commands.push(cmd);
      allNames.add(cmd.name);
      for (const a of cmd.aliases) allNames.add(a);
    }
  }

  if (commands.length === 0) throw new Error("Extracted 0 slash commands");
  return { commands, allNames: [...allNames].sort() };
}

// -------------------------------------------------------------
// 4. Tools: BUILTIN_TOOL_NAMES, HIDDEN_TOOL_NAMES, VIBE_TOOL_NAMES
// -------------------------------------------------------------
function readArrayStrings(sf, varName, kind) {
  const decl = findVariableDeclaration(sf, varName);
  if (!decl?.initializer) throw new Error(`${varName} not found in ${sf.fileName}`);
  const init = unwrapExpression(decl.initializer);
  if (!ts.isArrayLiteralExpression(init)) throw new Error(`${varName} is not an ArrayLiteral`);
  const out = [];
  for (const elem of init.elements) {
    if (ts.isStringLiteral(elem)) {
      out.push({ name: elem.text, kind });
    }
  }
  return out;
}

function extractTools() {
  const sfBuiltin = getSourceFile(files.toolsBuiltin);
  const sfVibe = getSourceFile(files.toolsVibe);
  const tools = [
    ...readArrayStrings(sfBuiltin, "BUILTIN_TOOL_NAMES", "builtin"),
    ...readArrayStrings(sfBuiltin, "HIDDEN_TOOL_NAMES", "hidden"),
    ...readArrayStrings(sfVibe, "VIBE_TOOL_NAMES", "vibe"),
  ];

  if (tools.length === 0) throw new Error("Extracted 0 tools");
  return tools;
}

// -------------------------------------------------------------
// 5. RPC Commands: types in RpcCommand union
// -------------------------------------------------------------
function getRpcCommandType(member) {
  let typeLit = member;
  if (ts.isParenthesizedTypeNode && ts.isParenthesizedTypeNode(typeLit)) {
    typeLit = typeLit.type;
  }
  if (!ts.isTypeLiteralNode(typeLit)) return null;

  for (const prop of typeLit.members) {
    const isTypeProp =
      ts.isPropertySignature(prop) && ts.isIdentifier(prop.name) && prop.name.text === "type";
    if (
      isTypeProp &&
      prop.type &&
      ts.isLiteralTypeNode(prop.type) &&
      ts.isStringLiteral(prop.type.literal)
    ) {
      return prop.type.literal.text;
    }
  }
  return null;
}

function extractRpcCommands() {
  const sf = getSourceFile(files.rpcTypes);
  const rpcCommands = [];

  for (const statement of sf.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== "RpcCommand") continue;
    if (!ts.isUnionTypeNode(statement.type)) throw new Error("RpcCommand is not a UnionTypeNode");

    for (const member of statement.type.types) {
      const typeName = getRpcCommandType(member);
      if (typeName) rpcCommands.push(typeName);
    }
  }

  if (rpcCommands.length === 0) throw new Error("Extracted 0 RPC commands from rpc-types.ts");
  return [...new Set(rpcCommands)].sort();
}

// -------------------------------------------------------------
// 6. Settings: ui-bearing paths in SETTINGS_SCHEMA
function readRegisterUiProperties(uiObj, filePath) {
  let tab = "";
  let group = "";
  let label = "";
  let secret = false;
  for (const prop of uiObj.properties) {
    if (ts.isSpreadAssignment(prop)) {
      throw new Error(
        `settings \`ui\` in ${filePath} uses a spread element; cannot read statically`,
      );
    }
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const initializer = unwrapExpression(prop.initializer);
    if (prop.name.text === "tab" && ts.isStringLiteral(initializer)) tab = initializer.text;
    if (prop.name.text === "group" && ts.isStringLiteral(initializer)) group = initializer.text;
    if (prop.name.text === "label" && ts.isStringLiteral(initializer)) label = initializer.text;
    if (prop.name.text === "secret" && initializer.kind === ts.SyntaxKind.TrueKeyword)
      secret = true;
  }
  return { tab, group, label, secret };
}

/**
 * Indexes `export const NAME = [ {…}, {…} ] as const` object arrays so a templated
 * setting id such as `` `magicKeywords.${keyword.id}` `` can be expanded to the
 * concrete ids it registers. Relative imports are followed so a list declared in a
 * sibling module (`MAGIC_KEYWORDS` lives in `modes/magic-keywords.ts`) is visible
 * under the name the importing file uses. Anything a template refers to that cannot
 * be resolved throws, so an unresolvable id is never skipped silently.
 */
const constArrayIndex = new Map();

/** Records `EXPORTED -> entries` for each named import this file pulls from a followed module. */
function addImportedConstArrays(sf, filePath, arrays, visiting) {
  const dir = path.dirname(filePath);
  for (const statement of sf.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith(".")) continue;
    const target = resolveRelativeModule(dir, specifier);
    if (!target) continue;
    recordImportedConstArrays(statement, indexConstObjectArrays(target, visiting), arrays);
  }
}

function recordImportedConstArrays(statement, imported, arrays) {
  const binding = statement.importClause?.namedBindings;
  for (const [name, entries] of imported) {
    if (!binding || !ts.isNamedImports(binding)) {
      arrays.set(name, entries);
      continue;
    }
    for (const element of binding.elements) {
      const exported = element.propertyName ? element.propertyName.text : element.name.text;
      if (exported === name) arrays.set(element.name.text, entries);
    }
  }
}

/** Adds this file's own `export const NAME = [ {…} ] as const` object arrays. */
function addLocalConstArrays(sf, arrays) {
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      const entries = objectEntriesOf(decl.initializer);
      if (entries.length > 0) arrays.set(decl.name.text, entries);
    }
  }
}

function objectEntriesOf(initializer) {
  let init = initializer;
  while (ts.isAsExpression(init) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(init))) {
    init = init.expression;
  }
  if (!ts.isArrayLiteralExpression(init)) return [];
  return init.elements.filter((element) => ts.isObjectLiteralExpression(element));
}

function indexConstObjectArrays(filePath, visiting) {
  if (constArrayIndex.has(filePath)) return constArrayIndex.get(filePath);
  if (visiting.has(filePath)) return new Map();
  visiting.add(filePath);

  const arrays = new Map();
  const sf = parseStandalone(filePath);
  addImportedConstArrays(sf, filePath, arrays, visiting);
  addLocalConstArrays(sf, arrays);

  visiting.delete(filePath);
  constArrayIndex.set(filePath, arrays);
  return arrays;
}

function resolveRelativeModule(fromDir, specifier) {
  const base = path.resolve(fromDir, specifier);
  for (const candidate of [`${base}.ts`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readStringProperty(literal, property, filePath) {
  for (const prop of literal.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    if (prop.name.text !== property) continue;
    const initializer = unwrapExpression(prop.initializer);
    if (!ts.isStringLiteral(initializer)) {
      throw new Error(
        `${property} in ${filePath} is not a string literal; cannot resolve templated settings ids`,
      );
    }
    return initializer.text;
  }
  throw new Error(`${property} is missing in ${filePath}; cannot resolve templated settings ids`);
}

/**
 * Expands one register() literal's id into the concrete ids it declares. A templated
 * id is resolved against `mapBindings`: the arrow-parameter -> entries bindings
 * created by enclosing `SOME_CONST_ARRAY.map(param => …)` calls, plus any const array
 * in the same file. Anything else throws.
 */
function resolveSettingIds(initializer, constArrays, mapBindings, filePath) {
  if (ts.isStringLiteral(initializer)) return [initializer.text];
  if (!ts.isTemplateExpression(initializer)) {
    throw new Error(
      `settings id in ${filePath} is neither a string nor a resolvable template literal`,
    );
  }
  if (initializer.templateSpans.length !== 1) {
    throw new Error(
      `settings id template in ${filePath} has ${initializer.templateSpans.length} spans; only one substitution is supported`,
    );
  }
  const head = initializer.head.text;
  const tail = initializer.templateSpans[0].literal.text;
  const span = initializer.templateSpans[0].expression;
  if (!ts.isPropertyAccessExpression(span) || !ts.isIdentifier(span.expression)) {
    throw new Error(
      `settings id template in ${filePath} is not \`<prefix>.${paramOrConst}.<prop>\` shaped`,
    );
  }
  const subject = span.expression.text;
  const sourceEntries = mapBindings.get(subject) ?? constArrays.get(subject);
  if (!sourceEntries) {
    throw new Error(
      `settings id template in ${filePath} refers to "${subject}", which is neither a mapped const array nor a static const array in the same file`,
    );
  }
  return sourceEntries.map(
    (entry) => `${head}${readStringProperty(entry, span.name.text, filePath)}${tail}`,
  );
}

/** Finds `<CONST_ARRAY>.map(<param> => …)` bindings enclosing a node, innermost last. */
function findMapBindings(node, constArrays) {
  const bindings = new Map();
  const search = (current, seen) => {
    if (bindings.size > 0) return;
    const parent = seen.get(current) ?? current.parent;
    if (!parent) return;
    if (
      ts.isCallExpression(parent) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      parent.expression.name.text === "map" &&
      ts.isIdentifier(parent.expression.expression) &&
      parent.arguments[0] &&
      ts.isArrowFunction(parent.arguments[0]) &&
      parent.arguments[0].parameters[0] &&
      ts.isIdentifier(parent.arguments[0].parameters[0].name)
    ) {
      const entries = constArrays.get(parent.expression.expression.text);
      if (entries) bindings.set(parent.arguments[0].parameters[0].name.text, entries);
    }
    seen.set(current, parent);
    search(parent, seen);
  };
  search(node, new Map());
  return bindings;
}

function readRegisterDefinition(literal, constArrays, mapBindings, filePath) {
  let idInit = null;
  let type = "";
  let credential = false;
  let hasUi = false;
  let ui = { tab: "", group: "", label: "", secret: false };

  for (const prop of literal.properties) {
    if (ts.isSpreadAssignment(prop)) {
      throw new Error(
        `settings definition in ${filePath} uses a spread element; cannot read statically`,
      );
    }
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const initializer = unwrapExpression(prop.initializer);
    if (prop.name.text === "id") {
      idInit = initializer;
    } else if (prop.name.text === "type" && ts.isStringLiteral(initializer)) {
      type = initializer.text;
    } else if (prop.name.text === "credential" && initializer.kind === ts.SyntaxKind.TrueKeyword) {
      credential = true;
    } else if (prop.name.text === "ui") {
      hasUi = true;
      if (ts.isObjectLiteralExpression(initializer))
        ui = readRegisterUiProperties(initializer, filePath);
    }
  }
  if (idInit === null) throw new Error(`a register() call in ${filePath} has no id`);
  const ids = resolveSettingIds(idInit, constArrays, mapBindings, filePath);
  return ids.map((id) => Object.assign({ id, type, credential, hasUi }, ui));
}

function extractSettings() {
  const settings = [];
  const seen = new Set();

  for (const filePath of settingsDomainFiles) {
    // Standalone parse (not the program): `ts.createProgram` leaves `parent`
    // unset, and resolving a templated id needs the enclosing `.map()` call.
    const sf = parseStandalone(filePath);
    const constArrays = indexConstObjectArrays(filePath, new Set());
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "register"
      ) {
        const literal = node.arguments[0] ? unwrapExpression(node.arguments[0]) : null;
        if (!literal || !ts.isObjectLiteralExpression(literal)) {
          throw new Error(
            `register() in ${filePath} is not called with an object literal; cannot read statically`,
          );
        }
        for (const entry of readRegisterDefinition(
          literal,
          constArrays,
          findMapBindings(node, constArrays),
          filePath,
        )) {
          if (seen.has(entry.id))
            throw new Error(`duplicate settings id "${entry.id}" in ${filePath}`);
          seen.add(entry.id);
          settings.push({
            path: entry.id,
            type: entry.type,
            credential: entry.credential,
            hasUi: entry.hasUi,
            tab: entry.tab,
            group: entry.group,
            label: entry.label,
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  if (settings.length === 0) throw new Error("Extracted 0 settings from the settings registry");
  return settings;
}

// -------------------------------------------------------------
// 7. Keybindings: TUI_KEYBINDINGS + KEYBINDINGS
// -------------------------------------------------------------
function parseKeybindingValue(val) {
  let defaultKeys = "";
  let description = "";
  for (const inner of val.properties) {
    if (!ts.isPropertyAssignment(inner) || !ts.isIdentifier(inner.name)) continue;
    if (inner.name.text === "description" && ts.isStringLiteral(inner.initializer)) {
      description = inner.initializer.text;
    } else if (inner.name.text === "defaultKeys") {
      if (ts.isStringLiteral(inner.initializer)) {
        defaultKeys = inner.initializer.text;
      } else if (ts.isArrayLiteralExpression(inner.initializer)) {
        defaultKeys = inner.initializer.elements
          .map((e) => (ts.isStringLiteral(e) ? e.text : ""))
          .filter(Boolean)
          .join(", ");
      }
    }
  }
  return { defaultKeys, description };
}

function readBindingsFromObject(sf, varName, seenIds, keybindings) {
  const decl = findVariableDeclaration(sf, varName);
  if (!decl?.initializer) throw new Error(`${varName} not found in ${sf.fileName}`);
  const init = unwrapExpression(decl.initializer);
  if (!ts.isObjectLiteralExpression(init)) throw new Error(`${varName} is not an ObjectLiteral`);

  for (const prop of init.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const id = prop.name.text || prop.name.getText(sf).replace(/['"]/g, "");
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const val = unwrapExpression(prop.initializer);
    const details =
      val && ts.isObjectLiteralExpression(val)
        ? parseKeybindingValue(val)
        : { defaultKeys: "", description: "" };
    keybindings.push({ id, keys: details.defaultKeys, description: details.description });
  }
}

function extractKeybindings() {
  const keybindings = [];
  const seenIds = new Set();
  const sfTui = getSourceFile(files.tuiKeybindings);
  const sfApp = getSourceFile(files.appKeybindings);
  readBindingsFromObject(sfTui, "TUI_KEYBINDINGS", seenIds, keybindings);
  readBindingsFromObject(sfApp, "KEYBINDINGS", seenIds, keybindings);

  if (keybindings.length === 0) throw new Error("Extracted 0 keybindings");
  return keybindings;
}

// -------------------------------------------------------------
// 8. Status Line Segments: STATUS_LINE_SEGMENT_IDS in schema.ts
// -------------------------------------------------------------
function extractStatusSegments() {
  const sf = getSourceFile(files.statusSchema);
  const segments = [];

  const decl = findVariableDeclaration(sf, "STATUS_LINE_SEGMENT_IDS");
  if (!decl?.initializer)
    throw new Error("STATUS_LINE_SEGMENT_IDS not found in status-line/schema.ts");
  const init = unwrapExpression(decl.initializer);
  if (!ts.isArrayLiteralExpression(init))
    throw new Error("STATUS_LINE_SEGMENT_IDS is not an ArrayLiteral");

  for (const elem of init.elements) {
    if (ts.isStringLiteral(elem)) {
      segments.push(elem.text);
    }
  }

  if (segments.length === 0) throw new Error("Extracted 0 status line segments");
  return [...new Set(segments)].sort();
}

// -------------------------------------------------------------
// 9. Overlays: directory listing of vendor/packages/tui/src/overlays
// -------------------------------------------------------------
function isOverlayFile(name, overlaysDir) {
  const full = path.join(overlaysDir, name);
  return (
    fs.statSync(full).isDirectory() ||
    (name.endsWith(".tsx") && !name.endsWith(".test.tsx") && !name.endsWith(".d.ts")) ||
    (name.endsWith(".ts") &&
      !name.endsWith(".test.ts") &&
      !name.endsWith(".d.ts") &&
      name !== "index.ts")
  );
}

function extractOverlays() {
  const overlaysDir = path.join(tuiSrc, "overlays");
  if (!fs.existsSync(overlaysDir)) throw new Error(`Overlays directory missing: ${overlaysDir}`);
  const entries = fs.readdirSync(overlaysDir);
  const overlays = entries
    .filter((name) => isOverlayFile(name, overlaysDir))
    .map((name) => name.replace(/\.tsx?$/, ""));

  if (overlays.length === 0) throw new Error("Extracted 0 overlays");
  return overlays.sort((a, b) => a.localeCompare(b));
}

// -------------------------------------------------------------
// 10. Generate Markdown Output
// -------------------------------------------------------------
function generateControlSurfaceMarkdown() {
  const flags = extractFlags();
  const subcommands = extractSubcommands();
  const slash = extractSlashCommands();
  const tools = extractTools();
  const rpc = extractRpcCommands();
  const settings = extractSettings();
  const keybindings = extractKeybindings();
  const segments = extractStatusSegments();
  const overlays = extractOverlays();

  const surfaces = {
    flags: flags.length,
    subcommands: subcommands.length,
    slashCommands: slash.commands.length,
    tools: tools.length,
    rpcCommands: rpc.length,
    settings: settings.length,
    keybindings: keybindings.length,
    segments: segments.length,
    overlays: overlays.length,
  };

  for (const [name, count] of Object.entries(surfaces)) {
    if (count === 0) {
      throw new Error(
        `Inviolable invariant failed: surface '${name}' is empty (0 entries extracted)!`,
      );
    }
  }

  let md = "# OMP Control Surface Inventory\n\n";
  md +=
    "Machine-checked inventory generated by `scripts/generate-omp-control-surface.mjs` directly from the OMP source of truth in `vendor/oh-my-pi`.\n\n";

  md += `## 1. CLI Flags (${flags.length} total)\n\n`;
  md += "| Flag | Kind | Source table |\n|---|---|---|\n";
  for (const f of flags.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${f.name}\` | ${f.kind} | ${f.source} |\n`;
  }

  md += `\n## 2. CLI Subcommands (${subcommands.length} total)\n\n`;
  md += "| Subcommand | Source of Truth |\n|---|---|\n";
  for (const s of subcommands.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${s.name}\` | \`cli-commands.ts:commands\` |\n`;
  }

  md += `\n## 3. Builtin Slash Commands (${slash.allNames.length} names & aliases across ${slash.commands.length} definitions)\n\n`;
  md += "| Command | Aliases | RPC Handle? | Description |\n|---|---|---|---|\n";
  for (const c of slash.commands.sort((a, b) => a.name.localeCompare(b.name))) {
    const aliasesStr = c.aliases.length > 0 ? c.aliases.map((a) => `\`${a}\``).join(", ") : "—";
    md += `| \`/${c.name}\` | ${aliasesStr} | ${c.hasHandle ? "Yes (`handle`)" : "TUI only (`handleTui`)"} | ${c.description || "—"} |\n`;
  }

  md += `\n## 4. Builtin Tools (${tools.length} total)\n\n`;
  md += "| Tool Name | Category |\n|---|---|\n";
  for (const t of tools.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `| \`${t.name}\` | ${t.kind} |\n`;
  }

  md += `\n## 5. RPC Commands (${rpc.length} total)\n\n`;
  md += "| RPC Command Type | Transport |\n|---|---|\n";
  for (const r of rpc) {
    md += "| `" + r + "` | OMP JSON-RPC (`--mode rpc`) |\n";
  }

  md += `\n## 6. Settings Schema (${settings.length} total settings, ${settings.filter((s) => s.hasUi).length} with UI metadata)\n\n`;
  md += "| Path | Has UI | Tab | Group |\n|---|---|---|---|\n";
  for (const s of settings.sort((a, b) => a.path.localeCompare(b.path))) {
    md += `| \`${s.path}\` | ${s.hasUi ? "Yes" : "No"} | ${s.tab || "—"} | ${s.group || "—"} |\n`;
  }

  md += `\n## 7. Keybindings (${keybindings.length} default bindings)\n\n`;
  md += "| Action ID | Default Keys | Description |\n|---|---|---|\n";
  for (const k of keybindings.sort((a, b) => a.id.localeCompare(b.id))) {
    md += `| \`${k.id}\` | \`${k.keys}\` | ${k.description || "—"} |\n`;
  }

  md += `\n## 8. Status Line Segments (${segments.length} segment IDs)\n\n`;
  md += "| Segment ID |\n|---|\n";
  for (const seg of segments) {
    md += `| \`${seg}\` |\n`;
  }

  md += `\n## 9. TUI Overlays (${overlays.length} overlays)\n\n`;
  md += "| Overlay Name |\n|---|\n";
  for (const o of overlays) {
    md += `| \`${o}\` |\n`;
  }

  return md;
}

// -------------------------------------------------------------
// Entrypoint & --check mode
// -------------------------------------------------------------
const isCheck = process.argv.includes("--check");
const outputPath = path.join(root, "docs", "omp", "CONTROL-SURFACE.md");

const generatedContent = generateControlSurfaceMarkdown();

if (isCheck) {
  if (!fs.existsSync(outputPath)) {
    console.error(
      `Error: ${outputPath} does not exist. Run 'node scripts/generate-omp-control-surface.mjs' to generate it.`,
    );
    process.exit(1);
  }
  const existing = fs.readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n");
  const normalizedGenerated = generatedContent.replace(/\r\n/g, "\n");
  if (existing !== normalizedGenerated) {
    console.error(
      `Error: ${outputPath} is out of date. Run 'node scripts/generate-omp-control-surface.mjs' to update it.`,
    );
    process.exit(1);
  }
  console.log(`[parity:check] ${path.relative(root, outputPath)} is up to date.`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generatedContent, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}
