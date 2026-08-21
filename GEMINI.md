# Project Guidelines & Invariants (GEMINI.md)

## Explorer & Directory Picker Invariant
- **NEVER use Windows Explorer or native OS folder pickers (`pick_folder` / system dialogs).**
- **STRICTLY use our own custom in-app directory picker (`DirectoryPickerModal`).**
- Any folder browsing or repository directory selection must render and use `DirectoryPickerModal`.

## Sync & Deployment Rules
- Do NOT sync, copy, or build artifacts into `/home/opc/projects/Flurer/plugins/git/`.
- Plugin releases are published via tag pushing (`v*`) to `sahuishan01/flurer-plugin-git`.
