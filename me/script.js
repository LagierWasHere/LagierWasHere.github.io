const canvas = document.querySelector(".starfield");
const context = canvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const discordTrigger = document.querySelector(".discord-trigger");

let stars = [];
let animationFrame;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const starCount = Math.max(70, Math.floor((window.innerWidth * window.innerHeight) / 11000));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.25 + 0.2,
    opacity: Math.random() * 0.65 + 0.15,
    speed: Math.random() * 0.0015 + 0.0004,
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawStars(time = 0) {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  stars.forEach((star) => {
    const pulse = reducedMotion ? 1 : (Math.sin(time * star.speed + star.phase) + 1) / 2;
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, 255, 255, ${star.opacity * (0.65 + pulse * 0.35)})`;
    context.fill();
  });

  if (!reducedMotion) {
    animationFrame = requestAnimationFrame(drawStars);
  }
}

resizeCanvas();
drawStars();
window.addEventListener("resize", resizeCanvas);

if (reducedMotion && animationFrame) {
  cancelAnimationFrame(animationFrame);
}

discordTrigger.addEventListener("click", () => {
  const isRevealed = discordTrigger.classList.toggle("is-revealed");
  discordTrigger.setAttribute("aria-expanded", String(isRevealed));
});
