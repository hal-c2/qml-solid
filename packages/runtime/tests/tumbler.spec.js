// Tumbler. What is expected is what Qt 6.11 answers for the same scene
// (`qml6`), a second and a half after each step: a tumbler takes a second to
// turn to a row; and what it notes when a QtTest `TestCase` presses the same
// keys and drags with its mouse.
import { advance, call, said, set, still, take } from "./notes.js";
import { expect, test } from "./open.js";
import { lettered } from "./stages.js";

// prettier-ignore
const TUMBLER = [
  [[10,0,true,5,false,"0","path",[0,0,60,210,true,0,10,2,0.5,0.5],[0,6,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[8,0,0,60,42,2,0.2,true],[9,0,42,60,42,1,0.6,true],[0,0,84,60,42,0,1,true],[1,0,126,60,42,-1,0.6,true],[2,0,168,60,42,-2,0.2,true]],[3,0,false,5,false,"a","list",[0,0,60,150,true,0,3,2,60,90],[0,1]],[[0,0,0,60,30,2,0.2,true],[1,0,30,60,30,1,0.6,true],[2,0,60,60,30,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,4,true,3,false,"4","path",[0,0,50,90,true,4,6,2,0.5,0.5],[2,4,25,300]],[[3,0,0,50,30,1,0.333,true],[4,0,30,50,30,0,1,true],[5,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],[]],
  [[10,3,true,5,false,"3","path",[0,0,60,210,true,3,10,2,0.5,0.5],[7,6,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[1,0,0,60,42,2,0.2,true],[2,0,42,60,42,1,0.6,true],[3,0,84,60,42,0,1,true],[4,0,126,60,42,-1,0.6,true],[5,0,168,60,42,-2,0.2,true]],[3,2,false,5,false,"c","list",[0,0,60,150,true,2,3,2,60,90],[0,1]],[[0,0,0,60,30,2,0.2,true],[1,0,30,60,30,1,0.6,true],[2,0,60,60,30,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["current 3","few.current 2"]],
  [[10,9,true,5,false,"9","path",[0,0,60,210,true,9,10,2,0.5,0.5],[1,6,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[7,0,0,60,42,2,0.2,true],[8,0,42,60,42,1,0.6,true],[9,0,84,60,42,0,1,true],[0,0,126,60,42,-1,0.6,true],[1,0,168,60,42,-2,0.2,true]],[3,0,false,5,false,"a","list",[0,0,60,150,true,0,3,2,60,90],[-60,1]],[[0,0,60,60,30,0,1,true],[1,0,90,60,30,-1,0.6,true],[2,0,120,60,30,-2,0.2,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["current 9","few.current 0"]],
  [[10,9,true,5,false,"9","path",[0,0,60,210,true,9,10,2,0.5,0.5],[1,6,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[7,0,0,60,42,2,0.2,true],[8,0,42,60,42,1,0.6,true],[9,0,84,60,42,0,1,true],[0,0,126,60,42,-1,0.6,true],[1,0,168,60,42,-2,0.2,true]],[3,0,false,5,false,"a","list",[0,0,60,150,true,0,3,2,60,90],[-60,1]],[[0,0,60,60,30,0,1,true],[1,0,90,60,30,-1,0.6,true],[2,0,120,60,30,-2,0.2,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],[]],
  [[10,9,true,3,false,"9","path",[0,0,60,210,true,9,10,2,0.5,0.5],[1,4,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[8,0,0,60,70,1,0.333,true],[9,0,70,60,70,0,1,true],[0,0,140,60,70,-1,0.333,true]],[3,0,false,3,false,"a","list",[0,0,60,150,true,0,3,2,50,100],[-50,1]],[[0,0,50,60,50,0,1,true],[1,0,100,60,50,-1,0.333,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],[]],
  [[10,9,true,3,false,"9","path",[0,0,60,210,true,9,10,2,0.5,0.5],[1,4,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[8,0,0,60,70,1,0.333,true],[9,0,70,60,70,0,1,true],[0,0,140,60,70,-1,0.333,true]],[6,0,true,3,false,"a","path",[0,0,60,150,true,0,6,2,0.5,0.5],[0,4,30,1000]],[[5,0,0,60,50,1,0.333,true],[0,0,50,60,50,0,1,true],[1,0,100,60,50,-1,0.333,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["few.count 6","few.wrap true"]],
  [[10,9,false,3,false,"9","list",[0,0,60,210,true,9,10,2,70,140],[490,1]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,1500,false],[[7,0,0,60,70,1,0.333,true],[8,0,70,60,70,0,1,true],[9,0,140,60,70,-1,0.333,true]],[6,4,true,3,false,"e","path",[0,0,60,150,true,4,6,2,0.5,0.5],[2,4,30,1000]],[[3,0,0,60,50,1,0.333,true],[4,0,50,60,50,0,1,true],[5,0,100,60,50,-1,0.333,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["few.current 4","wrap false"]],
  [[10,5,true,3,false,"5","path",[0,0,60,210,true,5,10,2,0.5,0.5],[5,4,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[[4,0,0,60,70,1,0.333,true],[5,0,70,60,70,0,1,true],[6,0,140,60,70,-1,0.333,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["current 5","few.count 2","few.current 0","few.wrap false","wrap true"]],
  [[0,-1,true,3,false,null,"path",[0,0,60,210,true,0,0,2,0.5,0.5],[0,4,30,1000]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,100,false],[],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["count 0","current -1","current 0"]],
  [[4,0,false,5,false,"0","list",[0,0,60,210,true,0,4,2,84,126],[0,1]],[70,220,70,220,60,210,5,5,60,210,1],[1,true,false,7,1500,false],[[0,0,0,60,42,2,0.2,true],[1,0,42,60,42,1,0.6,true],[2,0,84,60,42,0,1,true],[3,0,126,60,42,-1,0.6,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["count 4","current 0","wrap false"]],
  [[12,0,true,5,false,"0","path",[0,0,60,210,true,0,12,2,0.5,0.5],[0,6,30,1000]],[80,240,80,240,60,210,15,25,60,210,1],[1,true,false,7,100,false],[[10,0,0,60,42,2,0.2,true],[11,0,42,60,42,1,0.6,true],[0,0,84,60,42,0,1,true],[1,0,126,60,42,-1,0.6,true],[2,0,168,60,42,-2,0.2,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,2,false,3,false,"z","list",[0,0,50,120,true,2,4,2,40,80],[40,1]],[[1,0,0,50,40,1,0.333,true],[2,0,40,50,40,0,1,true],[3,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["count 12","wrap true"]],
  [[12,7,true,5,false,"7","path",[0,0,60,210,true,7,12,2,0.5,0.5],[5,6,30,1000]],[80,240,80,240,60,210,15,25,60,210,1],[1,true,false,7,100,false],[[5,0,0,60,42,2,0.2,true],[6,0,42,60,42,1,0.6,true],[7,0,84,60,42,0,1,true],[8,0,126,60,42,-1,0.6,true],[9,0,168,60,42,-2,0.2,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,0,true,3,false,"0","path",[0,0,50,90,true,0,6,2,0.5,0.5],[0,4,25,300]],[[5,0,0,50,30,1,0.333,true],[0,0,30,50,30,0,1,true],[1,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,1,false,3,false,"y","list",[0,0,50,120,true,1,4,2,40,80],[0,1]],[[0,0,0,50,40,1,0.333,true],[1,0,40,50,40,0,1,true],[2,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["current 7"]],
  [[12,7,true,5,false,"7","path",[0,0,60,210,true,7,12,2,0.5,0.5],[5,6,30,1000]],[80,240,80,240,60,210,15,25,60,210,1],[1,true,true,1,100,false],[[5,0,0,60,42,2,0.2,true],[6,0,42,60,42,1,0.6,true],[7,0,84,60,42,0,1,true],[8,0,126,60,42,-1,0.6,true],[9,0,168,60,42,-2,0.2,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,true,true,true,0,0,true,100],[6,1,true,3,false,"1","path",[0,0,50,90,true,1,6,2,0.5,0.5],[5,4,25,300]],[[0,0,0,50,30,1,0.333,true],[1,0,30,50,30,0,1,true],[2,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,1,false,3,false,"y","list",[0,0,50,120,true,1,4,2,40,80],[0,1]],[[0,0,0,50,40,1,0.333,true],[1,0,40,50,40,0,1,true],[2,0,80,50,40,-1,0.333,true]],[12,7,true,3,false,"7","path",[0,0,50,90,true,7,12,2,0.5,0.5],[5,4,25,1000]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],["reason 1"]],
  [[12,7,true,5,false,"7","path",[0,0,60,210,true,7,12,2,0.5,0.5],[5,6,30,1000]],[80,240,80,240,60,210,15,25,60,210,1],[1,true,true,1,100,false],[[5,0,0,60,42,2,0.2,true],[6,0,42,60,42,1,0.6,true],[7,0,84,60,42,0,1,true],[8,0,126,60,42,-1,0.6,true],[9,0,168,60,42,-2,0.2,true]],[2,0,false,3,false,"a","list",[0,0,60,150,true,0,2,2,50,100],[0,1]],[[0,0,0,60,50,1,0.333,true],[1,0,50,60,50,0,1,true]],[0,-1,true,5,false,true,false,true,true,0,0,true,100],[6,1,true,3,false,"1","path",[0,0,50,90,true,1,6,2,0.5,0.5],[5,4,25,300]],[[0,0,0,50,30,1,0.333,true],[1,0,30,50,30,0,1,true],[2,0,60,50,30,-1,0.333,true]],[8,5,false,5,false,"5","list",[0,0,50,100,true,5,8,2,40,60],[60,1]],[[3,0,0,50,20,2,0.2,true],[4,0,20,50,20,1,0.6,true],[5,0,40,50,20,0,1,true],[6,0,60,50,20,-1,0.6,true],[7,0,80,50,20,-2,0.2,true]],[4,1,false,3,false,"y","list",[0,0,50,120,true,1,4,2,40,80],[0,1]],[[0,0,0,50,40,1,0.333,true],[1,0,40,50,40,0,1,true],[2,0,80,50,40,-1,0.333,true]],[12,7,false,3,false,"7","list",[0,0,50,90,true,7,12,2,30,60],[180,1]],[[6,0,0,50,30,1,0.333,true],[7,0,30,50,30,0,1,true],[8,0,60,50,30,-1,0.333,true]],[0,1,2,3,4,5],[]],
];

const read = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.scene.read())));

test("a tumbler turns the view of its style to its current row and says how far each row is from it", async ({ page }) => {
  await begin(page);
  for (let at = 0; at < TUMBLER.length; at++) {
    expect(await read(page), at ? `after step ${at - 1}` : "at first").toEqual(TUMBLER[at]);
    if (at === TUMBLER.length - 1) break;
    await page.evaluate((index) => window.scene.step(index), at);
    await advance(page, 1500);
  }
});

// A tumbler and the view it turns: the current row of each, where the view
// is, and whether it moves.
const turning = (page, name) =>
  page.evaluate((name) => {
    const tumbler = window.scene[name];
    const view = window.scene.view(tumbler);
    const at = view.offset === undefined ? view.contentY : view.offset;
    return [tumbler.currentIndex, tumbler.moving, view.currentIndex, Math.round(at * 1000) / 1000, view.moving, view.dragging];
  }, name);

async function begin(page) {
  await still(page, "tumbler");
  await lettered(page);
  await advance(page, 1500);
  await take(page);
}

test("the keys up and down turn a tumbler that has focus a row on, and round", async ({ page }) => {
  await begin(page);
  const press = async (...keys) => {
    for (const key of keys) await page.keyboard.press(key);
  };
  const tell = async (notes, name, state) => {
    await said(page, notes);
    expect(await turning(page, name)).toEqual(state);
  };
  await press("ArrowDown");
  await tell([], "wheel", [0, false, 0, 0, false, false]);
  await call(page, "wheel.forceActiveFocus");
  await press("ArrowDown");
  // The view is told, and turns to the row: it is not moving, which is what
  // a user does to it.
  await tell(["current 1"], "wheel", [1, false, 1, 0, false, false]);
  await advance(page, 1500);
  await tell([], "wheel", [1, false, 1, 9, false, false]);
  await press("ArrowDown", "ArrowDown");
  await tell(["current 2", "current 3"], "wheel", [3, false, 3, 9, false, false]);
  await advance(page, 1500);
  await tell([], "wheel", [3, false, 3, 7, false, false]);
  await press("ArrowUp");
  await advance(page, 1500);
  await tell(["current 2"], "wheel", [2, false, 2, 8, false, false]);
  await press("ArrowUp", "ArrowUp", "ArrowUp");
  await advance(page, 1500);
  await tell(["current 1", "current 0", "current 9"], "wheel", [9, false, 9, 1, false, false]);
  await press("ArrowLeft", "ArrowRight", "PageDown", "Home");
  await advance(page, 1500);
  await tell([], "wheel", [9, false, 9, 1, false, false]);
  // When the key goes down, and not again while it is held (Qt's source: a
  // QtTest key does not repeat).
  await page.keyboard.down("ArrowDown");
  await tell(["current 0"], "wheel", [0, false, 0, 1, false, false]);
  await page.keyboard.down("ArrowDown");
  await page.keyboard.up("ArrowDown");
  await advance(page, 1500);
  await tell([], "wheel", [0, false, 0, 0, false, false]);

  // One that does not wrap stops at its ends.
  await call(page, "few.forceActiveFocus");
  await take(page);
  await press("ArrowUp");
  await advance(page, 1500);
  await tell([], "few", [0, false, 0, 0, false, false]);
  await press("ArrowDown");
  await advance(page, 1500);
  await tell(["few.current 1"], "few", [1, false, 1, -30, false, false]);
  await press("ArrowDown", "ArrowDown");
  await advance(page, 1500);
  await tell(["few.current 2"], "few", [2, false, 2, 0, false, false]);
  await press("ArrowDown");
  await advance(page, 1500);
  await tell([], "few", [2, false, 2, 0, false, false]);
  await press("ArrowUp");
  await advance(page, 1500);
  await tell(["few.current 1"], "few", [1, false, 1, -30, false, false]);

  await set(page, "wheel.enabled", false);
  await call(page, "wheel.forceActiveFocus");
  await take(page);
  await press("ArrowDown");
  await advance(page, 1500);
  await tell([], "wheel", [0, false, 0, 0, false, false]);
});

test("the mouse turns a tumbler that wraps, which is moving until it rests on a row", async ({ page }) => {
  await begin(page);
  const tell = async (notes, state) => {
    await said(page, notes);
    expect(await turning(page, "wheel")).toEqual(state);
  };
  const drag = async (x, from, to, by) => {
    await page.mouse.move(x, from);
    await page.mouse.down();
    for (let y = from + by; by > 0 ? y <= to : y >= to; y += by) await page.mouse.move(x, y);
  };
  // A point that rested before it was let go has no speed left.
  const drop = async () => {
    await page.waitForTimeout(120);
    await page.mouse.up();
  };
  await page.mouse.move(45, 120);
  await page.mouse.down();
  await tell([], [0, false, 0, 0, false, false]);
  await page.mouse.up();
  // Up by most of a row: the row after is the current one, and the one it
  // rests on.
  await drag(45, 120, 80, -5);
  await tell(["moving true", "current 1"], [1, true, 1, 9.405, true, true]);
  await drop();
  await tell([], [1, true, 1, 9.405, true, false]);
  await advance(page, 1500);
  await tell(["moving false"], [1, false, 1, 9, false, false]);
  // Down by two rows, past the first.
  await drag(45, 120, 220, 5);
  await tell(["moving true", "current 0", "current 9"], [9, true, 9, 1.024, true, true]);
  await drop();
  await advance(page, 1500);
  await tell(["moving false"], [9, false, 9, 1, false, false]);
  // The padding is not the view's.
  await drag(12, 120, 70, -5);
  await tell([], [9, false, 9, 1, false, false]);
  await drop();
  await advance(page, 1500);
  await tell([], [9, false, 9, 1, false, false]);
});

// The list of a tumbler that does not wrap is the browser's to scroll, where
// Qt's is dragged: the wheel here. Where it rests at its ends is where Qt's
// does after a drag to them.
test("a tumbler that does not wrap is turned as far as its first row and its last", async ({ page }) => {
  await begin(page);
  expect(await turning(page, "early")).toEqual([5, false, 5, 60, false, false]);
  const rested = (index) =>
    page.waitForFunction((index) => window.scene.early.currentIndex === index && !window.scene.early.moving, index);
  await page.mouse.move(265, 60);
  await page.mouse.wheel(0, -300);
  await rested(0);
  expect(await turning(page, "early")).toEqual([0, false, 0, -40, false, false]);
  await page.mouse.wheel(0, 300);
  await rested(7);
  expect(await turning(page, "early")).toEqual([7, false, 7, 100, false, false]);
  await page.mouse.wheel(0, -40);
  await rested(5);
  expect(await turning(page, "early")).toEqual([5, false, 5, 60, false, false]);
});
