# linear-tick

[English](README.md) | 中文

在 canvas 上用线性刻度绘制一切

## 安装

```bash
npm i linear-tick
```

## 使用方法

### 基本用法

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

### 属性

- `canvas?: HTMLCanvasElement` - 画布
- `keepSameSizeWith?: HTMLElement` - 如果设置，则 `params.width` 和 `params.height` 会根据该元素的尺寸和 `params.pixelRatio` 计算得出，并在尺寸变化时自动调整
- `drawNextFrame: boolean` - 是否在下一帧绘制
- `whenResized?: WhenResized` - 当尺寸变化时执行的操作
- `initStore?: () => STORE` - 函数：用于初始化自定义状态
- `initDraw?: DrawCallFn<STORE, void | null>` - 函数：任何绘制开始前执行，返回 `null` 则终止绘制
- `finalDraw?: DrawCallFn<STORE>` - 函数：所有绘制完成后执行
- `ticks: LinearTickDefine<STORE>[]` - 刻度定义，建议按 `multiply` 从小到大排列
- `params: LinearTickParams` - 参数

### 刻度定义

`LinearTickDefine<STORE>` 接口定义了刻度的结构:

- `multiply: number` - 刻度值的倍率，即多少值对应一个刻度
- `zeroOffset?: number` - 刻度值的偏移量，例如偏移3倍率5，则刻度为 3、8、13、18...
- `maxDensityToShow?: number` - 当密度大于该值时，刻度将被隐藏
- `shy?: boolean` - 当后续有刻度与此刻度重合时，是否隐藏此刻度
- `drawCall: LinearTickDrawCall<STORE> | LinearTickDrawCall<STORE>[]` - 绘制函数定义，如果为数组，则按顺序绘制

`LinearTickDrawCall<STORE>` 接口定义了绘制函数:

- `init?: DrawCallFn<STORE, void | null>` - 绘制开始前执行，返回 `null` 则终止绘制
- `each: DrawCallFn<STORE>` - 每次绘制时执行
- `final?: DrawCallFn<STORE>` - 绘制结束时执行

`DrawCallFn<STORE>` 接口定义了绘制函数:

- `ctx: CanvasRenderingContext2D` - 画布上下文
- `store: STORE` - 自定义状态
- `state: LinearTickDrawState` - 绘制状态
- `params: LinearTickParams` - 参数

`LinearTickDrawState` 接口定义了绘制状态:

- `x: number` - 当前绘制位置的X坐标
- `y: number` - 当前绘制位置的Y坐标
- `value: number` - 当前绘制位置的刻度值
- `firstValue: number` - 画布可容纳的第一个刻度值
- `lastValue: number` - 画布可容纳的最后一个刻度值

### 参数

`LinearTickParams` 接口定义了以下参数:

- `min?: number` - 绘制范围的最小值，小于该值的刻度将不会被绘制
- `max?: number` - 绘制范围的最大值，大于该值的刻度将不会被绘制
- `value: number` - 锚点处对应的值
- `redundancy: number` - 可见范围应扩展的单位数，以防边界上的绘制缺失
- `anchorX: number` - 锚点在画布中的X坐标，范围[0, 1]，0表示最左侧，1表示最右侧
- `anchorY: number` - 锚点在画布中的Y坐标，范围[0, 1]，0表示最顶部，1表示最底部
- `directionX: number` - 单位向量在X方向上的分量，单位为像素。单位向量长度建议为 1px
- `directionY: number` - 单位向量在Y方向上的分量
- `density: number` - 密度，即每单位向量包含的值数量
- `minDensity: number` - 最小密度，即缩放到最大值时每单位向量包含的值数量，将限制 `density` 的最小值
- `maxDensity: number` - 最大密度，即缩放到最小值时每单位向量包含的值数量，将限制 `density` 的最大值
- `width: number` - 绘制像素宽度
- `height: number` - 绘制像素高度
- `pixelRatio?: number` - 像素比

### 响应式

```typescript
const container = document.getElementById('container');
const linearTick = new LinearTick();
linearTick.canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
linearTick.keepSameSizeWith = container;
linearTick.whenResized = WhenResized.Draw;
```

这个设置使得 canvas 会随着容器元素的大小变化而自动调整大小并重绘。

`WhenResized` 是一个枚举，定义了当容器大小变化时，`LinearTick` 的行为:

- `DoNothing` - 尺寸变化时什么也不做
- `Draw` - 响应尺寸变化并重绘
- `DrawNextFrame` - 响应尺寸变化，但不立即重绘，而是等到下一帧重绘
