import { Boss } from "./Boss";
import { Bullet } from "./Bullet";
import { ParticleSystem } from "./ParticleSystem";
import { Player } from "./Player";

export class Pet {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  speed: number;
  health: number;
  maxHealth: number;
  private animationFrame: number;
  private bullets: Bullet[];
  private gunCooldown: number;
  private followDistance: number;
  private sprite: HTMLImageElement | null = null;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 25;
    this.targetX = x;
    this.targetY = y;
    this.speed = 3;
    this.health = 50;
    this.maxHealth = 50;
    this.animationFrame = 0;
    this.bullets = [];
    this.gunCooldown = 0;
    this.followDistance = 80;
    this.loadSprite();
  }

  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      // Ajuster la taille selon l'image
      if (this.sprite) {
        const aspectRatio = this.sprite.height / this.sprite.width;
        this.width = 30;
        this.height = this.width * aspectRatio;
      }
    };
    this.sprite.onerror = () => {
      console.warn("Impossible de charger pet.jpg");
      this.spriteLoaded = false;
    };
    this.sprite.src = "/assets/pet.jpg";
  }

  update(player: Player, boss: Boss | null, canvas: HTMLCanvasElement, particleSystem: ParticleSystem) {
    this.animationFrame++;

    // Réduire le cooldown de tir
    if (this.gunCooldown > 0) {
      this.gunCooldown--;
    }

    // Calculer la position cible (suivre le joueur avec une distance)
    const dx = player.x - this.x;
    const dy = player.y + player.height / 2 - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Se déplacer vers le joueur mais garder une distance
    if (distance > this.followDistance) {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else if (distance < this.followDistance - 10) {
      // S'éloigner un peu si trop proche
      const angle = Math.atan2(dy, dx);
      this.x -= Math.cos(angle) * this.speed * 0.5;
      this.y -= Math.sin(angle) * this.speed * 0.5;
    }

    // Garder le pet sur le canvas
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    // Position Y (sol)
    const groundY = canvas.height - 30;
    if (this.y + this.height < groundY) {
      // Appliquer une légère gravité au pet
      this.y += 0.3;
      if (this.y + this.height > groundY) {
        this.y = groundY - this.height;
      }
    } else {
      this.y = groundY - this.height;
    }

    // Attaquer le boss s'il existe et est à portée
    if (boss && !boss.isDead()) {
      const bossDx = boss.x - this.x;
      const bossDy = boss.y + boss.height / 2 - this.y;
      const bossDistance = Math.sqrt(bossDx * bossDx + bossDy * bossDy);

      // Tirer sur le boss s'il est à portée (300px)
      if (bossDistance < 300 && this.gunCooldown === 0) {
        this.shootAtBoss(boss, particleSystem);
      }
    }

    // Mettre à jour les balles
    this.bullets.forEach((bullet, index) => {
      bullet.update(canvas);
      if (!bullet.active) {
        this.bullets.splice(index, 1);
      }
    });
  }

  shootAtBoss(boss: Boss, particleSystem: ParticleSystem) {
    if (this.gunCooldown === 0) {
      const dx = boss.x - this.x;
      const dy = boss.y + boss.height / 2 - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const direction = dx / distance;
      const vy = (dy / distance) * 6;

      const bullet = new Bullet(this.x + this.width / 2, this.y + this.height / 2, direction, 7, vy);
      bullet.color = "#ff69b4"; // Balle rose pour le pet
      bullet.damage = 5;
      this.bullets.push(bullet);
      this.gunCooldown = 40; // Cadence de tir du pet

      // Effet de flash
      particleSystem.createMuzzleFlash(this.x + this.width / 2, this.y + this.height / 2, direction);
    }
  }

  getBullets() {
    return this.bullets;
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  isDead() {
    return this.health <= 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Ombre
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height + 3, this.width / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animation de saut/bond
    const bounce = Math.sin(this.animationFrame * 0.15) * 2;

    // Dessiner le sprite si chargé
    if (this.spriteLoaded && this.sprite) {
      ctx.drawImage(this.sprite, this.x, this.y + bounce, this.width, this.height);
    } else {
      // Fallback : dessiner un sprite simple si l'image n'est pas chargée
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2
      );
      gradient.addColorStop(0, "#ffb6c1");
      gradient.addColorStop(0.7, "#ff69b4");
      gradient.addColorStop(1, "#ff1493");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + bounce, this.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Yeux
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2 - 4, this.y + this.height / 2 - 2 + bounce, 2, 0, Math.PI * 2);
      ctx.arc(this.x + this.width / 2 + 4, this.y + this.height / 2 - 2 + bounce, 2, 0, Math.PI * 2);
      ctx.fill();

      // Reflet dans les yeux
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3 + bounce, 1, 0, Math.PI * 2);
      ctx.arc(this.x + this.width / 2 + 5, this.y + this.height / 2 - 3 + bounce, 1, 0, Math.PI * 2);
      ctx.fill();

      // Sourire
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + 3 + bounce, 4, 0, Math.PI);
      ctx.stroke();
    }

    // Barre de vie du pet
    const barWidth = this.width;
    const barHeight = 3;
    const barX = this.x;
    const barY = this.y - 8;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Dessiner les balles du pet
    this.bullets.forEach((bullet) => {
      if (bullet.active) {
        bullet.draw(ctx);
      }
    });

    ctx.restore();
  }
}
