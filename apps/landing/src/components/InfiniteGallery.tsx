import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageLightbox from '@/components/ImageLightbox';
import { SALON_GALLERY } from '@/config/content';
import styles from '@/styles/InfiniteGallery.module.css';

type Language = 'pl' | 'en' | 'de';
interface Props {
    locale: string;
    bookingLabel: string;
    onBook: () => void;
}

const FRAMES = [0, 2, 5, 1, 7, 3] as const;
const PHOTOS = FRAMES.map((index) => SALON_GALLERY[index]);

const COPY = {
    pl: {
        label: '07 / INFINITE GALLERY',
        title: 'Wejdź w',
        emphasis: 'nasz świat.',
        lead: 'Zmieniaj perspektywę. Odkrywaj prawdziwe kadry z Black & White.',
        left: 'Poprzednie zdjęcie',
        right: 'Następne zdjęcie',
        open: 'Powiększ fotografię',
        fallback: 'Galeria zdjęć',
        note: 'Kadry z wnętrza salonu. Realizacje fryzjerskie znajdziesz w galerii.',
        gallery: 'Zobacz nasze realizacje',
        services: 'Usługi i ceny',
        instruction: 'Przesuń palcem lub użyj strzałek',
    },
    en: {
        label: '07 / INFINITE GALLERY',
        title: 'Step into',
        emphasis: 'our world.',
        lead: 'Change your perspective. Explore real moments from Black & White.',
        left: 'Previous image',
        right: 'Next image',
        open: 'Expand photograph',
        fallback: 'Photo gallery',
        note: 'These images show our salon interior. Hair results live in the gallery.',
        gallery: 'Explore our work',
        services: 'Services and prices',
        instruction: 'Swipe or use the arrows',
    },
    de: {
        label: '07 / INFINITE GALLERY',
        title: 'Entdecke',
        emphasis: 'unsere Welt.',
        lead: 'Neue Perspektiven und echte Eindrücke aus Black & White.',
        left: 'Vorheriges Foto',
        right: 'Nächstes Foto',
        open: 'Foto vergrößern',
        fallback: 'Fotogalerie',
        note: 'Bilder unseres Salons. Frisuren findest du in der Galerie.',
        gallery: 'Unsere Arbeiten entdecken',
        services: 'Leistungen und Preise',
        instruction: 'Wische oder nutze die Pfeile',
    },
} as const;

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_uv;
uniform float u_delta;
uniform float u_aspect;
uniform float u_portrait;
out vec2 v_uv;
out float v_fade;
void main() {
    float distance = abs(u_delta);
    float scale = 1.0 / (1.0 + distance * 0.24);
    float centerX = u_delta * (u_portrait > 0.5 ? 1.12 : 1.60);
    float centerY = sin(u_delta * 0.8) * 0.20;
    float width = (u_portrait > 0.5 ? 1.1 : 1.18) * scale;
    float height = (u_portrait > 0.5 ? 1.30 : 1.48) * scale;
    float x = (centerX + a_position.x * width) / u_aspect;
    float y = centerY + a_position.y * height;
    gl_Position = vec4(x, y, min(0.96, distance * 0.09), 1.0);
    v_uv = a_uv;
    v_fade = 1.0 - min(0.65, distance * 0.16);
}
`;
const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec2 v_uv;
in float v_fade;
uniform sampler2D u_texture;
out vec4 outColor;
void main() {
    vec4 photo = texture(u_texture, v_uv);
    vec3 color = mix(photo.rgb, vec3(0.07, 0.07, 0.075), (1.0 - v_fade) * 0.8);
    outColor = vec4(color, 1.0);
}
`;

/** A compact GPU photo-plane stage. No third-party CDN, shaders or tracking. */
function compileShader(
    gl: WebGL2RenderingContext, type: number, source: string,
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('WebGL shader allocation failed');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const reason = gl.getShaderInfoLog(shader) ?? 'WebGL shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(reason);
    }
    return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        throw new Error('WebGL program allocation failed');
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const reason = gl.getProgramInfoLog(program) ?? 'WebGL program linking failed';
        gl.deleteProgram(program);
        throw new Error(reason);
    }
    return program;
}

function usePhotoPlanes(canvasRef: React.RefObject<HTMLCanvasElement>, target: number) {
    const [webglReady, setWebglReady] = useState(false);
    const targetRef = useRef(target);
    const drawRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        targetRef.current = target;
        drawRef.current?.();
    }, [target]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let visible = true;
        let disposed = false;
        let raf = 0;
        let gl: WebGL2RenderingContext | null = null;
        let program: WebGLProgram | null = null;
        let buffer: WebGLBuffer | null = null;
        const textures: Array<WebGLTexture | null> = Array(PHOTOS.length).fill(null);
        const imageLoaders: HTMLImageElement[] = [];
        let position = targetRef.current;

        const fallback = () => { if (!disposed) setWebglReady(false); };
        try {
            gl = canvas.getContext('webgl2', {
                alpha: false,
                antialias: true,
                powerPreference: 'low-power',
                preserveDrawingBuffer: false,
            });
            if (!gl) return;
            const context = gl;
            program = createProgram(context);
            const linkedProgram = program;
            buffer = context.createBuffer();
            if (!buffer) throw new Error('WebGL buffer allocation failed');

            context.bindBuffer(context.ARRAY_BUFFER, buffer);
            // X/Y and U/V; each card is a GPU plane with an actual photo texture.
            context.bufferData(context.ARRAY_BUFFER, new Float32Array([
                -1, -1, 0, 0,  1, -1, 1, 0,
                -1,  1, 0, 1,  1,  1, 1, 1,
            ]), context.STATIC_DRAW);
            context.useProgram(linkedProgram);
            const xy = context.getAttribLocation(linkedProgram, 'a_position');
            const uv = context.getAttribLocation(linkedProgram, 'a_uv');
            context.enableVertexAttribArray(xy);
            context.vertexAttribPointer(xy, 2, context.FLOAT, false, 16, 0);
            context.enableVertexAttribArray(uv);
            context.vertexAttribPointer(uv, 2, context.FLOAT, false, 16, 8);
            const delta = context.getUniformLocation(linkedProgram, 'u_delta');
            const aspect = context.getUniformLocation(linkedProgram, 'u_aspect');
            const portrait = context.getUniformLocation(linkedProgram, 'u_portrait');
            context.uniform1i(context.getUniformLocation(linkedProgram, 'u_texture'), 0);
            context.enable(context.DEPTH_TEST);
            context.depthFunc(context.LEQUAL);

            const render = () => {
                raf = 0;
                if (disposed || !visible || document.hidden) return;
                const bounds = canvas.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
                const width = Math.max(1, Math.floor(bounds.width * pixelRatio));
                const height = Math.max(1, Math.floor(bounds.height * pixelRatio));
                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                }
                context.viewport(0, 0, width, height);
                context.clearColor(0.04, 0.04, 0.047, 1);
                context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
                const goal = targetRef.current;
                const difference = goal - position;
                position = Math.abs(difference) < 0.006 ? goal : position + difference * 0.14;
                context.uniform1f(aspect, width / height);
                context.uniform1f(portrait, width < height ? 1 : 0);
                // Draw back to front for reliable depth across platforms.
                const order = PHOTOS.map((_, i) => i)
                    .sort((a, b) => Math.abs(b - position) - Math.abs(a - position));
                for (const i of order) {
                    const texture = textures[i];
                    if (!texture) continue;
                    context.activeTexture(context.TEXTURE0);
                    context.bindTexture(context.TEXTURE_2D, texture);
                    context.uniform1f(delta, i - position);
                    context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
                }
                if (Math.abs(goal - position) >= 0.006) schedule();
            };
            const schedule = () => {
                if (!disposed && visible && !document.hidden && !raf) {
                    raf = window.requestAnimationFrame(render);
                }
            };
            drawRef.current = schedule;

            // Bound texture dimensions to avoid decoding full-resolution images
            // directly into several large GPU textures on a phone.
            PHOTOS.forEach((photo, index) => {
                const image = new window.Image();
                imageLoaders.push(image);
                image.onload = () => {
                    if (disposed) return;
                    const maxSize = 1024;
                    const factor = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
                    const staging = document.createElement('canvas');
                    staging.width = Math.max(1, Math.floor(image.naturalWidth * factor));
                    staging.height = Math.max(1, Math.floor(image.naturalHeight * factor));
                    const ctx = staging.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(image, 0, 0, staging.width, staging.height);
                    const texture = context.createTexture();
                    if (!texture) return;
                    context.bindTexture(context.TEXTURE_2D, texture);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
                    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1);
                    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA,
                        context.RGBA, context.UNSIGNED_BYTE, staging);
                    textures[index] = texture;
                    setWebglReady(true);
                    schedule();
                };
                image.onerror = () => { /* Individual missing photos are skipped. */ };
                image.src = photo.image;
            });
            const observer = new IntersectionObserver((entries) => {
                visible = entries[0]?.isIntersecting ?? false;
                if (visible) schedule();
                else if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
            }, { threshold: 0 });
            observer.observe(canvas);
            const resize = new ResizeObserver(schedule);
            resize.observe(canvas);
            const onVisibility = () => { if (!document.hidden) schedule(); };
            const onLost = (event: Event) => { event.preventDefault(); fallback(); };
            const onRestore = () => { fallback(); };
            canvas.addEventListener('webglcontextlost', onLost);
            canvas.addEventListener('webglcontextrestored', onRestore);
            schedule();

            return () => {
                disposed = true;
                drawRef.current = null;
                observer.disconnect();
                resize.disconnect();
                document.removeEventListener('visibilitychange', onVisibility);
                canvas.removeEventListener('webglcontextlost', onLost);
                canvas.removeEventListener('webglcontextrestored', onRestore);
                if (raf) window.cancelAnimationFrame(raf);
                imageLoaders.forEach((image) => { image.onload = null; image.onerror = null; image.src = ''; });
                textures.forEach((texture) => { if (texture) context.deleteTexture(texture); });
                if (buffer) context.deleteBuffer(buffer);
                context.deleteProgram(linkedProgram);
            };
        } catch {
            fallback();
            if (buffer && gl) gl.deleteBuffer(buffer);
            if (program && gl) gl.deleteProgram(program);
        }
    }, [canvasRef]);

    return webglReady;
}

export default function InfiniteGallery({ locale, bookingLabel, onBook }: Props) {
    const lang: Language = locale === 'en' || locale === 'de' ? locale : 'pl';
    const copy = COPY[lang];
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startRef = useRef<{ x: number; y: number } | null>(null);
    const webglReady = usePhotoPlanes(canvasRef, active);
    const photo = PHOTOS[active];

    const move = (delta: number) => setActive((i) =>
        Math.min(PHOTOS.length - 1, Math.max(0, i + delta)));

    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = startRef.current;
        startRef.current = null;
        if (!start || event.pointerType !== 'touch') return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            move(dx < 0 ? 1 : -1);
        }
    };

    return (
        <div className={styles.experience} data-cy="design-infinite">
            <header className={styles.intro}>
                <p>{copy.label} / BLACK & WHITE</p>
                <h1>{copy.title}<em>{copy.emphasis}</em></h1>
                <div className={styles.introBottom}>
                    <p>{copy.lead}</p>
                    <button type="button" onClick={onBook} className={styles.booking}>{bookingLabel} ↗</button>
                </div>
            </header>
            <section className={styles.gallerySection} aria-label={copy.fallback}>
                <div
                    className={styles.viewport}
                    tabIndex={0}
                    role="group"
                    aria-label={copy.instruction}
                    data-cy="infinite-viewport"
                    onPointerDown={(event) => {
                        if (event.pointerType === 'touch') startRef.current = { x: event.clientX, y: event.clientY };
                    }}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { startRef.current = null; }}
                    onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            move(event.key === 'ArrowRight' ? 1 : -1);
                        }
                    }}
                >
                    <div className={styles.staticBackground}>
                        <Image src={photo.image} alt={photo.alt} fill sizes="100vw"
                            className={styles.staticPhoto} priority />
                    </div>
                    <canvas ref={canvasRef} className={styles.canvas}
                        aria-hidden="true" data-cy="infinite-webgl-canvas"
                        data-ready={webglReady ? 'true' : 'false'}/>
                    <div className={styles.photoIndex} aria-live="polite" aria-atomic="true">
                        {String(active + 1).padStart(2, '0')} <span>/ {String(PHOTOS.length).padStart(2, '0')}</span>
                    </div>
                    <span className={styles.interactionHint}>{copy.instruction}</span>
                </div>
                <div className={styles.controls}>
                    <button type="button" onClick={() => move(-1)} disabled={active === 0}
                        aria-label={copy.left} data-cy="infinite-prev">←</button>
                    <div className={styles.caption} aria-live="polite">
                        <strong>{photo.caption}</strong>
                        <span>{copy.note}</span>
                    </div>
                    <button type="button" onClick={() => move(1)}
                        disabled={active === PHOTOS.length - 1}
                        aria-label={copy.right} data-cy="infinite-next">→</button>
                </div>
                <div className={styles.actions}>
                    <button type="button" onClick={() => setLightbox(true)}
                        data-cy="infinite-lightbox">{copy.open} ↗</button>
                    <Link href="/gallery">{copy.gallery} ↗</Link>
                    <Link href="/services">{copy.services} ↗</Link>
                </div>
            </section>
            {lightbox && (
                <ImageLightbox
                    sources={PHOTOS.map((item) => item.image)}
                    index={active}
                    alt={photo.alt}
                    onClose={() => setLightbox(false)}
                    onPrev={() => move(-1)}
                    onNext={() => move(1)}
                />
            )}
        </div>
    );
}
