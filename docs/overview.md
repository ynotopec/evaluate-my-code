# Overview technique

## Objectif
Fournir un environnement d’évaluation technique rapide à exécuter pour des tests QCM multi-thèmes avec scoring, contraintes de temps, et éléments d’intégrité.

## Composants
- `index.html` : structure UI (onglets Tutoriel / Test / Intégrité)
- `styles.css` : styles de l’interface
- `script.js` : logique applicative (chargement questions, randomisation, scoring, timer, événements)
- `questions.json` : référentiel local de questions

## Fonctionnement synthétique
1. L’application charge `questions.json`.
2. Les questions sont distribuées par rotation équilibrée de thèmes.
3. Une réponse est évaluée en score binaire (10/0).
4. Les statistiques de session (tentatives, moyenne, distribution) sont mises à jour.
5. Le journal d’intégrité enregistre les événements de session.

## Limites connues (POC)
- Stockage local en mémoire uniquement (pas de persistance backend)
- Authentification non implémentée
- Anti-triche avancée non implémentée (webcam, proctoring, etc.)
