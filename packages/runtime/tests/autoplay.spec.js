// The same as the last test of multimedia.spec.js, in a browser told to let
// a page play at once: a kiosk, or a site the user has allowed.
import { expect, test } from "./open.js";

test.use({ launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] } });

test("what plays before the user has done anything is heard where the browser allows it", async ({ page }) => {
  const film = page.waitForEvent("console", (message) => message.text() === "player playing");
  const sound = page.waitForEvent("console", (message) => message.text() === "effect playing true");
  await page.goto("/?scene=autoplay");
  await Promise.all([film, sound]);
  expect(await page.evaluate(() => [...window.objects.log])).toEqual(["state 1", "moving muted false"]);
  // The effect finds out that it may by playing a moment of silence.
  await page.waitForFunction(() => window.objects.effect.$sound.node);
  const read = await page.evaluate(() => {
    const { player, effect } = window.objects;
    const { element } = player.$media;
    return {
      player: [player.playbackState, player.mediaStatus, player.error],
      element: [element.paused, element.muted],
      effect: [effect.status, effect.playing, effect.$sound.node.context.state],
    };
  });
  expect(read).toEqual({ player: [1, 5, 0], element: [false, false], effect: [2, true, "running"] });
});
