import { lerp } from './math'

/** Persistent application behavior, separate from the animation catalogue. */
export type ActivityId = 'rest' | 'waiting' | 'working' | 'disabled'
export interface ActivityPose {
  wander: number
  float: number
  blink: number
  working: number
}
export const ACTIVITIES: Record<ActivityId, ActivityPose> = {
  rest: { wander: 1, float: 1, blink: 1, working: 0 },
  waiting: { wander: 0.22, float: 0.5, blink: 1, working: 0 },
  working: { wander: 0.12, float: 0.35, blink: 1, working: 1 },
  disabled: { wander: 0, float: 0, blink: 0, working: 0 }
}
export const blendActivity = (a: ActivityPose, b: ActivityPose, t: number): ActivityPose => ({
  wander: lerp(a.wander, b.wander, t),
  float: lerp(a.float, b.float, t),
  blink: lerp(a.blink, b.blink, t),
  working: lerp(a.working, b.working, t)
})
