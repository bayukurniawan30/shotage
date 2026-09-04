import React, { useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';

export interface FlowBackgroundProps {
  colors?: string[];
  speed?: number; // 0 to 100, 0 = paused
  distortion?: number; // 0 to 100
  swirl?: number; // 0 to 100
  scale?: number; // 0 to 100
  timeSec?: number; // deterministic timeline / export time in seconds
  isExporting?: boolean;
  isMini?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FLOW_BASE_TIME = 20.75;

export const computeFlowTime = (seconds: number, speed: number) => {
  return FLOW_BASE_TIME + seconds * (speed / 30) * 0.75;
};

export const hexToOklab = (hex: string): [number, number, number] => {
  const cleanHex = (hex || '#1E50A2').replace('#', '');
  const normalized =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex.padEnd(6, '0').slice(0, 6);

  const num = parseInt(normalized, 16) || 0;
  const r8 = (num >> 16) & 255;
  const g8 = (num >> 8) & 255;
  const b8 = num & 255;

  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
precision mediump int;

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_numColors;
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_color5;
uniform float u_scale;
uniform float u_distortion;
uniform float u_swirl;

float fract1(float x) {
  return x - floor(x);
}

float smoothstep01(float x) {
  float t = clamp(x, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

vec2 getLissajous(float idx, float t) {
  float n = idx * 0.37;
  float o = 0.6 + fract1(idx * 0.333333) * 0.9;
  float i = 0.8 + fract1((idx + 1.0) * 0.25);
  return vec2(
    0.5 + 0.5 * sin(t * o + n),
    0.5 + 0.5 * cos(t * i + n * 1.5)
  );
}

float cube(float v) {
  return v * v * v;
}

vec3 oklabToSrgb(vec3 c) {
  float l_ = cube(c.x + 0.3963377774 * c.y + 0.2158037573 * c.z);
  float m_ = cube(c.x - 0.1055613458 * c.y - 0.0638541728 * c.z);
  float s_ = cube(c.x - 0.0894841775 * c.y - 1.2914855480 * c.z);

  float r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  float g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  float b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  vec3 rgb = vec3(r, g, b);
  vec3 higher = 1.055 * pow(max(rgb, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
  vec3 lower = rgb * 12.92;
  vec3 cutoff = step(vec3(0.0031308), rgb);
  return clamp(mix(lower, higher, cutoff), 0.0, 1.0);
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st.y = 1.0 - st.y;

  float g = 0.4 + (u_scale / 100.0) * 1.2;
  float f = u_distortion / 100.0;
  float u = u_swirl / 100.0;

  vec2 pos = (st - 0.5) / g + 0.5;
  float dCenter = smoothstep01(length(pos - 0.5));
  float invDist = 1.0 - dCenter;

  // 2 octaves of sine wave distortion (unrolled for universal GPU compatibility)
  pos.x += (f * invDist) * sin(u_time + 0.4 * smoothstep01(pos.y)) * cos(0.2 * u_time + 2.4 * smoothstep01(pos.y));
  pos.y += (f * invDist) * cos(u_time + 2.0 * smoothstep01(pos.x));

  pos.x += (f * invDist * 0.5) * sin(u_time + 0.8 * smoothstep01(pos.y)) * cos(0.2 * u_time + 4.8 * smoothstep01(pos.y));
  pos.y += (f * invDist * 0.5) * cos(u_time + 4.0 * smoothstep01(pos.x));

  // vortex swirl
  float swirlAngle = 3.0 * u * dCenter;
  float cosS = cos(-swirlAngle);
  float sinS = sin(-swirlAngle);
  vec2 delta = pos - 0.5;
  pos = vec2(cosS * delta.x - sinS * delta.y, sinS * delta.x + cosS * delta.y) + 0.5;

  vec3 sumLab = vec3(0.0);
  float sumW = 0.0;

  if (u_numColors > 0) {
    vec2 anchor0 = getLissajous(0.0, u_time);
    vec2 d0 = pos - anchor0;
    float d2_0 = dot(d0, d0);
    float w0 = 1.0 / (pow(d2_0, 1.75) + 0.0001);
    sumLab += u_color0 * w0;
    sumW += w0;
  }
  if (u_numColors > 1) {
    vec2 anchor1 = getLissajous(1.0, u_time);
    vec2 d1 = pos - anchor1;
    float d2_1 = dot(d1, d1);
    float w1 = 1.0 / (pow(d2_1, 1.75) + 0.0001);
    sumLab += u_color1 * w1;
    sumW += w1;
  }
  if (u_numColors > 2) {
    vec2 anchor2 = getLissajous(2.0, u_time);
    vec2 d2 = pos - anchor2;
    float d2_2 = dot(d2, d2);
    float w2 = 1.0 / (pow(d2_2, 1.75) + 0.0001);
    sumLab += u_color2 * w2;
    sumW += w2;
  }
  if (u_numColors > 3) {
    vec2 anchor3 = getLissajous(3.0, u_time);
    vec2 d3 = pos - anchor3;
    float d2_3 = dot(d3, d3);
    float w3 = 1.0 / (pow(d2_3, 1.75) + 0.0001);
    sumLab += u_color3 * w3;
    sumW += w3;
  }
  if (u_numColors > 4) {
    vec2 anchor4 = getLissajous(4.0, u_time);
    vec2 d4 = pos - anchor4;
    float d2_4 = dot(d4, d4);
    float w4 = 1.0 / (pow(d2_4, 1.75) + 0.0001);
    sumLab += u_color4 * w4;
    sumW += w4;
  }
  if (u_numColors > 5) {
    vec2 anchor5 = getLissajous(5.0, u_time);
    vec2 d5 = pos - anchor5;
    float d2_5 = dot(d5, d5);
    float w5 = 1.0 / (pow(d2_5, 1.75) + 0.0001);
    sumLab += u_color5 * w5;
    sumW += w5;
  }

  vec3 finalLab = sumLab / max(0.0001, sumW);
  vec3 finalRgb = oklabToSrgb(finalLab);

  gl_FragColor = vec4(finalRgb, 1.0);
}
`;

export const FlowBackground: React.FC<FlowBackgroundProps> = ({
  colors = ['#EAF4FC', '#1E50A2', '#F09199', '#895B8A'],
  speed = 30,
  distortion = 60,
  swirl = 15,
  scale = 50,
  timeSec,
  isExporting = false,
  isMini = false,
  className = '',
  style,
}) => {
  const c = colors && colors.length >= 4 ? colors : ['#EAF4FC', '#1E50A2', '#F09199', '#895B8A'];
  const fallbackCss = `
    radial-gradient(at 15% 20%, ${c[0]}ee 0px, transparent 55%),
    radial-gradient(at 85% 15%, ${c[1]}ee 0px, transparent 50%),
    radial-gradient(at 20% 85%, ${c[2]}ee 0px, transparent 55%),
    radial-gradient(at 85% 85%, ${c[3]}ee 0px, transparent 55%),
    radial-gradient(at 50% 50%, ${c[0]}88 0px, transparent 65%),
    linear-gradient(135deg, ${c[1]}, ${c[3]})
  `;

  // Mini preview buttons use pure CSS radial gradient to conserve WebGL contexts
  if (isMini) {
    return (
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
        style={{
          backgroundColor: c[1],
          backgroundImage: fallbackCss,
          ...style,
        }}
      />
    );
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeRef = useRef<number>(20.75);
  const lastTimestampRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const renderFuncRef = useRef<((time: number) => void) | null>(null);

  // Keep props in refs for animation loop access without restarting WebGL
  const propsRef = useRef({ colors, speed, distortion, swirl, scale, timeSec, isExporting });
  propsRef.current = { colors, speed, distortion, swirl, scale, timeSec, isExporting };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try WebGL2 then WebGL
    const gl = (canvas.getContext('webgl2', {
      preserveDrawingBuffer: true,
      alpha: false,
      antialias: false,
    }) ||
      canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        alpha: false,
        antialias: false,
      }) ||
      canvas.getContext('experimental-webgl', {
        preserveDrawingBuffer: true,
        alpha: false,
        antialias: false,
      })) as WebGLRenderingContext | null;

    if (!gl) {
      console.warn('WebGL not available for FlowBackground');
      return;
    }

    // Compile shaders
    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Flow shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) {
      console.error('Could not compile Flow shaders');
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Flow program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen quad geometry
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uNumColorsLoc = gl.getUniformLocation(program, 'u_numColors');
    const uScaleLoc = gl.getUniformLocation(program, 'u_scale');
    const uDistortionLoc = gl.getUniformLocation(program, 'u_distortion');
    const uSwirlLoc = gl.getUniformLocation(program, 'u_swirl');

    const uColorLocs = [
      gl.getUniformLocation(program, 'u_color0'),
      gl.getUniformLocation(program, 'u_color1'),
      gl.getUniformLocation(program, 'u_color2'),
      gl.getUniformLocation(program, 'u_color3'),
      gl.getUniformLocation(program, 'u_color4'),
      gl.getUniformLocation(program, 'u_color5'),
    ];

    const render = (time: number) => {
      if (!gl || !canvas) return;

      const currentProps = propsRef.current;
      const numColors = Math.min(6, Math.max(1, currentProps.colors.length));

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, time);
      gl.uniform1i(uNumColorsLoc, numColors);
      gl.uniform1f(uScaleLoc, currentProps.scale);
      gl.uniform1f(uDistortionLoc, currentProps.distortion);
      gl.uniform1f(uSwirlLoc, currentProps.swirl);

      for (let i = 0; i < 6; i++) {
        const loc = uColorLocs[i];
        if (loc) {
          if (i < numColors) {
            const lab = hexToOklab(currentProps.colors[i]);
            gl.uniform3f(loc, lab[0], lab[1], lab[2]);
          } else {
            gl.uniform3f(loc, 0, 0, 0);
          }
        }
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    renderFuncRef.current = render;

    // Size canvas appropriately
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(20, Math.round((rect.width || 400) * dpr));
      const h = Math.max(20, Math.round((rect.height || 300) * dpr));

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      render(timeRef.current);
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(canvas);
    }

    // Direct synchronous store subscriber for frame-perfect video export rendering
    const unsubscribeStore = useStudioStore.subscribe((state) => {
      if (state.isExporting && state.exportTimeSec != null && renderFuncRef.current) {
        const t = computeFlowTime(state.exportTimeSec, state.flowSpeed ?? 30);
        timeRef.current = t;
        renderFuncRef.current(t);
      }
    });

    // Animation Loop for live canvas playback
    let running = true;
    const loop = (timestamp: number) => {
      if (!running) return;

      const currentProps = propsRef.current;
      const isControlled = currentProps.isExporting || currentProps.timeSec !== undefined;

      if (!isControlled && currentProps.speed > 0) {
        if (lastTimestampRef.current > 0) {
          const delta = (timestamp - lastTimestampRef.current) / 1000;
          timeRef.current += (currentProps.speed / 30) * delta * 0.75;
          render(timeRef.current);
        } else {
          render(timeRef.current);
        }
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        lastTimestampRef.current = 0;
      }
    };

    const isControlled = isExporting || timeSec !== undefined;
    if (!isControlled && speed > 0) {
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      const initialT = isControlled
        ? computeFlowTime(timeSec ?? 0, speed)
        : timeRef.current;
      timeRef.current = initialT;
      render(initialT);
    }

    return () => {
      running = false;
      renderFuncRef.current = null;
      unsubscribeStore();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(posBuffer);
    };
  }, []);

  // Whenever props update, re-render immediately and manage animation loop state
  useEffect(() => {
    const isControlled = isExporting || timeSec !== undefined;

    if (renderFuncRef.current) {
      if (isControlled) {
        const targetT = computeFlowTime(timeSec ?? 0, speed);
        timeRef.current = targetT;
        renderFuncRef.current(targetT);
      } else {
        renderFuncRef.current(timeRef.current);
      }
    }

    if (speed <= 0 || isControlled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    } else if (!animationFrameRef.current && renderFuncRef.current) {
      let running = true;
      lastTimestampRef.current = 0;
      const loop = (timestamp: number) => {
        if (!running) return;
        const currentProps = propsRef.current;
        const controlledNow = currentProps.isExporting || currentProps.timeSec !== undefined;

        if (!controlledNow && currentProps.speed > 0) {
          if (lastTimestampRef.current > 0) {
            const delta = (timestamp - lastTimestampRef.current) / 1000;
            timeRef.current += (currentProps.speed / 30) * delta * 0.75;
            if (renderFuncRef.current) {
              renderFuncRef.current(timeRef.current);
            }
          }
          lastTimestampRef.current = timestamp;
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };
      animationFrameRef.current = requestAnimationFrame(loop);
      return () => {
        running = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [colors, speed, distortion, swirl, scale, timeSec, isExporting]);

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
      style={{
        backgroundColor: c[1],
        backgroundImage: fallbackCss,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};
