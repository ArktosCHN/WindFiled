### 使用方法 (openlayers)

```javascript
import OLFiled from ''
// OLFiled 是引入的名字
let olFiled = new OLFiled({
  olMap: map
});
olFiled.buildOLWindFiled({
  datas: datas
})
```

### API (openlayers)

> 创建对象
```javascript
new OLFiled({
  olMap: map // typeof ol.map
});
```

> 构建风场

```javascript
olFiled.buildOLWindFiled({
  datas: datas, // wind data
  params: params // object
})
```
> 参数设置

```javascript
params = {
  projection: 'EPSG:4326',
  minVelocity: 0,
  maxVelocity: 60,
  velocityScale: 0.02,
  particleAge: 180,
  lineWidth: 3,
  particleMultiplier: 1/1250,
  frameRate: 16,
  colorScale: [
    "#000"
  ]
}
```
> 风场数据结构
```javascript
[
  {
    data:[],
    header:{
      refTime:"",
      lo2: null,
      lo1:null,
      dx:null,
      dy:null,
      ny:null,
      nx:null,
      la1:null,
      la2:null,
      ...
    }
  },
  {

  }
]
```

### 使用方法（Cesium）

```javascript
let viewer = new Cesium.Viewer('cesiumContainer');
let cesiumWindFiled = new CesiumWindFiled({
  cesium: viewer
});
cesiumWindFiled.buildCesiumWindFiled({
  datas: datas
})
```

### API (Cesium)

> 创建对象

```javascript
import CesiumWindFiled from './index.js'
// CesiumWindFiled 是引入的名字
let cesiumWindFiled = new CesiumWindFiled({
  cesium: viewer
});
```

> 构建风场

```javascript
cesiumWindFiled.buildCesiumWindFiled({
    datas = null,
    params = {}
})
```

> 参数设置

```javascript
let params = {
  SPEED_RATE: 0.15,
  PARTICLE_MULTIPLIER: 2.5,
  MAX_AGE: 10,
  BRIGHTEN: 1.5,
  DEFAULT_COLOR_SCALE: ["#0f0", "#00f", "#f00"],
  MIN_VELOCITY: 0,
  MAX_VELOCITY: 5
}
```

> 风场数据

```javascript
// 同上
```


### 参考


[sakitam-fdd/wind-layer](https://github.com/sakitam-fdd/wind-layer)

[RaymanNg/3D-Wind-Field](https://github.com/RaymanNg/3D-Wind-Field)
