import { Bullet } from "./Bullet";
import { ParticleSystem } from "./ParticleSystem";

export class Player {
  x: number;
  y: number;
  width: number;
  height: number;
  crouchHeight: number;
  speed: number;
  health: number;
  maxHealth: number;
  isCrouching: boolean;
  isAttacking: boolean;
  attackCooldown: number;
  attackRange: number;
  direction: number;
  color: string;
  attackColor: string;
  velocityY: number;
  isGrounded: boolean;
  private jumpPower: number;
  private canJump: boolean;
  private animationFrame: number;
  private attackAnimationFrame: number;
  private gunCooldown: number;
  private bullets: Bullet[];
  private sprite: HTMLImageElement | null = null;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 60;
    this.crouchHeight = 30;
    this.speed = 5;
    this.health = 100;
    this.maxHealth = 100;
    this.isCrouching = false;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackRange = 50;
    this.direction = 1;
    this.color = "#4CAF50";
    this.attackColor = "#ffd700";
    this.velocityY = 0;
    this.isGrounded = true;
    this.jumpPower = 18; // Augmenté pour pouvoir sauter au-dessus du boss
    this.canJump = true;
    this.animationFrame = 0;
    this.attackAnimationFrame = 0;
    this.gunCooldown = 0;
    this.bullets = [];
    this.loadSprite();
  }

  loadSprite() {
    this.sprite = new Image();
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      // Ajuster la taille selon l'image
      if (this.sprite) {
        const aspectRatio = this.sprite.height / this.sprite.width;
        this.width = 50;
        this.height = this.width * aspectRatio;
        this.crouchHeight = this.height * 0.6;
      }
    };
    this.sprite.onerror = () => {
      console.warn("Impossible de charger heros.png");
      this.spriteLoaded = false;
    };
    this.sprite.src = "/assets/heros.png";
  }

  update(keys: { [key: string]: boolean }, canvas: HTMLCanvasElement, mouseClick?: boolean, particleSystem?: ParticleSystem) {
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    if (this.gunCooldown > 0) {
      this.gunCooldown--;
    }

    // Accroupissement
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
      this.isCrouching = true;
    } else {
      this.isCrouching = false;
    }

    // Saut amélioré - plus réactif
    if ((keys["ArrowUp"] || keys["w"] || keys["W"]) && this.isGrounded && this.canJump && !this.isCrouching) {
      this.velocityY = -this.jumpPower;
      this.isGrounded = false;
      this.canJump = false;
    }

    // Réinitialiser canJump quand on touche le sol
    if (this.isGrounded) {
      this.canJump = true;
    }

    // Attaque au corps à corps
    if ((keys[" "] || keys["Space"]) && this.attackCooldown === 0) {
      this.attack();
    }

    // Tir avec pistolet (clic souris ou touche F)
    if ((mouseClick || keys["f"] || keys["F"] || keys["KeyF"]) && this.gunCooldown === 0) {
      this.shoot(particleSystem);
    }

    // Mouvement horizontal avec accélération
    let targetSpeed = 0;
    if ((keys["ArrowRight"] || keys["d"] || keys["D"]) && !this.isAttacking) {
      targetSpeed = this.speed;
      this.direction = 1;
    } else if ((keys["ArrowLeft"] || keys["a"] || keys["A"]) && !this.isAttacking) {
      targetSpeed = -this.speed;
      this.direction = -1;
    }

    this.x += targetSpeed;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    // Physique de saut améliorée
    const groundY = canvas.height - 30;
    this.velocityY += 0.5; // Gravité
    this.y += this.velocityY;

    // Collision avec le sol
    const targetY = this.isCrouching ? groundY - this.crouchHeight : groundY - this.height;
    if (this.y >= targetY) {
      this.y = targetY;
      this.velocityY = 0;
      this.isGrounded = true;
      this.canJump = true;
    }

    // Mettre à jour les balles
    this.bullets.forEach((bullet, index) => {
      bullet.update(canvas);
      if (!bullet.active) {
        this.bullets.splice(index, 1);
      }
    });

    // Animation
    this.animationFrame++;
  }

  shoot(particleSystem?: ParticleSystem) {
    if (this.gunCooldown === 0) {
      try {
        const bulletX = this.direction === 1 ? this.x + this.width : this.x;
        const bulletY = this.y + this.height / 2;
        this.bullets.push(new Bullet(bulletX, bulletY, this.direction));
        this.gunCooldown = 15; // Cadence de tir

        // Effet de flash de bouche
        if (particleSystem && typeof particleSystem.createMuzzleFlash === "function") {
          particleSystem.createMuzzleFlash(bulletX, bulletY, this.direction);
        }
      } catch (error) {
        console.error("Erreur lors du tir:", error);
      }
    }
  }

  getBullets() {
    return this.bullets;
  }

  attack() {
    this.isAttacking = true;
    this.attackCooldown = 30;
    this.attackAnimationFrame = 0;
    setTimeout(() => {
      this.isAttacking = false;
    }, 300);
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  heal(amount: number) {
    this.health += amount;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }

  getAttackBox() {
    const attackX = this.direction === 1 ? this.x + this.width : this.x - this.attackRange;
    return {
      x: attackX,
      y: this.y + 10,
      width: this.attackRange,
      height: this.height - 20,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Ombre
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + (this.isCrouching ? this.crouchHeight : this.height) + 5, this.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dessiner le sprite si chargé
    if (this.spriteLoaded && this.sprite) {
      const currentHeight = this.isCrouching ? this.crouchHeight : this.height;
      const drawWidth = this.width;
      const drawHeight = currentHeight;

      // Miroir l'image si direction gauche
      if (this.direction === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(this.sprite, -this.x - drawWidth, this.y, drawWidth, drawHeight);
      } else {
        ctx.drawImage(this.sprite, this.x, this.y, drawWidth, drawHeight);
      }
    } else {
      // Fallback : dessiner les formes géométriques si l'image n'est pas chargée
      const currentHeight = this.isCrouching ? this.crouchHeight : this.height;
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + currentHeight);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, "#2E7D32");
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x, this.y, this.width, currentHeight);
    }

    // Zone d'attaque avec effet
    if (this.isAttacking) {
      this.attackAnimationFrame++;
      const attackBox = this.getAttackBox();
      const pulse = Math.sin(this.attackAnimationFrame * 0.5) * 0.3 + 0.7;
      ctx.fillStyle = this.attackColor;
      ctx.globalAlpha = 0.5 * pulse;
      ctx.fillRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);

      // Effet de slash
      ctx.strokeStyle = this.attackColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8 * pulse;
      ctx.beginPath();
      if (this.direction === 1) {
        ctx.moveTo(attackBox.x, attackBox.y);
        ctx.lineTo(attackBox.x + attackBox.width, attackBox.y + attackBox.height);
      } else {
        ctx.moveTo(attackBox.x + attackBox.width, attackBox.y);
        ctx.lineTo(attackBox.x, attackBox.y + attackBox.height);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Pistolet
    ctx.save();
    const gunX = this.direction === 1 ? this.x + this.width - 5 : this.x - 15;
    const gunY = this.y + this.height / 2 - 5;

    // Canon
    ctx.fillStyle = "#333";
    ctx.fillRect(gunX, gunY, 15, 8);

    // Poignée
    ctx.fillStyle = "#654321";
    ctx.fillRect(gunX + 5, gunY + 8, 6, 10);

    // Détails
    ctx.fillStyle = "#666";
    ctx.fillRect(gunX + 2, gunY + 2, 2, 4);

    ctx.restore();

    // Dessiner les balles
    this.bullets.forEach((bullet) => {
      if (bullet.active) {
        bullet.draw(ctx);
      }
    });

    // Indicateur de direction
    ctx.fillStyle = "#fff";
    ctx.fillRect(this.direction === 1 ? this.x + this.width - 5 : this.x, this.y + 10, 5, 10);

    ctx.restore();
  }
}
