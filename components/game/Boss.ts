import { Bullet } from "./Bullet";
import { ParticleSystem } from "./ParticleSystem";
import { Player } from "./Player";

export class Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  attackCooldown: number;
  attackRange: number;
  isAttacking: boolean;
  direction: number;
  color: string;
  specialAttackCooldown: number;
  isSpecialAttacking: boolean;
  private animationFrame: number;
  private attackAnimationFrame: number;
  private specialAttackAnimationFrame: number;
  private hurtFlash: number;
  private phase: number;
  private velocityY: number;
  private isGrounded: boolean;
  private jumpCooldown: number;
  private movePattern: number;
  private moveTimer: number;
  private bullets: Bullet[];
  private gunCooldown: number;
  private shootTimer: number;
  private sprite: HTMLImageElement | null = null;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 100;
    this.speed = 1.5;
    this.health = 200;
    this.maxHealth = 200;
    this.attackCooldown = 0;
    this.attackRange = 60;
    this.isAttacking = false;
    this.direction = -1;
    this.color = "#8B0000";
    this.specialAttackCooldown = 0;
    this.isSpecialAttacking = false;
    this.animationFrame = 0;
    this.attackAnimationFrame = 0;
    this.specialAttackAnimationFrame = 0;
    this.hurtFlash = 0;
    this.phase = 1;
    this.velocityY = 0;
    this.isGrounded = true;
    this.jumpCooldown = 0;
    this.movePattern = 0;
    this.moveTimer = 0;
    this.bullets = [];
    this.gunCooldown = 0;
    this.shootTimer = 0;
    this.loadSprite();
  }

  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      // Ajuster la taille selon l'image
      if (this.sprite) {
        const aspectRatio = this.sprite.height / this.sprite.width;
        this.width = 80;
        this.height = this.width * aspectRatio;
      }
    };
    this.sprite.onerror = () => {
      console.warn("Impossible de charger boss.png");
      this.spriteLoaded = false;
    };
    this.sprite.src = "/assets/boss.png";
  }

  update(player: Player, canvas: HTMLCanvasElement, particleSystem: ParticleSystem) {
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown--;
    }
    if (this.hurtFlash > 0) {
      this.hurtFlash--;
    }
    if (this.jumpCooldown > 0) {
      this.jumpCooldown--;
    }
    if (this.gunCooldown > 0) {
      this.gunCooldown--;
    }

    this.moveTimer++;
    this.shootTimer++;

    // Phase du boss selon la santé
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < 0.3) {
      this.phase = 3;
      this.speed = 2.5;
    } else if (healthPercent < 0.6) {
      this.phase = 2;
      this.speed = 2;
    }

    // Patterns de mouvement selon la phase
    const distance = player.x - this.x;
    const absDistance = Math.abs(distance);

    // Phase 1: Déplacement simple
    if (this.phase === 1) {
      if (absDistance > this.attackRange) {
        this.x += Math.sign(distance) * this.speed;
      }
    }
    // Phase 2: Déplacement avec sauts occasionnels
    else if (this.phase === 2) {
      if (absDistance > this.attackRange) {
        this.x += Math.sign(distance) * this.speed;
      }
      // Sauter pour éviter les attaques
      if (this.moveTimer % 120 === 0 && this.isGrounded && this.jumpCooldown === 0) {
        this.velocityY = -8;
        this.isGrounded = false;
        this.jumpCooldown = 60;
      }
    }
    // Phase 3: Mouvement agressif avec sauts fréquents
    else if (this.phase === 3) {
      // Mouvement en zigzag
      if (this.moveTimer % 60 < 30) {
        this.x += Math.sign(distance) * this.speed * 1.2;
      } else {
        this.x -= Math.sign(distance) * this.speed * 0.5;
      }
      // Sauts fréquents
      if (this.moveTimer % 80 === 0 && this.isGrounded && this.jumpCooldown === 0) {
        this.velocityY = -10;
        this.isGrounded = false;
        this.jumpCooldown = 40;
      }
    }

    // Physique de saut
    const groundY = canvas.height - 30;
    this.velocityY += 0.4; // Gravité
    this.y += this.velocityY;

    // Collision avec le sol
    const targetY = groundY - this.height;
    if (this.y >= targetY) {
      this.y = targetY;
      this.velocityY = 0;
      this.isGrounded = true;
    }

    // Attaques
    if (absDistance <= this.attackRange) {
      if (healthPercent < 0.3 && this.specialAttackCooldown === 0) {
        this.specialAttack();
      } else if (this.attackCooldown === 0) {
        this.attack();
      }
    }

    // Tir à distance selon la phase
    if (absDistance > this.attackRange) {
      if (this.phase === 2 && this.shootTimer % 90 === 0 && this.gunCooldown === 0) {
        this.shoot(player, particleSystem);
      } else if (this.phase === 3 && this.shootTimer % 60 === 0 && this.gunCooldown === 0) {
        this.shoot(player, particleSystem);
        // Double tir en phase 3
        setTimeout(() => this.shoot(player, particleSystem), 200);
      }
    }

    // Mettre à jour les balles
    this.bullets.forEach((bullet, index) => {
      bullet.update(canvas);
      if (!bullet.active) {
        this.bullets.splice(index, 1);
      }
    });

    // Limites du canvas
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    this.direction = Math.sign(distance);
    this.animationFrame++;
  }

  attack() {
    this.isAttacking = true;
    this.attackCooldown = 80;
    this.attackAnimationFrame = 0;
    setTimeout(() => {
      this.isAttacking = false;
    }, 500);
  }

  specialAttack() {
    this.isSpecialAttacking = true;
    this.specialAttackCooldown = 180;
    this.specialAttackAnimationFrame = 0;
    setTimeout(() => {
      this.isSpecialAttacking = false;
    }, 600);
  }

  shoot(player: Player, particleSystem?: ParticleSystem) {
    if (this.gunCooldown === 0) {
      const bulletX = this.direction === 1 ? this.x + this.width : this.x;
      const bulletY = this.y + this.height / 2;

      // Calculer la direction vers le joueur pour un tir précis
      const dx = player.x - bulletX;
      const dy = player.y + player.height / 2 - bulletY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const direction = dx / distance;
      const vy = (dy / distance) * 8;

      const bullet = new Bullet(bulletX, bulletY, direction, 8, vy);
      bullet.color = "#ff0000"; // Balle rouge pour le boss
      bullet.damage = 8;
      this.bullets.push(bullet);
      this.gunCooldown = 30;

      // Effet de flash de bouche
      if (particleSystem) {
        particleSystem.createMuzzleFlash(bulletX, bulletY, this.direction);
      }
    }
  }

  getBullets() {
    return this.bullets;
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

  getSpecialAttackBox() {
    return {
      x: this.x - 30,
      y: this.y,
      width: this.width + 60,
      height: this.height,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Effet de flash
    if (this.hurtFlash > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ombre plus grande (qui suit le mouvement vertical)
    const groundY = this.y + this.height + 8;
    const shadowY = groundY + (this.isGrounded ? 0 : Math.min(this.velocityY * 0.5, 10));
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, shadowY, this.width / 2 + 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dessiner le sprite si chargé
    if (this.spriteLoaded && this.sprite) {
      // Miroir le sprite selon la direction
      if (this.direction < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprite, -this.x - this.width, this.y, this.width, this.height);
      } else {
        ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
      }
    } else {
      // Fallback : dessiner un sprite simple si l'image n'est pas chargée
      // Corps avec gradient et effet de phase
      const phaseColor = this.phase === 3 ? "#4B0000" : this.phase === 2 ? "#6B0000" : "#8B0000";
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      gradient.addColorStop(0, phaseColor);
      gradient.addColorStop(1, "#000000");
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Effet de pulsation selon la phase
      const pulse = Math.sin(this.animationFrame * 0.1) * 0.1 + 0.9;
      if (this.phase >= 2) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * pulse})`;
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      }

      // Tête
      ctx.fillStyle = "#4B0082";
      ctx.fillRect(this.x + 20, this.y - 20, 40, 30);

      // Yeux avec animation menaçante
      const eyeGlow = Math.sin(this.animationFrame * 0.2) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
      ctx.fillRect(this.x + 28, this.y - 15, 8, 8);
      ctx.fillRect(this.x + 44, this.y - 15, 8, 8);

      // Cornes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(this.x + 25, this.y - 20);
      ctx.lineTo(this.x + 20, this.y - 30);
      ctx.lineTo(this.x + 25, this.y - 25);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.x + 55, this.y - 20);
      ctx.lineTo(this.x + 60, this.y - 30);
      ctx.lineTo(this.x + 55, this.y - 25);
      ctx.closePath();
      ctx.fill();
    }

    // Zone d'attaque normale
    if (this.isAttacking) {
      this.attackAnimationFrame++;
      const attackBox = this.getAttackBox();
      const pulse = Math.sin(this.attackAnimationFrame * 0.5) * 0.3 + 0.7;
      ctx.fillStyle = "#ff0000";
      ctx.globalAlpha = 0.5 * pulse;
      ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
      ctx.globalAlpha = 1.0;
    }

    // Zone d'attaque spéciale avec effet
    if (this.isSpecialAttacking) {
      this.specialAttackAnimationFrame++;
      const attackBox = this.getSpecialAttackBox();
      const pulse = Math.sin(this.specialAttackAnimationFrame * 0.3) * 0.4 + 0.6;
      const gradient = ctx.createRadialGradient(
        this.x + this.width / 2,
        this.y + this.height / 2,
        0,
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width
      );
      gradient.addColorStop(0, `rgba(255, 0, 255, ${0.8 * pulse})`);
      gradient.addColorStop(1, `rgba(255, 0, 255, ${0.2 * pulse})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
    }

    // Barre de vie du boss améliorée
    const barWidth = this.width + 20;
    const barHeight = 8;
    const barX = this.x - 10;
    const barY = this.y - 20;

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

    // Bordure et effet
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Texte "BOSS"
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", this.x + this.width / 2, this.y - 25);

    // Dessiner les balles du boss
    this.bullets.forEach((bullet) => {
      if (bullet.active) {
        bullet.draw(ctx);
      }
    });

    ctx.restore();
  }
}
