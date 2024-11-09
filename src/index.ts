export interface LinearTickDrawState {
    x: number
    y: number
    value: number
    firstValue: number
    lastValue: number
}

export type DrawCallFn<STORE, RT = void> = (
    ctx: CanvasRenderingContext2D,
    store: STORE,
    state: LinearTickDrawState,
    params: LinearTickParams,
) => RT

export interface LinearTickParams {
    min?: number
    max?: number
    value: number
    redundancy: number
    anchorX: number
    anchorY: number
    directionX: number
    directionY: number
    density: number
    minDensity: number
    maxDensity: number
    width: number
    height: number
    pixelRatio?: number
}

export interface LinearTickDrawCall<STORE extends Record<string, any>> {
    init?: DrawCallFn<STORE, void | null>
    each: DrawCallFn<STORE>
    final?: DrawCallFn<STORE>
}

export interface LinearTickDefine<STORE extends Record<string, any>> {
    multiply: number
    zeroOffset?: number
    maxDensityToShow?: number
    shy?: boolean
    drawCall: LinearTickDrawCall<STORE> | LinearTickDrawCall<STORE>[]
}

export enum WhenResized {
    DoNothing = 0,
    Draw,
    DrawNextFrame,
}

export function valueToCoord(value: number, params: LinearTickParams) {
    const { density } = params
    const delta = value - params.value
    return [
        delta * params.directionX / density + params.anchorX * params.width,
        delta * params.directionY / density + params.anchorY * params.height
    ] as [number, number]
}

export class LinearTick<STORE extends Record<string, any> = Record<string, any>> {
    static defaultParams: LinearTickParams = {
        value: 0,
        redundancy: 1,
        anchorX: 0,
        anchorY: 0,
        directionX: 1,
        directionY: 0,
        density: 0.1,
        minDensity: 0.02,
        maxDensity: 100,
        width: 100,
        height: 20,
    }

    #drawNextFrame?: ReturnType<typeof requestAnimationFrame>
    #observedElem?: HTMLElement
    #sizeObserver = new ResizeObserver(() => {
        const elem = this.#observedElem
        if (!elem) return
        const dpr = this.params.pixelRatio ?? window.devicePixelRatio
        const { offsetWidth, offsetHeight } = elem
        const width = this.params.width = offsetWidth * dpr
        const height = this.params.height = offsetHeight * dpr
        const canvas = this.canvas
        if (!canvas) return
        canvas.width = width
        canvas.height = height
        canvas.style.width = `${offsetWidth}px`
        canvas.style.height = `${offsetHeight}px`
        if (this.whenResized === WhenResized.Draw) this.draw()
        else if (this.whenResized === WhenResized.DrawNextFrame) this.drawNextFrame = true
    })

    initStore?: () => STORE
    initDraw?: DrawCallFn<STORE, void | null>
    finalDraw?: DrawCallFn<STORE>
    canvas?: HTMLCanvasElement
    params: LinearTickParams
    ticks: LinearTickDefine<STORE>[]
    whenResized = WhenResized.DoNothing

    constructor(ticks?: LinearTickDefine<STORE>[], params?: Partial<LinearTickParams>) {
        const { defaultParams } = LinearTick
        this.params = params ? Object.assign({}, defaultParams, params) : { ...defaultParams }
        this.ticks = ticks ?? []
    }

    get keepSameSizeWith() { return this.#observedElem }

    set keepSameSizeWith(elem) {
        if (this.#observedElem === elem) return
        if (this.#observedElem) this.#sizeObserver.unobserve(this.#observedElem)
        this.#observedElem = elem
        if (elem) this.#sizeObserver.observe(elem)
    }

    get drawNextFrame() { return this.#drawNextFrame !== undefined }

    set drawNextFrame(draw) {
        if (draw === this.drawNextFrame) return
        if (this.#drawNextFrame) {
            cancelAnimationFrame(this.#drawNextFrame)
            this.#drawNextFrame = undefined
        } else this.#drawNextFrame = requestAnimationFrame(() => this.draw())
    }

    draw() {
        this.drawNextFrame = false
        const { params, canvas } = this
        checkDensity(params)
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get 2d context')
        const {
            directionX: dx, directionY: dy, value: anchorValue, redundancy, width, height, density
        } = params
        const originX = params.anchorX * width
        const originY = params.anchorY * height
        const startUnit = -calcUnitToEdge(originX, originY, -dx, -dy, width, height) - redundancy
        const endUnit = calcUnitToEdge(originX, originY, dx, dy, width, height) + redundancy
        const firstValue = calcFirstValue(startUnit, density, anchorValue, params.min)
        const lastValue = calcLastValue(endUnit, density, anchorValue, params.max)
        const store = this.initStore?.() ?? {} as STORE
        const state = { x: 0, y: 0, value: 0, firstValue, lastValue }
        if (this.initDraw?.(ctx, store, state, params) === null) return
        const deltaX = dx / density, deltaY = dy / density, { ticks } = this
        for (const { 0: { drawCall }, 1: values } of filter(ticks, density, firstValue, lastValue))
            for (const { init, each, final } of Array.isArray(drawCall) ? drawCall : [drawCall]) {
                if (init?.(ctx, store, state, params) === null) continue
                for (const value of values) {
                    const delta = (state.value = value) - anchorValue
                    state.x = delta * deltaX + originX
                    state.y = delta * deltaY + originY
                    each(ctx, store, state, params)
                }
                final?.(ctx, store, state, params)
            }
        this.finalDraw?.(ctx, store, state, params)
    }
}

function checkDensity(params: LinearTickParams) {
    if (params.density < params.minDensity) params.density = params.minDensity
    else if (params.density > params.maxDensity) params.density = params.maxDensity
}

function filter<STORE extends Record<string, any>>(
    ticks: LinearTickDefine<STORE>[], density: number, firstValue: number, lastValue: number
): [LinearTickDefine<STORE>, number[]][] {
    const result = ticks
        .filter(({ maxDensityToShow: md }) => md === undefined ? true : md >= density)
        .map(t => [t, firstTickValue(t, firstValue)] as [LinearTickDefine<STORE>, any])
        .filter(({ 1: firstTickValue }) => firstTickValue <= lastValue)
    const valuesDrawn = new Set()
    for (let i = result.length - 1; i >= 0; --i) {
        const { 0: { shy = false, multiply }, 1: firstTickValue } = result[i]
        const steps = Math.floor((lastValue - firstTickValue) / multiply) + 1
        const values = []
        if (i) for (let n = 0; n < steps; ++n) {
            const v = firstTickValue + n * multiply
            if (shy && valuesDrawn.has(v)) continue
            values.push(v)
            valuesDrawn.add(v)
        } else for (let n = 0; n < steps; ++n) {
            const v = firstTickValue + n * multiply
            if (!shy || !valuesDrawn.has(v)) values.push(v)
        }
        result[i][1] = values
    }
    return result
}

function isInfinitesimal(n: number) { return Math.abs(n) <= Number.EPSILON }

function calcUnitToEdge<N extends number>(originX: N, originY: N, dx: N, dy: N, w: N, h: N) {
    return Math.min(
        isInfinitesimal(dx) ? Infinity : (dx > 0 ? w - originX : -originX) / dx,
        isInfinitesimal(dy) ? Infinity : (dy > 0 ? h - originY : -originY) / dy,
    )
}

function calcFirstValue(startUnit: number, density: number, anchorValue: number, min?: number) {
    const v = anchorValue + startUnit * density
    return min === undefined ? v : Math.max(min, v)
}

function calcLastValue(endUnit: number, density: number, anchorValue: number, max?: number) {
    const v = anchorValue + endUnit * density
    return max === undefined ? v : Math.min(max, v)
}

function firstTickValue<STORE extends Record<string, any>>(
    { multiply, zeroOffset = 0 }: LinearTickDefine<STORE>, firstValue: number
) { return Math.ceil((firstValue - zeroOffset) / multiply) * multiply + zeroOffset }