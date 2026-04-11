// Premium IRSHAD Landing Page Interactivity

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  
  // Sticky Navbar Effect on Scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.style.padding = '16px 0';
      navbar.style.backgroundColor = 'rgba(10, 41, 37, 0.95)';
    } else {
      navbar.style.padding = '24px 0';
      navbar.style.backgroundColor = 'rgba(10, 41, 37, 0.8)';
    }
  });

  // Smooth Scrolling for Anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Simple Reveal Animation on Scroll
  const observerOptions = {
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
});
