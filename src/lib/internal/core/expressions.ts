import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE, type HeadGaze } from './face'
import { lerp } from './math'
import type { EyeCfg } from './states'

/**
 * Expression de repos du bot.
 *
 * Le visage ne tient qu'à deux gélules, donc tout se joue sur quatre leviers :
 * l'orientation de la tête, l'écart des yeux, leurs proportions, et
 * l'inclinaison propre de chaque œil. C'est ce dernier qui permet la colère et
 * la tristesse : elles demandent des inclinaisons EN MIROIR (les hauts qui
 * convergent ou divergent), impossible avec le seul roulis de tête qui incline
 * les deux yeux du même côté.
 *
 * Seul l'état de repos porte cette expression. Les états expressifs de la vidéo
 * (clin d'œil, yeux écarquillés, notification) gardent la leur : c'est elle
 * qu'on est venu reproduire.
 *
 * Les amplitudes s'appuient sur bible-strong-avatar-lab, qui expose le même
 * modèle (tête X/Y/Z, largeur et hauteur par œil, écart, angle par œil) : chez
 * eux la largeur va de 0,8 à 2,7 fois le neutral, la hauteur de 0,3 à 1,5, et
 * les angles jusqu'à ±80°. On reste dans cette enveloppe.
 */
/** Enumeres pour que la couche i18n verifie leurs traductions a la compilation. */
export type ExpressionId =
  | 'neutral'
  | 'attentive'
  | 'surprised'
  | 'happy'
  | 'laughing'
  | 'sad'
  | 'scared'
  | 'suspicious'
  | 'confused'
  | 'curious'
  | 'sleepy'

export interface MouthCfg {
  kind: 'arc' | 'open'
  /** Head-local sine coordinates, independent of expression gaze. */
  x: number
  y: number
  width: number
  height: number
  curve: number
  thickness: number
  alpha: number
}

export interface BotExpression {
  id: ExpressionId
  gaze: HeadGaze
  split: number
  eyes: [EyeCfg, EyeCfg]
  mouth: MouthCfg | null
}

/** `tilt` en degrés, positif = le haut de la gélule part vers la droite. */
const eye = (w: number, h: number, tilt = 0, open = 1): EyeCfg => ({ w, h, tilt, open })

/** Les deux yeux identiques, inclinaisons en miroir si `tilt` est fourni. */
const pair = (w: number, h: number, tilt = 0, open = 1): [EyeCfg, EyeCfg] => [
  eye(w, h, tilt, open),
  eye(w, h, -tilt, open)
]

const arc = (width: number, y: number, curve: number, thickness = 0.065, x = 0): MouthCfg => ({
  kind: 'arc', x, y, width, height: thickness, curve, thickness, alpha: 1
})

const openMouth = (width: number, height: number, y: number, x = 0): MouthCfg => ({
  kind: 'open', x, y, width, height, curve: 0, thickness: 0, alpha: 1
})

export const EXPRESSIONS: BotExpression[] = [
  {
    // la pose relevée image par image sur la vidéo de référence
    id: 'neutral',
    gaze: { ...REST_GAZE },
    split: EYE_SPLIT,
    eyes: [eye(EYE_W, EYE_H), eye(EYE_W, EYE_H)],
    mouth: null
  },
  {
    id: 'attentive',
    gaze: { yaw: 4, pitch: 5, roll: -4 },
    split: 16,
    eyes: pair(0.22, 0.48),
    mouth: null
  },
  {
    id: 'surprised',
    gaze: { yaw: 1, pitch: -5, roll: 0 },
    split: 20,
    eyes: pair(0.43, 0.58),
    mouth: openMouth(0.22, 0.28, 0.55)
  },
  {
    // yeux plissés en arc : les hauts convergent légèrement
    id: 'happy',
    gaze: { yaw: 5, pitch: 9, roll: 0 },
    split: 17,
    eyes: pair(0.32, 0.14, 18),
    mouth: arc(0.48, 0.40, 0.12)
  },
  {
    id: 'laughing',
    gaze: { yaw: 2, pitch: 10, roll: 0 },
    split: 19,
    eyes: pair(0.38, 0.1, 24),
    mouth: { ...openMouth(0.62, 0.32, 0.43), curve: 0.16 }
  },
  {
    // l'inverse : les hauts divergent, et le regard tombe
    id: 'sad',
    gaze: { yaw: 1, pitch: -16, roll: 0 },
    split: 16,
    eyes: pair(0.24, 0.42, -32),
    mouth: arc(0.32, 0.53, -0.08, 0.055)
  },
  {
    id: 'scared',
    gaze: { yaw: 2, pitch: -20, roll: 0 },
    split: 20.5,
    eyes: pair(0.4, 0.65),
    mouth: openMouth(0.23, 0.32, 0.59)
  },
  {
    // un œil franchement plus fermé que l'autre
    id: 'suspicious',
    gaze: { yaw: 12, pitch: 6, roll: -6 },
    split: 16,
    eyes: [eye(0.22, 0.42), eye(0.3, 0.11, 12)],
    mouth: arc(0.24, 0.4, -0.025, 0.05, 0.06)
  },
  {
    // asymétrique sur les deux axes : tailles ET inclinaisons dépareillées.
    // L'œil plissé est volontairement plat (rapport 1,6) : à un rapport proche
    // de 1 il serait rond, et son inclinaison ne se verrait pas.
    id: 'confused',
    gaze: { yaw: -14, pitch: 3, roll: 8 },
    split: 16.5,
    eyes: [eye(0.2, 0.48, -22), eye(0.31, 0.14, 18)],
    mouth: arc(0.3, 0.41, -0.04, 0.055, 0.06)
  },
  {
    // la tête penche : c'est le roulis qui porte la curiosité
    id: 'curious',
    gaze: { yaw: 16, pitch: -9, roll: -15 },
    split: 16.5,
    eyes: [eye(0.27, 0.5, -10), eye(0.19, 0.35, -10)],
    mouth: arc(0.26, 0.48, 0.055, 0.05, 0.03)
  },
  {
    // paupières à moitié tombées : on passe par `open`, donc l'écrasement
    // vertical à l'écran, le même mécanisme que le clignement
    id: 'sleepy',
    gaze: { yaw: 6, pitch: -9, roll: -3 },
    split: 16,
    eyes: pair(0.28, 0.36, 4, 0.34),
    mouth: arc(0.2, 0.43, 0, 0.045)
  }
]

export const EXPRESSION_BY_ID = new Map<string, BotExpression>(EXPRESSIONS.map((e) => [e.id, e]))
export const DEFAULT_EXPRESSION = 'neutral'

const lerpEyeCfg = (a: EyeCfg, b: EyeCfg, t: number): EyeCfg => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t),
  open: lerp(a.open, b.open, t)
})

/** Interpolation de deux expressions : le changement se fait en glissant. */
export function blendExpression(a: BotExpression, b: BotExpression, t: number): BotExpression {
  const mouth = blendMouth(a.mouth, b.mouth, t)
  return {
    id: b.id,
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t)
    },
    split: lerp(a.split, b.split, t),
    eyes: [lerpEyeCfg(a.eyes[0], b.eyes[0], t), lerpEyeCfg(a.eyes[1], b.eyes[1], t)],
    mouth
  }
}

/** One outline topology for smiles and openings; no invisible midpoint. */
export function blendMouth(a: MouthCfg | null, b: MouthCfg | null, t: number): MouthCfg | null {
  if (!a && !b) return null
  const source = a ?? { ...b!, alpha: 0 }
  const target = b ?? { ...a!, alpha: 0 }
  return {
    kind: t < 0.5 ? source.kind : target.kind,
    x: lerp(source.x, target.x, t),
    y: lerp(source.y, target.y, t),
    width: lerp(source.width, target.width, t),
    height: lerp(source.height, target.height, t),
    curve: lerp(source.curve, target.curve, t),
    thickness: lerp(source.thickness, target.thickness, t),
    alpha: lerp(source.alpha, target.alpha, t)
  }
}
