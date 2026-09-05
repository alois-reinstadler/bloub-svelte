import type { ActivityId } from './internal/core/activity'
import type { ExpressionId, LookAtTarget, StateId } from './types'

export const BLOUB_STATUSES = ['idle', 'waiting', 'loading', 'empty', 'disabled'] as const
export const BLOUB_REACTIONS = [
  'validation-error',
  'error',
  'success',
  'warning',
  'confused',
  'celebrate',
  'notify',
  'destructive'
] as const

export type BloubStatus = (typeof BLOUB_STATUSES)[number]
export type BloubReaction = (typeof BLOUB_REACTIONS)[number]
export type BloubMotion = 'shake' | 'nod' | 'pulse' | 'tilt' | 'bounce' | 'tremble' | null

export interface BloubReactionOptions {
  /** Element Bloub should look at while reacting. Pass it from `bind:this`. */
  target?: Element | null
  /** Override the reaction's default duration in milliseconds. */
  duration?: number
  /** Interrupt a higher-priority reaction and ignore the repetition cooldown. */
  force?: boolean
}

export interface ActiveBloubReaction {
  readonly id: number
  readonly type: BloubReaction
  readonly target: Element | null
  readonly duration: number
  readonly motion: BloubMotion
  readonly priority: number
}

export interface BloubPresentation {
  readonly activity: ActivityId
  readonly state: StateId
  readonly expression?: ExpressionId
  readonly lookAt: LookAtTarget | null
  readonly motion: BloubMotion
  readonly reactionId: number | null
  readonly reactionDuration: number
}

interface VisualState {
  state: StateId
  expression?: ExpressionId
  activity?: ActivityId
}

interface ReactionDefinition extends VisualState {
  duration: number
  cooldown: number
  motion: Exclude<BloubMotion, null>
  priority: number
}

const STATUS: Record<BloubStatus, VisualState> = {
  idle: { state: 'idle' },
  waiting: { state: 'idle', expression: 'attentive', activity: 'waiting' },
  loading: { state: 'idle', expression: 'attentive', activity: 'working' },
  empty: { state: 'idle', expression: 'curious' },
  disabled: { state: 'idle', expression: 'sleepy', activity: 'disabled' }
}

/** Shared by declarative status props and the event controller. */
export function statusPresentation(status: BloubStatus): BloubPresentation {
  const visual = STATUS[status]
  return {
    ...visual, activity: visual.activity ?? 'rest', lookAt: null,
    motion: null, reactionId: null, reactionDuration: 0
  }
}

const REACTION: Record<BloubReaction, ReactionDefinition> = {
  'validation-error': {
    state: 'idle',
    expression: 'confused',
    duration: 1400,
    cooldown: 650,
    motion: 'shake',
    priority: 4
  },
  error: {
    state: 'idle',
    expression: 'sad',
    duration: 1600,
    cooldown: 650,
    motion: 'shake',
    priority: 5
  },
  success: {
    state: 'idle',
    expression: 'happy',
    duration: 1300,
    cooldown: 450,
    motion: 'nod',
    priority: 3
  },
  warning: {
    state: 'idle',
    expression: 'suspicious',
    duration: 1500,
    cooldown: 600,
    motion: 'pulse',
    priority: 4
  },
  confused: {
    state: 'idle',
    expression: 'confused',
    duration: 1500,
    cooldown: 500,
    motion: 'tilt',
    priority: 2
  },
  celebrate: {
    state: 'idle',
    expression: 'laughing',
    duration: 1900,
    cooldown: 900,
    motion: 'bounce',
    priority: 3
  },
  notify: {
    state: 'notify',
    expression: 'attentive',
    duration: 1800,
    cooldown: 500,
    motion: 'pulse',
    priority: 2
  },
  destructive: {
    state: 'idle',
    expression: 'scared',
    duration: 1800,
    cooldown: 800,
    motion: 'tremble',
    priority: 5
  }
}

/**
 * Reactive behavior controller for `<Bloub>`. Create it in a Svelte component
 * and pass real element references from `bind:this`; it never searches the DOM.
 */
export class BloubState {
  status = $state<BloubStatus>('idle')

  private attention = $state.raw<LookAtTarget | null>(null)
  private currentReaction = $state.raw<ActiveBloubReaction | null>(null)
  private sequence = 0
  private reactionTimer: ReturnType<typeof setTimeout> | undefined
  private readonly lastReaction = new Map<BloubReaction, number>()

  get reaction(): ActiveBloubReaction | null {
    return this.currentReaction
  }

  get attentionTarget(): LookAtTarget | null {
    return this.attention
  }

  get presentation(): BloubPresentation {
    const active = this.currentReaction
    const visual = active ? REACTION[active.type] : STATUS[this.status]
    return {
      activity: active ? 'rest' : visual.activity ?? 'rest',
      state: visual.state,
      expression: visual.expression,
      // An explicit reaction temporarily owns attention. If it has no target,
      // Bloub performs the reaction straight ahead and resumes attention after.
      lookAt: active ? active.target : this.status === 'disabled' || this.status === 'loading' ? null : this.attention,
      motion: active?.motion ?? null,
      reactionId: active?.id ?? null,
      reactionDuration: active?.duration ?? 0
    }
  }

  setStatus(status: BloubStatus): void {
    this.status = status
  }

  followCursor(): void {
    this.attention = 'cursor'
  }

  lookAt(target: Element): void {
    this.attention = target
  }

  releaseAttention(): void {
    this.attention = null
  }

  react(type: BloubReaction, options: BloubReactionOptions = {}): boolean {
    const definition = REACTION[type]
    const now = Date.now()
    const last = this.lastReaction.get(type) ?? -Infinity
    if (!options.force && now - last < definition.cooldown) return false
    if (!options.force && this.currentReaction && this.currentReaction.priority > definition.priority) {
      return false
    }

    const duration = Math.max(0, options.duration ?? definition.duration)
    const active: ActiveBloubReaction = {
      id: ++this.sequence,
      type,
      target: options.target ?? null,
      duration,
      motion: definition.motion,
      priority: definition.priority
    }

    clearTimeout(this.reactionTimer)
    this.lastReaction.set(type, now)
    this.currentReaction = active
    this.reactionTimer = setTimeout(() => {
      if (this.currentReaction?.id === active.id) this.currentReaction = null
    }, duration)
    return true
  }

  dismissReaction(): void {
    clearTimeout(this.reactionTimer)
    this.reactionTimer = undefined
    this.currentReaction = null
  }

  reset(): void {
    this.dismissReaction()
    this.status = 'idle'
    this.attention = null
  }

  destroy(): void {
    this.dismissReaction()
  }
}
