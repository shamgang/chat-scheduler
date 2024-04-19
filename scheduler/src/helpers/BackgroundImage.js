import img1 from '../img/gradients/1.jpg';
import img2 from '../img/gradients/2.jpg';
import img3 from '../img/gradients/3.jpg';

const images = [img1, img2, img3];

export function getRandomBackgroundImageUrl() {
  const imageIndex = Math.floor(Math.random() * images.length);
  return images[imageIndex];
}