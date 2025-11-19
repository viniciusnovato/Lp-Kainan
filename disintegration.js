
class DisintegrationEffect {
    constructor(element) {
        this.element = element;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.particles = [];
        this.isHovering = false;
        this.animationId = null;

        // Config
        this.particleSize = 2;
        this.gap = 2; // Gap between particles for performance
        this.mouseRadius = 80;
        this.returnSpeed = 0.08;

        this.init();
    }

    init() {
        this.element.style.position = 'relative';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10';
        this.element.appendChild(this.canvas);

        // Wait for fonts to load
        document.fonts.ready.then(() => {
            this.resize();
            this.createParticles();
            this.addListeners();
        });

        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
    }

    resize() {
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createParticles() {
        // Draw text to canvas first to get pixel data
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Replicate text styles
        const computedStyle = window.getComputedStyle(this.element);
        this.ctx.font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Gradient for text
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.5, '#3B82F6');
        gradient.addColorStop(1, '#0055FF');
        this.ctx.fillStyle = gradient;

        // Draw text (handling multi-line)
        const lines = this.element.innerText.split('\n');
        const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
        const startY = (this.height - (lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
            this.ctx.fillText(line, this.width / 2, startY + index * lineHeight);
        });

        // Get pixel data
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        this.particles = [];

        for (let y = 0; y < this.height; y += this.gap) {
            for (let x = 0; x < this.width; x += this.gap) {
                const index = (y * this.width + x) * 4;
                const alpha = data[index + 3];

                if (alpha > 0) {
                    this.particles.push({
                        x: x,
                        y: y,
                        originX: x,
                        originY: y,
                        color: `rgba(${data[index]}, ${data[index + 1]}, ${data[index + 2]}, ${alpha / 255})`,
                        size: this.particleSize,
                        vx: 0,
                        vy: 0,
                        ease: Math.random() * 0.1 + 0.05
                    });
                }
            }
        }

        // Clear canvas after getting data
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    addListeners() {
        this.element.addEventListener('mouseenter', () => {
            this.isHovering = true;
            this.element.style.color = 'transparent'; // Hide original text
            this.element.style.webkitTextFillColor = 'transparent';
            this.animate();
        });

        this.element.addEventListener('mouseleave', () => {
            this.isHovering = false;
        });

        this.element.addEventListener('mousemove', (e) => {
            if (!this.isHovering) return;
            const rect = this.element.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        let allBack = true;

        this.particles.forEach(p => {
            if (this.isHovering) {
                // Impact/Throw Logic
                const dx = this.mouseX - p.x;
                const dy = this.mouseY - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = this.mouseRadius;

                // Explosive force when close
                if (distance < this.mouseRadius) {
                    const force = (maxDistance - distance) / maxDistance;
                    // Much stronger force for "Impact" feel
                    const directionX = forceDirectionX * force * 50;
                    const directionY = forceDirectionY * force * 50;

                    p.vx -= directionX;
                    p.vy -= directionY;
                    allBack = false;
                }

                // Gravity effect (falling like sweat/ink)
                if (!allBack) {
                    p.vy += 0.5; // Gravity
                }

            } else {
                // Return to origin logic (Elastic snap back)
                const dx = p.x - p.originX;
                const dy = p.y - p.originY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0.5) {
                    p.vx -= dx * 0.1; // Stronger snap
                    p.vy -= dy * 0.1;
                    allBack = false;
                } else {
                    p.x = p.originX;
                    p.y = p.originY;
                    p.vx = 0;
                    p.vy = 0;
                }
            }

            // Friction
            p.vx *= 0.85; // Heavier friction
            p.vy *= 0.85;

            p.x += p.vx;
            p.y += p.vy;

            // Render as circles (Ink/Sweat drops)
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });

        if (!this.isHovering && allBack) {
            // Animation finished, restore text
            this.element.style.color = '';
            this.element.style.webkitTextFillColor = '';
            this.ctx.clearRect(0, 0, this.width, this.height);
            cancelAnimationFrame(this.animationId);
        } else {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}

// Initialize
const heroTitle = document.getElementById('hero-title');
if (heroTitle) {
    new DisintegrationEffect(heroTitle);
}
