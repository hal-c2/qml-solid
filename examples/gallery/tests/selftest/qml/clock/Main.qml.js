const block = (left, top, colour) => {
  const node = document.createElement("div");
  node.style.cssText = `position: absolute; left: ${left}px; top: ${top}px; width: 100px; height: 60px; background: ${colour}`;
  return node;
};

// The moment the self-test says the reference picture was taken.
const taken = 1700000000000;

export default function Main() {
  return block(20, 20, Date.now() === taken ? "#0000ff" : "#ff0000");
}
