# Architecture

## Vue simplifiée

```mermaid
flowchart LR
    U[Utilisateur] --> B[Navigateur]
    B --> H[index.html]
    B --> C[styles.css]
    B --> JS[script.js]
    JS --> Q[(questions.json)]
    JS --> UI[Affichage score / timer / intégrité]
```

## Responsabilités
- **UI statique** : rendu des écrans et contrôles.
- **Moteur d’évaluation (script.js)** : orchestration du test, randomisation, scoring, analytics.
- **Source de données locale** : banque de questions JSON versionnée dans le repo.
