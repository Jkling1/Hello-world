# Examples

This directory aggregates runnable examples and recipes. Add subfolders per example with a short README and a script to run it.

## Suggested structure

```
docs/
  examples/
    01-hello-world/
      README.md
      run.sh
    02-authentication/
      README.md
      run.sh
```

## Example template

```md
# Hello World

Demonstrates the minimal usage of the library.

## Run
```bash
./run.sh
```

## Code
```ts
// import { hello } from '<your-package>'
// console.log(hello('world'))
```
```

## Tips

- Keep examples self-contained and minimal
- Prefer copy-pasteable snippets
- Link back to relevant API and component docs