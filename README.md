#   :sparkles:看板娘前端:sparkles:
-   简体中文|[Englis](./README.md)
-   [:link:食用说明](#食用说明)
-   [:link:新增结构](#新增结构)
-   [:link:鸣谢](#鸣谢)
-   [:link:参考链接](#参考链接)
-   [:link:演示地址](https://lrplrplrp.github.io/live2dDemo.html)
-   大家好啊，磨了这么长时间总算是把船新版本的live2d改好了，在此首先感谢[guansss]("https://github.com/guansss/pixi-live2d-display")大佬的live2d框架以及之前编写live2d的大佬们。此次修改重新设计了waifu-jips.json与model_list.json的结构，并且可以对单个模型单独配置waifu-jips.json，模型的地址也可以随意配置。总的来说，就是支持了更多配置、支持了更多模型、优化了配置逻辑。
##  食用说明
-   快速使用，只需在head标签内加上如下代码，load.js 为你的 load.js 文件地址
```html
<script src="loads.js"></script>
```
-   但你肯定不想你的纸片人老婆是说话前篇一律的木头人吧，所以请看下面的详细配置
-   文件说明：
```
index.min.js--live2d框架
live2d.min.js--live2d核心(兼容2.0及以下版本模型)
live2dcubismcore.min.js--live2d核心(兼容3.0及以上版本模型)
pixi.min.js--pixijs渲染
loads.js--资源加载文件
waifu-tips.js--模型，文本框，按钮加载
waifu.css--模型，文本框样式文件
all.min.css--按钮图标样式文件
waifu-tips.json--默认模型文本文件
waifu-tips-XXX.json--单模型文本文件
```
***
-   资源文件地址配置
-   [loads.js](./loads.js#L28)
```javascript
async function loadScriptsInOrder(){
	if (screen.width >= 768) {
	await Promise.all([//以下文件地址可根据实际情况进行更改
			loadExternalResource(live2d_path + "pixi.min.js", "js"),
			loadExternalResource("./live2d.min.js", "js"),
			loadExternalResource("./live2dcubismcore.min.js", "js"),
			loadExternalResource("http://cdn.bootcss.com/jquery/1.11.3/jquery.min.js", "js"),
			loadExternalResource(live2d_path + "waifu.css", "css"),
			loadExternalResource("https://cdn.bootcdn.net/ajax/libs/font-awesome/6.6.0/css/all.min.css", "css")
		])
	await loadExternalResource("./index.min.js", "js");//因调用顺序问题，这两个需要在最后加载
	await loadExternalResource(live2d_path + "waifu-tips.js", "js");
	initWidget({
		waifuPath: live2d_path + "waifu-tips.json",
		modelListPath: "./model_list.json"
	});
}}
```
***
-   模型画布配置
-   [waifu-tips.js](./waifu-tips.js#L1)
```javascript
window.PIXI = PIXI;//请无视
const live2d = PIXI.live2d;//请无视
const canvasWidth = 300;//画布宽
const canvasHeigth = 400;//画布高
const firstModelId=0;//首次加载的模型id
const firstModelTexturesId=0;//首次加载的材质id
const github="https://github.com/lrplrplrp/live2d"//github地址
```
>	以下内容均为后端配置，fork请转至仓库[https://github.com/lrplrplrp/live2d_api](https://github.com/lrplrplrp/live2d_api)
***
-   模型地址与模型加载配置
```json
    {
      "url":"https://raw.bgithub.xyz/lrplrplrp/live2d_api/master/model/genshin/BCSZ1.1/BCSZ1.1.model3.json",
      "url说明":"模型的结构文件,2.0及以下为 model.json 或 index.json ，3.0以上为 model3.json 结尾",
      "tipsUrl":"./waifu-tips-BCSZ.json",
      "tipsUrl说明":"单模型文本文件地址，若为空，则使用load.js中配置的地址。",
      "config":{
        "x":0,
        "x说明":"模型的横轴偏移，默认为0",
        "y":0,
        "y说明":"模型的纵轴偏移，默认为0",
        "scaleX":1.8,
        "scaleX说明":"模型的横轴缩放，默认为1",
        "scaleY":1.8,
        "scaleY说明":"模型的纵轴缩放，默认为1"
      }
    }
```
***
-   模型文本文件配置
-   由于文件过长，这里只简单解释下节点分类
-   [messages-模型的特殊情况下的交互](./waifu-tips.json#L2)
-   [mouseover-鼠标悬浮在某些元素上时的交互](./waifu-tips.json#L22)
-   [click-鼠标点击某些元素时的交互](./waifu-tips.json#L313)
-   [timer-满足特定时间时的交互](./waifu-tips.json#L329)
##  新增结构
-   为了交互更生动，重新设计了waifu-tips.json的结构，可以在交互的时候触发动作和表情，并为动作添加了文本，但因为每个模型的动作和表情命名并不一样，所以需要单独配置一个文件
-   [waifu-tips-BCSZ.json](./waifu-tips-BCSZ.json#L23)
```json
"selector": "#waifu-tool .fa-paper-plane",
		"interaction":{
			"text": ["要不要来玩飞机大战？", "这个按钮上写着「不要点击」。", "怎么，你想来和我玩个游戏？", "听说这样可以蹦迪！"],
        	"motion":"Start"
		}
```
-   [waifu-tips-BCSZ.json](./waifu-tips-BCSZ.json#L272)
```json
"motion":{
		"Tap早上好":"早，嗯?怎么一副无精打采的样子，没有睡好吗?哎呀，昨晚是去做什么坏事了么?",
		"Tap中午好":"嗯~伤脑筋，中午吃些什么呢?油豆腐吃腻了，想吃点清淡的。话说好久没见到社奉行家的小姑娘了，我们不如就去吃她做的点心吧。",
		"Tap晚上好":"今夜的月光如此清亮，不做些什么真是浪费。随我一同去月下漫步吧，不许拒绝。"
	}
```
-   交互配置中同时存在动作和表情时，将优先播放表情，交互文本的优先级要高于动作文本，其他文本的优先级高于交互文本
##  鸣谢
-	[stevenjoezhang](https://github.com/stevenjoezhang)
-	[fghrsh](https://github.com/fghrsh)
-	[guansss](https://github.com/guansss)
-	[Akilarlxh](https://github.com/Akilarlxh)
##  参考链接
-	[https://github.com/stevenjoezhang/live2d-widget](https://github.com/stevenjoezhang/live2d-widget)
-	[https://github.com/fghrsh/live2d_api](https://github.com/fghrsh/live2d_api)
-	[https://github.com/guansss/pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)
-	[https://github.com/Akilarlxh/live2d_api](https://github.com/Akilarlxh/live2d_api)