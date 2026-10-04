import { echo } from "./echo.js";
import { expect, open, test } from "./open.js";

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;
const ERROR = 4;

let server;
let nowhere;
test.beforeAll(async () => {
  server = await echo();
  // Nothing listens where a server has stopped listening.
  const stopped = await echo();
  nowhere = stopped.url;
  await stopped.close();
});
test.afterAll(() => server.close());

test("a WebSocket says every step of connecting, talking and closing", async ({ page }) => {
  await open(page, "websocket");
  await page.evaluate(([server, nowhere]) => Object.assign(window.scene, { server, nowhere }), [server.url, nowhere]);
  // What a step has told of once the socket has got to `status`, and to
  // `told` things to tell.
  const step = async (index, status, told = 0) => {
    await page.evaluate((index) => window.scene.step(index), index);
    await page.waitForFunction(
      ([status, told]) => window.scene.socket.status === status && window.scene.seen.length >= told,
      [status, told],
    );
    return page.evaluate(() => window.scene.read());
  };
  // Qt's answers, but for why a connection failed: a browser does not say.
  expect(await step(0, OPEN, 8)).toEqual([
    ["made", CLOSED, false, "QQmlWebSocket is not ready.", ""],
    ["url", CLOSED],
    ["active", true, CLOSED],
    ["error", false],
    ["status", CONNECTING, true, ""],
    ["asked", CONNECTING],
    ["status", OPEN, true, ""],
    ["protocol", "b"],
  ]);
  // How many bytes each was.
  expect(await step(1, OPEN, 3)).toEqual([
    ["sent", 6, 3],
    ["text", "echo:héllo"],
    ["binary", true, "1,2,3"],
  ]);
  // Somewhere else to connect to: it connects there at once.
  expect(await step(2, OPEN, 6)).toEqual([
    ["url", OPEN],
    ["status", CONNECTING, true, "b"],
    ["protocol", ""],
    ["asked", CONNECTING],
    ["status", OPEN, true, ""],
    ["protocol", "b"],
  ]);
  // No longer active: it is closed once the server has agreed.
  expect(await step(3, CLOSED)).toEqual([
    ["active", false, OPEN],
    ["asked", OPEN],
    ["status", CLOSING, false, "b"],
    ["protocol", ""],
    ["status", CLOSED, false, ""],
  ]);
  expect(await step(4, OPEN, 4)).toEqual([
    ["active", true, CLOSED],
    ["status", CONNECTING, true, ""],
    ["status", OPEN, true, ""],
    ["protocol", "b"],
  ]);
  // Closed by the server, it stays active.
  expect(await step(5, CLOSED)).toEqual([
    ["status", CLOSING, true, "b"],
    ["protocol", ""],
    ["status", CLOSED, true, ""],
  ]);
  // Which is why it is made inactive and active to connect again.
  expect(await step(6, OPEN, 6)).toEqual([
    ["active", false, CLOSED],
    ["asked", CLOSED],
    ["active", true, CLOSED],
    ["status", CONNECTING, true, ""],
    ["status", OPEN, true, ""],
    ["protocol", "b"],
  ]);
  // Nowhere to connect to.
  expect(await step(7, CLOSED)).toEqual([
    ["url", OPEN],
    ["asked", OPEN],
    ["status", CLOSING, true, "b"],
    ["protocol", ""],
    ["status", CLOSED, true, ""],
  ]);
  expect(await step(8, CLOSED)).toEqual([
    ["unsent", 0, ERROR, "Messages can only be sent when the socket is open."],
    [CONNECTING, OPEN, CLOSING, CLOSED, ERROR],
  ]);
  // Nobody there. The browser says so in its console too.
  const refused = [];
  page.removeAllListeners("console");
  page.on("console", (message) => refused.push(message.text()));
  expect(await step(9, ERROR)).toEqual([
    ["url", CLOSED],
    ["status", CONNECTING, true, ""],
    ["status", CLOSED, true, ""],
    ["error", true],
    ["status", ERROR, true, ""],
  ]);
  expect(refused.every((text) => text.includes("WebSocket connection to"))).toBe(true);
});
