export type SectionType = 'paragraph' | 'heading' | 'tip' | 'list' | 'warning';

export interface ArticleSection {
  type: SectionType;
  text?: string;
  items?: string[];
}

export interface Article {
  id: string;
  iconKey: 'droplet' | 'sun' | 'leaf' | 'bottle';
  title: string;
  preview: string;
  category: string;
  readTime: string;
  accentColor: string;
  cta?: { label: string; route: string };
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    id: '1',
    iconKey: 'droplet',
    title: 'Méthode LOC pour cheveux 4C',
    preview: "Liquid, Oil, Cream — l'ordre d'application qui change tout pour l'hydratation des cheveux crépus.",
    category: 'Cheveux',
    readTime: '4 min',
    accentColor: '#8B6952',
    cta: { label: 'Analyser mes cheveux', route: '/ai/hair-capture' },
    sections: [
      {
        type: 'paragraph',
        text: "Les cheveux de type 4C ont une porosité très élevée et une structure qui rend l'hydratation difficile à retenir. La méthode LOC — Liquid, Oil, Cream — est née de cette réalité. L'ordre d'application n'est pas arbitraire : il suit la logique de la pénétration capillaire.",
      },
      { type: 'heading', text: "Liquid — L'eau d'abord" },
      {
        type: 'paragraph',
        text: "Commencez toujours par appliquer un liquide sur cheveux légèrement humides. L'eau est la seule molécule capable de pénétrer réellement dans le cortex capillaire. Vous pouvez utiliser de l'eau pure, une lotion capillaire ou un leave-in léger dilué.",
      },
      {
        type: 'tip',
        text: "Pulvérisez section par section et massez doucement du bout des doigts pour maximiser l'absorption avant de passer à l'étape suivante.",
      },
      { type: 'heading', text: "Oil — Sceller l'humidité" },
      {
        type: 'paragraph',
        text: "L'huile ne nourrit pas les cheveux — elle scelle. Elle crée une barrière légère sur la cuticule qui empêche l'eau d'évaporer. Choisissez selon votre porosité :",
      },
      {
        type: 'list',
        items: [
          "Porosité faible : huile de jojoba, huile d'argan (légères)",
          'Porosité moyenne : huile de coco, huile d\'olive',
          'Porosité élevée : huile de ricin, beurre de karité (pour sceller fort)',
        ],
      },
      { type: 'heading', text: 'Cream — Définir et protéger' },
      {
        type: 'paragraph',
        text: "La crème capillaire (leave-in crème ou crème coiffante) ferme le tout. Elle ajoute une deuxième couche de protection, apporte de la souplesse et aide à définir vos boucles ou poser vos tresses.",
      },
      {
        type: 'tip',
        text: 'Pour les cheveux 4C très denses, certaines préfèrent la méthode LOCO (Liquid → Oil → Cream → Oil) pour un scellage encore plus intense les jours de grand froid ou de sécheresse.',
      },
      { type: 'heading', text: 'Fréquence recommandée' },
      {
        type: 'paragraph',
        text: "Appliquez la méthode LOC tous les 2 à 4 jours selon votre niveau de sécheresse. Les jours entre les applications, contentez-vous d'un spray d'eau légère pour rafraîchir sans tout refaire.",
      },
      {
        type: 'warning',
        text: "Évitez de surcharger vos cheveux. Si vos longueurs semblent lourdes ou grasses, réduisez la quantité d'huile — l'excès de produit peut boucher les follicules et ralentir la croissance.",
      },
    ],
  },
  {
    id: '2',
    iconKey: 'sun',
    title: 'SPF et peau foncée : le mythe',
    preview: "Les peaux riches en mélanine ont aussi besoin de protection solaire. L'hyperpigmentation est plus visible sans SPF.",
    category: 'Soins de peau',
    readTime: '3 min',
    accentColor: '#5B21B6',
    cta: { label: 'Analyser ma peau', route: '/ai/skin-capture' },
    sections: [
      {
        type: 'paragraph',
        text: "\"J'ai la peau noire, je n'ai pas besoin de crème solaire.\" C'est l'un des mythes les plus répandus en Afrique — et l'un des plus dommageables. Oui, la mélanine offre une protection naturelle équivalente à environ SPF 13. Mais ce n'est pas suffisant.",
      },
      { type: 'heading', text: 'Ce que la mélanine protège vraiment' },
      {
        type: 'paragraph',
        text: "La mélanine absorbe et dissipe une partie des UV-B, responsables des coups de soleil. C'est pourquoi les peaux foncées brûlent moins vite. Mais les UV-A pénètrent en profondeur dans le derme quelle que soit la couleur de peau, provoquant vieillissement prématuré, hyperpigmentation et, sur le long terme, risque de cancer cutané.",
      },
      {
        type: 'tip',
        text: "Le mélanome cutané est certes moins fréquent sur peaux foncées, mais il est diagnostiqué plus tard et plus grave. L'absence de surveillance n'est pas de la protection.",
      },
      { type: 'heading', text: 'Les vraies conséquences sans SPF' },
      {
        type: 'list',
        items: [
          'Hyperpigmentation aggravée (taches, melasma, acné post-inflammatoire)',
          'Teint inégal et terne au fil du temps',
          "Vieillissement accéléré (rides, perte d'élasticité)",
          "Aggravation des cicatrices d'acné par les UV",
        ],
      },
      { type: 'heading', text: 'Choisir son SPF sans effet blanc' },
      {
        type: 'paragraph',
        text: "Le problème historique des crèmes solaires sur peaux foncées est l'effet blanc — les filtres minéraux (zinc, dioxyde de titane) laissent un résidu gris ou blanc disgracieux. La bonne nouvelle : les formulations 2024-2026 ont beaucoup progressé.",
      },
      {
        type: 'list',
        items: [
          'Privilégiez les filtres chimiques (Avobenzone, Tinosorb) — transparents',
          'Si vous préférez les filtres minéraux, choisissez des formules "tinted" adaptées à votre teinte',
          "Un SPF 30 à 50 est le bon range pour une protection quotidienne en Afrique équatoriale",
          "Appliquez 15-20 min avant l'exposition, renouvelez toutes les 2h au soleil",
        ],
      },
      {
        type: 'warning',
        text: "Les SPF en sprays et poudres ne remplacent pas une crème appliquée uniformément. Ils servent uniquement de renouvellement au-dessus d'un maquillage.",
      },
    ],
  },
  {
    id: '3',
    iconKey: 'leaf',
    title: 'Beurre de karité : guide complet',
    preview: 'Comment choisir, préparer et appliquer le karité pour cheveux et peau. Du brut au raffiné, tout savoir.',
    category: 'Soins naturels',
    readTime: '5 min',
    accentColor: '#7C4D3E',
    cta: { label: 'Analyser mes cheveux', route: '/ai/hair-capture' },
    sections: [
      {
        type: 'paragraph',
        text: "Le karité est l'or blanc du Sahel. Extrait des noix du karité (Vitellaria paradoxa), il est utilisé depuis des siècles en Afrique de l'Ouest pour nourrir et protéger peau et cheveux. Mais tous les karitès ne se valent pas.",
      },
      { type: 'heading', text: 'Brut vs Raffiné : quelle différence ?' },
      {
        type: 'paragraph',
        text: "Le beurre brut (non-raffiné) conserve toutes ses propriétés actives : vitamines A, E, F, phytostérols, latex naturel. Il est plus efficace mais a une odeur fumée distincte. Le beurre raffiné est inodore, à texture lisse, mais a perdu une partie de ses actifs au cours du traitement industriel.",
      },
      {
        type: 'tip',
        text: "Pour un usage cosmétique quotidien, préférez le karité brut Grade A ou B, idéalement d'origine Burkina Faso ou Ghana — les filières y sont les plus structurées et traçables.",
      },
      { type: 'heading', text: 'Pour les cheveux' },
      {
        type: 'list',
        items: [
          "Scellage après LOC : appliquez une petite noix fondue dans vos paumes sur les longueurs et pointes",
          "Hot oil treatment : mélangez avec de l'huile de coco, réchauffez légèrement, appliquez sur l'ensemble de la chevelure et laissez poser 30 min sous une charlotte chauffante",
          "Protège-bords (edges) : une quantité infime pour lisser et nourrir les bords fragiles",
          "Après-shampoing : ajoutez une noisette à votre après-shampoing pour booster l'effet nourrissant",
        ],
      },
      { type: 'heading', text: 'Pour la peau' },
      {
        type: 'list',
        items: [
          "Corps : appliquez sur peau légèrement humide après la douche pour enfermer l'hydratation",
          "Lèvres : quelques grammes suffisent pour une protection durable",
          "Cicatrices et vergetures : mélangé à de la vitamine E, il aide à atténuer les marques",
          "Eczéma et peau sèche : anti-inflammatoire naturel grâce aux phytostérols",
        ],
      },
      { type: 'heading', text: 'Karité fouetté maison' },
      {
        type: 'paragraph',
        text: "Faites ramollir 100g de karité brut au bain-marie (sans liquéfier). Laissez refroidir 30 min puis fouettez au batteur électrique 5-8 minutes. Ajoutez quelques gouttes d'huile essentielle de lavande ou de ylang-ylang. Conservez en pot hermétique à température ambiante — texture aérée, ultra-légère.",
      },
      {
        type: 'warning',
        text: "Le karité contient du latex naturel. En cas d'allergie au latex, faites un test sur une petite zone avant toute application large.",
      },
    ],
  },
  {
    id: '4',
    iconKey: 'bottle',
    title: 'Routine night-time pour braids',
    preview: 'Protège tes tresses la nuit avec un bonnet en satin et un spray hydratant léger pour éviter la sécheresse.',
    category: 'Cheveux tressés',
    readTime: '3 min',
    accentColor: '#6B705C',
    cta: { label: 'Journal capillaire', route: '/hair-journal' },
    sections: [
      {
        type: 'paragraph',
        text: "Les tresses (braids, box braids, cornrows, twists) sont un style protecteur — elles minimisent la manipulation et protègent vos pointes. Mais sans soin nocturne, elles peuvent devenir une source de sécheresse, de casse et d'irritation du cuir chevelu.",
      },
      { type: 'heading', text: 'Pourquoi la nuit est critique' },
      {
        type: 'paragraph',
        text: "Pendant votre sommeil, vos cheveux frottent contre votre oreiller pendant 6 à 8 heures. Le coton absorbe l'humidité de vos tresses et crée des frottements répétés sur vos pointes et vos bords. Sur une période de 4 à 8 semaines (durée habituelle des braids), c'est des centaines d'heures de friction.",
      },
      { type: 'heading', text: 'Le bonnet en satin : indispensable' },
      {
        type: 'paragraph',
        text: "La soie et le satin créent une surface lisse qui élimine le frottement et préserve l'humidité de vos tresses. Le satin est préférable à la soie en termes de rapport qualité-prix et de durabilité.",
      },
      {
        type: 'list',
        items: [
          "Choisissez un bonnet à élastique large — il ne comprima pas les edges",
          "Préférez un bonnet double-couche (satin à l'intérieur, coton à l'extérieur) pour garder sa forme",
          "Si vous portez de très longues extensions, utilisez un grand foulard en satin noué en deux couches",
          "Une taie d'oreiller en satin est un filet de sécurité supplémentaire si le bonnet glisse",
        ],
      },
      { type: 'heading', text: 'Spray hydratant léger' },
      {
        type: 'paragraph',
        text: "N'hydratez pas vos tresses comme si elles étaient libres — le risque de moisissures existe si les tresses ne sèchent pas complètement. Utilisez un spray très léger, à base d'eau majoritairement.",
      },
      {
        type: 'tip',
        text: "Recette maison : 70% eau, 20% aloe vera pur, 10% huile de jojoba. Pulvérisez légèrement sur les longueurs (pas le cuir chevelu) avant de mettre le bonnet.",
      },
      { type: 'heading', text: 'Soin des edges (bords)' },
      {
        type: 'paragraph',
        text: "Les bords sont la zone la plus fragile. La tension des tresses combinée au frottement nocturne peut provoquer une alopécie des bords (traction alopecia). Appliquez chaque soir une petite quantité de beurre de karité ou d'huile de ricin sur vos bords — sans les tirer ni les coiffer.",
      },
      {
        type: 'warning',
        text: "Si vous ressentez une douleur aux bords ou si des cheveux tombent, desserrez vos tresses immédiatement. Une tension prolongée peut provoquer une alopécie permanente.",
      },
    ],
  },
];
