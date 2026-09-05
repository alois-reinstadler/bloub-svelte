// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, tick, unmount } from 'svelte'
import Bloub from '@/lib/Bloub.svelte'

type FrameCallback = (time: number) => void

describe('lookAt public prop', () => {
  let component: ReturnType<typeof mount> | null = null

  afterEach(async () => {
    if (component) await unmount(component)
    component = null
    document.body.replaceChildren()
    vi.unstubAllGlobals()
  })

  it('tracks the live centre of an element and releases when it disconnects', async () => {
    let nextFrame: FrameCallback | null = null
    vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => {
      nextFrame = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const target = document.createElement('button')
    const host = document.createElement('div')
    document.body.append(target, host)

    let targetLeft = 800
    target.getBoundingClientRect = () => ({
      x: targetLeft,
      y: 280,
      left: targetLeft,
      top: 280,
      right: targetLeft + 100,
      bottom: 320,
      width: 100,
      height: 40,
      toJSON: () => ({})
    })

    component = mount(Bloub, { target: host, props: { lookAt: target } })
    await tick()
    const svg = host.querySelector('svg')!
    svg.getBoundingClientRect = () => ({
      x: 300,
      y: 200,
      left: 300,
      top: 200,
      right: 620,
      bottom: 520,
      width: 320,
      height: 320,
      toJSON: () => ({})
    })

    const advance = async (from: number, count: number) => {
      for (let i = 1; i <= count; i++) {
        const callback = nextFrame
        expect(callback).toBeTypeOf('function')
        nextFrame = null
        callback!((from + i) * 16)
        await tick()
        expect(svg.querySelectorAll('mask path[fill="#000"]')).toHaveLength(2)
      }
    }
    const eyes = () => [...svg.querySelectorAll('mask path[fill="#000"]')].map((eye) => eye.getAttribute('transform'))

    await advance(0, 80)
    const lookingRight = eyes()
    expect(lookingRight).toHaveLength(2)

    targetLeft = 40
    await advance(80, 40)
    const lookingLeft = eyes()
    expect(lookingLeft).not.toEqual(lookingRight)

    target.remove()
    await advance(120, 80)
    expect(eyes()).not.toEqual(lookingLeft)
  })
  it('renders declarative working status with a stable reduced-motion face', async () => {
    let nextFrame: FrameCallback | null = null
    vi.stubGlobal('requestAnimationFrame', (callback: FrameCallback) => { nextFrame = callback; return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const host = document.createElement('div')
    document.body.append(host)
    component = mount(Bloub, { target: host, props: { status: 'loading', motion: 'reduced' } })
    await tick()
    const advance = async (from: number) => {
      for (let i = 1; i <= 80; i++) {
        nextFrame!((from + i) * 16)
        await tick()
      }
    }
    await advance(0)
    const svg = host.querySelector('svg')!
    expect(svg.dataset.activity).toBe('working')
    expect(svg.querySelectorAll('circle')).toHaveLength(3)
    const before = svg.innerHTML
    await advance(80)
    expect(svg.innerHTML).toBe(before)
  })

})
