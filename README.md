# Plateforme d'évaluation technique QCM (POC structuré)

Ce dépôt fournit une application web statique permettant de simuler un test technique en mode QCM (SQL, Java, Angular, TypeScript, Spring Framework), avec minuterie, score, analytics de session et journal d’intégrité.

## Démarrage rapide (≤ 10 min)

### Prérequis
- `python3` (version 3.8+ recommandée)
- `make`

### Lancer en une commande
```bash
make run
```
Puis ouvrir : <http://localhost:4173>

## Installation déterministe
Aucune dépendance externe n’est nécessaire :
- Front-end statique (`index.html`, `styles.css`, `script.js`)
- Banque de questions locale (`questions.json`)
- Serveur local Python standard library

## Exemple reproductible (entrée / sortie)
1. Ouvrir l’onglet **Test**.
2. Sélectionner une réponse.
3. Cliquer **Submit answer**.

Sortie attendue (dans la zone de sortie) :
- Bonne réponse : `✅ Correct answer. +10 points.`
- Mauvaise réponse : `❌ Incorrect answer. +0 point.`

## Documentation
- Vue d’ensemble technique : `docs/overview.md`
- Architecture : `docs/architecture.md`
- Cas d’usage métier : `USE_CASE.md`
- Valeur métier mesurable : `VALUE.md`
- Trajectoire d’innovation : `INNOVATION_STATUS.md`
