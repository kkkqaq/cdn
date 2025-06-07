// 延迟加载JS
let customizeInterval = setInterval(() => {
    if (document.querySelector(".footer")) {
        document.querySelector("#customize").style.display = "";
        clearInterval(customizeInterval);
    }
}, 200);

// 字体加载检测 - 简化为标记加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 创建一个隐藏的测试元素
    const testElement = document.createElement('span');
    testElement.className = 'font-test';
    testElement.textContent = '字体测试';
    document.body.appendChild(testElement);
    
    // 简化字体加载检测，直接标记为已加载
    console.log('标记字体为已加载状态');
    document.documentElement.classList.add('fonts-loaded');
});

// 获取一言内容的函数
function fetchHitokoto() {
    fetch('https://img.8845.top/yiyan/')
        .then(response => response.json())
        .then(data => {
            if(data.status === "success" && data.content) {
                const hitokotoElement = document.getElementById('hitokoto');
                if (hitokotoElement) {
                    hitokotoElement.innerText = data.content;
                }
            }
        })
        .catch(error => console.error('获取一言失败:', error));
}

// 站点运行时间 - 优化显示格式
function show_runtime() {
    window.setTimeout("show_runtime()", 1000);
    // 这里填写你的建站时间
    const startDate = new Date("6/4/2025 14:00:00");
    const currentDate = new Date();
    
    // 如果开始时间在未来，显示预计上线时间
    if (startDate > currentDate) {
        const timeDiff = startDate.getTime() - currentDate.getTime();
        const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);
        
        document.getElementById('runtime_span').innerHTML = "预计上线倒计时：" + days + "天" + hours + "小时" + minutes + "分" + seconds + "秒";
        return;
    }
    
    // 计算已运行时间
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);
    
    document.getElementById('runtime_span').innerHTML = "本站已运行 " + days + " 天 " + hours + " 小时 " + minutes + " 分 " + seconds + " 秒";
}

// 初始化运行时间
show_runtime();

// 延迟加载逻辑
let oldInterval = setInterval(() => {
    const bodyContainer = document.querySelector(".body.hope-stack");
    if (bodyContainer) {
        bodyContainer.appendChild(document.getElementById("customize"));
        document.getElementById("customize").style.display = "block";
        
        // 在元素加载到DOM后设置一言内容
        if (window.hitokoroContent) {
            const hitokotoElement = document.getElementById('hitokoto');
            if (hitokotoElement) {
                hitokotoElement.innerText = window.hitokoroContent;
            }
        } else {
            // 如果全局变量中没有一言内容，则重新获取
            fetchHitokoto();
        }
        
        clearInterval(oldInterval);
    }
}, 200);

// 确保页面完全加载后再次尝试设置一言
window.addEventListener('load', function() {
    setTimeout(function() {
        const hitokotoElement = document.getElementById('hitokoto');
        if (hitokotoElement && hitokotoElement.innerText === '你现在的气质里，藏着你走过的路，读过的书和爱过的人。') {
            fetchHitokoto();
        }
    }, 1000);
});

// 评论系统开关功能
function toggleComments() {
    var commentSection = document.getElementById("comment-section");
    var toggleButton = document.querySelector(".toggle-comments");
    
    if (commentSection.style.display === "none" || !commentSection.style.display) {
        commentSection.style.display = "block";
        toggleButton.innerHTML = '<i class="fas fa-times" style="margin-right: 0.4rem; color: var(--link-color);"></i>隐藏评论';
        
        // 延迟加载评论，确保DOM已经准备好
        setTimeout(function() {
            try {
                if (typeof Valine !== 'undefined' && !window.valineInstance) {
                    // 保存原始Valine构造函数
                    const OriginalValine = Valine;
                    
                    // 重写Valine构造函数，添加钩子
                    window.Valine = function(options) {
                        // 确保parseAvatarMeta函数被正确调用
                        const originalParseAvatarMeta = options.parseAvatarMeta;
                        if (originalParseAvatarMeta) {
                            options.parseAvatarMeta = function(json) {
                                const result = originalParseAvatarMeta.call(this, json);
                                return result;
                            };
                        }
                        
                        // 尝试修改Valine内部的getAvatarUrl方法
                        try {
                            // 创建一个实例
                            const instance = new OriginalValine(options);
                            
                            // 查找并替换getAvatarUrl方法
                            if (instance.getAvatarUrl) {
                                const originalGetAvatarUrl = instance.getAvatarUrl;
                                instance.getAvatarUrl = function(mail) {
                                    // 检查是否是QQ邮箱
                                    if (isQQMail(mail)) {
                                        const qq = mail.replace(/@qq\.com$/, '');
                                        const url = getQQAvatar(qq);
                                        return url;
                                    }
                                    
                                    // 检查是否是QQ号
                                    if (isQQ(mail)) {
                                        const url = getQQAvatar(mail);
                                        return url;
                                    }
                                    
                                    // 使用随机头像
                                    const url = getRandomAvatar(mail);
                                    return url;
                                };
                            }
                            
                            return instance;
                        } catch (e) {
                            return new OriginalValine(options);
                        }
                    };
                    
                    window.valineInstance = new Valine({
                        visitor: true,
                        el: '#vcomments',
                        avatar: '', // 禁用默认头像
                        avatarForce: true, // 强制使用自定义头像
                        enableQQ: true, // 启用QQ号和QQ邮箱自动获取头像
                        appId: 'fj6lFwUIgjHpvYwoFawTTHvz-gzGzoHsz',
                        appKey: 'A6Gwu6bwABTF5GqsO545QHL8',
                        placeholder: "有什么问题欢迎评论区留言~么么哒",
                        serverURLs: 'https://fj6lfwui.lc-cn-n1-shared.com',
                        recordIP: false, // 禁用IP记录
                        region: 'cn-n1', // 指定区域
                        // 添加自定义表情
                        emojiCDN: '//i0.hdslb.com/bfs/emote/',
                        emojiMaps: {
                            "tv_doge": "6ea59c827c414b4a2955fe79e0f6fd3dcd515e24.png",
                            "tv_亲亲": "a8111ad55953ef5e3be3327ef94eb4a39d535d06.png",
                            "tv_偷笑": "bb690d4107620f1c15cff29509db529a73aee261.png",
                            "tv_再见": "180129b8ea851044ce71caf55cc8ce44bd4a4fc8.png",
                            "tv_冷漠": "b9cbc755c2b3ee43be07ca13de84e5b699a3f101.png",
                            "tv_发怒": "34ba3cd204d5b05fec70ce08fa9fa0dd612409ff.png",
                            "tv_惊吓": "0d15c7e2ee58e935adc6a7193ee042388adc22af.png",
                            "tv_呆": "9f996894a39e282ccf5e66856af49483f81870f3.png"
                        },
                        // 自定义头像
                        // 评论框获取焦点时触发
                        focus: function(event) {
                            // 监听昵称输入框变化
                            setTimeout(function() {
                                const nicknameInput = document.querySelector('.vnick');
                                if (nicknameInput) {
                                    nicknameInput.setAttribute('placeholder', '昵称或QQ号');
                                    
                                    // 添加输入事件监听
                                    nicknameInput.addEventListener('input', function() {
                                        const value = this.value.trim();
                                        if (isQQ(value)) {
                                            // 如果输入的是QQ号，自动填充邮箱
                                            const mailInput = document.querySelector('.vmail');
                                            if (mailInput) {
                                                mailInput.value = `${value}@qq.com`;
                                            }
                                        }
                                    });
                                }
                            }, 100);
                        },
                        // 自定义头像处理
                        avatarForce: true,
                        parseAvatarMeta: function(json) {
                            // 如果填写的昵称是QQ号，使用QQ头像
                            const nick = json.nick || '';
                            if (isQQ(nick)) {
                                return getQQAvatar(nick);
                            }
                            
                            // 如果填写的邮箱是QQ邮箱，使用QQ头像
                            const email = json.mail || '';
                            if (isQQMail(email)) {
                                const qq = email.replace(/@qq\.com$/, '');
                                return getQQAvatar(qq);
                            }
                            
                            // 如果没有QQ信息，使用邮箱或昵称作为标识符获取一致的头像
                            // 优先使用邮箱，因为邮箱通常更加唯一
                            const identifier = email || nick || '';
                            return getRandomAvatar(identifier);
                        },
                        // 错误处理
                        errorCallback: function(error) {
                            // 移除日志打印，保留错误处理
                        }
                    });
                    
                    // 添加评论提交事件监听，用于调试
                    setTimeout(function() {
                        const submitBtn = document.querySelector('.vsubmit');
                        if (submitBtn) {
                            submitBtn.addEventListener('click', function() {
                                const nickInput = document.querySelector('.vnick');
                                const mailInput = document.querySelector('.vmail');
                                
                                if (nickInput && mailInput) {
                                    const nick = nickInput.value;
                                    const mail = mailInput.value;
                                    
                                    if (isQQ(nick)) {
                                    } else if (isQQMail(mail)) {
                                    }
                                }
                            });
                        }
                    }, 1000);
                    
                    // 添加样式以改进QQ号输入体验
                    const style = document.createElement('style');
                    style.textContent = `
                        .v .vwrap .vheader .vinput.vnick:focus::placeholder {
                            color: rgba(0,0,0,0.3);
                        }
                        .v .vwrap .vheader .vinput.vnick::placeholder {
                            color: rgba(0,0,0,0.5);
                        }
                        .hope-ui-dark .v .vwrap .vheader .vinput.vnick::placeholder {
                            color: rgba(255,255,255,0.5);
                        }
                        .hope-ui-dark .v .vwrap .vheader .vinput.vnick:focus::placeholder {
                            color: rgba(255,255,255,0.3);
                        }
                        .v .vwrap .vheader .qq-avatar-hint {
                            font-size: 12px;
                            color: var(--link-color);
                            margin-top: 2px;
                            display: none;
                        }
                        .v .vwrap .vheader .vinput.vnick:focus + .qq-avatar-hint {
                            display: block;
                        }
                    `;
                    document.head.appendChild(style);
                    
                    // 立即处理页面上的Gravatar头像
                    function processExistingGravatarAvatars() {
                        const avatars = document.querySelectorAll('.vimg');
                        
                        avatars.forEach(function(avatar) {
                            if (avatar.src && avatar.src.includes('gravatar.loli.net')) {
                                // 查找评论者信息
                                const commentItem = avatar.closest('.vcard');
                                if (commentItem) {
                                    let mail = '';
                                    let nick = '';
                                    
                                    // 尝试从DOM元素获取邮箱和昵称
                                    const mailElement = commentItem.querySelector('.vhead .vmail');
                                    const nickElement = commentItem.querySelector('.vhead .vnick');
                                    
                                    if (mailElement) {
                                        mail = mailElement.getAttribute('data-mail') || '';
                                    }
                                    
                                    if (nickElement) {
                                        nick = nickElement.textContent || '';
                                    }
                                    
                                    // 根据邮箱或昵称确定头像
                                    if (isQQMail(mail)) {
                                        const qq = mail.replace(/@qq\.com$/, '');
                                        avatar.src = getQQAvatar(qq);
                                    } else if (isQQ(nick)) {
                                        avatar.src = getQQAvatar(nick);
                                    } else {
                                        // 使用随机头像，优先使用邮箱或昵称作为标识符
                                        const identifier = mail || nick || avatar.src;
                                        avatar.src = getRandomAvatar(identifier);
                                    }
                                }
                            }
                        });
                    }
                    
                    // 在评论加载后处理头像
                    setTimeout(processExistingGravatarAvatars, 1000);
                    
                    // 添加MutationObserver监听DOM变化，处理新添加的评论头像
                    const observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                                // 检查新添加的节点中是否有评论头像
                                for (let i = 0; i < mutation.addedNodes.length; i++) {
                                    const node = mutation.addedNodes[i];
                                    if (node.nodeType === 1) { // 元素节点
                                        // 查找新添加的头像
                                        const newAvatars = node.querySelectorAll ? node.querySelectorAll('.vimg') : [];
                                        if (node.classList && node.classList.contains('vimg')) {
                                            newAvatars.push(node);
                                        }
                                        
                                        // 处理找到的头像
                                        newAvatars.forEach(function(avatar) {
                                            // 检查是否是Gravatar头像
                                            if (avatar.src && avatar.src.includes('gravatar.loli.net')) {
                                                // 查找评论者信息
                                                const commentItem = avatar.closest('.vcard');
                                                if (commentItem) {
                                                    let mail = '';
                                                    let nick = '';
                                                    
                                                    // 尝试获取邮箱
                                                    const mailMeta = commentItem.querySelector('.vhead .vmail');
                                                    if (mailMeta) {
                                                        mail = mailMeta.getAttribute('data-mail') || '';
                                                    }
                                                    
                                                    // 尝试获取昵称
                                                    const nickMeta = commentItem.querySelector('.vhead .vnick');
                                                    if (nickMeta) {
                                                        nick = nickMeta.textContent || '';
                                                    }
                                                    
                                                    // 根据邮箱或昵称确定头像
                                                    if (isQQMail(mail)) {
                                                        const qq = mail.replace(/@qq\.com$/, '');
                                                        avatar.src = getQQAvatar(qq);
                                                    } else if (isQQ(nick)) {
                                                        avatar.src = getQQAvatar(nick);
                                                    } else {
                                                        // 使用随机头像
                                                        const identifier = mail || nick || avatar.src;
                                                        avatar.src = getRandomAvatar(identifier);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        });
                    });
                    
                    // 开始观察评论区的DOM变化
                    setTimeout(function() {
                        const commentsContainer = document.getElementById('vcomments');
                        if (commentsContainer) {
                            observer.observe(commentsContainer, {
                                childList: true,
                                subtree: true
                            });
                        }
                    }, 1500);
                }
            } catch (e) {
                // 移除日志打印，保留错误处理
                const vcommentsEl = document.getElementById('vcomments');
                if (vcommentsEl) {
                    vcommentsEl.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">评论加载失败，请刷新页面重试</div>';
                }
            }
        }, 100);
    } else {
        commentSection.style.display = "none";
        toggleButton.innerHTML = '<i class="fas fa-comments" style="margin-right: 0.4rem; color: var(--link-color);"></i>显示评论';
    }
}

// QQ号识别和头像获取函数
function isQQMail(email) {
    return /^[1-9][0-9]{4,12}@qq\.com$/.test(email);
}

function isQQ(qq) {
    return /^[1-9][0-9]{4,12}$/.test(qq);
}

// 调试函数 - 在控制台输出头像信息
function logAvatarInfo(type, identifier, url) {
    // 移除日志打印
}

function getQQAvatar(qq, size = 640) {
    // 处理QQ邮箱，提取QQ号
    if (isQQMail(qq)) {
        qq = qq.replace(/@qq\.com$/, '');
        const url = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=640&img_type=jpg`;
        logAvatarInfo('QQ邮箱转换为QQ号', qq, url);
        return url;
    } 
    // 处理纯QQ号
    else if (isQQ(qq)) {
        const url = `https://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=640&img_type=jpg`;
        logAvatarInfo('QQ号', qq, url);
        return url;
    }
    // 不是QQ号或QQ邮箱，使用随机头像
    else {
        const randomUrl = getRandomAvatar(qq);
        logAvatarInfo('随机头像', qq, randomUrl);
        return randomUrl;
    }
}

// 随机头像数组
const randomAvatars = [
    'https://pan.8845.top/p/pan/1.jpg',
    'https://pan.8845.top/p/pan/2.jpg',
    'https://pan.8845.top/p/pan/3.jpg',
    'https://pan.8845.top/p/pan/8.jpg',
    'https://pan.8845.top/d/pan/10.jpg'
];

// 获取随机头像 - 使用字符串哈希确保同一用户获取相同头像
function getHashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function getRandomAvatar(identifier) {
    // 如果没有提供标识符，使用随机头像
    if (!identifier) {
        const randomIndex = Math.floor(Math.random() * randomAvatars.length);
        return randomAvatars[randomIndex];
    }
    
    // 使用标识符生成哈希，确保同一用户获得相同头像
    const hash = getHashCode(identifier);
    
    // 使用哈希值选择头像API或本地头像
    if (hash % 2 === 0) {
        // 使用loliapi头像API
        return `https://www.loliapi.com/acg/pp/?id=${hash}`;
    } else {
        // 使用本地头像
        const index = hash % randomAvatars.length;
        return randomAvatars[index];
    }
}

// 鼠标点击爱心特效
!function (e, t, a) {
    function r() {
        for (var e = 0; e < s.length; e++) s[e].alpha <= 0 ? (t.body.removeChild(s[e].el), s.splice(e, 1)) : (s[e].y--, s[e].scale += .004, s[e].alpha -= .013, s[e].el.style.cssText = "left:" + s[e].x + "px;top:" + s[e].y + "px;opacity:" + s[e].alpha + ";transform:scale(" + s[e].scale + "," + s[e].scale + ") rotate(45deg);background:" + s[e].color + ";z-index:99999");
        requestAnimationFrame(r)
    }

    function n() {
        var t = "function" == typeof e.onclick && e.onclick;
        e.onclick = function (e) {
            t && t(), o(e)
        }
    }

    function o(e) {
        var a = t.createElement("div");
        a.className = "heart", s.push({
            el: a,
            x: e.clientX - 5,
            y: e.clientY - 5,
            scale: 1,
            alpha: 1,
            color: c()
        }), t.body.appendChild(a)
    }

    function i(e) {
        var a = t.createElement("style");
        a.type = "text/css";
        try {
            a.appendChild(t.createTextNode(e))
        } catch (t) {
            a.styleSheet.cssText = e
        }
        document.head.appendChild(a)
    }

    function c() {
        return "rgb(" + ~~(255 * Math.random()) + "," + ~~(255 * Math.random()) + "," + ~~(255 * Math.random()) + ")"
    }

    var s = [];
    e.requestAnimationFrame = e.requestAnimationFrame || e.webkitRequestAnimationFrame || e.mozRequestAnimationFrame || e.oRequestAnimationFrame || e.msRequestAnimationFrame || function (e) {
        setTimeout(e, 1e3 / 60)
    };

    i(".heart{width: 10px;height: 10px;position: fixed;background: #f00;transform: rotate(45deg);}.heart:after,.heart:before{content: '';width: inherit;height: inherit;background: inherit;border-radius: 50%;position: fixed;}.heart:after{top: -5px;}.heart:before{left: -5px;}"), n(), r()
}(window, document);

// 全局错误处理
window.addEventListener('error', function(e) {
    // 处理图片加载错误
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        if (e.target.classList.contains('vimg')) {
            // 检查是否是QQ头像加载失败
            const src = e.target.src || '';
            if (src.includes('q.qlogo.cn/headimg_dl')) {
                // 尝试从URL中提取QQ号
                let qqNumber = '';
                const qqMatch = src.match(/dst_uin=(\d+)/);
                if (qqMatch && qqMatch[1]) {
                    qqNumber = qqMatch[1];
                }
                
                // 尝试获取评论者标识符
                const commentItem = e.target.closest('.vcard');
                let identifier = '';
                
                if (commentItem) {
                    const emailMeta = commentItem.querySelector('.vhead .vmail');
                    const nickMeta = commentItem.querySelector('.vhead .vnick');
                    
                    if (emailMeta) {
                        identifier = emailMeta.getAttribute('data-mail') || '';
                    }
                    
                    if (!identifier && nickMeta) {
                        identifier = nickMeta.textContent || '';
                    }
                }
                
                // 优先使用从URL提取的QQ号作为标识符
                identifier = qqNumber || identifier;
                
                // 如果找不到标识符，使用图片的src作为备选
                if (!identifier && e.target.src) {
                    identifier = e.target.src;
                }
                
                e.target.src = getRandomAvatar(identifier);
                e.target.onerror = null;
                e.target.classList.add('error');
            }
        }
    }
}, true); 
