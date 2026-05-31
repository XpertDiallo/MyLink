# API locale

Le serveur local expose quelques endpoints utiles a l'aperçu.

## `GET /`

Retourne `index.html`.

## `GET /app.jsx`

Retourne le code React de l'application.

## `POST /api/profile/extract-cv`

Extrait le texte d'un fichier charge par l'utilisateur.

Requete :

- `multipart/form-data`
- champ fichier : `cv`

Formats pris en charge :

- `.txt`, `.csv`, `.json`, `.md`, `.xml`
- `.pdf` avec couche texte
- `.docx`
- `.doc` avec extraction binaire approximative

Exemple de reponse :

```json
{
  "filename": "profil.pdf",
  "text": "Texte extrait...",
  "chars": 1234,
  "warning": null
}
```

Si l'extraction est trop courte :

```json
{
  "filename": "scan.pdf",
  "text": "",
  "chars": 0,
  "warning": "Texte extrait trop court ou document scanne sans OCR."
}
```

## `POST /api/profile/generate`

Proxy serveur vers l'API Groq.

Pourquoi passer par le serveur :

- la cle Groq reste cote serveur ;
- le frontend ne manipule pas de secret ;
- les parametres du modele sont controles.

Corps accepte :

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "maxTokens": 1600,
  "temperature": 0.2,
  "top_p": 0.85,
  "response_format": { "type": "json_object" }
}
```

Si `GROQ_API_KEY` est absente, le serveur retourne `503`. Le frontend intercepte cette erreur et utilise le fallback local.

## `POST /api/auth/send-validation-email`

Endpoint simule pour l'aperçu local.

Il retourne toujours :

```json
{
  "ok": true,
  "preview": true
}
```

En production, cet endpoint devrait etre remplace par un vrai service d'authentification et d'email transactionnel.
