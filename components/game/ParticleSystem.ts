import { Particle } from './types'

export class ParticleSystem {
  private particles: Particle[] = []

  createHitEffect(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      const speed = 2 + Math.random() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20,
        maxLife: 20,
        color,
        size: 3 + Math.random() * 3
      })
    }
  }

  createDeathEffect(x: number, y: number) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 30,
        maxLife: 30,
        color: `hsl(${Math.random() * 60}, 100%, 50%)`,
        size: 4 + Math.random() * 4
      })
    }
  }

  createRewardEffect(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = 1 + Math.random() * 2
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 40,
        maxLife: 40,
        color: '#ffd700',
        size: 3 + Math.random() * 3
      })
    }
  }

  createMuzzleFlash(x: number, y: number, direction: number) {
    for (let i = 0; i < 12; i++) {
      const angle = (direction > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5
      const speed = 3 + Math.random() * 3
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 8,
        maxLife: 8,
        color: `hsl(${30 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
        size: 2 + Math.random() * 3
      })
    }
  }

  createExplosion(x: number, y: number, color: string = '#ff6600') {
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 25,
        maxLife: 25,
        color: color,
        size: 4 + Math.random() * 5
      })
    }
  }

  // Helper pour ajouter de l'opacité à une couleur
  private addOpacity(color: string, opacity: number): string {
    // Si c'est déjà une couleur avec opacité, on la retourne telle quelle
    if (color.includes('rgba') || color.includes('hsla')) {
      return color
    }
    
    // Si c'est HSL, convertir en HSLA
    const hslMatch = color.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/)
    if (hslMatch) {
      return `hsla(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%, ${opacity})`
    }
    
    // Si c'est hexadécimal (#rrggbb ou #rgb), ajouter l'opacité hex
    if (color.startsWith('#')) {
      // Si c'est déjà un hex avec opacité (#rrggbbaa), on le remplace
      if (color.length === 9) {
        const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0')
        return color.substring(0, 7) + opacityHex
      }
      // Si c'est un hex court (#rgb), le convertir en long
      if (color.length === 4) {
        const r = color[1]
        const g = color[2]
        const b = color[3]
        const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0')
        return `#${r}${r}${g}${g}${b}${b}${opacityHex}`
      }
      // Hex long (#rrggbb)
      const opacityHex = Math.round(opacity * 255).toString(16).padStart(2, '0')
      return color + opacityHex
    }
    
    // Si c'est rgb(), convertir en rgba()
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`
    }
    
    // Fallback : utiliser rgba avec la couleur originale et l'opacité via globalAlpha
    // Pour les couleurs nommées (comme 'red', 'blue', etc.), on utilise simplement la couleur
    // et on laisse globalAlpha gérer l'opacité
    return color
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1 // Gravité
      p.life--
      
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife
      const scale = 1 + (1 - alpha) * 0.3
      
      ctx.save()
      ctx.globalAlpha = alpha
      
      // Lueur autour de la particule
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * scale)
      gradient.addColorStop(0, p.color)
      gradient.addColorStop(0.5, this.addOpacity(p.color, 0.5))
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2)
      ctx.fill()
      
      // Particule principale
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    })
  }
}
