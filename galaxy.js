import * as THREE from "three";

// ======================================================
// ESCENA
// ======================================================
let scene;
let camera;
let renderer;
let galaxyGroup;
let capaDifusaGroup;
let starField;
let dustField;
let coreSprite;
let star;
let starGlow;
let starHalo;

let starSystem;
let universeGroup;
let cardNodes = [];
let raycaster;
let mouse = new THREE.Vector2();
const reloj =
    new THREE.Clock();

let hintHidden = false;

// --- Rotación libre tipo "trackball
let isDragging = false;
let lastX = 0;
let lastY = 0;
let pointerDownX = 0;
let pointerDownY = 0;
let pointerDownTime = 0;
let angularVelocity = { x: 0, y: 0 };
let dragDX = 0;
let dragDY = 0;
const ROT_SENSITIVITY = 0.0019;
const DAMPING = 0.90;

// --- Zoom de la camaraaa
let camDir = new THREE.Vector3(0, 1.2, 9.5).normalize();
let camDistance =
    new THREE.Vector3(
        0,
        1.2,
        9.5
    ).length();
let targetCamDistance =
    camDistance;

const MIN_DISTANCE = 3.2;
const MAX_DISTANCE = 35;

// Pellizcar con dos dedos (zoom táctil)
let distanciaPellizcoAnterior = null;

// ======================================================
// CONFIGURACIÓN
// ======================================================

const STAR_Y = 1.00;
// Objetos reutilizables 
const _camUp = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _qYaw = new THREE.Quaternion();
const _qPitch = new THREE.Quaternion();
const _camTarget = new THREE.Vector3(0, STAR_Y, 0);

// ======================================================
// TEXTURA CIRCULAR 
// ======================================================
function crearTexturaParticula() {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = 64;
    canvas.height = 64;

    const ctx =
        canvas.getContext(
            "2d"
        );

    const grad =
        ctx.createRadialGradient(
            32,
            32,
            0,
            32,
            32,
            32
        );

    grad.addColorStop(
        0,
        "rgba(255,255,255,1)"
    );

    grad.addColorStop(
        0.4,
        "rgba(255,255,255,0.85)"
    );

    grad.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );

    ctx.fillStyle = grad;

    ctx.fillRect(
        0,
        0,
        64,
        64
    );

    return new THREE.CanvasTexture(
        canvas
    );

}
const texturaParticula =
    crearTexturaParticula();

// ======================================================
// INICIO
// ======================================================
function init() {

    scene =
        new THREE.Scene();
    scene.background =
        new THREE.Color(0x000000);

    // ==========================================
    // CÁMARA
    // ==========================================

    camera =
        new THREE.PerspectiveCamera(
            55,
            window.innerWidth /
            window.innerHeight,
            0.1,
            300
        );
        updateCameraPosition();

    // ==========================================
    // RENDERER
    // ==========================================

    renderer =
        new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            powerPreference: "high-performance"
        });

    const esTactil =
        window.matchMedia(
            "(pointer: coarse)"
        ).matches;
    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            esTactil ? 2 : 1.2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setClearColor(
        0x000000,
        1
    );

    document.body.appendChild(
        renderer.domElement
    );

    // ==========================================
    // ROTACIÓN LIBRE, solo entorno a la galaxia !
    universeGroup =
        new THREE.Group();
    scene.add(
        universeGroup
    );

    // ==========================================
    // LUCES (necesito mas)
    // ==========================================

    const luzAmbiental =
        new THREE.AmbientLight(
            0xffffff,
            0.20
        );

    scene.add(
        luzAmbiental
    );

    const luzCentral =
        new THREE.PointLight(
            0xffd7d2,
            2.8,
            35,
            2
        );

    luzCentral.position.set(
        0,
        STAR_Y,
        0
    );

    // Objeto independiente: no gira con la galaxia,
    // igual que el fondo de estrellas.
    scene.add(
        luzCentral
    );

    raycaster =
        new THREE.Raycaster();

    // ==========================================
    // CONSTRUIR UNIVERSO
    // ==========================================
    buildBackgroundStars();
    buildGalaxy(90000);
    buildCoreGlow();
    buildCentralStar();
    buildCards();

    // ==========================================
    // EVENTOS
    // ==========================================
    window.addEventListener(
        "resize",
        onResize
    );
    renderer.domElement.addEventListener(
        "pointerdown",
        onPointerDown
    );
    window.addEventListener(
        "pointermove",
        onPointerMove
    );
    window.addEventListener(
        "pointerup",
        onPointerUp
    );
    renderer.domElement.addEventListener(
        "wheel",
        onWheel,
        { passive: false }
    );
    renderer.domElement.addEventListener(
        "touchstart",
        onTouchStart,
        { passive: false }
    );
    renderer.domElement.addEventListener(
        "touchmove",
        onTouchMove,
        { passive: false }
    );
    renderer.domElement.addEventListener(
        "touchend",
        onTouchEnd
    );
    const botonCerrar =
        document.getElementById(
            "cerrarTarjeta"
        );
    if (botonCerrar) {
        botonCerrar.addEventListener(
            "click",
            cerrarTarjeta
        );
    }
    animate();
}

// ======================================================
// ESTRELLAS DEL FONDO
// ======================================================

function buildBackgroundStars() {
    const count = 6000;
    const geometry =
        new THREE.BufferGeometry();
    const positions =
        new Float32Array(
            count * 3
        );
    const colors =
        new Float32Array(
            count * 3
        );
    const sizes =
        new Float32Array(
            count
        );
    const white =
        new THREE.Color(
            0xfff2e6
        );
    const warm =
        new THREE.Color(
            0xffdca0
        );
    const redAccent =
        new THREE.Color(
            0xff5a3c
        );

    for (
        let i = 0;
        i < count;
        i++
    ) {
        const r =
            40 +
            Math.random() * 70;
        const u =
            Math.random();
        const v =
            Math.random();
        const theta =
            u * Math.PI * 2;
        const phi =
            Math.acos(
                2 * v - 1
            );
        positions[i * 3] =
            r *
            Math.sin(phi) *
            Math.cos(theta);
        positions[i * 3 + 1] =
            r *
            Math.cos(phi);

        positions[i * 3 + 2] =
            r *
            Math.sin(phi) *
            Math.sin(theta);

        let color;
        const roll =
            Math.random();

        if (roll < 0.04) {
            color =
                redAccent;
        } else if (roll < 0.18) {

            color =
                warm;
        } else {

            color =
                white;

        }


        colors[i * 3] =
            color.r;


        colors[i * 3 + 1] =
            color.g;


        colors[i * 3 + 2] =
            color.b;


        sizes[i] =
            Math.random() < 0.04
                ? 1.8 + Math.random() * 1.6
                : 0.4 + Math.random() * 0.8;
    }


    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(
            colors,
            3
        )
    );

    geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(
            sizes,
            1
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 0.5,
            map: texturaParticula,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            sizeAttenuation: true,
            depthWrite: false
        });

    starField =
        new THREE.Points(
            geometry,
            material
        );

    scene.add(
        starField
    );

}

// ======================================================
// GALAXIA
// ======================================================
function buildGalaxy(count) {
    if (galaxyGroup) {
        scene.remove(
            galaxyGroup
        );

        galaxyGroup.traverse(
            (obj) => {
                if (obj.geometry)
                    obj.geometry.dispose();
                if (obj.material)
                    obj.material.dispose();
            }
        );
    }


    galaxyGroup =
        new THREE.Group();

    // ================================================
    // COLOR SEGÚN EL RADIO degradado (lo intente)
    // ================================================

    const radiusMax = 5;
    const insideColor =
        new THREE.Color(
            0xffc9c9
        );

    const midColor =
        new THREE.Color(
            0xf22432
        );

    const outsideColor =
        new THREE.Color(
            0x851209
        );

    function colorPorRadio(r) {
        const t =
            r / radiusMax;
        const mixed =
            new THREE.Color();
        if (t < 0.4) {
            mixed
                .copy(insideColor)
                .lerp(
                    midColor,
                    t / 0.4
                );
        } else {
            mixed
                .copy(midColor)
                .lerp(
                    outsideColor,
                    (t - 0.4) / 0.6
                );
        }
        return mixed;
    }

    // ================================================
    // PARTICULAS de relleno (en espiral)
    // ================================================

    function construirCapa({
        cantidad,
        ramas,
        giro,
        aleatoriedad,
        potenciaAleatoriedad,
        tamañoMin,
        tamañoMax,
        opacidad
    }) {

        const positions =
            new Float32Array(
                cantidad * 5
            );

        const colors =
            new Float32Array(
                cantidad * 3
            );

        const sizes =
            new Float32Array(
                cantidad
            );

        for (
            let i = 0;
            i < cantidad;
            i++
        ) {
            const r =
                Math.pow(
                    Math.random(),
                    1.5
                ) * radiusMax;
            const branchAngle =
                ((i % ramas) / ramas) *
                Math.PI * 2;
            const spinAngle =
                r * giro;
            const randomX =
                Math.pow(
                    Math.random(),
                    potenciaAleatoriedad
                ) *
                (Math.random() < 0.5 ? 1 : -1) *
                aleatoriedad * r;
            const randomY =
                Math.pow(
                    Math.random(),
                    potenciaAleatoriedad
                ) *
                (Math.random() < 0.5 ? 1 : -1) *
                aleatoriedad * 0.25 * r;
            const randomZ =
                Math.pow(
                    Math.random(),
                    potenciaAleatoriedad
                ) *
                (Math.random() < 0.5 ? 1 : -1) *
                aleatoriedad * r;
            const x =
                Math.cos(branchAngle + spinAngle) * r +
                randomX;
            const y =
                randomY;
            const z =
                Math.sin(branchAngle + spinAngle) * r +
                randomZ;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            const mixed =
                colorPorRadio(r);
            const flicker =
                0.85 + Math.random() * 0.3;
            colors[i * 3] = mixed.r * flicker;
            colors[i * 3 + 1] = mixed.g * flicker;
            colors[i * 3 + 2] = mixed.b * flicker;
            sizes[i] =
                tamañoMin +
                Math.random() * (tamañoMax - tamañoMin);
        }
        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colors, 3)
        );

        geometry.setAttribute(
            "size",
            new THREE.BufferAttribute(sizes, 1)
        );

        const material =
            new THREE.PointsMaterial({
                size: tamañoMax,
                map: texturaParticula,
                sizeAttenuation: true,
                vertexColors: true,
                transparent: true,
                opacity: opacidad,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

        return new THREE.Points(
            geometry,
            material
        );
    }

    // ================================================
    // CAPA 1: galaxia difusa llena de partículas como fondo/relleno
    // ================================================
    const capaDifusa =
        construirCapa({
            cantidad: Math.floor(count * 0.9),
            ramas: 4,
            giro: 1.4,
            aleatoriedad: 0.45,
            potenciaAleatoriedad: 2.6,
            tamañoMin: 0.035,
            tamañoMax: 0.045,
            opacidad: 0.8
        });

    // Grupo propio para poder rotar esta capa por su
    // cuenta, en sentido contrario a los brazos.
    capaDifusaGroup =
        new THREE.Group();
    capaDifusaGroup.add(
        capaDifusa
    );
    galaxyGroup.add(
        capaDifusaGroup
    );

    // ================================================
    // CAPA 2: brazos principales
    // ================================================
    const brazosPrincipales =
        construirCapa({
            cantidad: count,
            ramas: 2,
            giro: 1.9,
            aleatoriedad: 0.25,
            potenciaAleatoriedad: 3.2,
            tamañoMin: 0.055,
            tamañoMax: 0.075,
            opacidad: 0.95
        });

    galaxyGroup.add(
        brazosPrincipales
    );

    // ================================================
    // DUST LANE 
    // ================================================
    const branches = 2;
    const spin = 1.9;
    const dustCount =
        Math.floor(
            count * 0.15
        );

    const dPositions =
        new Float32Array(
            dustCount * 3
        );

    const dColors =
        new Float32Array(
            dustCount * 3
        );

    const dustColorA =
        new THREE.Color(
            0x260806
        );

    const dustColorB =
        new THREE.Color(
            0x090302
        );

    for (
        let i = 0;
        i < dustCount;
        i++
    ) {
        const r =
            0.5 +
            Math.random() *
            (
                radiusMax *
                0.85
            );

        const branchAngle =
            (
                (i % branches) /
                branches
            ) *
            Math.PI * 2;

        const spinAngle =
            r * spin;

        const randomX =
            Math.pow(
                Math.random(),
                2
            ) *
            (
                Math.random() < 0.5
                    ? 1
                    : -1
            ) *
            0.35 *
            r;

        const randomZ =
            Math.pow(
                Math.random(),
                2
            ) *
            (
                Math.random() < 0.5
                    ? 1
                    : -1
            ) *
            0.35 *
            r;

        const y =
            (
                Math.random() -
                0.5
            ) *
            0.06;

        dPositions[i * 3] =
            Math.cos(
                branchAngle +
                spinAngle
            ) *
            r +
            randomX;

        dPositions[i * 3 + 1] =
            y;

        dPositions[i * 3 + 2] =
            Math.sin(
                branchAngle +
                spinAngle
            ) *
            r +
            randomZ;

        const c =
            dustColorA
                .clone()
                .lerp(
                    dustColorB,
                    Math.random()
                );

        dColors[i * 3] =
            c.r;

        dColors[i * 3 + 1] =
            c.g;

        dColors[i * 3 + 2] =
            c.b;
    }

    const dustGeo =
        new THREE.BufferGeometry();

    dustGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(
            dPositions,
            3
        )
    );

    dustGeo.setAttribute(
        "color",
        new THREE.BufferAttribute(
            dColors,
            3
        )
    );

    const dustMat =
        new THREE.PointsMaterial({
            size: 0.07,
            map: texturaParticula,
            vertexColors: true,
            transparent: true,
            opacity: 0.55,
            depthWrite: false
        });

    dustField =
        new THREE.Points(
            dustGeo,
            dustMat
        );

    galaxyGroup.add(
        dustField
    );

    // ================================================
    // INCLINACIÓN
    // ================================================
    galaxyGroup.rotation.x =
        1.15;
    galaxyGroup.rotation.z =
        0.35;
    universeGroup.add(
        galaxyGroup
    );
}

// ======================================================
// RESPLANDOR DEL NÚCLEO
// ======================================================
function buildCoreGlow() {
    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width = 128;
    canvas.height = 128;

    const ctx =
        canvas.getContext(
            "2d"
        );

    const grad =
        ctx.createRadialGradient(
            64,
            64,
            0,
            64,
            64,
            64
        );

    grad.addColorStop(
        0,
        "rgba(255,255,255,1)"
    );
    grad.addColorStop(
        0.25,
        "rgba(255,255,255,0.55)"
    );
    grad.addColorStop(
        0.6,
        "rgba(255,255,255,0.18)"
    );
    grad.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );
    ctx.fillStyle =
        grad;

    ctx.fillRect(
        0,
        0,
        128,
        128
    );

    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending:
                THREE.AdditiveBlending,
            depthWrite: false
        });

    coreSprite =
        new THREE.Sprite(
            material
        );
    coreSprite.scale.set(
        2.6,
        2.6,
        1
    );
    coreSprite.position.set(
        0,
        0,
        0
    );

    // ================================================
    // ESFERA NEGRA 
    // ================================================
    const nucleoGeometry =
        new THREE.SphereGeometry(
            0.20,
            32,
            32
        );

    const nucleoMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x000001
        });

    const nucleoEsfera =
        new THREE.Mesh(
            nucleoGeometry,
            nucleoMaterial
        );
    nucleoEsfera.position.set(
        0,
        0,
        0
    );
    galaxyGroup
        ? galaxyGroup.add(
            nucleoEsfera
        )
        : scene.add(
            nucleoEsfera
        );
    galaxyGroup
        ? galaxyGroup.add(
            coreSprite
        )
        : scene.add(
            coreSprite
        );
}

// ======================================================
// ESTRELLA CENTRAL
// ======================================================

function buildCentralStar() {
    starSystem =
    new THREE.Group();
        starSystem.position.set(
            0,
            STAR_Y,
            0
        );
        scene.add(
            starSystem
        );
    const texture =
        new THREE.TextureLoader().load(
            "./assets/estrella.png"
        );

    // ================================================
    // HALO
    // ================================================
    const haloCanvas =
        document.createElement(
            "canvas"
        );
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const ctx =
        haloCanvas.getContext(
            "2d"
        );
    const gradient =
        ctx.createRadialGradient(
            128,
            128,
            0,
            128,
            128,
            128
        );
    gradient.addColorStop(
        0,
        "rgba(255,235,230,0.60)"
    );

    gradient.addColorStop(
        0.24,
        "rgba(230,135,140,0.28)"
    );

    gradient.addColorStop(
        0.55,
        "rgba(150,50,65,0.12)"
    );

    gradient.addColorStop(
        1,
        "rgba(100,20,30,0)"
    );

    ctx.fillStyle =
        gradient;
    ctx.fillRect(
        0,
        0,
        256,
        256
    );

    const haloTexture =
        new THREE.CanvasTexture(
            haloCanvas
        );

    starGlow =
        new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: haloTexture,
                transparent: true,
                depthWrite: false,
                blending:
                    THREE.AdditiveBlending
            })
        );

    starGlow.scale.set(
        4.2,
        4.2,
        1
    );
    starGlow.position.set(
        0,
        STAR_Y,
        0
    );
    starGlow.renderOrder =
        8;
    scene.add(
        starGlow
    );
    // ================================================
    // HALO ESFÉRICO
    // ================================================
    const haloGeometry =
        new THREE.SphereGeometry(
            0.68,
            32,
            32
        );
    const haloMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xa76b73,
            transparent: true,
            opacity: 0.11,
            depthWrite: false
        });

    starHalo =
        new THREE.Mesh(
            haloGeometry,
            haloMaterial
        );
    starHalo.position.set(
        0,
        STAR_Y,
        0
    );
    scene.add(
        starHalo
    );

    // ================================================
    // PNG DE LA ESTRELLA
    // ================================================
    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            blending:
                THREE.AdditiveBlending
        });

    star =
        new THREE.Sprite(
            material
        );

    star.scale.set(
        1.7,
        3.05,
        1
    );

    star.position.set(
        0,
        STAR_Y,
        0
    );

    star.renderOrder =
        10;

    scene.add(
        star
    );

}


// ======================================================
// TARJETAS
// ======================================================
const cards = [
    {
        title: "El bufón de mi reino",
        text:
            "Como ya ambos sabemos, si tuviera que nombrarte con algún personaje dentro de mi pequeño reino, serías mi bufón, no porque seas menos solemne, sino porque tienes el extraño privilegio de entrar en mi corazón y hacer reír hasta a las partes de mí que habían olvidado cómo hacerlo. Me haces reír todos los días, incluso cuando no lo pretendes, y literalmente has convertido la alegría en una costumbre que lleva tu nombre. A mi chico que hace de un dia ordinario una pequeña alegria. ",
        color:
            0xc08388
    },

    {
        title: "Esencia irrepetible",
        text:
            "Aunque no lo creas mi vida, eres de esas personas que no podrían repetirse aunque el mundo lo intentara. Porque simplemente hay algo en tu esencia que solo existe en ti, tal vez en la manera en que conviertes tus pensamientos en dibujos, sentimientos en escritos y aquello que quizá otros no saben decir, en algo que solamente tú podrías crear y entender. Mi querido, ante mi, tu arte no es solamente una pasión que llegas a tener cuando estas inspirado, es mas, es una de las ventanas por las que puedo contemplar aquello que existe dentro tuyo. Y cuanto más miro, más comprendo que tu belleza no está únicamente en lo que haces o dices, sino en la mente y el alma extraordinaria que deja su huella detrás de cada detalle.",
        color:
            0xb89aa1
    },

    {
        title: "Tu precioso trato",
        text:
            "La forma de tratar a los demás dice mucho más de una persona que cualquier otra cosa, y tú me has demostrado que sabes hacerlo con respeto, cuidado, y una educación que no necesita ser anunciada, pues podría verse 10 años antes. Especialmente con quienes amas, tienes una delicadeza que admiro profundamente, en serio, me encanta. Y quizá exista algo egoístamente hermoso en saber que, de todas las versiones que el mundo puede conocer de ti, yo tengo el privilegio de recibir una de las más preciosas. Me siento afortunada de llevarme lo mejor de ti, de ser destinataria de ese cuidado que no ofreces indiscriminadamente y de poder decir que, entre tantas personas que existen en tu mundo, me permitiste ocupar un lugar tan lindo en él, te amo.",
        color:
            0xd08c93
    },

    {
        title: "Tu extraño pero adictivo encanto",
        text:
            "Y simplemente sucede cuando eres tú. Adoro el hecho de que puedas hablar de casi cualquier cosa, aunque no tengas ni idea o sin tener temas de conversación frente a personas completamente distintas porque, aun así, conservas intacta esa risa tan característica que amo, ese humor que inevitablemente termina dejando tu huella y el cual entiendo totalmente, me gusta incluso tu franqueza, esa manera de decir lo que piensas cuando consideras que corresponde, sin disfrazar innecesariamente aquello que quieres expresar. Eres increíble amor, porque no intentas convertirte en alguien agradable para todos. Eres tú, con tu humor, tu sinceridad y tus rarezas que me enloquecen y de alguna manera consigues caerle bien a todos.",
        color:
            0xa8737a
    },

    {
        title: "Guardián perfecto",
        text:
            "Admiro que no entregues las partes más profundas de ti a cualquiera. Pues he notado que sabes reconocer a quienes pueden comprender tu humor, acompañarte en tus risas y cuando llegado el momento, guardar silencio cuando se exige seriedad, es de lo que mas me gusta, saber en que momento sí y en cuales no. Sabes a quién contarle tus heridas, con quién compartir tus pensamientos y cuándo necesitas simplemente permanecer contigo mismo, con tu propio tiempo y espacio. Me encanta la inteligencia que tienes para distinguir aquello que merece quedarse de aquello que es mejor dejar atrás, y la fortaleza de saber estar solo cuando la vida así lo exige. Gracias, valoro tanto que me hayas elegido, porque sé que tu corazón difícilmente abre sus puertas, y aun así decidiste entregarme una llave.",
        color:
            0xc58e92

    },

    {
        title: "Confianza mía",
        text:
            "De todas las cosas que has podido darme y decirme, quizá ninguna sea tan valiosa como tu confianza, porque me has permitido caminar por lugares de tu alma que no cualquiera llega a conocer, has dejado caer ante mí silencios, pensamientos, temores y fragmentos de ti que podrían haber permanecido ocultos, tal vez aun no todos, pero lo hiciste, y yo estaré esperando que cada vez sean mas. Por ello quiero que sepas que no considero esa confianza un derecho adquirido, sino como un privilegio que pienso cuidar, demostrarte, con cada acto y no solamente con palabras, que aquello que me entregaste estará a salvo conmigo sin importar qué. Si me confiaste fragmentos de tu alma, yo quiero aprender a sostener cada uno con ambas manos, con cuidado casi reverencial, con amor...y devolvértelos siempre intactos.",
        color:
            0xb07b84
    },

    {
        title: "Amo que ames",
        text:
            "Hay algo profundamente hermoso e increíble en la manera en que amas Josue, quizá no siempre encuentres las palabras exactas, quizá todavía estés aprendiendo a expresar todo aquello que sientes y algunas veces no sepas cómo dejarlo salir con completa libertad, pero jamás he visto en ti la falta de voluntad para intentarlo. Adoro con lo que he visto que, cuando amas, das lo mejor que tienes, lo haces con tu familia, con tus amigos y conmigo, claro, cada uno recibe una versión distinta de ese amor, pero todas tienen la misma raíz: tu deseo genuino de cuidar y demostrar de alguna manera. Y eso me conmueve, me endulza y enamora, porque no necesito que sepas amar perfectamente me basta con saber que, con tan solo entrar en tu corazón, tú haces todo lo posible por dar lo mejor y de la forma correcta, te amo, de nuevo. ",
        color:
            0xd0a0a4
    },

    {
        title: "Preciado corazón",
        text:
            "Porque incluso detrás de tu humor más pesado existe una persona que sabe dónde termina una broma y dónde comienza el dolor, mi vida, porque jamás percibo en ti el deseo de destruir por destruir, de herir gratuitamente o de convertir la sensibilidad de otros en un juego. Simplemente me encantas por eso también incluso, además, hay algo particularmente lindo en la manera en que contemplas la naturaleza, en el respeto que tienes por sus criaturas, sus elementos y todo aquello que existe sin necesitar de nosotros para tener valor, el como lo admiras y encuentras inspiración en ello. Amo como ves la vida y las personas, sabiendo cuándo guardar la risa y tratar algo —o a alguien— con la delicadeza que merece.",
        color:
            0xb47f89
    },

    {
        title: "Tú elección",
        text:
            "Y esta quizá sea la razón que más profundamente guardo y amo, porque me estás permitiendo amarte, amarte no desde la ingenuidad de quien no ve defectos, ni desde una ilusión que algún día pueda romperse al descubrir la realidad, sino sabiendo quién soy y quién eres, con todo aquello que todavía tenemos que aprender, incluso del otro. Adoro que vayas hacia mí porque quieres hacerlo, que me elijas porque tu corazón, razón, consciente y libre, encuentra algo aquí donde desea quedarse. Y yo quiero responder a esa elección entregándote todo lo que tenga para dar, y quizá no siempre sepa hacerlo bien, quizá me equivoque, mucho, y tropiece o descubra que todavía me faltan muchas herramientas para construir el amor que imagino, todo para darte. Pero hay algo que sí puedo prometerte, y es que **no dejaré de intentarlo.** Si tú vienes hacia mí con el corazón abierto, yo haré todo lo que esté en mis manos para encontrarte en mi cariño y amor infinito por ti.&#x20;",
        color:
            0xc08d94
    },

    {
        title: "Descubre a mi lado",
        text:
            "Me encanta tenerte, también por el hecho de todo aquello que todavía te falta aprender, porque simplemente no necesito que llegues a mí terminado, como una obra que ya no admite modificaciones, yo prefiero contemplarte mientras creces, mientras descubres, mientras cambias de opinión, mientras encuentras nuevas preguntas y buscas respuestas, amo que desees ser comprendido y comprender a quienes te rodean y quieres, que cuando tienes libertad y tiempo busques soluciones en lugar de conformarte con la primera respuesta, realmente no hay, ni podría haber alguien como tú mi amor, mi amado Josue. Igual, me llena de vida que tengas curiosidad por el mundo, por sus culturas, por todo aquello que todavía no conoces, sin levantar fronteras innecesarias frente a lo diferente y solo quieras descubrir, quizá aún te falte muchísimo por vivir, pero precisamente por eso quiero seguir observándote y estar de la mano, porque todavía tienes un universo entero por ver, y me parece precioso que quieras hacerlo aprendiendo, sintiendo y a veces, dejando algo de ti en quienes tengan la hermosa fortuna de encontrarte.",
        color:
            0xd29ba0
    }
];


// ======================================================
// CREAR NODOS DE TARJETA
// ======================================================
function buildCards() {
    const positions = [
        [-0.55, 0.08, 0.96],
        [1.69, -0.06, 0.15],
        [-0.77, 0.10, -2.17],
        [-2.08, -0.09, 2.03],
        [3.27, 0.05, 1.26],
        [1.24, -0.07, -0.65],
        [-1.58, 0.09, -1.22],
        [-0.59, -0.05, 2.53],
        [3.13, 0.07, -0.65],
        [-1.68, -0.08, -3.52]
    ];
    const texturaEstrella =
        new THREE.TextureLoader().load(
            "./assets/estrella.png"
        );

    // ================================================
    // TEXTURA DEL HALO...se quedara con negro creo 
    // ================================================
    const haloCanvas =
        document.createElement(
            "canvas"
        );
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const haloCtx =
        haloCanvas.getContext(
            "2d"
        );
    const haloGradiente =
        haloCtx.createRadialGradient(
            64,
            64,
            0,

            64,
            64,
            64

        );

    haloGradiente.addColorStop(
        0,
        "rgba(0,0,0,0.85)"
    );

    haloGradiente.addColorStop(
        0.45,
        "rgba(0,0,0,0.55)"
    );

    haloGradiente.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    haloCtx.fillStyle =
        haloGradiente;

    haloCtx.fillRect(
        0,
        0,
        128,
        128
    );

    const texturaHaloNegro =
        new THREE.CanvasTexture(
            haloCanvas
        );


    cards.forEach(
        (card, index) => {

            const group =
                new THREE.Group();


            const tamaño =
                index === 9
                    ? 1.7
                    : 1.4;


            // ========================================
            // HALO NEGRO (detrás, oscurece el fondo)
            // ========================================

            const halo =
                new THREE.Sprite(

                    new THREE.SpriteMaterial({

                        map: texturaHaloNegro,

                        transparent: true,

                        depthWrite: false,

                        blending:
                            THREE.NormalBlending

                    })

                );

            halo.scale.set(
                0.85 * tamaño,
                0.85 * tamaño,
                1
            );

            halo.renderOrder =
                5;

            group.add(
                halo
            );


            // ========================================
            // MINI ESTRELLA (encima, brillante)
            // ========================================

            const miniEstrella =
                new THREE.Sprite(

                    new THREE.SpriteMaterial({

                        map: texturaEstrella,

                        transparent: true,

                        depthWrite: false,

                        blending:
                            THREE.AdditiveBlending

                    })

                );

            miniEstrella.scale.set(
                0.5 * tamaño,
                0.9 * tamaño,
                1
            );

            miniEstrella.renderOrder =
                9;

            miniEstrella.userData.cardIndex =
                index;

            group.add(
                miniEstrella
            );


            group.position.set(

                positions[index][0],

                positions[index][1],

                positions[index][2]

            );


            galaxyGroup.add(
                group
            );


            cardNodes.push({

                object:
                    group,

                mesh:
                    miniEstrella,

                halo:
                    halo,

                baseStarScale: {
                    x: 0.5 * tamaño,
                    y: 0.9 * tamaño
                },

                baseHaloScale:
                    0.85 * tamaño,

                index:
                    index,

                phase:
                    Math.random() *
                    Math.PI * 2

            });

        }
    );

}


// ======================================================
// ABRIR TARJETA
// ======================================================

function abrirTarjeta(index) {

    const card =
        cards[index];


    document.getElementById(
        "tituloTarjeta"
    ).textContent =
        card.title;


    document.getElementById(
        "textoTarjeta"
    ).textContent =
        card.text;


    document.getElementById(
        "numeroTarjeta"
    ).textContent =
        String(index + 1)
            .padStart(2, "0");


    document
        .getElementById("tarjeta")
        .classList.remove(
            "oculta"
        );

}


// ======================================================
// CERRAR
// ======================================================

function cerrarTarjeta() {

    document
        .getElementById("tarjeta")
        .classList.add(
            "oculta"
        );

}


// ======================================================
// CLICK EN NODOS
// ======================================================

function onPointerDown(event) {

    pointerDownX =
        event.clientX;


    pointerDownY =
        event.clientY;


    pointerDownTime =
        performance.now();


    isDragging = true;

    lastX = event.clientX;
    lastY = event.clientY;

    dragDX = 0;
    dragDY = 0;

    angularVelocity.x = 0;
    angularVelocity.y = 0;

    document.body.classList.add(
        "dragging"
    );

}


// ======================================================
// ARRASTRAR PARA GIRAR EL UNIVERSO
// ======================================================

function onPointerMove(event) {

    if (!isDragging) return;

    const dx =
        event.clientX - lastX;

    const dy =
        event.clientY - lastY;

    lastX = event.clientX;
    lastY = event.clientY;

    // Se acumula aquí y se aplica una sola vez por
    // cuadro en animate(), para que no dependa de
    // cuántas veces dispare el navegador este evento.
    dragDX += dx;
    dragDY += dy;

}


function onPointerUp(event) {

    isDragging = false;

    document.body.classList.remove(
        "dragging"
    );


    const dx =
        event.clientX -
        pointerDownX;


    const dy =
        event.clientY -
        pointerDownY;


    const distancia =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const tiempo =
        performance.now() -
        pointerDownTime;

    // Si apenas se movió, interpretamos
    // el gesto como un click.
    if (
        distancia < 8 &&
        tiempo < 450
    ) {

        mouse.x =
            (
                event.clientX /
                window.innerWidth
            ) * 2 - 1;


        mouse.y =
            -(
                event.clientY /
                window.innerHeight
            ) * 2 + 1;


        raycaster.setFromCamera(
            mouse,
            camera
        );


        const objetos =
            cardNodes.map(
                node =>
                    node.mesh
            );


        const intersecciones =
            raycaster.intersectObjects(
                objetos,
                false
            );


        if (
            intersecciones.length > 0
        ) {

            const index =
                intersecciones[0]
                    .object
                    .userData
                    .cardIndex;


            abrirTarjeta(
                index
            );

        }

    }

}


// ======================================================
// ROTAR EL UNIVERSO
// ======================================================
// Trackball libre: la rotación se aplica alrededor de
// los ejes "arriba" y "derecha" de la propia cámara,
// así nunca hay gimbal lock y se puede girar el
// universo completamente en cualquier dirección, como
// si fuera un objeto independiente en la mano.

function rotateUniverse(dx, dy) {

    if (!universeGroup) return;

    _camUp
        .copy(camera.up)
        .applyQuaternion(
            camera.quaternion
        )
        .normalize();

    _camRight
        .set(1, 0, 0)
        .applyQuaternion(
            camera.quaternion
        )
        .normalize();

    _qYaw.setFromAxisAngle(
        _camUp,
        dx * ROT_SENSITIVITY
    );

    _qPitch.setFromAxisAngle(
        _camRight,
        dy * ROT_SENSITIVITY
    );

    universeGroup.quaternion
        .premultiply(_qYaw)
        .premultiply(_qPitch);

}

// ======================================================
// CÁMARA FIJA (solo la distancia cambia con el zoom)
// ======================================================

function updateCameraPosition() {

    camera.position
        .copy(camDir)
        .multiplyScalar(camDistance)
        .add(_camTarget);

    camera.lookAt(
        0,
        STAR_Y,
        0
    );

}

function onWheel(event) {

    event.preventDefault();
    // Convertimos el movimiento de la rueda
    // en un nuevo destino, no en un salto.
    targetCamDistance +=
        event.deltaY * 0.004;


    targetCamDistance =
        THREE.MathUtils.clamp(

            targetCamDistance,
            MIN_DISTANCE,
            MAX_DISTANCE
        );

}


// ======================================================
// PELLIZCAR CON DOS DEDOS (zoom en móvil)
// ======================================================

function distanciaEntreDedos(touches) {

    const dx =
        touches[0].clientX -
        touches[1].clientX;

    const dy =
        touches[0].clientY -
        touches[1].clientY;

    return Math.sqrt(
        dx * dx + dy * dy
    );

}

function onTouchEnd(event) {

    if (event.touches.length < 2) {

        distanciaPellizcoAnterior =
            null;

    }

}

function onTouchStart(event) {

    if (event.touches.length === 2) {

        event.preventDefault();

        // Al empezar el pellizco soltamos el
        // arrastre de un dedo, si estaba activo.
        isDragging = false;

        angularVelocity.x = 0;
        angularVelocity.y = 0;

        distanciaPellizcoAnterior =
            distanciaEntreDedos(
                event.touches
            );

    }

}

function onTouchMove(event) {

    if (event.touches.length === 2) {

        event.preventDefault();

        const distanciaActual =
            distanciaEntreDedos(
                event.touches
            );

        if (distanciaPellizcoAnterior !== null) {

            const diferencia =
                distanciaActual -
                distanciaPellizcoAnterior;

            // Separar los dedos acerca la cámara,
            // juntarlos la aleja (como en fotos/mapas).
            targetCamDistance -=
                diferencia * 0.02;

            targetCamDistance =
                THREE.MathUtils.clamp(

                    targetCamDistance,
                    MIN_DISTANCE,
                    MAX_DISTANCE
                );

        }

        distanciaPellizcoAnterior =
            distanciaActual;

    }

}




// ======================================================
// ANIMACIÓN
// ======================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    const tiempo =
        performance.now();

    // Tiempo real transcurrido desde el cuadro anterior,
    // para que el giro y el zoom se sientan igual de
    // fluidos sin importar la velocidad de fotogramas.
    const delta =
        Math.min(
            reloj.getDelta(),
            0.05
        );

    // ZOOM SUAVE

    const zoomLerp =
        1 -
        Math.pow(
            1 - 0.15,
            delta * 60
        );

    camDistance +=
        (
            targetCamDistance -
            camDistance
        ) * zoomLerp;

    updateCameraPosition();
    // ================================================
    // GIRO: se aplica el arrastre acumulado del cuadro
    // (fluido, sin importar cuántos eventos de mouse
    // hayan llegado) y, al soltar, sigue con inercia
    // que se frena sola.
    // ================================================

    if (isDragging) {

        if (dragDX !== 0 || dragDY !== 0) {

            rotateUniverse(
                dragDX,
                dragDY
            );

            angularVelocity.x = dragDX;
            angularVelocity.y = dragDY;

            dragDX = 0;
            dragDY = 0;

        }

    } else {

        if (
            Math.abs(angularVelocity.x) > 0.01 ||
            Math.abs(angularVelocity.y) > 0.01
        ) {

            rotateUniverse(
                angularVelocity.x,
                angularVelocity.y
            );

            const frenado =
                Math.pow(
                    DAMPING,
                    delta * 60
                );

            angularVelocity.x *= frenado;
            angularVelocity.y *= frenado;

        }

    }


    // ================================================
    // GALAXIA
    // ================================================

    if (galaxyGroup) {

        galaxyGroup.rotation.y +=
            0.0045;

    }


    if (capaDifusaGroup) {

        // Al ser hija de galaxyGroup, restarle el
        // doble hace que, en el mundo, gire igual de
        // rápido que los brazos pero en sentido
        // contrario.
        capaDifusaGroup.rotation.y -=
            0.0045 * 2;

    }


    // ================================================
    // ESTRELLAS DE FONDO
    // ================================================

    if (starField) {

        starField.rotation.y +=
            0.00105;

        starField.rotation.x +=
            0.00035;

        starField.material.opacity =
        0.82 +
        Math.sin(
            tiempo * 0.0012
        ) * 0.14;

    }


    // ================================================
    // ESTRELLA
    // ================================================

    if (
        star &&
        starGlow &&
        starHalo
    ) {

        const pulso =
            1 +
            Math.sin(
                tiempo * 0.0018
            ) *
            0.035;


        star.scale.set(
            1.7 * pulso,
            3.05 * pulso,
            1
        );


        const brillo =
            1 +
            Math.sin(
                tiempo * 0.0014
            ) *
            0.08;


        starGlow.scale.set(
            4.2 * brillo,
            4.2 * brillo,
            1
        );


        starHalo.scale.set(
            brillo,
            brillo,
            brillo
        );

    }


    // ================================================
    // MINI ESTRELLAS (pulso suave, cada una con su
    // propio ritmo para que no palpiten sincronizadas)
    // ================================================

    cardNodes.forEach(
        (node) => {

            const pulso =
                1 +
                Math.sin(
                    tiempo * 0.0022 +
                    node.phase
                ) *
                0.045;

            node.mesh.scale.set(
                node.baseStarScale.x * pulso,
                node.baseStarScale.y * pulso,
                1
            );

            node.halo.scale.set(
                node.baseHaloScale * pulso,
                node.baseHaloScale * pulso,
                1
            );

        }
    );


    // ================================================
    // MINI ESTRELLAS (parpadeo/pulso, cada una a su
    // propio ritmo, usando su fase aleatoria)
    // ================================================

    cardNodes.forEach(
        (node) => {

            const pulsoMini =
                1 +
                Math.sin(
                    tiempo * 0.002 +
                    node.phase
                ) * 0.12;

            node.object.scale.set(
                pulsoMini,
                pulsoMini,
                pulsoMini
            );

        }
    );


    // ================================================
    // HINT
    // ================================================

    if (
        !hintHidden &&
        performance.now() > 4500
    ) {

        document
            .getElementById("hint")
            .style.opacity =
                "0";

        hintHidden =
            true;

    }


    // ================================================
    // RENDER
    // ================================================

    renderer.render(
        scene,
        camera
    );

}


// ======================================================
// RESPONSIVE
// ======================================================

function onResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(

        window.innerWidth,
        window.innerHeight

    );

}

// ======================================================
// INICIAR
// ======================================================

init();