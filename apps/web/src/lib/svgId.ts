// Generer un identifiant valide pour les defs SVG a partir de plusieurs
// morceaux (marque, modele, ...). Les ids ne doivent pas contenir d'espace ni
// d'accent sinon le referencement url(#id) echoue et le remplissage du
// vehicule ne s'affiche pas (carrosserie invisible sur fond sombre).
export function uid(...parts: string[]): string {
  return parts
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]/g, "-");
}
