/* ==========================================
   ARBITRAGEAR - ANIMATIONS JS v7.0
   Utilidades de Animación
   ========================================== */

/**
 * Utilidades de animación
 */
const AnimationUtils = {
  /**
   * Trigger animación en un elemento
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} animationName - Nombre de la animación
   * @param {number} duration - Duración en ms
   */
  trigger(element, animationName, duration = 300) {
    if (!element) return;

    // Resetear animación
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow

    // Aplicar nueva animación
    element.style.animation = `${animationName} ${duration}ms ease-out`;
  },

  /**
   * Stagger animation para hijos
   * @param {HTMLElement} container - Contenedor con hijos
   * @param {string} animationName - Nombre de la animación
   * @param {number} staggerDelay - Delay entre cada hijo en ms
   */
  stagger(container, animationName, staggerDelay = 100) {
    if (!container) return;

    const children = container.children;
    Array.from(children).forEach((child, index) => {
      child.style.animationDelay = `${index * staggerDelay}ms`;
      child.classList.add(animationName);
    });
  },

  /**
   * Intersection Observer para animaciones al scroll
   * @param {NodeList|Array} elements - Elementos a observar
   * @param {string} animationName - Nombre de la animación
   * @param {number} threshold - Umbral de visibilidad (0-1)
   */
  observe(elements, animationName, threshold = 0.1) {
    if (!elements || elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationName);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    elements.forEach(el => observer.observe(el));

    return observer;
  },

  /**
   * Count up animation para números
   * @param {HTMLElement} element - Elemento con el número
   * @param {number} finalValue - Valor final
   * @param {number} duration - Duración en ms
   */
  countUp(element, finalValue, duration = 1000) {
    if (!element) return;

    const startValue = 0;
    const startTime = performance.now();
    const isFloat = finalValue % 1 !== 0;

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out-expo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (finalValue - startValue) * easedProgress;
      element.textContent = isFloat ? currentValue.toFixed(1) : Math.round(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Animar progress ring SVG
   * @param {HTMLElement} ring - Elemento circle del ring
   * @param {number} percent - Porcentaje (0-100)
   * @param {number} duration - Duración en ms
   */
  animateProgressRing(ring, percent, duration = 1000) {
    if (!ring) return;

    // Calcular stroke-dashoffset
    // stroke-dasharray: 283 (2 * PI * 45)
    const circumference = 283;
    const targetOffset = circumference - (circumference * percent) / 100;

    // Animar usando Web Animations API
    ring.animate([{ strokeDashoffset: circumference }, { strokeDashoffset: targetOffset }], {
      duration: duration,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    });
  },

  /**
   * Flash de color en un elemento
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} type - 'up' o 'down'
   */
  flashPrice(element, type = 'up') {
    if (!element) return;

    const animationClass = type === 'up' ? 'animate-price-flash-up' : 'animate-price-flash-down';

    // Remover y volver a agregar para retrigger
    element.classList.remove(animationClass);
    element.offsetHeight; // Trigger reflow
    element.classList.add(animationClass);

    // Limpiar después de la animación
    setTimeout(() => {
      element.classList.remove(animationClass);
    }, 500);
  },

  /**
   * Toggle de animación
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} animationClass - Clase de animación
   * @param {boolean} state - true para agregar, false para remover
   */
  toggleAnimation(element, animationClass, state = true) {
    if (!element) return;

    if (state) {
      element.classList.add(animationClass);
    } else {
      element.classList.remove(animationClass);
    }
  },

  /**
   * Animar entrada de elementos con stagger
   * @param {string} selector - Selector CSS de los elementos
   * @param {string} animationClass - Clase de animación
   * @param {number} staggerDelay - Delay entre elementos
   */
  animateEntrance(selector, animationClass = 'animate-fade-in-up', staggerDelay = 100) {
    const elements = document.querySelectorAll(selector);

    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * staggerDelay}ms`;
      el.classList.add(animationClass);
    });
  },

  /**
   * Crear animación personalizada
   * @param {string} name - Nombre de la animación
   * @param {Object} keyframes - Keyframes de la animación
   */
  createAnimation(name, keyframes) {
    const keyframeString = Object.entries(keyframes)
      .map(([percent, styles]) => {
        const styleString = Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value}`)
          .join('; ');
        return `${percent} { ${styleString}; }`;
      })
      .join(' ');

    const style = document.createElement('style');
    style.textContent = `@keyframes ${name} { ${keyframeString} }`;
    document.head.appendChild(style);
  },

  /**
   * Animar múltiples elementos en secuencia
   * @param {Array<HTMLElement>} elements - Array de elementos
   * @param {string} animationClass - Clase de animación
   * @param {number} delay - Delay entre elementos
   */
  animateSequence(elements, animationClass, delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add(animationClass);
      }, index * delay);
    });
  },

  /**
   * Parar animación en un elemento
   * @param {HTMLElement} element - Elemento con animación
   */
  stopAnimation(element) {
    if (!element) return;

    const computedStyle = window.getComputedStyle(element);
    const animationName = computedStyle.animationName;

    if (animationName && animationName !== 'none') {
      element.style.animation = 'none';
      element.offsetHeight; // Trigger reflow
    }
  },

  /**
   * Pausar animación en un elemento
   * @param {HTMLElement} element - Elemento con animación
   */
  pauseAnimation(element) {
    if (!element) return;
    element.style.animationPlayState = 'paused';
  },

  /**
   * Reanudar animación pausada
   * @param {HTMLElement} element - Elemento con animación
   */
  resumeAnimation(element) {
    if (!element) return;
    element.style.animationPlayState = 'running';
  },

  /**
   * Verificar si prefers-reduced-motion está activo
   * @returns {boolean}
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Safe animation - Solo anima si no hay prefer-reduced-motion
   * @param {HTMLElement} element - Elemento a animar
   * @param {string} animationClass - Clase de animación
   */
  safeAnimate(element, animationClass) {
    if (this.prefersReducedMotion()) {
      element.classList.add(animationClass);
      return;
    }

    element.classList.add(animationClass);
  }
};

/**
 * Clase para manejar animaciones complejas
 */
class AnimationController {
  constructor() {
    this.activeAnimations = new Map();
    this.observers = new Map();
  }

  /**
   * Registrar una animación
   * @param {string} id - Identificador único
   * @param {Function} animationFn - Función de animación
   */
  register(id, animationFn) {
    this.activeAnimations.set(id, animationFn);
  }

  /**
   * Ejecutar una animación registrada
   * @param {string} id - Identificador de la animación
   * @param {...any} args - Argumentos para la función
   */
  execute(id, ...args) {
    const animationFn = this.activeAnimations.get(id);
    if (animationFn) {
      animationFn(...args);
    }
  }

  /**
   * Cancelar una animación activa
   * @param {string} id - Identificador de la animación
   */
  cancel(id) {
    const animationFn = this.activeAnimations.get(id);
    if (animationFn && typeof animationFn.cancel === 'function') {
      animationFn.cancel();
    }
    this.activeAnimations.delete(id);
  }

  /**
   * Cancelar todas las animaciones
   */
  cancelAll() {
    this.activeAnimations.forEach(fn => {
      if (typeof fn.cancel === 'function') {
        fn.cancel();
      }
    });
    this.activeAnimations.clear();
  }

  /**
   * Crear un observer persistente
   * @param {string} id - Identificador del observer
   * @param {Function} callback - Callback del observer
   * @param {Object} options - Opciones del observer
   */
  createObserver(id, callback, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '50px'
    };

    const observer = new IntersectionObserver(callback, { ...defaultOptions, ...options });
    this.observers.set(id, observer);

    return observer;
  }

  /**
   * Obtener un observer existente
   * @param {string} id - Identificador del observer
   */
  getObserver(id) {
    return this.observers.get(id);
  }

  /**
   * Desconectar un observer
   * @param {string} id - Identificador del observer
   */
  disconnectObserver(id) {
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }
  }

  /**
   * Desconectar todos los observers
   */
  disconnectAllObservers() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

/**
 * Instancia global del controlador
 */
const animationController = new AnimationController();

/**
 * Inicializar animaciones en el DOM
 */
function initAnimations() {
  // Auto-inicializar animaciones de entrada
  const animatedElements = document.querySelectorAll('[data-animate]');

  animatedElements.forEach(el => {
    const animationName = el.dataset.animate;
    const delay = parseInt(el.dataset.delay) || 0;

    setTimeout(() => {
      el.classList.add(animationName);
    }, delay);
  });

  // Inicializar observers para scroll animations
  const scrollElements = document.querySelectorAll('[data-observe]');

  scrollElements.forEach(el => {
    const animationName = el.dataset.observe;
    const threshold = parseFloat(el.dataset.threshold) || 0.1;

    animationController.observe(
      el,
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(animationName);
          }
        });
      },
      { threshold }
    );
  });
}

// Auto-inicializar cuando el DOM esté listo
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AnimationUtils,
    AnimationController,
    animationController,
    initAnimations
  };
}

// Exportar al ámbito global para uso en el navegador
if (typeof window !== 'undefined') {
  window.AnimationUtils = AnimationUtils;
  window.AnimationController = AnimationController;
  window.animationController = animationController;
  window.initAnimations = initAnimations;
}
