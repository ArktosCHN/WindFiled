import Windy from './ol/windy.js'
import CesWindy from './cesium/Windy.js'

const MAP_TYPE = {
  OPENLAYERS: 1,
  CESIUM: 2
}

class OLFiled {
  constructor({
    olMap = null,
    cesium = null
  }) {
    this.olMap = olMap;
    this.cesium = cesium;
  }

  buildOLWindFiled({
    datas = null,
    params = null
  }) {
    // 检查MAP对象并获取view坐标信息
    let viewProjection = this._checkMapObj(MAP_TYPE.OPENLAYERS);

    // 判断数据 如果有data 则不使用url
    let windData = null;
    if (datas) {
      if (!(datas instanceof Object)) {
        windData = JSON.parse(datas);
      }
      if (windData.length !== 2) {
        console.warn("数据格式可能出错");
      }
    } else {
      throw new Error('绘制风场时数据为空');
    }

    // 判断坐标系
    windData.forEach(data => {
      if (data.header && data.header.projection) {
        if (viewProjection.getCode() !== data.header.projection) {
          console.warn("气象数据坐标系与地图视角坐标系不统一 可能无法显示风场 -> %o", data);
        }
      } else {
        if (viewProjection.getCode() !== "EPSG:4326") {
          console.warn("气象数据坐标系与地图视角坐标系不统一 可能无法显示风场 -> %o", data);
        }
      }
    });

    // 绘制风场
    let canvas = this._addWindCanvasLayer();
    let windParam = {
      canvas: canvas,
      data: windData
    }

    windParam = Object.assign(windParam, params);

    let windy = new Windy(windParam);
    this._OLDrawWindFiled(windy, this.olMap, canvas);
    let self = this;
    // 绑定地图事件
    this.olMap.on("moveend", function () {
      self._OLDrawWindFiled(windy, self.olMap, canvas);
    });

    // 返回 windy 元素
    return windy;
  }

  buildCesiumWindFiled({
    datas = null,
    params = {}
  }) {
    this._checkMapObj(MAP_TYPE.CESIUM);
    let windData = null;
    if (datas === null) {
      throw new Error("绘制风场时数据为空");
    }
    if (!(datas instanceof Object)) {
      windData = JSON.parse(datas);
    }

    // 因为目前数据对于V方向是反方向 所以做去反操作 这里需要特别调整
    let tempWind = [];
    tempWind.push(windData[0]);
    let tempWindObj = {};
    tempWindObj.data = [];
    tempWindObj.header = windData[1].header;
    windData[1].data.forEach(vData => {
      tempWindObj.data.push(-vData);
    });
    tempWind.push(tempWindObj);


    // 进行风场绘制
    let header = tempWind[0].header;
    this._createRect(header['lo1'], header['la2'], header['lo2'], header['la1'])
    this.cesium.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(header['lo1'], header['la2'], header['lo2'], header['la1'])
    });
    let windy = new CesWindy(tempWind, this.cesium, params);
    setInterval(function () {
      windy.animate();
    }, 16);
  }

  _checkMapObj(mapType) {
    switch (mapType) {
      case MAP_TYPE.OPENLAYERS: {
        return this._checkOpenlayers();
      }
      case MAP_TYPE.CESIUM: {
        return this._checkCesium();
      }
      default: {
        throw new Error("不支持的地图类型");
      }
    }
  }

  _checkOpenlayers() {
    /** 
     * 检查步骤：
     * 1. 检查是否存在Openlayers的Map对象
     * 2. 获取view坐标信息并返回
     */
    if (!this.olMap) {
      throw new Error("请先设置OpenLayers Map对象 (set map)");
    }
    let viewProjection = this.olMap.getView().getProjection();
    return viewProjection;
  }

  _checkCesium() {
    /** 
     * 检查步骤：
     * 1. 检查是否存在Cesium
     * 2. 坐标系永远是EPSG 4326
     */
    if (!this.cesium) {
      throw new Error("请先设置Cesium Map对象 (set Cesium)");
    }
  }

  _addWindCanvasLayer() {
    let canvas = document.createElement('canvas');
    canvas.id = "windFiledCanvas" + new Date().getTime();
    canvas.width = window.map.getSize()[0];
    canvas.height = window.map.getSize()[1];
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    window.map.getViewport().appendChild(canvas);
    return canvas
  }

  _OLDrawWindFiled(windy, ol, canvas) {
    windy.stop();
    let tempHeight = canvas.height;
    canvas.height = tempHeight;
    const bounds = ol.getView().calculateExtent();
    const extent = {
      xmin: bounds[0],
      ymin: bounds[1],
      xmax: bounds[2],
      ymax: bounds[3]
    }
    setTimeout(() => {
      windy.start(
        [
          [0, 0],
          [canvas.width, canvas.height]
        ],
        canvas.width,
        canvas.height,
        [
          [extent.xmin, extent.ymin],
          [extent.xmax, extent.ymax]
        ]
      );
    }, 500);
  }

  _createRect(west, south, east, north) {
    /* global Cesium */
    this.cesium.scene.primitives.add(new Cesium.Primitive({
      geometryInstances: [
        this._getRectInstance(Cesium.Rectangle.fromDegrees(west, south, east, north))
      ],
      appearance: new Cesium.PolylineColorAppearance({
        translucent: false
      })
    }));
  }

  _getRectInstance(rect) {
    return new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleOutlineGeometry({
        rectangle: rect
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromBytes(255, 255, 255, 0)
        )
      }
    })
  }
}

export default OLFiled;
