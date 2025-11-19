import { Player } from "./Player";

export class Chest {
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  hasPet: boolean;
  color: string;
  goldColor: string;
  private animationFrame: number;
  private glowIntensity: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 40;
    this.isOpen = false;
    this.hasPet = true;
    this.color = "#8B4513";
    this.goldColor = "#ffd700";
    this.animationFrame = 0;
    this.glowIntensity = 0;
  }

  checkCollision(player: Player) {
    return player.x < this.x + this.width && player.x + player.width > this.x && player.y < this.y + this.height && player.y + player.height > this.y;
  }

  open() {
    if (!this.isOpen) {
      this.isOpen = true;
      return this.hasPet;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.animationFrame++;

    // Ombre
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height + 5, this.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.isOpen) {
      // Effet de brillance
      this.glowIntensity = Math.sin(this.animationFrame * 0.1) * 0.3 + 0.7;

      // Corps du coffre avec gradient
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, "#5D2E0A");
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Bordure dorée avec effet de brillance
      ctx.strokeStyle = this.goldColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.goldColor;
      ctx.shadowBlur = 10 * this.glowIntensity;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      ctx.shadowBlur = 0;

      // Serrure avec effet
      ctx.fillStyle = this.goldColor;
      ctx.shadowColor = this.goldColor;
      ctx.shadowBlur = 5;
      ctx.fillRect(this.x + this.width / 2 - 5, this.y + this.height / 2 - 5, 10, 10);
      ctx.shadowBlur = 0;

      // Effet de brillance animé
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * this.glowIntensity})`;
      ctx.fillRect(this.x + 5, this.y + 5, 15, 10);
    } else {
      // Coffre ouvert
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height / 2);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, "#5D2E0A");
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height / 2);

      // Bordure dorée
      ctx.strokeStyle = this.goldColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x, this.y, this.width, this.height / 2);

      // Pet à l'intérieur avec animation
      if (this.hasPet) {
        const petBounce = Math.sin(this.animationFrame * 0.2) * 2;
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(this.x + 15, this.y + 5 + petBounce, 20, 15);

        // Yeux du pet
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 18, this.y + 8 + petBounce, 3, 3);
        ctx.fillRect(this.x + 24, this.y + 8 + petBounce, 3, 3);

        // Sourire
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 12 + petBounce, 5, 0, Math.PI);
        ctx.stroke();
      }

      // Particules dorées
      for (let i = 0; i < 5; i++) {
        const angle = (this.animationFrame * 0.1 + i * 1.2) % (Math.PI * 2);
        const radius = 15 + Math.sin(this.animationFrame * 0.2) * 5;
        const px = this.x + this.width / 2 + Math.cos(angle) * radius;
        const py = this.y + this.height / 2 + Math.sin(angle) * radius;
        ctx.fillStyle = this.goldColor;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  }
}
