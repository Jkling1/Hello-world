# API Reference

No public APIs were detected in this repository at the time this was generated. Once your source code is present, this section should list all exported/public functions, classes, interfaces, and modules with examples.

## Regenerating API docs (choose your stack)

### JavaScript/TypeScript (TypeDoc)

1. `npm i -D typedoc typedoc-plugin-markdown`
2. Add `typedoc.json`:

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "categorizeByGroup": false,
  "excludeExternals": true
}
```

3. Add to `package.json`:

```json
{
  "scripts": {
    "docs:api": "typedoc"
  }
}
```

4. Run `npm run docs:api`

### Python (pdoc)

```bash
pip install pdoc
pdoc -o docs/api your_package
```

### Go (gomarkdoc)

```bash
go install golang.org/x/exp/cmd/gomarkdoc@latest
gomarkdoc ./... > docs/api/GO_API.md
```

### Java (Javadoc)

```bash
javadoc -d docs/api -sourcepath src/main/java -subpackages your.root.pkg
```

### .NET (DocFX)

```bash
dotnet tool install -g docfx
docfx init -q
docfx build
```

## Documentation Guidelines

- Describe parameters, return types, exceptions, and side effects
- Include minimal runnable examples for each public API
- Cross-link related APIs and concepts
- Note deprecations and migration paths