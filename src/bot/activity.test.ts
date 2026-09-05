import { describe, expect, it } from 'vitest'
import { BotEngine } from '@/lib/internal/core/engine'
import { EXPRESSION_BY_ID } from '@/lib/internal/core/expressions'

const bot = () => new BotEngine(100, 'idle', null, EXPRESSION_BY_ID.get('attentive')!)
const eyeX = (engine: BotEngine, t: number) => Number(engine.sample(t).eyes[0]!.matrix.slice(7, -1).split(',')[4])

describe('persistent character activity', () => {
  it('waits calmly for minutes without hiding the face or inventing progress', () => {
    const waiting = bot()
    waiting.setActivity('waiting', 0)
    const rest = bot()
    const times = Array.from({ length: 300 }, (_, i) => i + 1)
    const range = (engine: BotEngine) => {
      const positions = times.map(t => eyeX(engine, t))
      return Math.max(...positions) - Math.min(...positions)
    }
    expect(range(waiting)).toBeLessThan(range(rest) * 0.4)
    for (const t of times) {
      expect(waiting.sample(t).eyes).toHaveLength(2)
      expect(waiting.sample(t).dots).toHaveLength(0)
    }
  })

  it('keeps the working face and uses a seamless constant-size dot rhythm', () => {
    const engine = bot()
    engine.setActivity('working', 0)
    const frame = engine.sample(2)
    expect(frame.eyes).toHaveLength(2)
    expect(frame.dots).toHaveLength(3)
    engine.sample(4.4).dots.forEach((dot, i) => {
      expect(dot.opacity).toBeCloseTo(frame.dots[i]!.opacity, 12)
      expect([dot.x, dot.y, dot.r]).toEqual([frame.dots[i]!.x, frame.dots[i]!.y, frame.dots[i]!.r])
    })
    expect(engine.sample(2.6).dots.map(dot => dot.opacity)).not.toEqual(frame.dots.map(dot => dot.opacity))
    expect(new Set(frame.dots.map(dot => dot.r)).size).toBe(1)
    engine.sample(100)
    expect(engine.sample(2)).toEqual(frame)
  })

  it('retargets activity transitions without a jump', () => {
    const engine = bot()
    engine.setActivity('working', 1)
    const before = engine.sample(1.1)
    engine.setActivity('waiting', 1.1)
    expect(engine.sample(1.1)).toEqual(before)
    expect(engine.sample(3).dots).toHaveLength(0)
  })

  it('holds a stable face in reduced motion and when disabled', () => {
    const engine = bot()
    engine.setActivity('working', 0)
    expect(engine.sample(2, true)).toEqual(engine.sample(20, true))
    expect(engine.sample(2, true).dots).toHaveLength(3)
    engine.setActivity('disabled', 21)
    expect(engine.sample(23)).toEqual(engine.sample(40))
  })
})
