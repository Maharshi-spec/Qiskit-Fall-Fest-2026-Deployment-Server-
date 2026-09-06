import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const initializeGsap = () => {
  if (typeof window === 'undefined') return

  gsap.registerPlugin(ScrollTrigger)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ScrollTrigger.defaults({
      toggleActions: 'play none none none',
    })
    return
  }

  gsap.config({ trialWarn: false })
}
