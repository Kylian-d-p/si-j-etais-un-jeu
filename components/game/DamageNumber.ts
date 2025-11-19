// Système de nombres de dégâts flottants
export class DamageNumber {
  x: number
  y: number
  value: number
  life: number
  maxLife: number
  vx: number
  vy: number
  color: string

  constructor(x: number, y: number, value: number, color: string = '#ffffff') {
    this.x = x
    this.y = y
    this.value = value
    this.life = 60
    this.maxLife = 60
    this.vx = (Math.random() - 0.5) * 2
    this.vy = -3
    this.color = color
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += 0.1 // Gravité
    this.life--
  }

  isDead() {
    return this.life <= 0
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife
    const scale = 1 + (1 - alpha) * 0.5

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color
    ctx.font = `bold ${20 * scale}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Ombre du texte
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillText(`${this.value}`, this.x + 2, this.y + 2)
    
    // Texte principal
    ctx.fillStyle = this.color
    ctx.fillText(`${this.value}`, this.x, this.y)
    
    ctx.restore()
  }
}
