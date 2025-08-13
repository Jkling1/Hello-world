// IronMind Protocol Interactive Elements

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // For demo purposes, show alert
            // In real implementation, this would redirect to application form
            setTimeout(() => {
                alert('Ready to begin your transformation? This would redirect to the application form.');
            }, 200);
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections for scroll animations
    const sections = document.querySelectorAll('.benefits, .pricing, .tools, .quote-banner, .founder-note, .exit-cta');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        observer.observe(section);
    });

    // Enhanced hover effects for benefit items
    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 107, 53, 0.1)';
            this.style.borderColor = 'rgba(255, 107, 53, 0.8)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.05)';
            this.style.borderColor = 'rgba(255, 107, 53, 0.2)';
        });
    });

    // Tool items rainbow border animation on hover
    const toolItems = document.querySelectorAll('.tool-item');
    toolItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.3)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });

    // Floating animation for hero elements
    function addFloatingAnimation() {
        const heroElements = document.querySelectorAll('.benefit-icon, .tool-icon');
        
        heroElements.forEach((element, index) => {
            const delay = index * 0.2;
            const duration = 3 + Math.random() * 2; // Random duration between 3-5s
            
            element.style.animation = `float ${duration}s ease-in-out infinite`;
            element.style.animationDelay = `${delay}s`;
        });
    }

    // Rainbow text animation for quote
    function animateQuoteText() {
        const quoteText = document.querySelector('.quote-text');
        if (quoteText) {
            let hue = 0;
            setInterval(() => {
                hue = (hue + 1) % 360;
                const color1 = `hsl(${hue}, 70%, 60%)`;
                const color2 = `hsl(${(hue + 60) % 360}, 70%, 60%)`;
                const color3 = `hsl(${(hue + 120) % 360}, 70%, 60%)`;
                
                quoteText.style.background = `linear-gradient(45deg, ${color1}, ${color2}, ${color3})`;
                quoteText.style.webkitBackgroundClip = 'text';
                quoteText.style.backgroundClip = 'text';
            }, 50);
        }
    }

    // Parallax effect for background orbs
    function addParallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const orbs = document.querySelectorAll('.orb');
            
            orbs.forEach((orb, index) => {
                const speed = 0.1 + (index * 0.05);
                const yPos = -(scrolled * speed);
                orb.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
            });
        });
    }

    // Dynamic gradient animation for pricing card
    function animatePricingCard() {
        const pricingCard = document.querySelector('.pricing-card');
        if (pricingCard) {
            let angle = 0;
            setInterval(() => {
                angle = (angle + 1) % 360;
                const gradient = `linear-gradient(${angle}deg, #ff6b35, #ff1493, #8a2be2, #00bfff)`;
                pricingCard.style.setProperty('--border-gradient', gradient);
            }, 50);
        }
    }

    // Typewriter effect for hero headline (optional enhancement)
    function typewriterEffect() {
        const headline = document.querySelector('.hero-headline');
        if (headline) {
            const text = headline.textContent;
            headline.textContent = '';
            headline.style.borderRight = '2px solid #ff6b35';
            
            let i = 0;
            const typeSpeed = 50;
            
            function typeWriter() {
                if (i < text.length) {
                    headline.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, typeSpeed);
                } else {
                    // Remove cursor after typing is complete
                    setTimeout(() => {
                        headline.style.borderRight = 'none';
                    }, 1000);
                }
            }
            
            // Start typewriter effect after a short delay
            setTimeout(typeWriter, 1000);
        }
    }

    // Performance optimization: only run expensive animations if user prefers motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (!prefersReducedMotion.matches) {
        addFloatingAnimation();
        animateQuoteText();
        addParallaxEffect();
        animatePricingCard();
        // Uncomment the next line if you want the typewriter effect
        // typewriterEffect();
    }

    // Add loading complete class to body
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Easter egg: Konami code for extra rainbow effects
    let konamiCode = [];
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // Up Up Down Down Left Right Left Right B A
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > konami.length) {
            konamiCode.shift();
        }
        
        if (JSON.stringify(konamiCode) === JSON.stringify(konami)) {
            // Activate rainbow mode
            document.body.style.filter = 'hue-rotate(0deg)';
            let hue = 0;
            const rainbowInterval = setInterval(() => {
                hue = (hue + 5) % 360;
                document.body.style.filter = `hue-rotate(${hue}deg)`;
            }, 50);
            
            // Show special message
            const message = document.createElement('div');
            message.textContent = '🌈 RAINBOW MODE ACTIVATED! 🌈';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-size: 2rem;
                z-index: 9999;
                animation: fadeInUp 0.5s ease-out;
            `;
            document.body.appendChild(message);
            
            setTimeout(() => {
                document.body.removeChild(message);
                clearInterval(rainbowInterval);
                document.body.style.filter = '';
            }, 3000);
            
            konamiCode = [];
        }
    });
});

// Utility function for smooth scrolling
function smoothScrollTo(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add some CSS for the fade-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .loaded {
        animation: fadeInUp 0.5s ease-out;
    }
`;
document.head.appendChild(style);