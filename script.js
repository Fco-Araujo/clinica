document.addEventListener("DOMContentLoaded", function () {
  // ==================== MENU MOBILE ====================
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("active");
    this.querySelector("i").classList.toggle("fa-times");
    this.querySelector("i").classList.toggle("fa-bars");
  });

  // Fechar menu ao clicar em um link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function () {
      navLinks.classList.remove("active");
      menuToggle.querySelector("i").classList.remove("fa-times");
      menuToggle.querySelector("i").classList.add("fa-bars");
    });
  });

  // ==================== SCROLL SUAVE ====================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  // ==================== NAVBAR NO SCROLL ====================
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // ==================== CARROSSEL PRINCIPAL ====================
  let currentSlide = 0;
  const slides = document.querySelectorAll(".carousel-item");
  const indicators = document.querySelectorAll(".indicator");
  const totalSlides = slides.length;
  let slideInterval;

  // Função para mostrar slide
  function showSlide(index) {
    if (index >= totalSlides) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = totalSlides - 1;
    } else {
      currentSlide = index;
    }

    document.querySelector(".carousel-inner").style.transform = `translateX(-${
      currentSlide * 100
    }%)`;

    // Atualizar indicadores
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === currentSlide);
    });
  }

  // Navegação do carrossel
  window.moveSlide = function (step) {
    showSlide(currentSlide + step);
    resetInterval();
  };

  window.goToSlide = function (index) {
    showSlide(index);
    resetInterval();
  };

  // Reiniciar intervalo
  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      moveSlide(1);
    }, 5000);
  }

  // Iniciar carrossel automático
  function startCarousel() {
    slideInterval = setInterval(() => {
      moveSlide(1);
    }, 5000);
  }

  // Controles do carrossel
  const carousel = document.querySelector(".carousel");
  if (carousel) {
    // Pausar no hover
    carousel.addEventListener("mouseenter", () => {
      clearInterval(slideInterval);
    });

    carousel.addEventListener("mouseleave", () => {
      startCarousel();
    });

    // Touch events para mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(slideInterval);
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startCarousel();
      },
      { passive: true }
    );

    function handleSwipe() {
      const difference = touchStartX - touchEndX;
      if (difference > 50) moveSlide(1); // Swipe para esquerda
      if (difference < -50) moveSlide(-1); // Swipe para direita
    }
  }

  // Inicializar carrossel
  showSlide(0);
  startCarousel();

  // ==================== CARROSSEL DE SERVIÇOS ====================
  const servicesCarousel = document.querySelector(".services-carousel");

  if (servicesCarousel) {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Desktop - Mouse events
    servicesCarousel.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - servicesCarousel.offsetLeft;
      scrollLeft = servicesCarousel.scrollLeft;
      servicesCarousel.style.cursor = "grabbing";
      servicesCarousel.style.scrollBehavior = "auto";
    });

    servicesCarousel.addEventListener("mouseleave", () => {
      isDown = false;
      servicesCarousel.style.cursor = "grab";
    });

    servicesCarousel.addEventListener("mouseup", () => {
      isDown = false;
      servicesCarousel.style.cursor = "grab";
      servicesCarousel.style.scrollBehavior = "smooth";
    });

    servicesCarousel.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - servicesCarousel.offsetLeft;
      const walk = (x - startX) * 2;
      servicesCarousel.scrollLeft = scrollLeft - walk;
    });

    // Mobile - Touch events
    let touchStartX = 0;

    servicesCarousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].pageX;
      },
      { passive: true }
    );

    servicesCarousel.addEventListener(
      "touchmove",
      (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.touches[0].pageX - servicesCarousel.offsetLeft;
        const walk = (x - startX) * 2;
        servicesCarousel.scrollLeft = scrollLeft - walk;
      },
      { passive: false }
    );
  }

  // ==================== ANIMAÇÕES AO SCROLL ====================
  const animateOnScroll = function () {
    const elements = document.querySelectorAll(
      ".service-card, .about-img, .contact-form, .info-item"
    );

    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;

      if (elementPosition < screenPosition) {
        element.style.opacity = "1";
        element.style.transform = "translate(0)";
      }
    });
  };

  // Configurar animações iniciais
  function setupAnimations() {
    document.querySelectorAll(".service-card").forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(50px)";
      card.style.transition = `all 0.5s ease ${index * 0.1}s`;
    });

    const aboutImg = document.querySelector(".about-img");
    if (aboutImg) {
      aboutImg.style.opacity = "0";
      aboutImg.style.transform = "translateX(50px)";
      aboutImg.style.transition = "all 0.5s ease 0.2s";
    }

    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
      contactForm.style.opacity = "0";
      contactForm.style.transform = "translateY(50px)";
      contactForm.style.transition = "all 0.5s ease";
    }

    document.querySelectorAll(".info-item").forEach((item, index) => {
      item.style.opacity = "0";
      item.style.transform = "translateX(-50px)";
      item.style.transition = `all 0.5s ease ${index * 0.1}s`;
    });
  }

  // Inicializar animações
  setupAnimations();
  window.addEventListener("load", animateOnScroll);
  window.addEventListener("scroll", animateOnScroll);

  // ==================== FORMULÁRIO DE CONTATO ====================
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Simular envio (substituir por código real)
      const submitBtn = this.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";

      setTimeout(() => {
        submitBtn.textContent = "Mensagem Enviada!";
        submitBtn.style.backgroundColor = "#4CAF50";

        // Resetar formulário
        setTimeout(() => {
          contactForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.style.backgroundColor = "";
          submitBtn.disabled = false;
        }, 2000);
      }, 1500);
    });
  }
});
