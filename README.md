# linear-tick

English | [中文](README_CN.md)

Draw everything on canvas with linear ticks

## Installation

```bash
npm i linear-tick
```

## Usage

### Basic Usage

```typescript
import { LinearTick } from 'linear-tick';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const linearTick = new LinearTick();
linearTick.canvas = canvas;

linearTick.ticks = [{
    multiply: 10,
    maxDensityToShow: 3,
    drawCall: {
        init(ctx) {
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 2
            ctx.beginPath()
        },
        each(ctx, store, state, params) {
            ctx.moveTo(state.x, state.y)
            ctx.lineTo(state.x, state.y + params.height)
        },
        end(ctx) { ctx.stroke() }
    }
}];

linearTick.draw();
```

### Properties

- `canvas?: HTMLCanvasElement` - The canvas element
- `keepSameSizeWith?: HTMLElement` - If set, `params.width` and `params.height` will be calculated based on this element's size and `params.pixelRatio`, and automatically adjusted when the size changes
- `drawNextFrame: boolean` - Whether to draw on the next frame
- `whenResized?: WhenResized` - Action to perform when the size changes
- `initStore?: () => STORE` - Function to initialize custom state
- `initDraw?: DrawCallFn<STORE, void | null>` - Function executed before any drawing starts, returns `null` to abort drawing
- `finalDraw?: DrawCallFn<STORE>` - Function executed after all drawing is completed
- `ticks: LinearTickDefine<STORE>[]` - Tick definitions, recommended to be sorted by `multiply` from small to large
- `params: LinearTickParams` - Parameters

### Tick Definition

The `LinearTickDefine<STORE>` interface defines the structure of a tick:

- `multiply: number` - Multiplier for tick values, i.e., how many values correspond to one tick
- `zeroOffset?: number` - Offset for tick values, e.g., with offset 3 and multiply 5, ticks will be 3, 8, 13, 18...
- `maxDensityToShow?: number` - Ticks will be hidden when density is greater than this value
- `shy?: boolean` - Whether to hide this tick when subsequent ticks overlap with it
- `drawCall: LinearTickDrawCall<STORE> | LinearTickDrawCall<STORE>[]` - Drawing function definition, if an array, drawn in order

The `LinearTickDrawCall<STORE>` interface defines the drawing functions:

- `init?: DrawCallFn<STORE, void | null>` - Executed before drawing starts, returns `null` to abort drawing
- `each: DrawCallFn<STORE>` - Executed for each drawing
- `final?: DrawCallFn<STORE>` - Executed when drawing ends

The `DrawCallFn<STORE>` interface defines the drawing function:

- `ctx: CanvasRenderingContext2D` - Canvas context
- `store: STORE` - Custom state
- `state: LinearTickDrawState` - Drawing state
- `params: LinearTickParams` - Parameters

The `LinearTickDrawState` interface defines the drawing state:

- `x: number` - X coordinate of the current drawing position
- `y: number` - Y coordinate of the current drawing position
- `value: number` - Tick value at the current drawing position
- `firstValue: number` - First tick value that can fit on the canvas
- `lastValue: number` - Last tick value that can fit on the canvas

### Parameters

The `LinearTickParams` interface defines the following parameters:

- `min?: number` - Minimum value of the drawing range, ticks smaller than this will not be drawn
- `max?: number` - Maximum value of the drawing range, ticks larger than this will not be drawn
- `value: number` - Value corresponding to the anchor point
- `redundancy: number` - Number of units the visible range should be extended by to prevent missing drawings at the edges
- `anchorX: number` - X coordinate of the anchor point on the canvas, range [0, 1], 0 is leftmost, 1 is rightmost
- `anchorY: number` - Y coordinate of the anchor point on the canvas, range [0, 1], 0 is topmost, 1 is bottommost
- `directionX: number` - X component of the unit vector, in pixels. Recommended unit vector length is 1px
- `directionY: number` - Y component of the unit vector
- `density: number` - Density, i.e., number of values per unit vector
- `minDensity: number` - Minimum density, i.e., number of values per unit vector when zoomed out to maximum, will limit the minimum value of `density`
- `maxDensity: number` - Maximum density, i.e., number of values per unit vector when zoomed in to minimum, will limit the maximum value of `density`
- `width: number` - Drawing pixel width
- `height: number` - Drawing pixel height
- `pixelRatio?: number` - Pixel ratio

### Responsiveness

```typescript
const container = document.getElementById('container');
const linearTick = new LinearTick();
linearTick.canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
linearTick.keepSameSizeWith = container;
linearTick.whenResized = WhenResized.Draw;
```

This setup makes the canvas automatically adjust its size and redraw when the container element's size changes.

`WhenResized` is an enum that defines `LinearTick`'s behavior when the container size changes:

- `DoNothing` - Do nothing when the size changes
- `Draw` - Respond to size changes and redraw
- `DrawNextFrame` - Respond to size changes, but don't redraw immediately, wait until the next frame to redraw
