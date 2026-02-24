# Plateforme d'évaluation technique QCM

Ce repository contient un POC **documenté et relançable** pour évaluer des candidats via un QCM technique (SQL, Java, Angular, TypeScript, Spring).

## Démarrage en moins de 10 minutes

### Prérequis
- `python3` (3.8+)
- `make`

### Lancer l'application
```bash
make run
```
Application disponible sur : <http://localhost:4173>

## Installation déterministe
Aucune installation de package n'est nécessaire :
- serveur HTTP : module standard `python3 -m http.server`
- UI : `index.html`, `styles.css`, `script.js`
- données : `questions.json`

## Exemple reproductible d'entrée/sortie
1. Ouvrir l'onglet **Test**.
2. Répondre à une question.
3. Cliquer sur **Submit answer**.

Sorties attendues :
- `✅ Correct answer. +10 points.`
- `❌ Incorrect answer. +0 point.`

## Commandes utiles
```bash
make run      # lance l'application
make check    # vérifie les artefacts de standardisation
```

## Documentation du projet
- Vue d'ensemble : `docs/overview.md`
- Architecture : `docs/architecture.md`
- Cas d'usage : `USE_CASE.md`
- Valeur métier : `VALUE.md`
- Statut d'innovation : `INNOVATION_STATUS.md`
