# Project structure

```text
dsa-progress-tracker/
  package.json                  # root workspace scripts
  README.md                     # setup and API instructions
  client/
    package.json                # Vite + React app
    src/
      App.jsx
      styles.css
      components/
      hooks/
      utils/
  server/
    package.json                # Express backend
    src/
      index.js                  # REST API
      store.js                  # data/progress persistence
      query.js                  # filtering, sorting, export helpers
    data/
      questions.json            # 1,755 unique questions
      metadata.json             # extraction audit and options
      progress.example.json     # progress schema
```
