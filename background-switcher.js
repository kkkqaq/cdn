/**
 * 背景切换功能
 * 支持在图片背景和视频背景之间切换，并记住用户选择
 */

// 视频背景配置 - 包含API获取地址和视频信息
const videoBackgrounds = {
  light: {
    // API接口地址，供直接获取视频URL
    apiUrl: "https://img.8845.top/al/get_link.php",
    // 视频路径参数
    videoPath: "one/video/9ba3a7357adc03b3c641decaa34d66c0_preview.mp4",
    url: "", // 将由API动态获取
    type: "video/mp4",
    description: "魔女"
  },
  dark: {
    // API接口地址，供直接获取视频URL
    apiUrl: "https://img.8845.top/al/get_link.php",
    // 视频路径参数
    videoPath: "one/video/6f2f3aada1d6603c05b076b7e6664caf_preview.mp4",
    url: "", // 将由API动态获取
    type: "video/mp4",
    description: "少女"
  }
};

// 图片背景配置 - 动态从CSS获取
let imageBackgrounds = {
  light: "",
  dark: ""
};

// 存储键名
const STORAGE_KEY = 'background_preference';

// 当前背景类型状态 (image | video)
let currentBackgroundType = 'image';

// 视频缓存
const videoCache = {
  light: null,
  dark: null,
  status: {
    light: 'unloaded', // unloaded, loading, loaded, error
    dark: 'unloaded'
  }
};

// DOM 元素
let bgToggleBtn;
let bgToggleText;
let videoBackground;
let bgVideo;

// 初始化函数
function initBackgroundSwitcher() {
  // 获取DOM元素
  bgToggleBtn = document.getElementById('bg-toggle');
  bgToggleText = document.getElementById('bg-toggle-text');
  videoBackground = document.getElementById('video-background');
  bgVideo = document.getElementById('bg-video');

  if (!bgToggleBtn || !videoBackground || !bgVideo) {
    console.error('背景切换所需的DOM元素未找到');
    return;
  }

  // 从CSS获取背景图片URL
  extractBackgroundImagesFromCSS();

  // 从本地存储加载用户首选项
  loadUserPreference();

  // 添加点击事件监听器
  bgToggleBtn.addEventListener('click', toggleBackground);

  // 监听主题更改事件
  observeThemeChange();

  // 预缓存当前主题视频
  preCacheCurrentVideo();
}

// 从API获取视频URL
async function getVideoUrlFromApi(theme) {
  try {
    console.log(`正在获取${theme}主题视频URL...`);
    
    // 构建完整的API请求URL，使用videoPath作为参数
    const fullApiUrl = `${videoBackgrounds[theme].apiUrl}?path=${encodeURIComponent(videoBackgrounds[theme].videoPath)}`;
    console.log(`API请求URL: ${fullApiUrl}`);
    
    const response = await fetch(fullApiUrl);
    
    if (!response.ok) {
      console.error(`API请求失败，状态码: ${response.status}`);
      throw new Error('获取视频URL失败');
    }
    
    // 检查内容类型是否为JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`API未返回JSON格式数据，而是返回: ${contentType}`);
      // 如果响应不是JSON，创建一个直接访问的URL
      const directUrl = `https://img.8845.top/${videoBackgrounds[theme].videoPath}`;
      videoBackgrounds[theme].url = directUrl;
      return directUrl;
    }
    
    const data = await response.json();
    console.log("API返回数据:", data);
    
    // 确保API返回了正确的数据格式
    if (data && data.success && data.data && data.data.url) {
      videoBackgrounds[theme].url = data.data.url;
      console.log(`已从API获取${theme}主题视频URL:`, data.data.url);
      return data.data.url;
    } else {
      console.error("API返回数据格式不符合预期:", data);
      throw new Error('API返回的数据格式不正确');
    }
  } catch (error) {
    console.error(`获取${theme}主题视频URL失败:`, error);
    // 尝试使用备用URL策略
    const fallbackUrl = `https://img.8845.top/${videoBackgrounds[theme].videoPath}`;
    console.log(`使用备用URL: ${fallbackUrl}`);
    videoBackgrounds[theme].url = fallbackUrl;
    return fallbackUrl;
  }
}

// 预缓存当前主题视频 - 懒加载模式
async function preCacheCurrentVideo() {
  const theme = isLightTheme() ? 'light' : 'dark';
  
  // 仅在未加载状态下执行预缓存
  if (videoCache.status[theme] === 'unloaded' || videoCache.status[theme] === 'error') {
    videoCache.status[theme] = 'loading';
    
    try {
      // 先获取最新的视频URL
      const videoUrl = await getVideoUrlFromApi(theme);
      
      if (!videoUrl) {
        throw new Error('获取视频URL失败');
      }
      
      // 使用 fetch 先获取视频元数据，不下载完整视频
      const response = await fetch(videoUrl, { method: 'HEAD' });
      if (!response.ok) throw new Error('视频资源不可用');
      
      // 标记为已加载
      videoCache.status[theme] = 'loaded';
      console.log(`${theme}主题视频元数据已预加载`);
      return true;
    } catch (error) {
      console.error(`预加载${theme}主题视频失败:`, error);
      videoCache.status[theme] = 'error';
      return false;
    }
  }
  return videoCache.status[theme] === 'loaded';
}

// 从CSS文件中提取背景图片URL
function extractBackgroundImagesFromCSS() {
  try {
    // 尝试获取所有样式表
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const styleSheet = styleSheets[i];
        // 跳过无法访问的样式表（跨域限制）
        if (!styleSheet.cssRules) continue;

        // 查找目标CSS规则
        for (let j = 0; j < styleSheet.cssRules.length; j++) {
          const rule = styleSheet.cssRules[j];
          
          // 检查是否是我们要找的规则
          if (rule.selectorText === '.hope-ui-light') {
            const cssText = rule.cssText || rule.style.cssText;
            imageBackgrounds.light = extractUrlFromCSSText(cssText);
          } else if (rule.selectorText === '.hope-ui-dark') {
            const cssText = rule.cssText || rule.style.cssText;
            imageBackgrounds.dark = extractUrlFromCSSText(cssText);
          }
        }
      } catch (e) {
        // 忽略跨域错误等
        continue;
      }
    }

    // 如果没有找到背景图片，尝试手动获取CSS文件并解析
    if (!imageBackgrounds.light || !imageBackgrounds.dark) {
      fetch('https://jsd-proxy.ygxz.in/gh/kkkqaq/cdn/head.css')
        .then(response => response.text())
        .then(cssText => {
          // 解析CSS文本
          const lightMatch = cssText.match(/\.hope-ui-light\s*{[^}]*background-image:\s*url\(([^)]+)\)/i);
          const darkMatch = cssText.match(/\.hope-ui-dark\s*{[^}]*background-image:\s*url\(([^)]+)\)/i);
          
          if (lightMatch && lightMatch[1]) {
            imageBackgrounds.light = lightMatch[1].replace(/["']/g, '');
          }
          
          if (darkMatch && darkMatch[1]) {
            imageBackgrounds.dark = darkMatch[1].replace(/["']/g, '');
          }
          
          // 如果背景已经激活但URL是空的，重新应用背景
          if (currentBackgroundType === 'image' && 
              (!document.body.style.backgroundImage || document.body.style.backgroundImage === 'none')) {
            applyImageBackground();
          }
        })
        .catch(error => {
          console.error('获取CSS文件失败:', error);
          // 使用默认背景作为后备
          imageBackgrounds.light = "https://pan.8845.top/d/doubao/%E2%80%94Pngtree%E2%80%94the%20sky%20is%20blue%20with_16496378.jpg";
          imageBackgrounds.dark = "https://pan.8845.top/d/doubao/john-towner-JgOeRuGD_Y4-unsplash.jpg";
        });
    }
  } catch (error) {
    console.error('提取背景图片URL时出错:', error);
    // 使用默认背景作为后备
    imageBackgrounds.light = "https://pan.8845.top/d/doubao/%E2%80%94Pngtree%E2%80%94the%20sky%20is%20blue%20with_16496378.jpg";
    imageBackgrounds.dark = "https://pan.8845.top/d/doubao/john-towner-JgOeRuGD_Y4-unsplash.jpg";
  }
}

// 从CSS文本中提取URL
function extractUrlFromCSSText(cssText) {
  const urlMatch = cssText.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
  return urlMatch ? urlMatch[1] : null;
}

// 加载用户首选项
function loadUserPreference() {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);
    if (preference) {
      const { type } = JSON.parse(preference);
      currentBackgroundType = type || 'image';
      
      // 应用已保存的设置
      if (currentBackgroundType === 'video') {
        activateVideoBackground();
      }
    }
  } catch (error) {
    console.error('加载背景首选项时出错:', error);
    // 出错时回退到默认设置
    currentBackgroundType = 'image';
  }
}

// 保存用户首选项
function saveUserPreference() {
  try {
    const preference = {
      type: currentBackgroundType
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.error('保存背景首选项时出错:', error);
  }
}

// 切换背景类型
function toggleBackground() {
  if (currentBackgroundType === 'image') {
    // 从图片切换到视频
    activateVideoBackground();
  } else {
    // 从视频切换到图片
    deactivateVideoBackground();
  }
  
  // 保存用户首选项
  saveUserPreference();
}

// 激活视频背景
function activateVideoBackground() {
  currentBackgroundType = 'video';
  
  // 更新按钮状态
  bgToggleBtn.classList.add('active');
  bgToggleText.textContent = '切换静态背景';
  
  // 设置合适的视频
  setVideoBasedOnTheme();
  
  // 显示视频背景
  videoBackground.classList.add('active');
}

// 停用视频背景
function deactivateVideoBackground() {
  currentBackgroundType = 'image';
  
  // 更新按钮状态
  bgToggleBtn.classList.remove('active');
  bgToggleText.textContent = '切换动态背景';
  
  // 隐藏视频背景
  videoBackground.classList.remove('active');
  
  // 暂停视频以节省资源
  pauseVideo();
  
  // 确保图片背景正确应用
  applyImageBackground();
}

// 应用图片背景
function applyImageBackground() {
  // 不做任何事情，依靠CSS中定义的背景图片
  // 这里不用设置，因为我们依赖CSS中的背景设置
}

// 根据当前主题设置视频
async function setVideoBasedOnTheme() {
  const theme = isLightTheme() ? 'light' : 'dark';
  
  // 显示加载指示器
  showLoadingIndicator();
  
  try {
    // 检查视频缓存状态，如果是错误状态则重试一次
    if (videoCache.status[theme] === 'error') {
      // 尝试重新加载
      const success = await preCacheCurrentVideo();
      if (!success) {
        hideLoadingIndicator();
        showErrorNotification('视频资源不可用，已切换回静态背景');
        // 自动切回图片背景
        setTimeout(() => {
          if (currentBackgroundType === 'video') {
            deactivateVideoBackground();
            saveUserPreference();
          }
        }, 1500);
        return;
      }
    }
    
    // 获取最新的视频URL
    const videoUrl = await getVideoUrlFromApi(theme);
    console.log(`设置${theme}主题视频URL:`, videoUrl);
    
    if (!videoUrl) {
      throw new Error('无法获取有效的视频URL');
    }
    
    const video = videoBackgrounds[theme];
    
    // 应用视频URL
    const videoSource = bgVideo.querySelector('source');
    if (videoSource) {
      videoSource.src = video.url;
      videoSource.type = video.type;
      
      // 设置超时处理，避免长时间加载
      let loadTimeout = setTimeout(() => {
        console.warn(`视频加载超时`);
        hideLoadingIndicator();
        showErrorNotification('视频加载超时，已切换回静态背景');
        videoCache.status[theme] = 'error';
        
        // 自动切回图片背景
        if (currentBackgroundType === 'video') {
          deactivateVideoBackground();
          saveUserPreference();
        }
      }, 20000); // 20秒超时，避免用户等待过长时间
      
      // 监听加载事件
      bgVideo.onloadeddata = () => {
        // 清除超时计时器
        clearTimeout(loadTimeout);
        
        // 视频元数据已加载
        hideLoadingIndicator();
        
        // 更新缓存状态
        videoCache.status[theme] = 'loaded';
        
        // 显示通知
        showVideoChangeNotification(video.description);
        
        // 开始播放
        playVideo();
      };
      
      bgVideo.onerror = (e) => {
        // 清除超时计时器
        clearTimeout(loadTimeout);
        
        console.error('视频加载失败:', e);
        hideLoadingIndicator();
        showErrorNotification('视频加载失败，已切换回静态背景');
        videoCache.status[theme] = 'error';
        
        // 自动切回图片背景
        setTimeout(() => {
          if (currentBackgroundType === 'video') {
            deactivateVideoBackground();
            saveUserPreference();
          }
        }, 1500);
      };
      
      // 加载视频
      bgVideo.load();
    } else {
      throw new Error('未找到视频源元素');
    }
  } catch (error) {
    console.error('设置视频背景失败:', error);
    hideLoadingIndicator();
    showErrorNotification('获取视频资源失败，已切换回静态背景');
    videoCache.status[theme] = 'error';
    
    // 自动切回图片背景
    setTimeout(() => {
      if (currentBackgroundType === 'video') {
        deactivateVideoBackground();
        saveUserPreference();
      }
    }, 1500);
  }
}

// 显示加载指示器
function showLoadingIndicator() {
  // 创建加载指示器（如果不存在）
  let loader = document.getElementById('video-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'video-loader';
    Object.assign(loader.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: '4px solid rgba(64, 158, 255, 0.2)',
      borderTop: '4px solid rgba(64, 158, 255, 0.8)',
      animation: 'spin 1s linear infinite',
      zIndex: '9999',
      display: 'none'
    });
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // 添加到页面
    document.body.appendChild(loader);
  }
  
  loader.style.display = 'block';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
  const loader = document.getElementById('video-loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// 显示错误通知
function showErrorNotification(message) {
  showVideoChangeNotification(`❌ ${message}`, true);
}

// 检查是否为亮色主题
function isLightTheme() {
  return document.documentElement.classList.contains('hope-ui-light');
}

// 播放视频
function playVideo() {
  try {
    if (bgVideo.paused) {
      const playPromise = bgVideo.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('视频播放失败:', error);
          showErrorNotification('视频播放失败，请稍后再试');
        });
      }
    }
  } catch (error) {
    console.error('尝试播放视频时出错:', error);
  }
}

// 暂停视频
function pauseVideo() {
  try {
    if (!bgVideo.paused) {
      bgVideo.pause();
    }
  } catch (error) {
    console.error('尝试暂停视频时出错:', error);
  }
}

// 监听主题变化
function observeThemeChange() {
  // 使用MutationObserver监听类名变化
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // 预缓存新主题的视频
        preCacheCurrentVideo();
        
        // 如果当前是视频背景，则根据新主题更新视频
        if (currentBackgroundType === 'video') {
          setVideoBasedOnTheme();
        }
      }
    });
  });
  
  // 监视根元素的类名变化
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });
}

// 显示视频切换通知
function showVideoChangeNotification(description, isError = false) {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'video-notification';
  notification.innerHTML = isError 
    ? `<i class="fas fa-exclamation-circle"></i> ${description}`
    : `<i class="fas fa-video"></i> ${description}`;
  
  // 添加样式
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: isError ? 'rgba(220, 53, 69, 0.8)' : 'rgba(64, 158, 255, 0.8)',
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.3s ease'
  });
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);
  
  // 3秒后隐藏
  setTimeout(() => {
    notification.style.opacity = '0';
    
    // 完全隐藏后移除
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// 添加视频循环功能
function setupVideoLoop() {
  // 监听视频结束事件
  bgVideo.addEventListener('ended', () => {
    // 重新播放视频
    bgVideo.currentTime = 0;
    playVideo();
  });
  
  // 监听视频错误事件
  bgVideo.addEventListener('error', (e) => {
    console.error('视频加载或播放出错:', e);
    showErrorNotification('视频加载失败，请稍后再试');
    // 更新缓存状态
    const theme = isLightTheme() ? 'light' : 'dark';
    videoCache.status[theme] = 'error';
    hideLoadingIndicator();
  });
  
  // 监听视频卸载事件
  bgVideo.addEventListener('emptied', () => {
    console.log('视频已卸载');
    hideLoadingIndicator();
  });
}

// 在页面加载完成后初始化
document。addEventListener('DOMContentLoaded', () => {
  // 延迟初始化以确保所有元素都已加载
  setTimeout(() => {
    initBackgroundSwitcher();
    setupVideoLoop();
    
    // 添加视频样式
    const style = document.createElement('style');
    style.textContent = `
      .video-background video {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }
    `;
    
    document.head.appendChild(style);
  }, 1000);
}); 
