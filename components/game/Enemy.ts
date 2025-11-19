import { Player } from "./Player";

export class Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  type: string;
  color: string;
  attackCooldown: number;
  attackRange: number;
  isAttacking: boolean;
  direction: number;
  private animationFrame: number;
  private attackAnimationFrame: number;
  private hurtFlash: number;
  private sprite: HTMLImageElement | null = null;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number, type: string = "normal") {
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 50;
    this.speed = 2;
    this.health = 30;
    this.maxHealth = 30;
    this.type = type;
    this.color = type === "normal" ? "#ff4444" : "#ff8800";
    this.attackCooldown = 0;
    this.attackRange = 30;
    this.isAttacking = false;
    this.direction = -1;
    this.animationFrame = 0;
    this.attackAnimationFrame = 0;
    this.hurtFlash = 0;
    this.loadSprite();
  }

  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      // Ajuster la taille selon l'image
      if (this.sprite) {
        const aspectRatio = this.sprite.height / this.sprite.width;
        this.width = 40;
        this.height = this.width * aspectRatio;
      }
    };
    this.sprite.onerror = () => {
      console.warn("Impossible de charger ennemi.png");
      this.spriteLoaded = false;
    };
    this.sprite.src = "/assets/ennemi.png";
  }

  update(player: Player, canvas: HTMLCanvasElement) {
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (this.hurtFlash > 0) {
      this.hurtFlash--;
    }

    // IA améliorée : se déplacer vers le joueur avec pathfinding simple
    const distance = player.x - this.x;
    const absDistance = Math.abs(distance);

    if (absDistance > this.attackRange + 10) {
      // Se déplacer vers le joueur
      this.x += Math.sign(distance) * this.speed;
    } else if (absDistance < this.attackRange && this.attackCooldown === 0) {
      // Attaquer si proche
      this.attack();
    }

    // Garder sur le canvas
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    // Position Y (sol)
    const groundY = canvas.height - 30;
    this.y = groundY - this.height;

    this.direction = Math.sign(distance);
    this.animationFrame++;
  }

  attack() {
    this.isAttacking = true;
    this.attackCooldown = 60;
    this.attackAnimationFrame = 0;
    setTimeout(() => {
      this.isAttacking = false;
    }, 400);
  }

  takeDamage(amount: number) {
    this.health -= amount;
    this.hurtFlash = 10;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  isDead() {
    return this.health <= 0;
  }

  getAttackBox() {
    return {
      x: this.direction === 1 ? this.x + this.width : this.x - this.attackRange,
      y: this.y + 10,
      width: this.attackRange,
      height: this.height - 20,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Effet de flash quand blessé
    if (this.hurtFlash > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ombre
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height + 5, this.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dessiner le sprite si chargé
    if (this.spriteLoaded && this.sprite) {
      // Miroir l'image si direction gauche (vers le joueur)
      if (this.direction === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprite, -this.x - this.width, this.y, this.width, this.height);
      } else {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
      }
    } else {
      // Fallback : dessiner les formes géométriques si l'image n'est pas chargée
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, "#8B0000");
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Zone d'attaque
    if (this.isAttacking) {
      this.attackAnimationFrame++;
      const attackBox = this.getAttackBox();
      const pulse = Math.sin(this.attackAnimationFrame * 0.5) * 0.3 + 0.7;
      ctx.fillStyle = "#ff0000";
      ctx.globalAlpha = 0.4 * pulse;
      ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
      ctx.globalAlpha = 1.0;
    }

    // Barre de vie améliorée
    const barWidth = this.width;
    const barHeight = 5;
    const barX = this.x;
    const barY = this.y - 10;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    const healthGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    if (healthPercent > 0.5) {
      healthGradient.addColorStop(0, "#00ff00");
      healthGradient.addColorStop(1, "#66ff66");
    } else if (healthPercent > 0.25) {
      healthGradient.addColorStop(0, "#ffff00");
      healthGradient.addColorStop(1, "#ffaa00");
    } else {
      healthGradient.addColorStop(0, "#ff0000");
      healthGradient.addColorStop(1, "#ff6666");
    }
    ctx.fillStyle = healthGradient;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Bordure de la barre
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.restore();
  }
}
