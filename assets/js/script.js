function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = document.querySelector('.main-header').offsetHeight;
        const elementPosition = element.offsetTop - headerHeight - 20; // 20px de margen adicional

        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// ====================================
// OPTIMIZACIÓN: LAZY LOADING DEL VIDEO HERO
// ====================================
function initHeroVideoLazyLoad() {
    const videoWrapper = document.getElementById('hero-video-wrapper');
    
    if (!videoWrapper) return;

    let videoLoaded = false;
    let userInteracted = false;

    // Función para cargar el video
    const loadVideo = () => {
        if (videoLoaded) return;
        
        videoLoaded = true;
        videoWrapper.classList.add('loading');

        const videoSrc = videoWrapper.dataset.videoSrc;
        
        // Crear elemento video
        const video = document.createElement('video');
        video.id = 'hero-video';
        video.width = 1920;
        video.height = 1080;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.pointerEvents = 'none';
        
        // Prevenir controles y menú contextual
        video.addEventListener('contextmenu', e => e.preventDefault());
        video.addEventListener('click', e => e.preventDefault());

        // Crear source
        const source = document.createElement('source');
        source.src = videoSrc;
        source.type = 'video/mp4';
        
        video.appendChild(source);

        // Cuando el video esté listo para reproducir
        video.addEventListener('loadeddata', () => {
            videoWrapper.classList.remove('loading');
            video.play().catch(err => {
                console.log('Autoplay blocked:', err);
                // Si el autoplay falla, mantener el poster
            });
        });

        // Agregar video al contenedor
        videoWrapper.appendChild(video);
    };

    // Estrategia 1: Cargar después de interacción del usuario
    const userInteractionEvents = ['click', 'touchstart', 'keydown', 'mousemove'];
    
    const handleUserInteraction = () => {
        if (!userInteracted) {
            userInteracted = true;
            // Esperar 500ms después de la primera interacción
            setTimeout(() => {
                loadVideo();
            }, 500);
            
            // Remover listeners después de la primera interacción
            userInteractionEvents.forEach(event => {
                document.removeEventListener(event, handleUserInteraction);
            });
        }
    };

    userInteractionEvents.forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    // Estrategia 2: Cargar después de 3 segundos si no hay interacción
    const fallbackTimer = setTimeout(() => {
        if (!videoLoaded) {
            loadVideo();
        }
    }, 3000);

    // Estrategia 3: Cargar cuando se hace scroll (opcional)
    let scrollTriggered = false;
    const handleScroll = () => {
        if (!scrollTriggered && window.scrollY > 50) {
            scrollTriggered = true;
            loadVideo();
            window.removeEventListener('scroll', handleScroll);
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Limpiar timer si el video se carga antes
    if (videoLoaded) {
        clearTimeout(fallbackTimer);
    }
}


function openWhatsApp() {
    const mensaje = 'Hola, quiero información sobre Casa Bonita Residencial';
    const whatsappUrl = `https://wa.me/51946552086?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}


function animateOnScroll() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const delay = index * 80;
                setTimeout(() => {
                    entry.target.classList.add('animate');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .benefit-card, .testimonio-card, .requirement-card, .timeline-content, .stat-card');
    animatedElements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = `opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        observer.observe(el);
    });
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number:not(.stat-number)');
    const observerOptions = {
        threshold: 0.4,
        rootMargin: '0px 0px -20px 0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const originalText = counter.textContent;
                const target = parseInt(originalText.replace(/[^\d]/g, ''));
                const duration = 900;
                const increment = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        const currentValue = Math.floor(current);
                        if (originalText.includes('m²')) {
                            counter.textContent = currentValue + ' m²';
                        } else if (originalText.includes('%')) {
                            counter.textContent = currentValue + '%';
                        } else {
                            counter.textContent = currentValue;
                        }
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = originalText;
                    }
                };

                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateHeroElements() {
    const heroElements = [
        {
            selector: '.hero-badge',
            delay: 100,
            transform: 'translateY(-40px) scale(0.8)',
            finalTransform: 'translateY(0) scale(1)'
        },
        {
            selector: '.hero-title',
            delay: 300,
            transform: 'translateX(-60px) scale(0.9)',
            finalTransform: 'translateX(0) scale(1)'
        },
        {
            selector: '.hero-subtitle',
            delay: 500,
            transform: 'translateX(60px) scale(0.9)',
            finalTransform: 'translateX(0) scale(1)'
        },
        {
            selector: '.hero-description',
            delay: 700,
            transform: 'translateY(40px) scale(0.95)',
            finalTransform: 'translateY(0) scale(1)'
        },
        {
            selector: '.hero-location',
            delay: 900,
            transform: 'translateY(30px) scale(0.7)',
            finalTransform: 'translateY(0) scale(1)'
        },
        {
            selector: '.hero-buttons',
            delay: 1100,
            transform: 'translateY(50px) scale(0.8)',
            finalTransform: 'translateY(0) scale(1)'
        },
        {
            selector: '.scroll-indicator',
            delay: 1300,
            transform: 'translateY(20px) scale(0.5)',
            finalTransform: 'translateY(0) scale(1)'
        }
    ];

    heroElements.forEach(({ selector, transform }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = transform;
            element.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
    });

    setTimeout(() => {
        heroElements.forEach(({ selector, delay, finalTransform }) => {
            setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) {
                    element.style.opacity = '1';
                    element.style.transform = finalTransform;

                    element.style.filter = 'brightness(1.1)';
                    setTimeout(() => {
                        element.style.filter = 'brightness(1)';
                        element.style.transition = 'filter 0.3s ease';
                    }, 200);
                }
            }, delay);
        });

    }, 200);
}

function initParallax() {
    const parallaxElements = document.querySelectorAll('.scroll-indicator');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        parallaxElements.forEach(element => {
            if (element.classList.contains('scroll-indicator')) {
                element.style.transform = `translateX(-50%) translateY(${rate * 0.1}px)`;
            }
        });
    });
}

function enhanceHoverEffects() {
    const cards = document.querySelectorAll('.feature-card, .benefit-card, .testimonio-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
            card.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0px) scale(1)';
            card.style.transition = 'all 0.3s ease';
        });
    });
}

function enhanceButtonAnimations() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.05) translateY(-2px)';
            button.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1) translateY(0px)';
            button.style.boxShadow = '';
        });

        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.98) translateY(1px)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1.05) translateY(-2px)';
        });
    });
}

function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
}


document.addEventListener('DOMContentLoaded', function () {
    // Solución simple para el video en iOS
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Prevenir toques en el video en móviles
        heroVideo.style.pointerEvents = 'none';

        // Prevenir el menú contextual y controles
        heroVideo.addEventListener('contextmenu', e => e.preventDefault());
        heroVideo.addEventListener('click', e => e.preventDefault());
    }

    // Initialize animations and effects
    animateOnScroll();
    animateCounters();
    animateHeroElements();
    initParallax();
    enhanceHoverEffects();
    enhanceButtonAnimations();
    lazyLoadImages();
});

/* Mobile navigation: inject hamburger button and overlay, handle toggle */
document.addEventListener('DOMContentLoaded', function () {
    const headerContent = document.querySelector('.header-content');
    if (!headerContent) return;

    // Create hamburger button
    const mobileBtn = document.createElement('button');
    mobileBtn.className = 'mobile-menu-btn';
    mobileBtn.setAttribute('aria-label', 'Abrir menú');
    mobileBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;

    // Insert button before the CTA button (or at end)
    const cta = headerContent.querySelector('.cta-button');
    if (cta) headerContent.insertBefore(mobileBtn, cta);
    else headerContent.appendChild(mobileBtn);

    // Create mobile nav overlay
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
        <div class="mobile-panel" role="dialog" aria-modal="true">
            <button class="mobile-close" aria-label="Cerrar menú" style="align-self:flex-end;background:none;border:none;font-size:1.6rem;">&times;</button>
            <nav class="desktop-nav" role="navigation"></nav>
            <div class="mobile-logo-container">
                <img src="assets/img/LOGO WEBP NEGRO.webp" alt="Casa Bonita Logo" class="mobile-logo">
            </div>
        </div>
    `;
    document.body.appendChild(mobileNav);

    // Clone desktop nav links into mobile panel
    const desktopNav = document.querySelector('.desktop-nav');
    const mobilePanelNav = mobileNav.querySelector('.desktop-nav');
    if (desktopNav && mobilePanelNav) {
        mobilePanelNav.innerHTML = desktopNav.innerHTML;
    }

    const openMenu = () => {
        mobileNav.classList.add('open');
        document.documentElement.classList.add('no-scroll');
        document.body.classList.add('no-scroll');
        mobileBtn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
        mobileNav.classList.remove('open');
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
        mobileBtn.setAttribute('aria-expanded', 'false');
    };

    mobileBtn.addEventListener('click', openMenu);
    mobileNav.querySelector('.mobile-close').addEventListener('click', closeMenu);

    // Close when clicking outside panel
    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) closeMenu();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
            closeMenu();
        }
    });

    // Close when clicking a link inside mobile nav
    mobileNav.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        // If link is anchor to section, let it scroll then close
        setTimeout(closeMenu, 150);
    });
});

// Manejo de errores globales
window.addEventListener('error', function (event) {
    console.error('Error en la aplicación:', event.error);
});

// ==========================================
// CARRUSEL DE TESTIMONIOS CON SWIPER
// ==========================================

let testimonialsSwiper;

// Inicializar carrusel de testimonios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    initTestimonialsCarousel();
});
// Cargar la librería Swiper de forma dinámica (solo cuando se necesite)
function loadSwiperLibrary() {
    return new Promise((resolve) => {
        if (typeof Swiper !== 'undefined') {
            resolve();
            return;
        }

        // Asegurar CSS de Swiper
        if (!document.querySelector('link[href*="swiper-bundle.min.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
            document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.warn('No se pudo cargar Swiper desde CDN.');
            resolve();
        };
        document.head.appendChild(script);
    });
}

async function initTestimonialsCarousel() {
    const swiperContainer = document.querySelector('.testimonials-swiper');

    if (!swiperContainer) return;
    // Cargar Swiper solo cuando exista el contenedor
    await loadSwiperLibrary();

    if (typeof Swiper === 'undefined') {
        // Si la librería no está disponible, no inicializamos y salimos
        console.warn('Swiper no está disponible. Saltando inicialización de testimonios.');
        return;
    }

    // Configurar Swiper para carrusel infinito
    testimonialsSwiper = new Swiper('.testimonials-swiper', {
        // Configuración básica para loop infinito
        loop: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 30,

        // Autoplay
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },

        // Velocidad de transición
        speed: 600,

        // Configuración responsive
        breakpoints: {
            320: {
                spaceBetween: 200,
                slidesPerView: 2,
                centeredSlides: true,
            },
            768: {
                spaceBetween: 20,
                slidesPerView: 'auto',
                centeredSlides: true,
            },
            1024: {
                spaceBetween: 30,
                slidesPerView: 3,
                centeredSlides: true,
            }
        },

        // Eventos
        on: {
            init: function () {
                // Contar slides originales (no duplicadas por loop)
                const originalSlides = document.querySelectorAll('.testimonials-swiper .swiper-slide');
                createTestimonialsIndicators(originalSlides.length);
                updateSlideClasses(this);
            },
            slideChange: function () {
                updateSlideClasses(this);
                updateActiveIndicator(this.realIndex);
            }
        }
    });
}

// Función para crear indicadores personalizados
function createTestimonialsIndicators(totalCards) {
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

    for (let i = 0; i < totalCards; i++) {
        const indicator = document.createElement('div');
        indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => {
            if (testimonialsSwiper) {
                testimonialsSwiper.slideToLoop(i);
            }
        });
        indicatorsContainer.appendChild(indicator);
    }
}

// Función para actualizar el indicador activo
function updateActiveIndicator(activeIndex) {
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === activeIndex);
    });
}

// Función para aplicar las clases de estilo originales
function updateSlideClasses(swiper) {
    const slides = swiper.slides;
    const activeIndex = swiper.realIndex;
    const totalSlides = Math.floor(slides.length / 3); // Slides originales sin duplicados

    slides.forEach((slide, index) => {
        const card = slide.querySelector('.testimonio-card');
        if (!card) return;

        // Limpiar todas las clases de estado
        card.classList.remove('active', 'prev', 'next', 'far');

        // Obtener el índice real de la slide
        const realIndex = parseInt(slide.getAttribute('data-swiper-slide-index') || '0');

        // Calcular la distancia desde la slide activa
        const distance = Math.abs(realIndex - activeIndex);

        // Aplicar clases basadas en la posición
        if (realIndex === activeIndex) {
            card.classList.add('active');
        } else if (distance === 1 ||
            (activeIndex === 0 && realIndex === totalSlides - 1) ||
            (activeIndex === totalSlides - 1 && realIndex === 0)) {
            // Determinar si es prev o next considerando el loop circular
            const isPrev = (realIndex === activeIndex - 1) ||
                (activeIndex === 0 && realIndex === totalSlides - 1);
            card.classList.add(isPrev ? 'prev' : 'next');
        } else {
            card.classList.add('far');
        }
    });
}

// Mantener funciones existentes para compatibilidad con botones
function moveCarousel(direction) {
    if (testimonialsSwiper) {
        if (direction > 0) {
            testimonialsSwiper.slideNext();
        } else {
            testimonialsSwiper.slidePrev();
        }
    }
}

function startTestimonialsAutoplay() {
    if (testimonialsSwiper && testimonialsSwiper.autoplay) {
        testimonialsSwiper.autoplay.start();
    }
}

function stopTestimonialsAutoplay() {
    if (testimonialsSwiper && testimonialsSwiper.autoplay) {
        testimonialsSwiper.autoplay.stop();
    }
}

// Funcionalidad del header compacto al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-header');
    let lastScrollTop = 0;
    let isScrolling = false;
    let wasScrolled = false; // Rastrear el estado anterior

    function handleHeaderScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const isCurrentlyScrolled = scrollTop > 0; // Cambio de 100 a 0 para activación inmediata

        // Detectar cambio de estado
        const stateChanged = wasScrolled !== isCurrentlyScrolled;

        // Agregar o quitar la clase 'scrolled' basado en la posición del scroll
        if (isCurrentlyScrolled) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Recalcular padding solo si hubo cambio de estado o al inicializar
        if (stateChanged || wasScrolled === undefined) {
            // Usar timeout para asegurar que las transiciones CSS se completen
            setTimeout(() => {
                updateBodyPadding();
            }, 100); // Ligeramente más que la transición CSS (0.3s)
        }

        wasScrolled = isCurrentlyScrolled;
        lastScrollTop = scrollTop;
        isScrolling = false;
    }

    // Optimizar el rendimiento usando requestAnimationFrame
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            requestAnimationFrame(handleHeaderScroll);
            isScrolling = true;
        }
    });

    // Asegurar que el header inicie correctamente
    handleHeaderScroll();
});

// Sistema inteligente de cálculo de padding del body
function updateBodyPadding() {
    const body = document.body;
    const mainHeader = document.querySelector('.main-header');

    if (!mainHeader) return;

    // Forzar múltiples reflows para obtener medidas precisas
    mainHeader.offsetHeight;

    // Usar requestAnimationFrame doble para asegurar que los cambios CSS se apliquen completamente
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const headerHeight = mainHeader.offsetHeight;
            body.style.paddingTop = headerHeight + 'px';
        });
    });
}

// Configurar el padding inicial y observadores
document.addEventListener('DOMContentLoaded', () => {
    const mainHeader = document.querySelector('.main-header');

    if (mainHeader) {
        // Aplicar padding inicial después de que todo se cargue
        setTimeout(() => {
            updateBodyPadding();
        }, 100);

        // Observar cambios de tamaño de ventana
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateBodyPadding();
            }, 50);
        });

        // Observador de mutaciones para detectar cambios en el DOM del header
        const headerObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            let hasClassChange = false;
            let hasElementRemoved = false;

            mutations.forEach((mutation) => {
                // Detectar cambios en clases (como .scrolled)
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    hasClassChange = true;
                }
                // Detectar eliminación de elementos (como .top-promo)
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    hasElementRemoved = true;
                }
            });

            // Manejar diferentes tipos de cambios con delays apropiados
            if (hasClassChange) {
                // Cambio de clase (scroll): esperar a que termine la transición
                setTimeout(updateBodyPadding, 50);
            } else if (hasElementRemoved) {
                // Elemento removido: delay más corto
                setTimeout(updateBodyPadding, 50);
            }
        });

        // Observar el header y sus cambios
        headerObserver.observe(mainHeader, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }
});

// Barra de progreso de scroll
document.addEventListener('DOMContentLoaded', function () {
    // Crear la barra de progreso
    const header = document.querySelector('.main-header');
    if (header) {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.id = 'scrollProgress';
        header.appendChild(progressBar);
    }

    // Función para actualizar la barra
    function updateScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) return;

        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    }

    // Eventos
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    updateScrollProgress();
});

// Lazy loading para imágenes de fondo
function initLazyBackgrounds() {
    const bgElements = document.querySelectorAll('[data-bg-src]');

    if ('IntersectionObserver' in window) {
        const bgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const bgSrc = element.dataset.bgSrc;

                    if (bgSrc) {
                        // Precargar la imagen
                        const img = new Image();
                        img.onload = () => {
                            // Una vez cargada, aplicar la clase que contiene el background-image
                            element.classList.add('bg-loaded');
                        };
                        img.src = bgSrc;
                    }

                    bgObserver.unobserve(element);
                }
            });
        }, {
            // Cargar la imagen cuando esté a 50px de entrar en el viewport
            rootMargin: '50px'
        });

        bgElements.forEach(element => {
            bgObserver.observe(element);
        });
    } else {
        // Fallback para navegadores que no soportan IntersectionObserver
        bgElements.forEach(element => {
            const bgSrc = element.dataset.bgSrc;
            if (bgSrc) {
                element.classList.add('bg-loaded');
            }
        });
    }
}

// Optimización adicional para imágenes lazy loading
function optimizeLazyImages() {
    // Verificar si el navegador soporta lazy loading nativo
    if ('loading' in HTMLImageElement.prototype) {
        // El navegador soporta lazy loading nativo, no necesitamos hacer nada más
        return;
    }

    // Fallback para navegadores que no soportan lazy loading nativo
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback para navegadores muy antiguos
        lazyImages.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }
}

// Inicializar modelo 3D cuando el DOM esté listo y manejar cambios de tamaño
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar lazy loading del video hero
    initHeroVideoLazyLoad();
    
    // Inicializar lazy loading para backgrounds
    initLazyBackgrounds();

    // Optimizar imágenes lazy loading
    optimizeLazyImages();

    // Listener para cambios de tamaño de ventana
    window.addEventListener('resize', function () {
        const showcaseImage = document.querySelector('.showcase-image');
    });
});
