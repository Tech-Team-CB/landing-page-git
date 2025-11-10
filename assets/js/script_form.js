// ====================================
// SCRIPT PARA CONECTAR FORMULARIO CON PROXY FASTAPI
// Casa Bonita Residencial - Landing Page
// ====================================

// Configuración del proxy
const PROXY_URL = 'https://landing.casabonita.pe';

// ====================================
// FUNCIÓN PRINCIPAL DEL FORMULARIO
// ====================================

async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Deshabilitar botón para evitar múltiples envíos
    submitButton.disabled = true;
    submitButton.innerHTML = '⏳ Enviando...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // ===== VALIDACIONES =====
    
    // 1. Validar términos y condiciones
    if (!data.terminos) {
        showToast('Error: Debes aceptar los términos y condiciones', 'error');
        resetButton(submitButton, originalButtonText);
        return;
    }

    // 2. Validar campos obligatorios
    const requiredFields = {
        'nombre': 'nombre completo',
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        if (!data[field] || data[field].trim() === '') {
            showToast(`Error: Por favor ingresa tu ${label}`, 'error');
            resetButton(submitButton, originalButtonText);
            return;
        }
    }

    // 3. Validar email (si se proporciona)
    if (data.email && !isValidEmail(data.email)) {
        showToast('Error: Por favor ingresa un email válido', 'error');
        resetButton(submitButton, originalButtonText);
        return;
    }

    // 4. Validar teléfono (si se proporciona)
    if (data.telefono && data.telefono.replace(/\D/g, '').length < 9) {
        showToast('Error: Por favor ingresa un teléfono válido', 'error');
        resetButton(submitButton, originalButtonText);
        return;
    }

    // ===== EVALUAR ELEGIBILIDAD PARA BONO TECHO PROPIO =====
    const cumpleRequisitos = (
        data.pregunta1 === 'si' &&
        data.pregunta2 === 'si' &&
        data.pregunta3 === 'no' &&
        data.pregunta4 === 'no'
    );

    // Si NO cumple requisitos, enviar a Mantra y mostrar mensaje
    if (!cumpleRequisitos) {
        // Preparar datos para Mantra
        const nombreCompleto = `${data.nombre}`.trim();
        const telefonoLimpio = data.telefono ? data.telefono.replace(/\D/g, '') : '';
        
        // Enviar a Mantra (en paralelo, no bloqueante)
        if (telefonoLimpio.length >= 9) {
            const mantraData = {
                name: nombreCompleto,
                phone: telefonoLimpio,
                countryCode: "51",
                custom_1: "Landing Page - No calificado para Bono Techo Propio"
            };
            
            if (data.email && data.email.trim()) {
                mantraData.email = data.email.trim();
            }
            
            // Enviar a Mantra sin esperar respuesta (fire and forget)
            fetch(`${PROXY_URL}/api/mantra/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mantraData)
            }).then(res => {
                console.log('✅ Contacto enviado a Mantra:', res.status);
            }).catch(err => {
                console.error('❌ Error al enviar a Mantra:', err);
            });
        }
        
        // Mostrar mensaje al usuario
        showToast(
            'Gracias por tu interés en Casa Bonita Residencial. ' +
            'Hemos evaluado tu información y, lamentablemente, en este momento no cumples con los requisitos ' +
            'necesarios para acceder al Bono de Techo Propio. ' +
            'Sin embargo, mantendremos tu información en nuestra base de datos y te contactaremos ' +
            'para futuras evaluaciones y oportunidades que se ajusten mejor a tu perfil. ' +
            '¡No pierdas la esperanza, seguimos en contacto!',
            'warning'
        );
        
        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
            form.reset();
            resetButton(submitButton, originalButtonText);
        }, 3000);
        
        return; // NO continuar con el envío al CRM
    }

    // ===== SI CUMPLE REQUISITOS, CONTINUAR CON EL ENVÍO AL CRM =====

    // ===== PROCESAR DATOS =====
    
    // Separar nombre completo
    const nombreParts = data.nombre.trim().split(/\s+/);
    const firstName = nombreParts[0];
    const paternalLastname = nombreParts[1] || '';
    const maternalLastname = nombreParts.slice(2).join(' ') || '';

    // ===== CONSTRUIR PAYLOAD =====
    const leadData = {
        portalCode: "WEB",
        projectCode: "CASABONITA",
        documentType: 1,
        firstName: firstName
    };

    // Agregar campos opcionales solo si existen
    if (paternalLastname) leadData.paternalLastname = paternalLastname;
    if (maternalLastname) leadData.maternalLastname = maternalLastname;
    if (data.email) leadData.email = data.email.trim();
    if (data.telefono) {
        const phoneClean = data.telefono.replace(/\D/g, '');
        leadData.phoneNumber = phoneClean.startsWith('51') ? `+${phoneClean}` : `+51${phoneClean}`;
    }
    if (data.mensaje) leadData.comment = data.mensaje.trim();

    // ===== ENVIAR AL PROXY =====
    try {
        const response = await fetch(`${PROXY_URL}/api/leads/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });

        const result = await response.json();

        if (response.ok && result.succeeded) {
            // ✅ ÉXITO
            
            showToast('¡Formulario enviado exitosamente! Nuestros asesores te contactarán pronto.', 'success');
            
            // Limpiar formulario después de 1.5 segundos
            setTimeout(() => {
                form.reset();
                resetButton(submitButton, originalButtonText);
            }, 1500);
            
        } else {
            // ❌ ERROR DEL SERVIDOR
            console.error('❌ Error en la respuesta:', result);
            
            // Mostrar errores detallados si existen
            if (result.errors && Array.isArray(result.errors)) {
                console.error('❌ Errores detallados:', result.errors);
                result.errors.forEach((error, index) => {
                    console.error(`   Error ${index + 1}:`, error);
                });
            }
            
            throw new Error(result.message || result.error || 'Error al enviar el formulario');
        }

    } catch (error) {
        console.error('❌ Error al enviar formulario:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al enviar el formulario. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'No se pudo conectar con el servidor. ¿Está el proxy ejecutándose?';
        } else {
            errorMessage += error.message;
        }
        
        showToast(errorMessage, 'error');
        resetButton(submitButton, originalButtonText);
    }

    return false;
}

// ====================================
// FUNCIONES AUXILIARES
// ====================================

function resetButton(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showToast(message, type = 'info') {
    // Eliminar toast existente si lo hay
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Iconos según el tipo
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Estilos del toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        left: '20px',
        margin: '0 auto',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '500px',
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.5',
        animation: 'slideInDown 0.3s ease-out',
        backgroundColor: type === 'success' ? '#10b981' : 
                         type === 'error' ? '#ef4444' : 
                         type === 'warning' ? '#f59e0b' : '#3b82f6',
        color: 'white'
    });
    
    document.body.appendChild(toast);
    
    // Auto-remover después de 5 segundos (o 8 para warning/mensajes largos)
    const duration = type === 'warning' ? 8000 : 5000;
    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Agregar estilos de animación al documento
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideInDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
        
        .toast-icon {
            font-size: 20px;
            flex-shrink: 0;
        }
        
        .toast-message {
            flex: 1;
            line-height: 1.4;
        }
        
        @media (max-width: 768px) {
            .toast {
                left: 10px !important;
                right: 10px !important;
                top: 10px !important;
                font-size: 13px !important;
                padding: 14px 16px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// ====================================
// FUNCIONES DE NAVEGACIÓN (del script original)
// ====================================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
        const elementPosition = element.offsetTop - headerHeight - 20;

        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

function openWhatsApp() {
    const mensaje = 'Hola, quiero información sobre Casa Bonita Residencial';
    const whatsappUrl = `https://wa.me/51946552086?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
}

// ====================================
// INICIALIZACIÓN
// ====================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario de contacto
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    } else {
        console.warn('⚠️ No se encontró el formulario con id "contactForm"');
    }
});

// ====================================
// TEST DE CONEXIÓN AL PROXY (Desarrollo)
// ====================================

async function testProxyConnection() {
    try {
        const response = await fetch(`${PROXY_URL}/health`);
        const data = await response.json();
        
        if (response.ok && data.status === 'healthy') {
            console.log('✅ Proxy conectado correctamente:', data);
            return true;
        } else {
            console.warn('⚠️ Proxy respondió pero con problemas:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ No se pudo conectar con el proxy:', error.message);
        console.error('   Asegúrate de que el proxy esté ejecutándose en', PROXY_URL);
        return false;
    }
}

// Ejecutar test de conexión al cargar (solo en desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    testProxyConnection();
}
