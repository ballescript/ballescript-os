document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       1. RELOJ EN TIEMPO REAL
    ========================================= */
    function updateClock() {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    updateClock(); // Llamada inicial
    setInterval(updateClock, 1000); // Actualizar cada segundo

    /* =========================================
       2. VISOR DE CLIMA (HERMOSILLO)
    ========================================= */
    async function fetchWeather() {
        const widget = document.getElementById('weather-widget');
        try {
            // Latitud y Longitud de Hermosillo, Sonora
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=29.0892&longitude=-110.9613&current_weather=true');
            const data = await res.json();
            widget.innerHTML = `☀️ HMO: ${data.current_weather.temperature}°C`;
        } catch (error) {
            widget.innerHTML = 'Clima no disponible';
        }
    }
    fetchWeather();

    /* =========================================
       3. MENÚ DE INICIO Y TOOLTIPS
    ========================================= */
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const tooltip = document.getElementById('floating-tooltip');

    // Abrir/Cerrar menú
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('active');
    });

    // Cerrar menú al hacer click fuera de él
    document.body.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) {
            startMenu.classList.remove('active');
        }
    });

    // Tooltip flotante para Escritorio (sigue al mouse)
    document.querySelectorAll('.start-link').forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (window.innerWidth > 600) {
                tooltip.textContent = link.getAttribute('data-info');
                tooltip.style.display = 'block';
            }
        });
        link.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 600) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }
        });
        link.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });

    // Alerta de información nativa para Móviles (botón 'i')
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que se cierre el menú
            alert(btn.getAttribute('data-info'));
        });
    });

    /* =========================================
       4. SISTEMA DE VENTANAS Y Z-INDEX
    ========================================= */
    let highestZIndex = 10;
    
    function openWindow(windowId) {
        const win = document.getElementById(windowId);
        win.classList.add('active');
        win.style.zIndex = ++highestZIndex; // Traer al frente
        
        // Si es la cámara, inicializar hardware
        if (windowId === 'window-camara') initCamera();
        
        // Cerrar menú de inicio si estaba abierto
        startMenu.classList.remove('active');
    }

    // Traer al frente al hacer clic en cualquier parte de una ventana
    document.querySelectorAll('.window').forEach(win => {
        win.addEventListener('mousedown', () => {
            win.style.zIndex = ++highestZIndex;
        });
    });

    // Botones de cerrar (X)
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const win = e.target.closest('.window');
            win.classList.remove('active');
            
            // Apagar procesos para ahorrar recursos
            if (win.id === 'window-camara') stopCamera();
            if (win.id === 'window-radio') document.getElementById('radio-player').pause();
        });
    });

    /* =========================================
       5. ARRASTRAR VENTANAS (DRAG & DROP)
    ========================================= */
    let isDragging = false;
    let currentWindow = null;
    let offsetX = 0, offsetY = 0;

    document.querySelectorAll('.window-header').forEach(header => {
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            currentWindow = header.closest('.window');
            currentWindow.style.zIndex = ++highestZIndex;
            
            // Posición exacta del clic dentro de la cabecera
            const rect = currentWindow.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentWindow) return;
        e.preventDefault(); // Evita seleccionar texto por accidente
        
        // Nueva posición
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;
        
        currentWindow.style.left = newLeft + 'px';
        currentWindow.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        currentWindow = null;
    });

    /* =========================================
       6. ENLACES Y APERTURA DE APLICACIONES
    ========================================= */
    // Íconos del Escritorio (Links a otras webs)
    document.querySelectorAll('.icon[data-url]').forEach(icon => {
        icon.addEventListener('dblclick', () => window.open(icon.dataset.url, '_blank'));
        icon.addEventListener('click', () => {
            if (window.innerWidth <= 600) window.open(icon.dataset.url, '_blank');
        });
    });

    // Íconos del Escritorio (Abrir ventanas internas)
    document.getElementById('icon-camara').addEventListener('dblclick', () => openWindow('window-camara'));
    document.getElementById('icon-radio').addEventListener('dblclick', () => openWindow('window-radio'));
    document.getElementById('icon-notes').addEventListener('dblclick', () => openWindow('window-notes'));

    // Soporte para un clic en móviles
    if (window.innerWidth <= 600) {
        document.getElementById('icon-camara').addEventListener('click', () => openWindow('window-camara'));
        document.getElementById('icon-radio').addEventListener('click', () => openWindow('window-radio'));
        document.getElementById('icon-notes').addEventListener('click', () => openWindow('window-notes'));
    }

    // Enlaces desde el Menú de Inicio
    document.getElementById('menu-camara').addEventListener('click', (e) => { e.preventDefault(); openWindow('window-camara'); });
    document.getElementById('menu-radio').addEventListener('click', (e) => { e.preventDefault(); openWindow('window-radio'); });
    document.getElementById('menu-notes').addEventListener('click', (e) => { e.preventDefault(); openWindow('window-notes'); });

    /* =========================================
       7. BLOC DE NOTAS (LOCALSTORAGE)
    ========================================= */
    const textarea = document.getElementById('notepad-text');
    // Recuperar notas al cargar
    textarea.value = localStorage.getItem('aeroNotes') || '';
    // Guardar al escribir
    textarea.addEventListener('input', () => {
        localStorage.setItem('aeroNotes', textarea.value);
    });

    /* =========================================
       8. CÁMARA (WEBRTC Y CANVAS)
    ========================================= */
    const video = document.getElementById('video-stream');
    const canvas = document.getElementById('photo-canvas');
    const effectsSelect = document.getElementById('camera-effects');
    const controlsCapture = document.getElementById('controls-capture');
    const controlsSave = document.getElementById('controls-save');
    let streamPtr = null;

    async function initCamera() {
        if (streamPtr) return; // Ya está encendida
        try {
            streamPtr = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = streamPtr;
            resetCameraView();
        } catch (err) { 
            alert('No se pudo acceder a la cámara. Por favor, acepta los permisos en tu navegador.'); 
        }
    }

    function stopCamera() {
        if (streamPtr) { 
            streamPtr.getTracks().forEach(t => t.stop()); 
            streamPtr = null; 
        }
    }

    // Aplicar filtro CSS en vivo al video
    effectsSelect.addEventListener('change', () => {
        video.style.filter = effectsSelect.value;
    });

    function resetCameraView() {
        video.style.display = 'block';
        canvas.style.display = 'none';
        controlsCapture.style.display = 'block';
        controlsSave.style.display = 'none';
    }

    // Tomar foto
    document.getElementById('btn-capture').addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Aplicar el filtro seleccionado al contexto del canvas antes de dibujar
        ctx.filter = effectsSelect.value;
        ctx.drawImage(video, 0, 0);
        
        // Cambiar interfaz
        video.style.display = 'none';
        canvas.style.display = 'block';
        controlsCapture.style.display = 'none';
        controlsSave.style.display = 'flex';
    });

    // Botón Retomar
    document.getElementById('btn-retake').addEventListener('click', resetCameraView);

    // Botón Guardar
    document.getElementById('btn-save').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `foto-aero-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });

    /* =========================================
       9. RADIO ONLINE (HTML5 AUDIO)
    ========================================= */
    const player = document.getElementById('radio-player');
    document.querySelectorAll('.station').forEach(btn => {
        btn.addEventListener('click', () => {
            player.src = btn.dataset.stream;
            player.play();
        });
    });

});