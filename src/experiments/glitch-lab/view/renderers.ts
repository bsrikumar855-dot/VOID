import type { GlitchConfig } from "../config";
import { BLOCK_H, IMAGE_SIZE as N, WAVE_PERIOD } from "../limits";
import { renderReference, toParams } from "../core/pipeline";

/**
 * Two renderers behind one interface. `webgl2` runs the pipeline in a fragment shader;
 * `cpu` runs the reference implementation from core/pipeline.ts into a 2D canvas (used when
 * WebGL 2 is unavailable or its context is lost). Both are integer-only, so they draw the same
 * pixels; tests/e2e/glitch-lab.spec.ts asserts that byte for byte.
 */
export interface Renderer {
  readonly kind: "webgl2" | "cpu";
  setSource(rgba: Uint8ClampedArray): void;
  render(config: GlitchConfig): void;
  toBlob(): Promise<Blob | null>;
  destroy(): void;
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

export function createCpuRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  let source: Uint8ClampedArray | null = null;
  return {
    kind: "cpu",
    setSource(rgba) {
      source = rgba;
    },
    render(config) {
      if (!source) return;
      // ImageData's typed-array view is the renderer's output buffer: no copy, no conversion.
      const px = renderReference(source, config);
      ctx.putImageData(new ImageData(px as Uint8ClampedArray<ArrayBuffer>, N, N), 0, 0);
    },
    toBlob: () => toBlob(canvas),
    destroy() {
      source = null;
    },
  };
}

const VERTEX = `#version 300 es
void main() {
  // One oversized triangle covers the viewport; no vertex buffer needed.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// A port of core/pipeline.ts. Same operations, same order, integers only. Division is only
// ever applied to non-negative operands or through divT, because GLSL leaves the rounding of
// negative integer division unspecified.
const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform sampler2D u_src;
uniform int u_shiftPx;
uniform int u_blocks;
uniform int u_blockAmp;
uniform int u_wave;
uniform int u_levels;
uniform int u_noise;
uniform int u_scanFactor;
uniform int u_seed;
uniform int u_phase;
uniform int u_blockFrame;
out vec4 outColor;

const int N = ${N};
const int BLOCK_H = ${BLOCK_H};
const int WAVE_PERIOD = ${WAVE_PERIOD};

uint pcg(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
uint hash4(uint a, uint b, uint c, uint d) {
  return pcg(a + pcg(b + pcg(c + pcg(d))));
}
int divT(int a, int b) {
  return a < 0 ? -((-a) / b) : a / b;
}

void main() {
  int x = int(gl_FragCoord.x);
  int y = N - 1 - int(gl_FragCoord.y);

  int offB = 0;
  uint hb = hash4(uint(y / BLOCK_H), uint(u_seed), uint(u_blockFrame), 1u);
  if (int(hb & 255u) * 100 < u_blocks * 128) {
    int mag = int((hb >> 8) & 255u);
    offB = divT((mag - 128) * u_blockAmp, 128);
  }
  int tri = abs(((y + u_phase * 2) % WAVE_PERIOD) - WAVE_PERIOD / 2);
  int offW = divT((tri - WAVE_PERIOD / 4) * u_wave * 3, 200);
  int base = x + offB + offW;

  ivec3 col = ivec3(0);
  for (int c = 0; c < 3; c++) {
    int sx = clamp(base + (c - 1) * u_shiftPx, 0, N - 1);
    col[c] = int(texelFetch(u_src, ivec2(sx, y), 0)[c] * 255.0 + 0.5);
  }
  if (u_levels >= 2) {
    int l1 = u_levels - 1;
    ivec3 q = (col * (l1 * 2) + 255) / 510;
    col = (q * 510 + l1) / (2 * l1);
  }
  if (u_noise > 0) {
    int n = int(hash4(uint(x), uint(y), uint(u_seed), uint(u_phase) + 7u) & 255u) - 128;
    col = clamp(col + ivec3(divT(n * u_noise, 100)), 0, 255);
  }
  if ((y & 1) == 1) {
    col = (col * u_scanFactor) / 100;
  }
  outColor = vec4(vec3(col) / 255.0, 1.0);
}`;

/**
 * Start compiling a shader. The status is deliberately NOT read here: querying it forces the
 * driver to finish compiling on the main thread. A failed shader shows up as a failed link.
 */
function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

const POLL_MS = 8;
const COMPILE_TIMEOUT_MS = 5000;

/**
 * null when WebGL 2 or the shader is unavailable (the caller then uses the CPU renderer).
 * Asynchronous so that linking the shader does not block the main thread: with
 * KHR_parallel_shader_compile the driver links on another thread and we poll for completion.
 */
export async function createGlRenderer(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<Renderer | null> {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    // The export reads the canvas after it was drawn; without this the buffer may be cleared.
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const release = () => gl.getExtension("WEBGL_lose_context")?.loseContext();
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    release();
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  const parallel = gl.getExtension("KHR_parallel_shader_compile") as {
    COMPLETION_STATUS_KHR: number;
  } | null;
  if (parallel) {
    const started = performance.now();
    while (!gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
      if (signal.aborted || performance.now() - started > COMPILE_TIMEOUT_MS) {
        release();
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  }
  if (signal.aborted || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    release();
    return null;
  }
  gl.useProgram(program);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // texelFetch ignores filtering, but an incomplete texture would read as black.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.uniform1i(gl.getUniformLocation(program, "u_src"), 0);
  gl.viewport(0, 0, N, N);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    shiftPx: u("u_shiftPx"),
    blocks: u("u_blocks"),
    blockAmp: u("u_blockAmp"),
    wave: u("u_wave"),
    levels: u("u_levels"),
    noise: u("u_noise"),
    scanFactor: u("u_scanFactor"),
    seed: u("u_seed"),
    phase: u("u_phase"),
    blockFrame: u("u_blockFrame"),
  };
  let hasSource = false;

  return {
    kind: "webgl2",
    setSource(rgba) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      hasSource = true;
    },
    render(config) {
      if (!hasSource || gl.isContextLost()) return;
      const p = toParams(config);
      gl.uniform1i(loc.shiftPx, p.shiftPx);
      gl.uniform1i(loc.blocks, p.blocks);
      gl.uniform1i(loc.blockAmp, p.blockAmp);
      gl.uniform1i(loc.wave, p.wave);
      gl.uniform1i(loc.levels, p.levels);
      gl.uniform1i(loc.noise, p.noise);
      gl.uniform1i(loc.scanFactor, p.scanFactor);
      gl.uniform1i(loc.seed, p.seed);
      gl.uniform1i(loc.phase, p.phase);
      gl.uniform1i(loc.blockFrame, p.blockFrame);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    toBlob: () => toBlob(canvas),
    destroy() {
      if (gl.isContextLost()) return;
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Release the GPU context now rather than waiting for garbage collection.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
