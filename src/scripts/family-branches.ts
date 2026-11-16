const svgNamespace = 'http://www.w3.org/2000/svg';
// Extend stems behind the card edges to account for their slight rotation.
const cardOverlap = 3;

export function drawFamilyBranches(plot: HTMLElement) {
  const frame = plot.getBoundingClientRect();
  if (!frame.width || !frame.height) return;

  const graphic = document.createElementNS(svgNamespace, 'svg');
  graphic.classList.add('family-branches');
  graphic.setAttribute('aria-hidden', 'true');
  graphic.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);

  const bounds = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - frame.left,
      right: rect.right - frame.left,
      top: rect.top - frame.top,
      bottom: rect.bottom - frame.top,
      middleX: (rect.left + rect.right) / 2 - frame.left,
      middleY: (rect.top + rect.bottom) / 2 - frame.top,
    };
  };

  const addPath = (data: string, kind = 'descent') => {
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', data);
    path.setAttribute('pathLength', '1');
    path.setAttribute('class', kind);
    graphic.append(path);
  };

  for (const branch of plot.querySelectorAll('.family-branch')) {
    const household = branch.querySelector(':scope > .household');
    const lead = household?.firstElementChild;
    if (!household || !lead) continue;
    const parent = bounds(household);
    const primary = bounds(lead);
    const partner = household.children[1];

    if (partner) {
      const other = bounds(partner);
      const midpoint = (primary.right + other.left) / 2;
      const y = (primary.middleY + other.middleY) / 2;
      addPath(`M ${primary.right - cardOverlap} ${primary.middleY} Q ${midpoint} ${y - 7} ${other.left + cardOverlap} ${other.middleY}`, 'marriage');
      const joint = document.createElementNS(svgNamespace, 'circle');
      joint.setAttribute('cx', String(midpoint));
      joint.setAttribute('cy', String(y - 3.5));
      joint.setAttribute('r', '2.5');
      graphic.append(joint);
    }

    const descendants = branch.querySelector(':scope > .descendants');
    if (!descendants) continue;
    const children = [...descendants.querySelectorAll(':scope > li > .household > .person-card:first-child')].map(bounds);
    if (!children.length) continue;

    if (getComputedStyle(descendants).flexDirection === 'column') {
      const trunk = bounds(descendants).left;
      const parentX = primary.left + (trunk - primary.left) / 2;
      const top = primary.bottom - cardOverlap;
      const bend = Math.min(15, (children[0].top - top) / 2);
      const bottom = children.at(-1)!.middleY;
      addPath(`M ${parentX} ${top} C ${parentX} ${top + bend}, ${trunk} ${top + bend}, ${trunk} ${top + bend * 2} V ${bottom - bend}`);
      for (const child of children) {
        const y = child.middleY;
        addPath(`M ${trunk} ${y - bend} Q ${trunk} ${y} ${child.left + cardOverlap} ${y}`);
      }
    } else {
      const x = partner ? parent.middleX : primary.middleX;
      const y = partner ? parent.bottom : primary.bottom - cardOverlap;
      const split = y + (Math.min(...children.map(child => child.top)) - y) * .29;
      addPath(`M ${x} ${y} V ${split}`);
      for (const child of children) {
        const curve = (child.top - split) * .67;
        addPath(`M ${x} ${split} C ${x} ${split + curve}, ${child.middleX} ${child.top - curve}, ${child.middleX} ${child.top + cardOverlap}`);
      }
    }
  }

  const current = plot.querySelector('.family-branches');
  if (current) current.replaceWith(graphic);
  else plot.prepend(graphic);
  plot.classList.add('has-branches');
}
