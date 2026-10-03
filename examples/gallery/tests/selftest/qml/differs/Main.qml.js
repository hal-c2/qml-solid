const block = (left, top, colour) => {
  const node = document.createElement("div");
  node.style.cssText = `position: absolute; left: ${left}px; top: ${top}px; width: 100px; height: 60px; background: ${colour}`;
  return { $node: node };
};

export default function Main() {
  return block(20, 20, "#0000ff");
}
