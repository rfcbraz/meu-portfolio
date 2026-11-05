/*
 * Queijo 3D desenhado por raymarching num fragment shader.
 * Não usa modelos nem texturas: a forma é definida por funções de distância.
 */
(function () {
  'use strict';

  // Buracos: x, y, z, raio.
  var HOLES = [
    [0.10, 0.18, 0.60, 0.20], [0.55, -0.22, 0.74, 0.25], [-0.25, -0.25, 0.30, 0.16],
    [0.72, 0.30, 0.90, 0.16], [0.25, -0.34, 0.55, 0.12], [-0.45, 0.20, 0.25, 0.11],
    [0.05, -0.10, -0.52, 0.22], [0.55, 0.25, -0.75, 0.20], [-0.30, 0.28, -0.30, 0.14],
    [0.80, -0.30, -0.88, 0.18], [0.20, 0.62, 0.10, 0.22], [0.60, 0.62, -0.30, 0.16],
    [-0.25, 0.62, -0.05, 0.12], [0.70, 0.60, 0.35, 0.13]
  ];

  // Dentadas: x, y, z, raio, início e fim no progresso do scroll.
  var BITES = [
    [-0.98, 0.10, 0.05, 0.44, 0.00, 0.20], [-0.58, 0.28, 0.22, 0.40, 0.20, 0.40],
    [-0.42, -0.12, -0.26, 0.44, 0.40, 0.60], [-0.10, 0.18, 0.12, 0.44, 0.60, 0.80],
    [0.06, -0.16, -0.22, 0.42, 0.80, 1.00]
  ];

  function num(v) {
    var s = String(v);
    return s.indexOf('.') === -1 ? s + '.0' : s;
  }

  var holeCode = HOLES.map(function (h) {
    return 'd = smax(d, -(length(q - vec3(' + num(h[0]) + ',' + num(h[1]) + ',' + num(h[2]) + ')) - ' + num(h[3]) + '), 0.035);';
  }).join('\n    ');

  var biteCode = BITES.map(function (b) {
    return 'r = ' + num(b[3]) + ' * smoothstep(' + num(b[4]) + ', ' + num(b[5]) + ', uBite);' +
      ' if (r > 0.001) d = smax(d, -(length(q - vec3(' + num(b[0]) + ',' + num(b[1]) + ',' + num(b[2]) + ')) - r + teeth), 0.03);';
  }).join('\n    ');

  var VERT = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes; uniform mat3 uRot; uniform float uBite;',
    'float smax(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return max(a, b) + h * h * k * 0.25; }',
    'float base(vec3 q){',
    '  vec3 w = q + vec3(0.95, 0.0, 0.0);',
    '  float cyl = length(w.xz) - 1.95;',
    '  float cap = abs(w.y) - 0.62;',
    '  float side = max(dot(w.xz, vec2(-0.444, 0.896)), dot(w.xz, vec2(-0.444, -0.896)));',
    '  return smax(smax(cyl, cap, 0.06), side, 0.06);',
    '}',
    'float map(vec3 p){',
    '  vec3 q = uRot * p;',
    '  float d = base(q);',
    '  if (d > 0.25) return d;',
    '  ' + holeCode,
    '  float r; float teeth = 0.022 * sin(q.x * 17.0) * sin(q.y * 19.0) * sin(q.z * 15.0);',
    '  ' + biteCode,
    '  return d;',
    '}',
    'vec3 normalAt(vec3 p){',
    '  vec2 e = vec2(0.0018, -0.0018);',
    '  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));',
    '}',
    'float ao(vec3 p, vec3 n){',
    '  float o = 0.0, s = 1.0;',
    '  for (int i = 1; i <= 4; i++) { float h = 0.05 * float(i); o += (h - map(p + n * h)) * s; s *= 0.6; }',
    '  return clamp(1.0 - 2.4 * o, 0.0, 1.0);',
    '}',
    'vec3 shade(vec3 p, vec3 rd){',
    '  vec3 n = normalAt(p);',
    '  vec3 q = uRot * p;',
    '  vec3 w = q + vec3(0.95, 0.0, 0.0);',
    '  float rind = smoothstep(-0.075, -0.04, length(w.xz) - 1.95);',
    '  vec3 paste = mix(vec3(1.0, 0.72, 0.05), vec3(1.0, 0.82, 0.22), 0.5 + 0.5 * sin(q.x * 3.0 + q.z * 2.0));',
    '  vec3 alb = mix(paste, vec3(0.86, 0.36, 0.05), rind);',
    '  vec3 l = normalize(vec3(0.55, 0.85, 0.65));',
    '  float occ = ao(p, n);',
    '  float dif = clamp((dot(n, l) + 0.4) / 1.4, 0.0, 1.0);',
    '  vec3 col = alb * (0.34 + 0.95 * dif) * mix(0.42, 1.0, occ);',
    '  col += vec3(1.0, 0.45, 0.05) * (1.0 - occ) * 0.16;',
    '  float fre = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);',
    '  col += vec3(1.0, 0.92, 0.62) * fre * 0.26;',
    '  float spec = pow(clamp(dot(reflect(rd, n), l), 0.0, 1.0), 42.0);',
    '  col += vec3(1.0, 0.97, 0.82) * spec * 0.34 * occ;',
    '  return col;',
    '}',
    'void main(){',
    '  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);',
    '  vec3 ro = vec3(0.0, 0.0, 4.2);',
    '  vec3 rd = normalize(vec3(uv, -2.55));',
    '  float b = dot(ro, rd); float c = dot(ro, ro) - 2.4;',
    '  float h = b * b - c;',
    '  if (h < 0.0) { gl_FragColor = vec4(0.0); return; }',
    '  h = sqrt(h);',
    '  float t = max(-b - h, 0.0); float tMax = -b + h;',
    '  float best = 1e3, bestT = t; bool hit = false;',
    '  for (int i = 0; i < 72; i++) {',
    '    float d = map(ro + rd * t);',
    '    if (d < best) { best = d; bestT = t; }',
    '    if (d < 0.0012) { hit = true; break; }',
    '    t += d * 0.9;',
    '    if (t > tMax) break;',
    '  }',
    '  float px = 2.0 * bestT / (2.55 * min(uRes.x, uRes.y));',
    '  float alpha = hit ? 1.0 : 1.0 - smoothstep(0.0, px * 1.5, best);',
    '  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }',
    '  vec3 col = shade(ro + rd * (hit ? t : bestT), rd);',
    '  col = pow(col, vec3(0.92));',
    '  gl_FragColor = vec4(col * alpha, alpha);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader error');
    return s;
  }

  function rotation(x, y) {
    var cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y);
    // Coluna a coluna, como o GLSL espera.
    return new Float32Array([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy]);
  }

  /** Devolve o controlador do queijo, ou null se o WebGL não estiver disponível. */
  function create(canvas, options) {
    var opts = options || {};
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var program, u;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link error');
    } catch (err) {
      console.warn('Cheese shader unavailable:', err.message);
      return null;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    u = { res: gl.getUniformLocation(program, 'uRes'), rot: gl.getUniformLocation(program, 'uRot'), bite: gl.getUniformLocation(program, 'uBite') };

    var cssSize = 0;
    var maxScale = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 1.5);
    var scale = maxScale;
    var slowFrames = 0;
    var lastDraw = 0;
    var MIN_SCALE = 0.6;

    function applySize() {
      var px = Math.max(1, Math.round(cssSize * scale));
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px;
        canvas.height = px;
        gl.viewport(0, 0, px, px);
      }
    }

    return {
      resize: function (size) {
        cssSize = size;
        applySize();
      },
      draw: function (state) {
        // Baixa a resolução em computadores com GPU mais fraca, em vez de perder fluidez.
        var now = performance.now();
        if (opts.adaptive && lastDraw && now - lastDraw < 120) {
          if (now - lastDraw > 26) slowFrames++;
          else slowFrames = Math.max(0, slowFrames - 1);
          if (slowFrames > 24 && scale > MIN_SCALE) {
            scale = Math.max(MIN_SCALE, scale * 0.8);
            slowFrames = 0;
            applySize();
          }
        }
        lastDraw = now;
        gl.uniform2f(u.res, canvas.width, canvas.height);
        gl.uniformMatrix3fv(u.rot, false, rotation(state.rotX, state.rotY));
        gl.uniform1f(u.bite, state.bite);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  window.Cheese = { create: create };
})();
