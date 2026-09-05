import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/lib/internal/core/engine'
import { EXPRESSIONS, EXPRESSION_BY_ID, blendExpression } from '@/lib/internal/core/expressions'
import { radiusAtAngle } from '@/lib/internal/core/shape'
import { SHAPE_BY_ID } from '@/lib/internal/core/skins'

const circle = () => SHAPE_BY_ID.get('circle')!.radii

/** Matrice de l'oeil rendu -> position, dimensions ecran et angle du grand axe. */
function rendu(matrix: string, w: number, h: number) {
  const [a, b, c, d, e, f] = /matrix\(([^)]+)\)/.exec(matrix)![1]!.split(',').map(Number) as number[]
  return {
    x: e!,
    y: f!,
    largeur: Math.hypot(a!, b!) * w,
    hauteur: Math.hypot(c!, d!) * h,
    axe: (Math.atan2(d!, c!) * 180) / Math.PI - 90
  }
}

describe('catalogue des expressions', () => {
  it('expose 11 expressions aux identifiants uniques', () => {
    expect(EXPRESSIONS).toHaveLength(11)
    expect(new Set(EXPRESSIONS.map((e) => e.id)).size).toBe(11)
    expect(EXPRESSION_BY_ID.size).toBe(11)
  })

  /**
   * Le piege sur lequel on est tombe : un oeil dont le rapport largeur/hauteur
   * approche 1 est un circle, il a la meme allure a tout angle et son
   * inclinaison est invisible. Toute expression qui compte sur une inclinaison
   * doit donc avoir des yeux franchement allonges.
   */
  it('n incline que des yeux assez allonges pour que ca se voie', () => {
    for (const e of EXPRESSIONS) {
      for (const oeil of e.eyes) {
        const tilt = Math.abs(oeil.tilt ?? 0)
        if (tilt < 1) continue
        const rapport = oeil.w / oeil.h
        const seuil = tilt >= 20 ? [0.6, 1.7] : [0.8, 1.25]
        expect(
          rapport < seuil[0]! || rapport > seuil[1]!,
          `${e.id}: rapport ${rapport.toFixed(2)} trop proche de 1 pour une inclinaison de ${tilt}deg`
        ).toBe(true)
      }
    }
  })

  it('incline la joie et la tristesse en miroir, et dans des sens opposes', () => {
    const angles = (id: string) => {
      const f = new BotEngine(100, 'idle', circle(), EXPRESSION_BY_ID.get(id)!).sample(1)
      const e = EXPRESSION_BY_ID.get(id)!
      return f.eyes.map((oeil, i) => rendu(oeil.matrix, e.eyes[i]!.w, e.eyes[i]!.h).axe)
    }
    const happy = angles('happy')
    const sad = angles('sad')
    // en miroir : les deux yeux penchent a l'oppose l'un de l'autre
    expect(Math.sign(happy[0]!)).toBe(-Math.sign(happy[1]!))
    expect(Math.sign(sad[0]!)).toBe(-Math.sign(sad[1]!))
    // et les deux emotions sont inversees l'une par rapport a l'autre
    expect(Math.sign(happy[0]!)).toBe(-Math.sign(sad[0]!))
  })

  it('garde les deux yeux dans la silhouette, sur les 11 expressions', () => {
    for (const e of EXPRESSIONS) {
      const f = new BotEngine(100, 'idle', circle(), e).sample(1)
      expect(f.eyes, e.id).toHaveLength(2)
      for (let i = 0; i < 2; i++) {
        const r = rendu(f.eyes[i]!.matrix, e.eyes[i]!.w, e.eyes[i]!.h)
        // demi-diagonale de l'oeil : le coin le plus lointain doit rester dedans
        const demi = Math.hypot(r.largeur, r.hauteur) / 2
        const bord = radiusAtAngle(circle(), Math.atan2(r.y, r.x)) * 100
        expect(Math.hypot(r.x, r.y) + demi, `${e.id} oeil ${i}`).toBeLessThan(bord * 1.02)
      }
    }
  })

  it('rend le rire immédiatement distinct de la joie', () => {
    const happy = EXPRESSION_BY_ID.get('happy')!
    const laughing = EXPRESSION_BY_ID.get('laughing')!
    expect(happy.mouth?.kind).toBe('arc')
    expect(laughing.mouth?.kind).toBe('open')
    expect(laughing.mouth!.width).toBeGreaterThan(happy.mouth!.width)
    expect(new BotEngine(100, 'idle', circle(), laughing).sample(1).mouth?.filled).toBe(true)
  })
})

describe('changement d expression', () => {
  it('interpole la geometrie de facon monotone', () => {
    // On mesure sur blendExpression, pas sur le rendu : la derive du regard au
    // repos fait varier la projection, donc la hauteur a l'ecran n'est pas
    // monotone meme quand l'interpolation, elle, l'est.
    const de = EXPRESSION_BY_ID.get('neutral')!
    const vers = EXPRESSION_BY_ID.get('scared')!
    const hauteurs = [0, 0.25, 0.5, 0.75, 1].map((t) => blendExpression(de, vers, t).eyes[0]!.h)
    for (let i = 1; i < hauteurs.length; i++) {
      expect(hauteurs[i]!).toBeGreaterThan(hauteurs[i - 1]!)
    }
    expect(hauteurs[0]!).toBeCloseTo(de.eyes[0]!.h, 5)
    expect(hauteurs[4]!).toBeCloseTo(vers.eyes[0]!.h, 5)
  })

  it('glisse vers la nouvelle expression au lieu de sauter', () => {
    const cible = EXPRESSION_BY_ID.get('scared')!
    const e = new BotEngine(100, 'idle', circle(), EXPRESSION_BY_ID.get('neutral')!)
    e.setExpression(cible, 1)

    // juste apres le changement, l'oeil n'a pas encore la forme de la cible...
    const tot = e.sample(1.02).eyes[0]!.d
    const arrive = new BotEngine(100, 'idle', circle(), cible).sample(1).eyes[0]!.d
    expect(tot).not.toBe(arrive)
    // ...et il l'a une fois le morph termine
    expect(e.sample(1 + BotEngine.SHAPE_MORPH + 0.05).eyes[0]!.d).toBe(arrive)
  })

  it('reste une fonction pure du temps pendant le morph', () => {
    const e = new BotEngine(100, 'idle', circle(), EXPRESSION_BY_ID.get('neutral')!)
    e.setExpression(EXPRESSION_BY_ID.get('happy')!, 1)
    const milieu = e.sample(1.12).eyes[0]!.matrix
    e.sample(3)
    expect(e.sample(1.12).eyes[0]!.matrix).toBe(milieu)
  })

  it('n applique l expression qu a l etat de repos', () => {
    const expr = EXPRESSION_BY_ID.get('scared')!
    // wink a son expression propre, relevee sur la video : elle doit survivre
    const nu = new BotEngine(100, 'wink', circle()).sample(1)
    const habille = new BotEngine(100, 'wink', circle(), expr).sample(1)
    expect(habille.eyes[0]!.d).toBe(nu.eyes[0]!.d)

    const repos = new BotEngine(100, 'idle', circle(), expr).sample(1)
    const reposNu = new BotEngine(100, 'idle', circle()).sample(1)
    expect(repos.eyes[0]!.d).not.toBe(reposNu.eyes[0]!.d)
  })

  it('interpole toutes les composantes, inclinaison comprise', () => {
    const a = EXPRESSION_BY_ID.get('happy')!
    const b = EXPRESSION_BY_ID.get('sad')!
    const m = blendExpression(a, b, 0.5)
    expect(m.eyes[0]!.tilt).toBeCloseTo(((a.eyes[0]!.tilt ?? 0) + (b.eyes[0]!.tilt ?? 0)) / 2, 5)
    expect(m.split).toBeCloseTo((a.split + b.split) / 2, 5)
    expect(m.gaze.pitch).toBeCloseTo((a.gaze.pitch + b.gaze.pitch) / 2, 5)
  })
})
