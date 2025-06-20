# Guide du routage basé sur l'URL

Cette application prend désormais en charge le routage basé sur l'URL, permettant de partager et de mettre en signet des vues spécifiques avec des filtres appliqués.

## Fonctionnalités

### 1. **Synchronisation automatique avec l'URL**
- Tous les filtres et la vue active sont automatiquement synchronisés avec l'URL
- Les changements de filtres mettent à jour l'URL en temps réel
- Le rechargement de la page conserve tous les filtres et la vue active

### 2. **Paramètres URL supportés**

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `view` | Vue active | `?view=charts` |
| `countries` | Pays sélectionnés | `?countries=Sénégal,Mali` |
| `journals` | Journaux sélectionnés | `?journals=Le%20Soleil,L'Observateur` |
| `polarities` | Polarités sélectionnées | `?polarities=Positif,Neutre` |
| `subjectivities` | Scores de subjectivité | `?subjectivities=1,2,3` |
| `centralities` | Niveaux de centralité | `?centralities=Central,Très%20central` |

### 3. **Vues disponibles**
- `charts` - Graphiques de distribution
- `trends` - Tendances temporelles
- `correlation` - Distribution croisée
- `volume` - Volume par pays
- `heatmap` - Heatmap de centralité
- `table` - Tableau des articles

## Exemples d'URLs

### Vue graphiques avec filtres par pays
```
https://fmadore.github.io/IWAC-sentiment-analysis/?view=charts&countries=Sénégal,Mali
```

### Vue tendances avec filtres de polarité
```
https://fmadore.github.io/IWAC-sentiment-analysis/?view=trends&polarities=Positif,Très%20positif
```

### Vue tableau avec filtres multiples
```
https://fmadore.github.io/IWAC-sentiment-analysis/?view=table&countries=Burkina%20Faso&journals=Sidwaya&subjectivities=1,2
```

### Heatmap avec centralité spécifique
```
https://fmadore.github.io/IWAC-sentiment-analysis/?view=heatmap&centralities=Central,Très%20central
```

## Utilisation

### 1. **Partage d'une vue**
- Cliquez sur le bouton "Partager" dans la barre de navigation
- L'URL de la vue actuelle avec tous les filtres sera copiée dans le presse-papiers
- Sur mobile, le menu de partage natif s'ouvrira si disponible

### 2. **Effacement des filtres**
- Cliquez sur "Effacer filtres" pour supprimer tous les filtres actifs
- L'URL sera mise à jour pour refléter l'état sans filtres

### 3. **Navigation directe**
- Collez une URL partagée dans votre navigateur
- L'application se chargera avec la vue et les filtres correspondants

## Avantages

### **Pour les utilisateurs**
- **Partage facile** : Partagez des découvertes spécifiques avec des collègues
- **Signets** : Sauvegardez des vues d'analyse fréquemment utilisées
- **Navigation** : Utilisez les boutons précédent/suivant du navigateur
- **Reproductibilité** : Retrouvez exactement la même vue plus tard

### **Pour la recherche**
- **Citations** : Référencez des vues spécifiques dans des publications
- **Collaboration** : Partagez des analyses avec des co-auteurs
- **Documentation** : Intégrez des liens dans des rapports
- **Présentation** : Accès direct à des vues pour des présentations

## Implémentation technique

### **Composants clés**
- `urlState.ts` : Gestion de l'état URL
- `ShareButton.svelte` : Bouton de partage
- `+page.svelte` : Intégration dans la page principale

### **Fonctionnalités avancées**
- **Encodage URL** : Les caractères spéciaux sont correctement encodés
- **Validation** : Les paramètres invalides sont ignorés
- **Fallbacks** : Gestion gracieuse des erreurs
- **Performance** : Mise à jour optimisée de l'URL

## Compatibilité

- ✅ **Navigateurs modernes** : Chrome, Firefox, Safari, Edge
- ✅ **Appareils mobiles** : iOS Safari, Chrome Mobile
- ✅ **GitHub Pages** : Compatible avec le déploiement statique
- ✅ **Partage natif** : Support de l'API Web Share sur mobile

## Limitations

- Les noms de journaux avec caractères spéciaux sont encodés en URL
- La longueur maximale de l'URL peut limiter le nombre de filtres simultanés
- Certains navigateurs très anciens peuvent ne pas supporter toutes les fonctionnalités 