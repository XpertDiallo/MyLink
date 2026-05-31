# Fonctionnement IA Groq

L'integration IA de MyLink utilise Groq via un endpoint serveur local.

## Modele

Le modele configure par defaut est :

```text
llama-3.3-70b-versatile
```

Les appels demandent une sortie JSON avec :

```json
{ "type": "json_object" }
```

## Pourquoi deux etapes ?

La generation est volontairement decoupee :

1. Extraction des faits
2. Redaction du profil

Cette approche reduit plusieurs problemes frequents :

- repetition des consignes ;
- contenu vague ;
- invention de chiffres ou de resultats ;
- confusion entre le document source et le contenu final.

## Etape 1 : extraction factuelle

Le modele recoit :

- l'identite connue ;
- la localisation si connue ;
- le texte extrait du document ou les reponses au questionnaire ;
- un contrat JSON de faits attendus.

Il doit retourner uniquement des faits :

- metier cible ;
- niveau ou seniorite si disponible ;
- secteurs ;
- competences ;
- outils ;
- experiences ;
- realisations ;
- objectif actuel.

Si une information manque, elle doit rester `null` ou `[]`.

## Etape 2 : redaction

Le modele recoit les faits extraits et doit produire le profil final :

- `ville_pays`
- `titre_pro`
- `accroche`
- `recherche`
- `a_propos`
- `distingue`
- `competences`
- `realisations`

Les realisations sont stockees comme paires `action` / `impact`, mais l'affichage final les transforme en phrases personnelles. Les mots `Action` et `Impact` ne sont pas affiches.

## Regles de redaction

Le profil final doit :

- etre redige a la premiere personne ;
- reformuler les informations de facon professionnelle et personnelle ;
- ne jamais mentionner le document source ;
- ne jamais afficher les consignes ;
- ne jamais inventer de chiffres, employeurs ou diplomes ;
- ne jamais melanger plusieurs langues.

## Nettoyage de securite

Avant affichage, l'application applique plusieurs filtres :

- `containsInstructionLeak` rejette les reponses qui recopient les consignes ;
- `looksGarbled` rejette les caracteres casses ou symboles suspects ;
- `removeSourceMentions` remplace les mentions directes du document source par des formulations neutres ;
- `formatAchievement` convertit les realisations en paragraphes naturels.

## Fallback local

Si Groq n'est pas disponible, MyLink genere un profil localement a partir :

- du metier detecte ;
- des competences reconnues ;
- d'une realisation ou mission detectee ;
- des reponses utilisateur si aucun document n'est fourni.

Ce fallback garantit une application utilisable meme sans cle API.
