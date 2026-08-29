/*
 * Le voyage de la boule, pilote par le DEFILEMENT (GSAP ScrollTrigger, scrub) :
 * sa position est une fonction de la position de defilement, pas une suite
 * d'etats discrets. Elle tient dans le o du titre tant que le heros est
 * epingle, vole vers l'anneau de l'installation pendant que celle-ci entre en
 * scene, s'y pose, puis repart vers le studio — et l'atterrissage tombe
 * exactement sur la fin de la page, ou elle est rendue a la grille du studio
 * (`onArrive`), seule facon de garder la boule geante des reglages et le
 * centrage de l'apercu.
 *
 * Toutes les poses sont MESUREES (o du titre, anneau, colonne du studio), pas
 * ecrites en dur : un redimensionnement reconstruit la timeline.
 *
 * GSAP est une dependance du SITE uniquement — jamais importe depuis
 * `src/lib`, la bibliotheque publiee reste sans dependance.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* La silhouette n'occupe que 200/316 de la boite du SVG (les anneaux des etats
   animes vivent dans la marge). Les deux facteurs qui en decoulent : */
const O_BOITE = 1.62 // boite = anneau du o x 1,62 : la silhouette le recouvre de peu
const ANNEAU_BOITE = 1.31 // boite = anneau des docs x 1,31 : ~17 % d'air dans l'anneau

export type Voyage = {
  detruire: () => void
  /* Repose la boule a sa pose d'atterrissage — a appeler juste apres que la
     classe `avatar--journey` est revenue, sinon une image passe sans style. */
  reposer: () => void
}

export function creerVoyage(options: {
  heroPin: HTMLElement
  oSlot: HTMLElement
  anneau: HTMLElement
  studio: HTMLElement
  onArrive: (arrivee: boolean) => void
}): Voyage | null {
  const { heroPin, oSlot, anneau, studio, onArrive } = options
  const avatar = document.querySelector<HTMLElement>('.avatar')
  const heroSection = heroPin.parentElement as HTMLElement
  // La planche (#planche) remplace le studio : rien a faire voyager.
  if (!avatar || !heroSection) return null

  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches
  const etroit = () => matchMedia('(width < 64rem)').matches

  /*
   * Poses en coordonnees de FENETRE (l'element est fixe, origine en haut a
   * gauche, centrage par xPercent/yPercent -50).
   */

  // Assise dans le o : mesuree par rapport au bloc EPINGLE, dont la position a
  // l'ecran vaut (0, 0) tant qu'il colle — la mesure ne depend donc pas du
  // defilement du moment.
  const poseO = () => {
    const pin = heroPin.getBoundingClientRect()
    const o = oSlot.getBoundingClientRect()
    return {
      x: o.left + o.width / 2 - pin.left,
      y: o.top + o.height / 2 - pin.top,
      width: o.width * O_BOITE
    }
  }

  // L'anneau de l'installation est fixe : ses coordonnees d'ecran sont
  // constantes. Sous 64rem il n'y a pas d'anneau — la boule guette depuis le
  // bord bas, a moitie hors champ.
  const poseDocs = () => {
    if (etroit()) {
      return { x: document.documentElement.clientWidth / 2, y: innerHeight - 10, width: 120 }
    }
    const r = anneau.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width * ANNEAU_BOITE }
  }

  // L'atterrissage : le centre REEL de la colonne de l'avatar, mesure sur la
  // grille — la colonne garde sa hauteur meme quand la boule n'y est pas (elle
  // a un min-height), donc la mesure vaut pendant le vol. Coordonnees d'ecran
  // AU defilement de fin (le haut du studio a 0).
  const poseStudio = (finDefilement: number) => {
    const colonne = studio.querySelector<HTMLElement>('.scene__avatar')
    if (!colonne) return poseDocs()
    const r = colonne.getBoundingClientRect()
    const plafond = parseFloat(getComputedStyle(avatar).maxWidth) || 460
    return {
      x: r.left + r.width / 2,
      // Sur grand ecran la colonne est COLLANTE : son rect ment des qu'elle
      // colle (rebuild pendant un defilement profond). Sa position NATURELLE
      // est connue — le padding de la scene (2rem) — donc la verticale se
      // deduit sans lire rect.top. Sous 64rem la pile n'est pas collante et le
      // rect dit vrai.
      y: etroit() ? r.top + scrollY + r.height / 2 - finDefilement : 32 + r.height / 2,
      width: Math.min(r.width, plafond)
    }
  }

  let tl: gsap.core.Timeline | null = null
  // Posee dans la grille : le voyage ne doit plus TOUCHER l'element. GSAP replie
  // les proprietes individuelles `translate`/`scale` (la boule geante des
  // reglages !) dans son cache au premier contact — un rebuild sur resize
  // pendant les reglages retamponnait donc un scale(2.5) en ligne.
  let arrivee = false

  // Tous les styles que le voyage pose en ligne, a retirer a l'atterrissage
  // pour que la grille (et les reglages) reprennent la main.
  const NETTOYAGE = { clearProps: 'transform,translate,scale,width' }

  const poser = () => {
    arrivee = true
    onArrive(true)
    gsap.set(avatar, NETTOYAGE)
  }

  const construire = () => {
    tl?.scrollTrigger?.kill()
    tl?.kill()
    const fin = studio.getBoundingClientRect().top + scrollY
    // Depart : l'instant exact ou le heros se desepingle et ou le mot se remet
    // a defiler. Pose : quand l'installation est alignee sous la barre.
    const depart = heroSection.offsetHeight - innerHeight
    const pose = Math.max(depart + 1, fin - innerHeight + 72)
    const redepart = Math.max(pose + 1, fin - innerHeight * 0.78)

    if (!arrivee) gsap.set(avatar, { xPercent: -50, yPercent: -50, scale: 1, ...poseO(), rotation: 0 })

    tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        start: 0,
        end: fin,
        scrub: calme ? true : 0.6,
        onLeave: (declencheur) => {
          // Le scrub lisse (0,6 s) continue d'ecrire des transforms APRES cet
          // evenement : on force d'abord son rattrapage a terme, sinon il
          // repeint la boule posee une demi-seconde apres le nettoyage.
          declencheur.getTween?.()?.progress(1)
          poser()
        },
        onEnterBack: () => {
          arrivee = false
          onArrive(false)
        }
      }
    })
    // Le vol vers l'anneau est COURBE : x part vite (power1.out), y retombe
    // tard (power1.in) — la boule s'ecarte d'abord vers la droite et contourne
    // le titre au lieu de le traverser en ligne droite.
    const docs = poseDocs()
    const dureeVol = (pose - depart) / fin
    tl.to(avatar, { x: docs.x, width: docs.width, rotation: calme ? 0 : 4, ease: 'power1.out', duration: dureeVol }, depart / fin)
    tl.to(avatar, { y: docs.y, ease: 'power1.in', duration: dureeVol }, depart / fin)
    tl.to(avatar, { ...poseStudio(fin), rotation: 0, duration: (fin - redepart) / fin }, redepart / fin)

    if (scrollY >= fin - 1) {
      // Chargement (ou rebuild) deja en bas de page : atterrissage immediat.
      tl.scrollTrigger?.getTween?.()?.progress(1)
      poser()
    } else if (arrivee) {
      // Un redimensionnement a repousse la fin sous la position courante : la
      // boule posee doit redecoller.
      arrivee = false
      onArrive(false)
    }
  }

  construire()

  /*
   * L'apparition. La page se pose, le o reste creux un instant, puis la boule
   * TOMBE dedans depuis le haut de la fenetre — ou dans l'anneau, ou dans le
   * studio : elle tombe la ou le defilement du moment la veut. Ease-out pur,
   * sans rebond : le corps de la boule ne depasse jamais (regle du projet).
   * Sous « mouvement reduit », pas de chute — elle est simplement la.
   */
  const svg = avatar.querySelector('svg')
  if (svg && !calme) {
    const boite = avatar.getBoundingClientRect()
    if (boite.bottom > 0) {
      gsap.fromTo(
        svg,
        { y: -boite.bottom },
        { y: 0, duration: 0.85, delay: 0.15, ease: 'power2.out', clearProps: 'transform' }
      )
    }
  }

  const surResize = () => construire()
  addEventListener('resize', surResize)
  // La police d'affichage arrive apres coup et change la metrique du titre.
  document.fonts?.ready.then(construire)

  return {
    detruire: () => {
      removeEventListener('resize', surResize)
      tl?.scrollTrigger?.kill()
      tl?.kill()
      gsap.killTweensOf([avatar, svg])
    },
    reposer: () => {
      const fin = studio.getBoundingClientRect().top + scrollY
      const p = poseStudio(fin)
      // La pose est exprimee au defilement de fin ; on la ramene au defilement
      // COURANT, legerement au-dessus au moment du redecollage. `scale: 1`
      // ecrase un eventuel agrandissement des reglages plie dans le cache GSAP.
      gsap.set(avatar, { xPercent: -50, yPercent: -50, x: p.x, y: p.y + (fin - scrollY), width: p.width, rotation: 0, scale: 1 })
    }
  }
}
