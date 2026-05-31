# Architecture

MyLink est compose de trois blocs principaux :

1. `index.html`
2. `app.jsx`
3. `server.mjs`

## Frontend

Le frontend est une application React chargee par `index.html`.

Pour garder l'aperçu simple, `index.html` charge :

- React via CDN ;
- ReactDOM via CDN ;
- Babel Standalone pour transformer `app.jsx` dans le navigateur ;
- Tailwind via CDN ;
- un shim minimal `window.MOTION_SAFE` qui remplace les primitives Framer Motion dans l'aperçu statique.

Le composant principal est `Preview` dans `app.jsx`.

Les pages principales sont :

- `HomePage` : page d'accueil ;
- `AuthPage` : inscription/connexion simulee ;
- `DashboardPage` : edition du profil, import document, questions guidees ;
- `DashboardQuestionsPage` : enrichissement par questionnaire ;
- `ResultPage` : resultat apres onboarding ;
- `SharePage` : partage du lien ;
- `PublicProfilePage` : aperçu public du profil.

## Backend

`server.mjs` fournit :

- le service de fichiers statiques (`/`, `/app.jsx`) ;
- l'endpoint d'extraction de texte (`/api/profile/extract-cv`) ;
- l'endpoint de generation IA (`/api/profile/generate`) ;
- un faux endpoint d'email local (`/api/auth/send-validation-email`) pour l'aperçu.

Le serveur utilise uniquement Node.js et deux dependances :

- `jszip` pour lire les `.docx` ;
- `pdfjs-dist` pour extraire le texte des `.pdf`.

## Flux document

1. L'utilisateur charge un fichier depuis le tableau de bord.
2. Le navigateur envoie le fichier a `/api/profile/extract-cv`.
3. Le serveur extrait le texte si le format est pris en charge.
4. Le texte est renvoye au frontend.
5. Le frontend demande une generation de profil.
6. Si Groq est configure, le backend appelle l'API Groq.
7. Sinon, le frontend utilise son fallback local.

## Flux IA

La generation Groq est separee en deux appels :

1. Extraction factuelle : le modele extrait des faits professionnels depuis les donnees utilisateur.
2. Redaction : le modele transforme ces faits en sections de profil.

Cette separation evite que le modele repete les consignes ou invente trop facilement du contenu.

## Nettoyage de sortie

Le frontend nettoie les sorties avant affichage :

- suppression des mentions du document source dans les paragraphes generes ;
- rejet des reponses contenant des consignes ;
- rejet des chaines corrompues (`�`, `□`, suites de symboles suspectes) ;
- suppression des placeholders ;
- reformulation des realisations sans libelles `Action` / `Impact`.

## Limites connues

- Les fichiers PDF scannes sans couche texte ne sont pas lus par OCR.
- L'authentification et l'envoi email sont simules.
- Les donnees ne sont pas persistees dans une base de donnees.
- Le chargement React/Babel via CDN est pratique pour l'aperçu, mais une production reelle devrait utiliser un bundler comme Vite.
