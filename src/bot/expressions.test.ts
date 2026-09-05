import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/lib/internal/core/engine'
import { EXPRESSIONS, EXPRESSION_BY_ID, blendExpression } from '@/lib/internal/core/expressions'
import { facialFeaturePose } from '@/lib/internal/core/face'
import { radiusAtAngle } from '@/lib/internal/core/shape'
import { SHAPES, SHAPE_BY_ID } from '@/lib/internal/core/skins'

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

function matrix(transform: string) {
  return /matrix\(([^)]+)\)/.exec(transform)![1]!.split(',').map(Number) as [
    number, number, number, number, number, number
  ]
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

  it('projette la bouche avec le regard au lieu de la laisser fixe', () => {
    const laughing = EXPRESSION_BY_ID.get('laughing')!
    const frameAt = (yaw: number, pitch: number) => {
      const engine = new BotEngine(100, 'idle', circle(), laughing)
      engine.setLook({ yaw, pitch, mix: 1, spin: 0, wander: 0 }, 0, 0.01)
      return engine.sample(1)
    }

    const left = frameAt(-30, 0)
    const right = frameAt(30, 0)
    const up = frameAt(0, 24)
    const down = frameAt(0, -24)
    const mouthX = (frame: ReturnType<typeof frameAt>) => matrix(frame.mouth!.transform)[4]
    const mouthY = (frame: ReturnType<typeof frameAt>) => matrix(frame.mouth!.transform)[5]
    const eyesX = (frame: ReturnType<typeof frameAt>) =>
      frame.eyes.reduce((sum, eye) => sum + matrix(eye.matrix)[4], 0) / frame.eyes.length

    expect(mouthX(right)).toBeGreaterThan(mouthX(left))
    expect(eyesX(right)).toBeGreaterThan(eyesX(left))
    expect(mouthY(up)).toBeLessThan(mouthY(down))
    expect(matrix(left.mouth!.transform).slice(0, 4)).not.toEqual(
      matrix(right.mouth!.transform).slice(0, 4)
    )
  })

  it('keeps the mouth attachment independent of the expression head pose', () => {
    const expression = EXPRESSION_BY_ID.get('laughing')!
    const render = (pitch: number) => {
      const engine = new BotEngine(100, 'idle', circle(), {
        ...expression, gaze: { yaw: 0, pitch, roll: 0 }
      })
      engine.setLook({ yaw: 25, pitch: 10, mix: 1, spin: 0, wander: 0 }, 0, 0)
      return engine.sample(1).mouth
    }
    expect(render(-20)).toEqual(render(20))
  })

  it('projects orthonormal tangents and a curved surface through yaw, pitch and roll', () => {
    for (const yaw of [-65, 0, 65]) for (const pitch of [-28, 0, 28]) {
      const pose = facialFeaturePose({ yaw, pitch, roll: 17 }, 100, 0.04, 0.45)
      expect(pose.a * pose.d - pose.b * pose.c).toBeCloseTo(pose.depth, 10)
      expect(Math.hypot(pose.a, pose.b)).toBeLessThanOrEqual(1.000001)
      expect(Math.hypot(pose.c, pose.d)).toBeLessThanOrEqual(1.000001)
      expect(pose.point(0, 0)).toEqual({ x: pose.x, y: pose.y, depth: pose.depth })
      for (const u of [-0.35, 0, 0.35]) for (const v of [-0.2, 0.3]) {
        const p = pose.point(u, v)
        expect(Math.hypot(p.x / 100, p.y / 100, p.depth)).toBeCloseTo(1, 10)
      }
    }
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


describe('mouth transitions', () => {
  it('keeps every pair of visible mouths opaque and continuous through the midpoint', () => {
    for (const a of EXPRESSIONS.filter(e => e.mouth)) {
      for (const b of EXPRESSIONS.filter(e => e.mouth)) {
        const frames = [0.4999, 0.5, 0.5001].map(t => blendExpression(a, b, t).mouth!)
        for (const mouth of frames) expect(mouth.alpha).toBe(1)
        for (const key of ['x', 'y', 'width', 'height', 'curve'] as const) {
          expect(Math.abs(frames[0]![key] - frames[2]![key])).toBeLessThan(0.001)
        }
      }
    }
  })

  it('retargets an unfinished morph from the displayed mouth, including removal', () => {
    const engine = new BotEngine(100, 'idle', circle(), EXPRESSION_BY_ID.get('happy')!)
    engine.setExpression(EXPRESSION_BY_ID.get('laughing')!, 1)
    const before = engine.sample(1.08)
    engine.setExpression(EXPRESSION_BY_ID.get('sad')!, 1.08)
    expect(engine.sample(1.08)).toEqual(before)
    const middle = engine.sample(1.15)
    engine.sample(9)
    expect(engine.sample(1.15)).toEqual(middle)
    engine.setExpression(null, 1.15)
    expect(engine.sample(1.15)).toEqual(middle)
    expect(engine.sample(2).mouth).toBeNull()
  })

  it('preserves the shared face-fit offset when a custom-shape morph is interrupted', () => {
    for (const shape of SHAPES) {
      const engine = new BotEngine(100, 'idle', shape.radii, EXPRESSION_BY_ID.get('confused')!)
      engine.setExpression(EXPRESSION_BY_ID.get('scared')!, 1)
      const before = engine.sample(1.06)
      engine.setExpression(EXPRESSION_BY_ID.get('laughing')!, 1.06)
      expect(engine.sample(1.06), shape.id).toEqual(before)
    }
  })

  it('fades in from a default engine without jumping to a complete mouth', () => {
    const engine = new BotEngine(100, 'idle', circle())
    engine.setExpression(EXPRESSION_BY_ID.get('laughing')!, 1)
    expect(engine.sample(1).mouth).toBeNull()
    expect(engine.sample(1.02).mouth!.alpha).toBeLessThan(1)
    expect(engine.sample(2).mouth!.alpha).toBe(1)
  })
})
