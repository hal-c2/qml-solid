export default function Part(props) {
  const node = document.createElement("div");
  node.style.cssText = `position: absolute; left: ${props.left}px; top: ${props.top}px; width: 100px; height: 60px; background: #0000ff`;
  return { $node: node };
}
