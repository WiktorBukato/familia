const cardSelector = '.person-card';

const center = (rect: DOMRect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

export function measureStack(stack: Element) {
  return [...stack.querySelectorAll(cardSelector)].map(card => ({
    ...center(card.getBoundingClientRect()),
    angle: getComputedStyle(card).rotate,
  }));
}

export async function animateFamilyCards(
  plot: HTMLElement,
  stack: ReturnType<typeof measureStack>,
  opening: boolean,
) {
  if (!stack.length) return;

  // Fly above the scroll area so the cards stay visible on the way to the stack.
  const flight = document.createElement('div');
  flight.className = 'family-flight';
  flight.inert = true;
  flight.setAttribute('aria-hidden', 'true');

  const cards = [...plot.querySelectorAll<HTMLElement>(cardSelector)].map((card, index) => {
    const position = center(card.getBoundingClientRect());
    const origin = stack[index % stack.length];
    const angle = getComputedStyle(card).rotate;
    const copy = card.cloneNode(true) as HTMLElement;
    const { offsetWidth: width, offsetHeight: height } = card;
    Object.assign(copy.style, {
      width: `${width}px`,
      height: `${height}px`,
      left: `${position.x - width / 2}px`,
      top: `${position.y - height / 2}px`,
    });
    flight.append(copy);
    return {
      copy,
      frames: [
        {
          transform: `translate(${origin.x - position.x}px, ${origin.y - position.y}px) scale(.75) rotate(${origin.angle})`,
          opacity: 0,
        },
        { opacity: 1, offset: .14 },
        { transform: `rotate(${angle})`, opacity: 1 },
      ],
    };
  });

  plot.closest('details')?.append(flight);
  try {
    const stagger = (index: number) => Math.min(index * 41, 385);
    const last = stagger(cards.length - 1);
    const animations = cards.map(({ copy, frames }, index) => copy.animate(frames, {
      duration: 875,
      delay: opening ? stagger(index) : last - stagger(index),
      direction: opening ? 'normal' : 'reverse',
      easing: 'cubic-bezier(.22,.72,.22,1)',
      fill: 'both',
    }));
    await Promise.allSettled(animations.map(animation => animation.finished));
  } finally {
    flight.remove();
  }
}
