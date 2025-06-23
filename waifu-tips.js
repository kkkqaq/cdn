
window.PIXI = PIXI;
const live2d = PIXI.live2d;
const canvasWidth = 300;//画布宽
const canvasHeigth = 400;//画布高
const firstModelId=0;//首次加载的模型id
const firstModelTexturesId=0;//首次加载的材质id
const github="https://github.com/lrplrplrp/live2d"

async function loadWidget(config) {
	let {
		waifuPath,
		modelListPath,
		modelPath
	} = config;
	let modelList,
		waifuTips,
		model = null;
	localStorage.removeItem("waifu-display");
	sessionStorage.removeItem("waifu-text");
	document.body.insertAdjacentHTML("beforeend", `<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d"></canvas>
			<div id="waifu-tool">
				<span class="fa-solid fa-xl fa-comment"></span>
				<span class="fa-solid fa-xl fa-cloud"></span>
				<span class="fa-solid fa-xl fa-paper-plane"></span>
				<span class="fa-solid fa-xl fa-user-circle"></span>
				<span class="fa-solid fa-xl fa-street-view"></span>
				<span class="fa-solid fa-xl fa-info-circle"></span>
				<span class="fa-xl fa-brands fa-github"></span>
				<span class="fa-solid fa-xl fa-times"></span>
			</div>
		</div>`);
	document.getElementById("live2d").style.width = canvasWidth+"px";//fa-brands fa-github   fa-solid fa-cloud 
	document.getElementById("live2d").style.height = canvasHeigth+"px";

	const appWidth=canvasWidth*devicePixelRatio;
	const appHeight=canvasHeigth*devicePixelRatio
	const app = new PIXI.Application({
		width: appWidth,
		height: appHeight,
		view: document.getElementById('live2d'),
		autoStart: true,
		transparent: true
	});

	// setTimeout(() => {
	// 	document.getElementById("waifu").style.bottom = 0;
	// }, 0);

	if (localStorage.getItem("skin") === "furvous") document.getElementById("waifu-tips").style.color = "white";

	function randomSelection(obj) {
		return Array.isArray(obj) ? obj[Math.floor(Math.random() * obj.length)] : obj;
	}

	function idSelection(obj, id) {
		return Array.isArray(obj) ? obj[id] : obj;
	}

	// 检测用户活动状态，并在空闲时显示消息
	let userAction = false,
		userActionTimer=0,
		messageTimer;
	window.addEventListener("mousemove", () => userAction = true);
	window.addEventListener("keydown", () => userAction = true);
	setInterval(() => {
		userActionTimer++;
		if (userAction){
			userActionTimer=0;
			userAction=false;
		} 
		if(userActionTimer>=30){
			loadInteraction(waifuTips.messages.idleMsg);
			userActionTimer=0;
		}
	}, 1000);

	let weather=await getWeather();
	//在特定时间执行一次操作
	setInterval(async () => {
		const now=new Date();
		waifuTips.timer.forEach(({
			date,
			time,
			interaction
		}) => {
			if (checkDateTime(date,time,now)) {
				loadInteraction(interaction);
			}
		});
		const nowWeather=await getWeather();
		if(weather!=nowWeather){
			showWeatherText();
			weather=nowWeather;
		}
	}, 60000);

	const firstMin=new Date().getMinutes();
	function checkDateTime(date,time,now){
		function checkDate(){
			if(!date)return true;
			let dateSplit=date.split("-");
			after = dateSplit[0],
			before = dateSplit[1] || after;
			let afterSplit=after.split("/"),
			beforeSplit=before.split("/");
			if ((afterSplit[0] <= now.getMonth() + 1 && now.getMonth() + 1 <=beforeSplit[0]) && 
			(afterSplit[1] <= now.getDate() && now.getDate() <= beforeSplit[1])) return true;
			return false;
		}
		function checkTime(){
			if(!time)return true;
			let timeSplit=time.split("-");
			after = timeSplit[0],
			before = timeSplit[1] || after;
			let afterSplit=after.split(":"),
			beforeSplit=before.split(":");
			if(timeSplit[1]){
				if((afterSplit[0] <= now.getHours() && now.getHours() <=beforeSplit[0])){
					if(firstMin==now.getMinutes())return true;
					else return false;
				}
			}
			if ((afterSplit[0] <= now.getHours() && now.getHours() <=beforeSplit[0]) && 
			(afterSplit[1] <= now.getMinutes() && now.getMinutes() <= beforeSplit[1])) return true;
			return false;
		}
		return (checkDate() && checkTime())
	}
	
	function keyReplace(text,event=undefined){
		const { year } = new Date();
		const tipsKey={
			"{text}":event?event.target.innerText:undefined,
			"{year}":year,
			"{title}":document.title.split('-')[0],
			"{hostname}":document.referrer.hostname
		}
		tempText=text;
		for(let key in tipsKey)tempText=tempText.replace(key, tipsKey[key]);
		return tempText;
	}

	async function initModel() {
		let modelId = localStorage.getItem("modelId"),
			modelTexturesId = localStorage.getItem("modelTexturesId");
		if (modelId === null) {
			// 首次访问加载 指定模型 的 指定材质
			modelId = firstModelId; // 模型 ID
			modelTexturesId = firstModelTexturesId; // 材质 ID
		}

		await loadModelConfig(modelId);
		loadModel(modelId, modelTexturesId).then(result => {
			model = result;
			window.addEventListener("mouseover", event => {
				//const { year } = new Date();
				// const tipsKey={
				// 	"{text}":event.target.innerText,
				// 	"{year}":year,
				// 	"{title}":document.title.split('-')[0]
				// }
				for (let {
					selector,
					interaction
				} of waifuTips.mouseover) {
					if (!event.target.matches(selector)) continue;
					if(interaction)loadInteraction(interaction,(text)=>keyReplace(text,event));
					return;
				}
			});
			window.addEventListener("click", event => {
				// const { year } = new Date();
				// const tipsKey={
				// 	"{text}":event.target.innerText,
				// 	"{year}":year,
				// 	"{title}":document.title.split('-')[0]
				// }
				for (let {
					selector,
					interaction
				} of waifuTips.click) {
					if (!event.target.matches(selector)) continue;
					if(interaction)loadInteraction(interaction,(text)=>keyReplace(text,event));
					return;
				}
			});
		});
	}

	function registerEventListener() {
		document.querySelector("#waifu-tool .fa-comment").addEventListener("click", showHitokoto); //showHitokoto
		document.querySelector("#waifu-tool .fa-cloud").addEventListener("click", showWeatherText);//fa-cloud
		document.querySelector("#waifu-tool .fa-paper-plane").addEventListener("click", () => {
			if (window.Asteroids) {
				if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
				window.ASTEROIDSPLAYERS.push(new Asteroids());
			} else {
				const script = document.createElement("script");
				script.src = "";
				document.head.appendChild(script);
			}
		});
		document.querySelector("#waifu-tool .fa-user-circle").addEventListener("click", loadOtherModel);
		document.querySelector("#waifu-tool .fa-street-view").addEventListener("click", loadRandModel);
		document.querySelector("#waifu-tool .fa-info-circle").addEventListener("click", () => {loadInteraction(waifuTips.messages.about);});
		document.querySelector("#waifu-tool .fa-github").addEventListener("click", () => {open(github);});
		document.querySelector("#waifu-tool .fa-times").addEventListener("click", () => {
			localStorage.setItem("waifu-display", Date.now());
			document.getElementById("waifu").style.bottom = `-${canvasHeigth*1.5}px`;
			setTimeout(() => {
				//document.getElementById("waifu").style.display = "none";//有动作就会出现无头的情况
				app.stop();
				document.getElementById("waifu-toggle").classList.add("waifu-toggle-active");
			}, 1500);
		});

		// const devtools = () => { };//试了几个方法都不是很准确，放弃了
		// devtools.toString = () => {
		// 	showMessage(waifuTips.messages.devtools, 9);
		// };
		// console.log("%c", devtools);

		window.addEventListener("copy", () => {
			loadInteraction(waifuTips.messages.copy,null,priority=4);
		});
		window.addEventListener("visibilitychange", () => {
			if (!document.hidden) loadInteraction(waifuTips.messages.focus);
		});
		const toggle = document.getElementById("waifu-toggle");
		toggle.addEventListener("click", () => {
			app.start();
		});
	}



	function welcomeMessage() {
		let interAction;
		if (location.pathname === "/lrplrplrp/") { // 如果是主页，可在浏览器后台输入location.pathname确定判断条件 
			loadInteraction(waifuTips.messages.home)
		} 
		if (document.referrer !== "") {
			const referrer = new URL(document.referrer),
				domain = referrer.hostname.split(".")[1];
			if (location.hostname === referrer.hostname) interAction = waifuTips.messages.location;
			for(key in waifuTips.messages.domain)if(domain===key)interAction=waifuTips.messages.domain[key];
			if(!interAction) interAction = waifuTips.messages.domain_other;
		} 
		if(!interAction)interAction = waifuTips.messages.path_other;
		loadInteraction(interAction,(text)=>keyReplace(text));//{hostname}
	}

	function showHitokoto() {
		// 增加 hitokoto.cn 的 API
		fetch("https://v1.hitokoto.cn?c=k")
			.then(response => response.json())
			.then(result => {
				showMessage(result.hitokoto,9);
			});
	}

	//获得当前天气的API
	//晴，多云，小雨，阴
	async function getWeather() {
		const now = new Date().getHours();
		let weather="晴";
		// await fetch("https://api.vore.top/api/Weather")//因访问次数不足以满足需求，暂时禁用
		// 	.then(response => response.json())
		// 	.then(result => {
		// 		weather=result.data.tianqi.weather;
		// });
		return weather;
	}

	//根据天气获取文本
	async function showWeatherText() {
		const weather = await getWeather();
		if ("weather" in waifuTips && weather in waifuTips.weather) {
			const text = waifuTips.weather[weather];
			console.log(text);
			loadInteraction(text);
		} else loadInteraction({text:`现在的天气是${weather}`});
	}

	//作者并没兼容老版模型的hitarea，需要自己完成点击区域的创建
	function drawHitArea(model) {
		if (Object.keys(model.internalModel.hitAreas).length > 0) {
			model.on('hit', (hitarea) => {
				setMotion( "Tap" + hitarea);
			});
		} else if ("hit_areas_custom" in model.internalModel.settings.json) {
			//没想到特别好的办法，只能先将就一下了
			model.on('click', (hitarea) => {
				const canvasPro = document.getElementById("live2d").getBoundingClientRect();
				//console.log(hitarea.data.originalEvent.clientX, hitarea.data.originalEvent.clientY);
				if (hitarea.data.originalEvent.clientY - canvasPro.top < canvasHeigth / 2) setMotion( "flick_head");
				else setMotion( "tap_body");
			});
		}
	}

	//优先级规划：交互优先级：1 ，text优先级：3，各类特殊事件优先级：9
	function showMessage(text,priority,timeout) {
		if (!text || (sessionStorage.getItem("waifu-text") && sessionStorage.getItem("waifu-text") > priority))
			return;
		if (messageTimer) {
			clearTimeout(messageTimer);
			messageTimer = null;
		}
		text = randomSelection(text);
		timeout=timeout?timeout:countChars(text)*1000;
		sessionStorage.setItem("waifu-text", priority);
		const tips = document.getElementById("waifu-tips");
		tips.innerHTML = text;
		tips.classList.add("waifu-tips-active");
		messageTimer = setTimeout(() => {
			sessionStorage.removeItem("waifu-text");
			tips.classList.remove("waifu-tips-active");
		}, timeout);
	}

	async function loadModelList() {
		const response = await fetch(modelListPath);//, {mode: 'no-cors'}
		modelList = await response.json();
	}

	async function loadWaifuTips(modelId) {
		const modelconfig = modelList.models[modelId];
		let path;
		if ('tipsUrl' in modelconfig && modelconfig.tipsUrl != "") {
			path = modelList.models[modelId].tipsUrl;
		} else path = waifuPath;
		const response = await fetch(pathMerge(modelPath,path));
		waifuTips = await response.json();
	}

	async function loadModelConfig(modelId) {
		if (!modelList) await loadModelList();
		await loadWaifuTips(modelId);
	}

	//将modelList中的相对路径转为网络路径，modelList中使用相对路径或网络路径
	function pathMerge(modelFilePath,relativePath){
		if(relativePath.includes("http"))return relativePath
		else return modelFilePath+relativePath.replace("./","")
	}

	async function loadModel(modelId, modelTexturesId) {
		localStorage.setItem("modelId", modelId);
		localStorage.setItem("modelTexturesId", modelTexturesId);
		//三代模型以后普遍比较大，加载时间比较久，所以隐藏一下
		document.getElementById("waifu").style.bottom = `-${canvasHeigth*1.5}px`;
		await setTimeout(async ()=>{
			model = await live2d.Live2DModel.from(pathMerge(modelPath,idSelection(modelList.models[modelId].url, modelTexturesId)));
			app.stage.removeChildren();
			app.stage.addChild(model);
			model.buttonMode = true;
			autoSetTransform(modelId);
			drawHitArea(model);
			console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);
			//三代模型加载卡顿比较明显，目前还没有解决方案,模型加载好会卡顿一下，所以等待半秒
			setTimeout(()=>{
				document.getElementById("waifu").style.bottom = 0;
				if(waifuTips.messages.meetMsg)loadInteraction(waifuTips.messages.meetMsg)
			},500);
		},1000);
		return model;
	}

	//自动调整模型位置和大小，使其适应元素
	function autoSetTransform(modelId) {
		const h = appHeight / model.internalModel.originalHeight;
		const w = appWidth / model.internalModel.originalWidth;
		if ('config' in modelList.models[modelId]) { //读取用户配置并修改配置
			const config = modelList.models[modelId].config;
			const min = Math.min(h, w)
			model.scale.set(config.scaleX * min, config.scaleY * min);
			model.y = (appHeight - model.height) / 2 + config.y;
			model.x = (appWidth - model.width) / 2 + config.x;
		} else {
			model.scale.set(Math.min(h, w));
			model.y = (appHeight - model.height) / 2;
			model.x = (appWidth - model.width) / 2;
		}
	}

	//设置表情
	async function setExpression( exp, time = 4) {
		const expressionManager = model.internalModel.motionManager.expressionManager;
		if (exp) {
			if (waifuTips.expression && waifuTips.expression[exp]) showMessage(waifuTips.expression[exp], 1);
			expressionManager.setExpression(randomSelection(exp));
			setTimeout(() => {
				expressionManager.resetExpression();
				//重置表情不会修改当前表情，且当修改的表情与当前表情一致时，修改会失败，所以重置表情后需要手动修改当前表情的值
				expressionManager.currentExpression = expressionManager.defaultExpression;
			}, time * 1000);
		} else {
			expressionManager.setExpression(); //随机加载表情
		}
	}

	//设置动作
	async function setMotion( group, index) {
		await model.motion(group, index)
		if (waifuTips.motion && waifuTips.motion[group]) showMessage(waifuTips.motion[group], 1);
	}

	//中英文字符计算，并返回读完所需的大概时间，单位s
	function countChars(str) {
		let chinese = 0; 
		let english = 0; 
		let special = 0; 
	   
		for (let i = 0; i < str.length; i++) {
		  const charCode = String(str).charCodeAt(i);
		  if (charCode >= 0x4E00 && charCode <= 0x9FFF) {
			chinese++;
		  } else if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
			english++;
		  } else {
			special++;
		  }
		}
		return 1+(~~(chinese/3)+~~(english/10)+~~(special/2));
	}

	//交互读取
	function loadInteraction(interaction,textFunc,priority=3){
		let text="";
		if(interaction.text){
			text=randomSelection(interaction.text);
			if(textFunc)text=textFunc(text);
			showMessage(text,priority);
		}
		if(interaction.motion)setMotion( interaction.motion);
		else if(interaction.expression)setExpression( interaction.expression)
	}

	async function loadRandModel() {
		const modelId = localStorage.getItem("modelId");
		let modelTexturesId = localStorage.getItem("modelTexturesId");

		//顺序选择
		if (Array.isArray(modelList.models[modelId].url)&&modelList.models[modelId].url.length>1) {
			const index = (++modelTexturesId >= modelList.models[modelId].url.length) ? 0 :
				modelTexturesId;
			loadModel(modelId, index);
			loadInteraction(waifuTips.messages.newClothes);
		} else loadInteraction(waifuTips.messages.notNewClothes);

		//控制台输出模型材质id
		//console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);

	}

	async function loadOtherModel() {
		let modelId = localStorage.getItem("modelId");
		const index = (++modelId >= modelList.models.length) ? 0 : modelId;
		loadModel(index, 0, "");
		loadModelConfig(index);
	}

	await initModel();
	registerEventListener();
	welcomeMessage();
}

function initWidget(config) {
	document.body.insertAdjacentHTML("beforeend", `<div id="waifu-toggle">
			<span>看板娘</span>
		</div>`);
	const toggle = document.getElementById("waifu-toggle");
	toggle.addEventListener("click", () => {
		toggle.classList.remove("waifu-toggle-active");
		if (toggle.getAttribute("first-time")) {
			loadWidget(config);
			toggle.removeAttribute("first-time");
		} else {
			localStorage.removeItem("waifu-display");
			//document.getElementById("waifu").style.display = "";
			setTimeout(() => {
				document.getElementById("waifu").style.bottom = 0;
			}, 0);
		}
	});
	if (localStorage.getItem("waifu-display") && Date.now() - localStorage.getItem("waifu-display") <= 86400000) {
		toggle.setAttribute("first-time", true);
		setTimeout(() => {
			toggle.classList.add("waifu-toggle-active");
		}, 0);
	} else {
		loadWidget(config);
	}
}
