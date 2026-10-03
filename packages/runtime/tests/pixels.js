// The colours of points of the page as it is painted: a screenshot, read
// back in the page, which has what it takes to decode one.
export async function pixels(page, points) {
  const shot = (await page.screenshot()).toString("base64");
  return page.evaluate(
    async ([shot, points]) => {
      const picture = document.createElement("img");
      picture.src = `data:image/png;base64,${shot}`;
      await picture.decode();
      const canvas = new OffscreenCanvas(picture.naturalWidth, picture.naturalHeight);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(picture, 0, 0);
      const { data, width } = context.getImageData(0, 0, canvas.width, canvas.height);
      return points.map(([x, y]) => Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 3)).join(" "));
    },
    [shot, points],
  );
}
