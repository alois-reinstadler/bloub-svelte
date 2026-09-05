// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'
import { mount, tick, unmount } from 'svelte'
import Bloub from '@/lib/Bloub.svelte'

it('suspends offscreen rendering and resumes the same face without advancing its clock', async () => {
  const frames = new Map<number, FrameRequestCallback>()
  let nextId = 0
  let visibility: IntersectionObserverCallback | undefined
  const disconnect = vi.fn()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback)
    return nextId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { visibility = callback }
    observe() {}
    disconnect = disconnect
  })
  const host = document.createElement('div')
  document.body.append(host)
  const component = mount(Bloub, { target: host, props: { expression: 'laughing' } })
  const step = async (time: number) => {
    const [id, callback] = [...frames][0]!
    frames.delete(id)
    callback(time)
    await tick()
  }
  const report = (isIntersecting: boolean) => visibility!([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
  try {
    await tick()
    await step(1000)
    await step(1060)
    const svg = host.querySelector('svg')!
    const face = svg.innerHTML
    report(false)
    expect(frames.size).toBe(0)
    report(true)
    expect(frames.size).toBe(1)
    await step(90_000)
    expect(host.querySelector('svg')).toBe(svg)
    expect(svg.innerHTML).toBe(face)
    await step(90_060)
    expect(svg.innerHTML).not.toBe(face)
  } finally {
    await unmount(component)
    host.remove()
    vi.unstubAllGlobals()
  }
  expect(frames.size).toBe(0)
  expect(disconnect).toHaveBeenCalledOnce()
})
