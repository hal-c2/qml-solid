// Tool tips, against what Qt 6.11 does with the same scene.
import { play } from "./moves.js";
import { test } from "./open.js";

const TIPS = [
  ["",[],[[false,false,"one",300,1000,0,0,60,24,0,0],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 0",[],[[false,false,"one",300,1000,0,0,60,24,0,0],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 150",[],[[false,false,"one",300,1000,0,0,60,24,0,0],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 300",["tip visible true","tip opened"],[[true,true,"one",300,1000,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 600",[],[[true,true,"one",300,1000,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 600",["tip visible false","tip closed"],[[false,false,"one",300,1000,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 1",["tip delay 0","tip visible true","tip opened"],[[true,true,"one",0,1000,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 2",["tip timeout -1"],[[true,true,"one",0,-1,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 1200",[],[[true,true,"one",0,-1,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 3",["tip timeout 300"],[[true,true,"one",0,300,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 150",[],[[true,true,"one",0,300,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 300",["tip visible false","tip closed"],[[false,false,"one",0,300,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 4",["tip timeout 400","tip text two","tip visible true","tip opened"],[[true,true,"two",0,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 200",[],[[true,true,"two",0,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 5",["tip visible false","tip closed"],[[false,false,"two",0,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 6",["tip delay 300"],[[false,false,"two",300,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 100",[],[[false,false,"two",300,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 7",[],[[false,false,"two",300,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 400",[],[[false,false,"two",300,400,10,-30,60,24,60,70],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 8",["tip delay 0","tip timeout -1","tip visible true","tip opened"],[[true,true,"two",0,-1,10,46,60,24,60,56],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 9",[],[[true,true,"two",0,-1,-40,-10,60,24,290,0],[false,"",0,-1,"none",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 10",["tip visible false","tip closed","shared parent b","shared delay 200","shared timeout 600","shared text hi"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"hi",200,600,"b",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 100",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"hi",200,600,"b",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 200",["b visible true","shared visible true"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"hi",200,600,"b",true],[true,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 400",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"hi",200,600,"b",true],[true,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 400",["b visible false","shared visible false"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"hi",200,600,"b",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 11",["shared parent c","shared delay 0","shared timeout -1","shared text sea","c visible true","shared visible true"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"sea",0,-1,"c",true],[false,"bee",200,600],[true,"sea",0,-1],[false,"",0,-1]]],
  ["step 12",["shared parent b","shared delay 200","shared timeout 300","shared text again"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"again",200,300,"b",true],[true,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 150",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"again",200,300,"b",true],[true,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["wait 300",["b visible false","shared visible false"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"again",200,300,"b",true],[false,"bee",200,600],[false,"sea",0,-1],[false,"",0,-1]]],
  ["step 13",["shared parent c","shared delay 0","shared timeout -1","shared text sea","c visible true","shared visible true"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"sea",0,-1,"c",true],[false,"bee",200,600],[true,"sea",0,-1],[false,"",0,-1]]],
  ["step 14",["shared text ocean","b text wasp"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"ocean",0,-1,"c",true],[false,"wasp",200,600],[true,"ocean",0,-1],[false,"",0,-1]]],
  ["step 15",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"ocean",0,-1,"c",true],[false,"wasp",200,600],[true,"ocean",0,-1],[false,"",0,-1]]],
  ["step 16",["shared delay 100","shared timeout 250"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"ocean",100,250,"c",true],[false,"wasp",200,600],[true,"ocean",100,250],[false,"",0,-1]]],
  ["wait 400",["c visible false","shared visible false"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"ocean",100,250,"c",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
  ["step 17",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"ocean",100,250,"c",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
  ["step 18",["shared parent d","shared delay 0","shared timeout -1","shared text ","d visible true","shared visible true"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"",0,-1,"d",true],[false,"wasp",200,600],[false,"ocean",100,250],[true,"",0,-1]]],
  ["step 19",["d visible false","shared visible false"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"",0,-1,"d",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
  ["step 20",["shared parent c","shared delay 100","shared timeout 250","shared text ocean"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"ocean",100,250,"c",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
  ["wait 50",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"ocean",100,250,"c",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
  ["wait 100",["c visible true","shared visible true"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"ocean",100,250,"c",true],[false,"wasp",200,600],[true,"ocean",100,250],[false,"",0,-1]]],
  ["wait 150",[],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[true,"ocean",100,250,"c",true],[false,"wasp",200,600],[true,"ocean",100,250],[false,"",0,-1]]],
  ["wait 200",["c visible false","shared visible false"],[[false,false,"two",0,-1,-40,-10,60,24,290,0],[false,"ocean",100,250,"c",true],[false,"wasp",200,600],[false,"ocean",100,250],[false,"",0,-1]]],
];

test("a ToolTip waits its delay and goes after its timeout, and the items share one", async ({ page }) => {
  await play(page, "tooltips", TIPS);
});
