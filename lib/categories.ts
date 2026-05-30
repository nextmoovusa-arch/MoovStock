/**
 * Arborescence simplifiée des catégories Vinted.
 * Sert au formulaire d'ajout d'article + filtres analytics.
 */
export const CATEGORIES: Record<string, string[]> = {
  "Femmes": [
    "Robes",
    "Tops & T-shirts",
    "Chemises & Blouses",
    "Pulls & Gilets",
    "Sweats & Hoodies",
    "Vestes & Manteaux",
    "Jeans",
    "Pantalons",
    "Jupes",
    "Shorts",
    "Costumes & Tailleurs",
    "Combinaisons",
    "Lingerie & Pyjamas",
    "Maillots de bain",
    "Vêtements de sport",
    "Chaussures",
    "Sacs",
    "Bijoux",
    "Montres",
    "Accessoires",
  ],
  "Hommes": [
    "T-shirts & Polos",
    "Chemises",
    "Pulls & Gilets",
    "Sweats & Hoodies",
    "Vestes & Manteaux",
    "Jeans",
    "Pantalons",
    "Shorts",
    "Costumes",
    "Sous-vêtements",
    "Vêtements de sport",
    "Chaussures",
    "Sacs",
    "Montres",
    "Bijoux",
    "Accessoires",
  ],
  "Enfants": [
    "Vêtements bébé (0-3 ans)",
    "Vêtements fille (4-14 ans)",
    "Vêtements garçon (4-14 ans)",
    "Chaussures bébé",
    "Chaussures fille",
    "Chaussures garçon",
    "Jouets",
    "Puériculture",
    "Mobilier enfant",
    "Accessoires enfant",
  ],
  "Maison": [
    "Décoration",
    "Linge de maison",
    "Cuisine & Arts de la table",
    "Mobilier",
    "Bricolage",
    "Jardin",
    "Animaux",
  ],
  "Beauté": [
    "Maquillage",
    "Parfums",
    "Soins visage",
    "Soins corps",
    "Soins cheveux",
    "Outils & Accessoires",
  ],
  "Électronique": [
    "Smartphones & Téléphones",
    "Tablettes",
    "Ordinateurs",
    "Audio",
    "TV & Vidéo",
    "Consoles & Jeux",
    "Accessoires électroniques",
  ],
  "Sport & Loisirs": [
    "Vêtements de sport",
    "Chaussures de sport",
    "Équipement",
    "Vélo",
    "Camping & Outdoor",
    "Fitness & Musculation",
  ],
  "Livres & Jeux": [
    "Livres",
    "BD & Mangas",
    "Jeux de société",
    "Jeux vidéo",
    "Musique & Films",
  ],
  "Autre": ["Divers"],
};

export const MAIN_CATEGORIES = Object.keys(CATEGORIES);

export function getSubcategories(category: string | null | undefined): string[] {
  if (!category) return [];
  return CATEGORIES[category] ?? [];
}

export function categoryPath(category: string | null, sub: string | null): string {
  if (!category) return "Sans catégorie";
  if (!sub) return category;
  return `${category} › ${sub}`;
}
