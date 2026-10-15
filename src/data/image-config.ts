import type { AnimalId, SystemId } from '../types/anatomy'

export interface ImageConfig { src: string; width: number; height: number; scale: number }
const img = (src: string, scale = 1): ImageConfig => ({ src, width: 720, height: 460, scale })
const IMAGE_CONFIG: Record<AnimalId, Record<SystemId, ImageConfig>> = {
  dog: {
    skeletal: img('/anatomy/dog/dog-skeleton.png', 1.4),
    muscular: img('/anatomy/dog/dog-muscles.png'),
    digestive: img('/anatomy/dog/dog-digestive.png'),
    cardiovascular: img('/anatomy/dog/dog-cardiovascular.png'),
    nervous: img('/anatomy/dog/dog-nervous.png'),
  },
  cat: {
    skeletal: img('/anatomy/cat/cat-skeleton.png'),
    muscular: img('/anatomy/cat/cat-muscles.png'),
    digestive: img('/anatomy/cat/cat-digestive.png', 1.2),
    cardiovascular: img('/anatomy/cat/cat-cardiovascular.png'),
    nervous: img('/anatomy/cat/cat-nervous.png'),
  },
  bird: {
    skeletal: img('/anatomy/bird/bird-skeleton.png'),
    muscular: img('/anatomy/bird/bird-muscles.png'),
    digestive: img('/anatomy/bird/bird-digestive.png'),
    cardiovascular: img('/anatomy/bird/bird-cardiovascular.png'),
    nervous: img('/anatomy/bird/bird-nervous.png'),
  },
}
export default IMAGE_CONFIG
