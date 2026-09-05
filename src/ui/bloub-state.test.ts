import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BloubState } from '@/lib/bloub.state.svelte'

describe('BloubState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps application status to a visual presentation', () => {
    const bloub = new BloubState()

    bloub.setStatus('loading')
    expect(bloub.presentation).toMatchObject({ state: 'thinking', lookAt: null })

    bloub.setStatus('empty')
    expect(bloub.presentation).toMatchObject({ state: 'idle', expression: 'curious' })
  })

  it('accepts cursor and bound element attention without looking up the DOM', () => {
    const bloub = new BloubState()
    const field = { isConnected: true } as Element

    bloub.followCursor()
    expect(bloub.presentation.lookAt).toBe('cursor')

    bloub.lookAt(field)
    expect(bloub.presentation.lookAt).toBe(field)

    bloub.releaseAttention()
    expect(bloub.presentation.lookAt).toBeNull()
  })

  it('lets a reaction own attention and resumes the previous target afterward', () => {
    const bloub = new BloubState()
    const restingTarget = { isConnected: true } as Element
    const invalidField = { isConnected: true } as Element
    bloub.lookAt(restingTarget)

    expect(bloub.react('validation-error', { target: invalidField, duration: 900 })).toBe(true)
    expect(bloub.presentation).toMatchObject({
      state: 'idle',
      expression: 'confused',
      lookAt: invalidField,
      motion: 'shake'
    })

    vi.advanceTimersByTime(900)
    expect(bloub.presentation.lookAt).toBe(restingTarget)
    expect(bloub.presentation.motion).toBeNull()
  })

  it('protects important feedback from lower-priority interruptions', () => {
    const bloub = new BloubState()

    expect(bloub.react('error')).toBe(true)
    expect(bloub.react('success')).toBe(false)
    expect(bloub.reaction?.type).toBe('error')

    expect(bloub.react('success', { force: true })).toBe(true)
    expect(bloub.reaction?.type).toBe('success')
  })

  it('limits accidental reaction repetition and can be reset', () => {
    const bloub = new BloubState()

    expect(bloub.react('success', { duration: 100 })).toBe(true)
    vi.advanceTimersByTime(100)
    expect(bloub.react('success')).toBe(false)

    vi.advanceTimersByTime(350)
    expect(bloub.react('success')).toBe(true)
    bloub.reset()
    expect(bloub.status).toBe('idle')
    expect(bloub.reaction).toBeNull()
    expect(bloub.attentionTarget).toBeNull()
  })
})
