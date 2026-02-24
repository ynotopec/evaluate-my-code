# Overview technique

## Objectif
Fournir un artefact réutilisable pour la préqualification technique : QCM chronométré, scoring instantané, analytics de session et journal d'intégrité.

## Périmètre fonctionnel
- Session de test avec questions à choix unique.
- Minuteur global de session.
- Calcul de score par réponse (10/0).
- Statistiques de session (tentatives, moyenne, distribution).
- Journal d'intégrité (événements utilisateur/session).

## Composants
- `index.html` : structure des écrans (Tutoriel, Test, Intégrité)
- `styles.css` : style et lisibilité de l'interface
- `script.js` : orchestration métier front-end
- `questions.json` : jeu de questions local versionné
- `Makefile` : exécution et vérification des artefacts attendus

## Exécution
```bash
make run
```

## Dépendances explicites
- `python3`
- `make`
- navigateur moderne (Chrome/Firefox/Safari/Edge)

## Limites connues (niveau POC)
- Pas de persistance serveur (session en mémoire navigateur).
- Pas d'authentification/SSO.
- Pas de mécanisme anti-fraude avancé.
