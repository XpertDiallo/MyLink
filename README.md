# MyLink

MyLink est une application web qui aide un utilisateur a creer une page de profil professionnel claire, credible et partageable. Le profil peut etre enrichi a partir de reponses guidees ou d'un document de parcours charge par l'utilisateur.

L'application est volontairement legere : une interface React chargee dans le navigateur, un serveur Node.js minimal, et une integration optionnelle avec Groq pour generer un contenu plus personnalise.

## Fonctionnalites

- Creation de compte simulee pour l'aperçu local.
- Tableau de bord de profil avec photo, banniere, accroche, sections editable et page publique.
- Import d'un document de parcours en `.txt`, `.pdf`, `.docx` ou `.doc`.
- Extraction de texte cote serveur pour eviter d'envoyer seulement le nom du fichier au modele IA.
- Generation de profil en deux etapes avec Groq :
  - extraction factuelle du parcours,
  - redaction professionnelle a la premiere personne.
- Fallback local lorsque `GROQ_API_KEY` n'est pas configuree.
- Filtres anti-consignes et anti-caracteres corrompus.
- Realisations reformulees en phrases personnelles, sans libelles visibles `Action` ou `Impact`.
- Boutons de sauvegarde, annulation, partage et deconnexion.

## Demarrage rapide

Pre-requis :

- Node.js `20.19+`
- Une cle Groq optionnelle pour la generation IA avancee

Installation :

```bash
npm install
```

Lancement en local :

```bash
npm run dev
```

Puis ouvrir :

```text
http://127.0.0.1:8766/
```

Sans cle Groq, l'application reste fonctionnelle grace au fallback local. Avec une cle Groq :

```bash
GROQ_API_KEY=xxx npm run dev
```

Sous PowerShell :

```powershell
$env:GROQ_API_KEY="xxx"
npm run dev
```

## Scripts

```bash
npm run dev      # lance le serveur sur le port 8766
npm start        # lance le serveur sur le port par defaut 8765 ou PORT
npm run check    # verifie la syntaxe du serveur
npm run smoke    # lance un test de fumee HTTP + extraction document texte
```

## Structure du projet

```text
.
├── app.jsx
├── index.html
├── server.mjs
├── package.json
├── .env.example
├── scripts/
│   └── smoke-test.mjs
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    ├── IA_GROQ.md
    └── UTILISATION.md
```

## Variables d'environnement

| Variable | Description |
| --- | --- |
| `GROQ_API_KEY` | Cle API Groq. Si absente, l'application utilise le fallback local. |
| `VITE_GROQ_API_KEY` | Alias accepte pour compatibilite. |
| `PORT` | Port serveur si aucun argument CLI n'est fourni. |

## Verification effectuee

La version livree a ete verifiee localement avec :

- chargement de la page d'accueil ;
- parcours d'inscription simule ;
- ouverture du tableau de bord ;
- import d'un document texte ;
- generation de profil sans cle Groq via fallback local ;
- controle de non-regression :
  - aucune mention de `CV` dans le contenu genere ;
  - aucun libelle visible `Action :` ou `Impact :` dans les realisations ;
  - rejet des caracteres corrompus du type `�`, `□` ;
  - preservation des listes de competences et qualites.

## Notes de securite

- Ne jamais exposer `GROQ_API_KEY` dans le navigateur.
- L'appel a Groq passe par `server.mjs`, jamais directement par React.
- Les fichiers charges sont traites en memoire par l'aperçu local. Pour une production reelle, ajouter une limite plus stricte, un antivirus et une politique de retention.

## Documentation complementaire

- [Architecture](docs/ARCHITECTURE.md)
- [API locale](docs/API.md)
- [Fonctionnement IA Groq](docs/IA_GROQ.md)
- [Guide utilisateur](docs/UTILISATION.md)
