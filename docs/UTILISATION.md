# Guide utilisateur

Ce guide decrit le parcours principal dans MyLink.

## 1. Ouvrir l'application

Lancer le serveur :

```bash
npm run dev
```

Ouvrir ensuite :

```text
http://127.0.0.1:8766/
```

## 2. Creer un compte de demonstration

Depuis l'accueil :

1. Cliquer sur `Inscris-toi`.
2. Saisir un nom complet.
3. Saisir un email.
4. Saisir et confirmer le mot de passe.
5. Cliquer sur `Recevoir le lien de validation`.
6. Cliquer sur `J'ai valide mon inscription`.

En aperçu local, la validation email est simulee.

## 3. Completer le profil avec un document

Dans `Mon espace` :

1. Aller au bloc `Completer autrement`.
2. Cliquer sur `Joins ton CV`.
3. Choisir un fichier lisible.
4. Cliquer sur `Appliquer`.

Le profil est ensuite rempli automatiquement.

Important : le contenu final ne mentionne pas le document source. Il reformule les informations en langage professionnel.

## 4. Completer le profil avec les questions guidees

Si l'utilisateur n'a pas de document :

1. Cliquer sur `Repondre a 5 questions`.
2. Repondre aux questions.
3. Valider a la derniere etape.

L'application genere alors un profil structure.

## 5. Modifier manuellement

Dans `Mon espace`, l'utilisateur peut modifier :

- l'accroche ;
- ce qu'il recherche ;
- la presentation ;
- les points distinctifs ;
- les competences ;
- les realisations ;
- la photo ;
- la banniere.

Boutons disponibles :

- `Annuler` : revient au dernier profil sauvegarde ;
- `Sauvegarder` : enregistre le brouillon courant dans l'etat local ;
- `Partager mon profil` : ouvre la page de partage.

## 6. Partager le profil

La page de partage propose :

- copie du lien ;
- partage natif si disponible ;
- WhatsApp ;
- LinkedIn ;
- email ;
- message conseille.

## 7. Se deconnecter

Lorsque l'utilisateur est connecte, le bouton `Se deconnecter` apparait apres `Mon profil` dans la barre de navigation.

## Conseils pour de meilleurs resultats

- Utiliser un document texte ou un PDF contenant une vraie couche texte.
- Eviter les scans sans OCR.
- Ajouter au moins une realisation concrete.
- Mentionner les outils et competences importants.
- Relire et adapter le profil final avant partage.
