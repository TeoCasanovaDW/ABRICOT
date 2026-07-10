# Modifications du backend

Le backend fourni par OpenClassrooms a été conservé dans sa structure d’origine.

Quelques modifications ciblées ont été réalisées afin de corriger des incohérences avec les spécifications fonctionnelles et de faciliter la démonstration du projet.

## 1. Statut lors de la création d’une tâche

### Problème

Le formulaire de création permet de choisir le statut d’une tâche, mais l’endpoint de création ignorait cette valeur et créait systématiquement la tâche avec le statut `TODO`.

### Modification

- ajout du champ optionnel `status` dans la requête de création ;
- validation des valeurs autorisées ;
- sauvegarde du statut transmis ;
- conservation de `TODO` comme valeur par défaut ;
- mise à jour de la documentation Swagger.

Valeurs acceptées :

- `TODO`
- `IN_PROGRESS`
- `DONE`
- `CANCELLED`

Aucune migration de base de données n’a été nécessaire.

## 2. Mise à jour des dates du seed

### Problème

Les données initiales utilisaient des dates fixes devenues obsolètes, ce qui rendait les vues du tableau de bord et du Kanban peu représentatives.

### Modification

Les dates des tâches ont été remplacées par des dates relatives au moment de l’exécution du seed.

Le seed contient désormais :

- des tâches en retard ;
- des tâches proches de leur échéance ;
- des tâches du mois courant ;
- des tâches à venir ;
- plusieurs statuts et niveaux de priorité.

Aucune modification du schéma de base de données n’a été nécessaire.

## 3. Statistiques de progression des projets

### Problème

La liste des projets retournait uniquement le nombre total de tâches, sans permettre de connaître le nombre de tâches terminées.

Cela empêchait d’afficher efficacement la progression d’un projet sans effectuer plusieurs requêtes supplémentaires depuis le frontend.

### Modification

L’endpoint `GET /projects` retourne maintenant un nouvel objet :

```json
{
  "taskStats": {
    "total": 5,
    "completed": 2
  }
}