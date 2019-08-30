/**
 * Created by mao on 2017/9/13.
 */
import Particle from './Particle';
import WindField from './WindField';

/* global Cesium */
class _windy {
    constructor(data, cesiumViewer, params = {}) {
        this._primitives = cesiumViewer.scene.primitives;
        this.windData = data;
        this.WindField = null;
        this.particles = [];
        this.lines = null;
        this.SPEED_RATE = params.SPEED_RATE || 0.15
        this.PARTICLE_MULTIPLIER = params.PARTICLE_MULTIPLIER || 2.5;
        this.PARTICLES_NUMBER = 1000 * this.PARTICLE_MULTIPLIER;
        this.MAX_AGE = params.MAX_AGE || 10;
        this.BRIGHTEN = params.BRIGHTEN || 1.5;
        this.DEFAULT_COLOR_SCALE = params.DEFAULT_COLOR_SCALE || ["#0f0", "#00f", "#f00"]
        this.MIN_VELOCITY = params.MIN_VELOCITY || 0;
        this.MAX_VELOCITY = params.MAX_VELOCITY || 5;

        this._init();
    }

    _init() {
        // 创建风场网格
        this.windField = this.createField();
        // 创建风场粒子
        for (let i = 0; i < this.PARTICLES_NUMBER; i++) {
            this.particles.push(this.randomParticle(new Particle()));
        }
    }
    createField() {
        let data = this._parseWindJson();
        return new WindField(data);
    }

    _parseWindJson() {
        let uComponent = null,
            vComponent = null,
            header = null;
        this.windData.forEach(function (record) {
            let type = record.header.parameterCategory + "," + record.header.parameterNumber;
            switch (type) {
                case "2,2":
                    uComponent = record['data'];
                    header = record['header'];
                    break;
                case "2,3":
                    vComponent = record['data'];
                    break;
                default:
                    break;
            }
        });
        return {
            header: header,
            uComponent: uComponent,
            vComponent: vComponent
        };
    }

    animate() {
        let self = this,
            field = self.windField,
            particles = self.particles;

        let instances = [],
            nextX = null,
            nextY = null,
            // xy = null,
            uv = null;
        particles.forEach(function (particle) {
            if (particle.age <= 0) {
                self.randomParticle(particle);
            }
            if (particle.age > 0) {
                let x = particle.x,
                    y = particle.y;

                if (!field.isInBound(x, y)) {
                    particle.age = 0;
                } else {
                    uv = field.getIn(x, y);
                    nextX = x + self.SPEED_RATE * uv[0];
                    nextY = y + self.SPEED_RATE * uv[1];
                    particle.path.push(nextX, nextY);
                    particle.x = nextX;
                    particle.y = nextY;
                    instances.push(self._createLineInstance(self._map(particle.path), particle.age / particle.birthAge));
                    particle.age--;
                }
            }
        });
        if (instances.length <= 0) this.removeLines();
        self._drawLines(instances);
    }

    removeLines() {
        if (this.lines) {
            this._primitives.remove(this.lines);
            this.lines.destroy();
        }
    }

    _map(arr) {
        let length = arr.length,
            field = this.windField,
            dx = field.dx,
            dy = field.dy,
            west = field.west,
            south = field.north,
            newArr = [];
        for (let i = 0; i <= length - 2; i += 2) {
            newArr.push(
                west + arr[i] * dx,
                south - arr[i + 1] * dy
            )
        }
        return newArr;
    }

    _createLineInstance(positions, ageRate) {
        let colors = [],
            length = positions.length,
            count = length / 2;
        for (let i = 0; i < length; i++) {
            // colors.push(Cesium.Color.WHITE.withAlpha(i / count * ageRate * BRIGHTEN));

            //TODO: 按照速度给线画上颜色
            colors.push(this._getColor(positions, ageRate, count, i));
        }
        return new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: Cesium.Cartesian3.fromDegreesArray(positions),
                colors: colors,
                width: 1.5,
                colorsPerVertex: true
            })
        });
    }

    _drawLines(lineInstances) {
        this.removeLines();
        let linePrimitive = new Cesium.Primitive({
            appearance: new Cesium.PolylineColorAppearance({
                translucent: true
            }),
            geometryInstances: lineInstances,
            asynchronous: false
        });
        this.lines = this._primitives.add(linePrimitive);
    }

    randomParticle(particle) {
        let safe = 30,
            x, y;

        do {
            x = Math.floor(Math.random() * (this.windField.cols - 2));
            y = Math.floor(Math.random() * (this.windField.rows - 2));
        } while (this.windField.getIn(x, y)[2] <= 0 && safe++ < 30);

        particle.x = x;
        particle.y = y;
        particle.age = Math.round(Math.random() * this.MAX_AGE);
        particle.birthAge = particle.age;
        particle.path = [x, y];
        return particle;
    }

    _getColor(positions, ageRate, count, i) {
        let vx = (positions[2] - positions[0]) / this.SPEED_RATE;
        let vy = (positions[3] - positions[1]) / this.SPEED_RATE;
        let dv = Math.sqrt(vx * vx + vy * vy);
        if (dv > this.MAX_VELOCITY) {
            return Cesium.Color.fromCssColorString(this.DEFAULT_COLOR_SCALE[this.DEFAULT_COLOR_SCALE.length - 1]).withAlpha(i / count * ageRate * this.BRIGHTEN);
        }
        if (dv < this.MIN_VELOCITY) {
            return Cesium.Color.fromCssColorString(this.DEFAULT_COLOR_SCALE[0]).withAlpha(i / count * ageRate * this.BRIGHTEN);
        }

        // 计算坐速度区间
        let dColor = (this.MAX_VELOCITY - this.MIN_VELOCITY) / this.DEFAULT_COLOR_SCALE.length
        return Cesium.Color.fromCssColorString(this.DEFAULT_COLOR_SCALE[Math.floor((dv - this.MIN_VELOCITY) / dColor)]).withAlpha(i / count * ageRate * this.BRIGHTEN);
    }

}


export default _windy
