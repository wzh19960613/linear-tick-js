export interface LinearTickDrawState {
	x: number
	y: number
	value: number
	firstValue: number
	lastValue: number
}
export type DrawCallFn<STORE, RT = void> = (ctx: CanvasRenderingContext2D, store: STORE, state: LinearTickDrawState, params: LinearTickParams) => RT
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
export declare enum WhenResized {
	DoNothing = 0,
	Draw = 1,
	DrawNextFrame = 2
}
export declare function valueToCoord(value: number, params: LinearTickParams): [
	number,
	number
]
export declare class LinearTick<STORE extends Record<string, any> = Record<string, any>> {
	#private
	static defaultParams: LinearTickParams
	initStore?: () => STORE
	initDraw?: DrawCallFn<STORE, void | null>
	finalDraw?: DrawCallFn<STORE>
	canvas?: HTMLCanvasElement
	params: LinearTickParams
	ticks: LinearTickDefine<STORE>[]
	whenResized: WhenResized
	constructor(ticks?: LinearTickDefine<STORE>[], params?: Partial<LinearTickParams>)
	get keepSameSizeWith(): HTMLElement | undefined
	set keepSameSizeWith(elem: HTMLElement | undefined)
	get drawNextFrame(): boolean
	set drawNextFrame(draw: boolean)
	draw(): void
}

export { }
