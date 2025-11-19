// Système de caméra avec shake et transitions fluides
export class Camera {
  x: number
  y: number
  targetX: number
  targetY: number
  shakeX: number
  shakeY: number
  shakeIntensity: number
  private shakeTimer: number

  constructor() {
    this.x = 0
    this.y = 0
    this.targetX = 0
    this.targetY = 0
    this.shakeX = 0
    this.shakeY = 0
    this.shakeIntensity = 0
    this.shakeTimer = 0
  }

  update() {
    // Transition fluide vers la cible
    this.x += (this.targetX - this.x) * 0.1
    this.y += (this.targetY - this.y) * 0.1

    // Réduire le shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity
      this.shakeTimer++

      if (this.shakeIntensity < 0.1) {
        this.shakeIntensity = 0
        this.shakeX = 0
        this.shakeY = 0
      }
    }
  }

  addShake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
  }

  setTarget(x: number, y: number) {
    this.targetX = x
    this.targetY = y
  }

  getOffset() {
    return {
      x: this.x + this.shakeX,
      y: this.y + this.shakeY
    }
  }
}
