/**
 * 背景切换功能
 * 支持在图片背景和视频背景之间切换，并记住用户选择
 * 
 * @version 2.0.0
 * @author 重构 by FENG
 */

// 使用立即执行函数表达式 (IIFE) 创建模块化结构
const BackgroundSwitcher = (function() {
  // 私有变量 - 模块内部状态
  const STORAGE_KEY = 'background_preference';
  const DEFAULT_BACKGROUNDS = {
    light: "https://pan.8845.top/d/doubao/%E2%80%94Pngtree%E2%80%94the%20sky%20is%20blue%20with_16496378.jpg",
    dark: "https://pan.8845.top/d/doubao/john-towner-JgOeRuGD_Y4-unsplash.jpg"
  };
  
  // 状态对象
  const state = {
    imageBackgrounds: {
      light: "",
      dark: ""
    },
    backgroundType: 'image', // 当前背景类型状态 (image | video)
    videoCache: {
      status: {
        light: 'unloaded', // unloaded, loading, loaded, error
        dark: 'unloaded'
      }
    }
  };
  
  // DOM元素引用
  let elements = {
    bgToggleBtn: null,
    bgToggleText: null,
    videoBackground: null,
    bgVideo: null,
    videoLoader: null
  };
  
  // 通知计时器存储
  let notificationTimers = {
    display: null,
    remove: null
  };
  
  // 视频加载超时计时器
  let videoLoadTimeout = null;
  
  // 主观察器
  let themeObserver = null;
  
  /**
   * 初始化函数 - 公共API
   * 设置背景切换功能
   */
  function init() {
    try {
      // 延迟初始化以确保所有元素都已加载
      setTimeout(() => {
        _initBackgroundSwitcher();
        _addVideoStyles();
      }, 1000);
    } catch (error) {
      console.error('背景切换初始化失败:', error);
    }
  }
  
  /**
   * 初始化背景切换功能
   * @private
   */
  function _initBackgroundSwitcher() {
    // 获取必要的DOM元素
    _cacheDOMElements();
    
    // 检查必要元素是否存在
    if (!_validateRequiredElements()) {
      console.error('背景切换所需的DOM元素未找到');
      return;
    }
    
    // 从CSS获取背景图片URL
    _extractBackgroundImagesFromCSS();
    
    // 从本地存储加载用户首选项
    _loadUserPreference();
    
    // 添加点击事件监听器
    elements.bgToggleBtn.addEventListener('click', _toggleBackground);
    
    // 监听主题更改事件
    _observeThemeChange();
  }

  /**
   * 缓存必要的DOM元素
   * @private
   */
  function _cacheDOMElements() {
    elements = {
      bgToggleBtn: document.getElementById('bg-toggle'),
      bgToggleText: document.getElementById('bg-toggle-text'),
      videoBackground: document.getElementById('video-background'),
      bgVideo: document.getElementById('bg-video'),
      videoLoader: document.getElementById('video-loader')
    };
  }
  
  /**
   * 验证所有必要的元素是否存在
   * @private
   * @returns {boolean} 元素是否都存在
   */
  function _validateRequiredElements() {
    return !!(elements.bgToggleBtn && elements.videoBackground && elements.bgVideo);
  }

  /**
   * 添加视频背景所需的CSS样式
   * @private
   */
  function _addVideoStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .video-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.5s ease, visibility 0.5s ease;
      }
      
      .video-background.active {
        opacity: 1;
        visibility: visible;
      }
      
      .video-background video {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }
      
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 从CSS文件中提取背景图片URL
   * @private
   */
  function _extractBackgroundImagesFromCSS() {
    try {
      // 尝试从内联样式表获取背景URL
      _extractFromStylesheets();
      
      // 如果没有从内联样式找到，则从外部CSS获取
      if (!state.imageBackgrounds.light || !state.imageBackgrounds.dark) {
        _fetchExternalCSS();
      }
    } catch (error) {
      console.error('提取背景图片URL时出错:', error);
      _setDefaultBackgrounds();
    }
  }
  
  /**
   * 从文档中的样式表提取背景URL
   * @private
   */
  function _extractFromStylesheets() {
    try {
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
              state.imageBackgrounds.light = _extractUrlFromCSSText(cssText);
            } else if (rule.selectorText === '.hope-ui-dark') {
              const cssText = rule.cssText || rule.style.cssText;
              state.imageBackgrounds.dark = _extractUrlFromCSSText(cssText);
            }
          }
        } catch (e) {
          // 忽略跨域错误等
          continue;
        }
      }
    } catch (error) {
      console.warn('从样式表提取背景时出错:', error);
    }
  }
  
  /**
   * 从外部CSS文件获取背景URL
   * @private
   */
  function _fetchExternalCSS() {
    fetch('https://jsd-proxy.ygxz.in/gh/kkkqaq/cdn/head.css')
      .then(response => {
        if (!response.ok) {
          throw new Error('CSS文件获取失败: ' + response.status);
        }
        return response.text();
      })
      .then(cssText => {
        // 解析CSS文本
        const lightMatch = cssText.match(/\.hope-ui-light\s*{[^}]*background-image:\s*url\(([^)]+)\)/i);
        const darkMatch = cssText.match(/\.hope-ui-dark\s*{[^}]*background-image:\s*url\(([^)]+)\)/i);
        
        if (lightMatch && lightMatch[1]) {
          state.imageBackgrounds.light = lightMatch[1].replace(/["']/g, '');
        }
        
        if (darkMatch && darkMatch[1]) {
          state.imageBackgrounds.dark = darkMatch[1].replace(/["']/g, '');
        }
        
        // 如果仍未找到，使用默认背景
        if (!state.imageBackgrounds.light || !state.imageBackgrounds.dark) {
          _setDefaultBackgrounds();
        }
      })
      .catch(error => {
        console.error('获取CSS文件失败:', error);
        _setDefaultBackgrounds();
      });
  }
  
  /**
   * 设置默认背景图片
   * @private
   */
  function _setDefaultBackgrounds() {
    state.imageBackgrounds.light = DEFAULT_BACKGROUNDS.light;
    state.imageBackgrounds.dark = DEFAULT_BACKGROUNDS.dark;
  }
  
  /**
   * 从CSS文本中提取URL
   * @private
   * @param {string} cssText - CSS文本
   * @returns {string|null} 提取的URL或null
   */
  function _extractUrlFromCSSText(cssText) {
    const urlMatch = cssText.match(/background-image:\s*url\(["']?([^"')]+)["']?\)/i);
    return urlMatch ? urlMatch[1] : null;
  }
  
  /**
   * 加载用户首选项
   * @private
   */
  function _loadUserPreference() {
    try {
      const preference = localStorage.getItem(STORAGE_KEY);
      if (preference) {
        const { type } = JSON.parse(preference);
        state.backgroundType = type || 'image';
        
        // 应用已保存的设置
        if (state.backgroundType === 'video') {
          _activateVideoBackground();
        }
      }
    } catch (error) {
      console.error('加载背景首选项时出错:', error);
      // 出错时回退到默认设置
      state.backgroundType = 'image';
    }
  }
  
  /**
   * 保存用户首选项
   * @private
   */
  function _saveUserPreference() {
    try {
      const preference = {
        type: state.backgroundType
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.error('保存背景首选项时出错:', error);
    }
  }
  
  /**
   * 切换背景类型
   * @private
   */
  function _toggleBackground() {
    if (state.backgroundType === 'image') {
      // 从图片切换到视频
      _activateVideoBackground();
    } else {
      // 从视频切换到图片
      _deactivateVideoBackground();
    }
    
    // 保存用户首选项
    _saveUserPreference();
  }
  
  /**
   * 激活视频背景
   * @private
   */
  function _activateVideoBackground() {
    state.backgroundType = 'video';
    
    // 更新按钮状态
    elements.bgToggleBtn.classList.add('active');
    elements.bgToggleText.textContent = '切换静态背景';
    
    // 设置合适的视频
    _setVideoBasedOnTheme();
    
    // 显示视频背景
    elements.videoBackground.classList.add('active');
  }
  
  /**
   * 停用视频背景
   * @private
   */
  function _deactivateVideoBackground() {
    state.backgroundType = 'image';
    
    // 更新按钮状态
    elements.bgToggleBtn.classList.remove('active');
    elements.bgToggleText.textContent = '切换动态背景';
    
    // 隐藏视频背景
    elements.videoBackground.classList.remove('active');
    
    // 暂停视频以节省资源
    _pauseVideo();
  }
  
  /**
   * 检查是否为亮色主题
   * @private
   * @returns {boolean} 是否为亮色主题
   */
  function _isLightTheme() {
    return document.documentElement.classList.contains('hope-ui-light');
  }
  
  /**
   * 根据当前主题设置视频
   * @private
   */
  function _setVideoBasedOnTheme() {
    const theme = _isLightTheme() ? 'light' : 'dark';
    
    // 如果视频已加载并且没有错误，直接使用缓存
    if (state.videoCache.status[theme] === 'loaded') {
      _playVideo();
      return;
    }
    
    // 如果视频之前加载失败，先提示用户
    if (state.videoCache.status[theme] === 'error') {
      _showErrorNotification('上次视频加载失败，正在重试...');
    }
    
    // 显示加载指示器
    _showLoadingIndicator();
    
    try {
      // 从video元素的data属性获取当前主题的视频URL和描述
      const videoUrl = elements.bgVideo.getAttribute('data-' + theme + '-url');
      const videoDesc = elements.bgVideo.getAttribute('data-' + theme + '-desc') || '视频背景';
      
      if (!videoUrl) {
        throw new Error('无法获取有效的视频URL');
      }
      
      // 清除之前可能存在的超时计时器
      if (videoLoadTimeout) {
        clearTimeout(videoLoadTimeout);
        videoLoadTimeout = null;
      }
      
      // 更新缓存状态
      state.videoCache.status[theme] = 'loading';
      
      // 清除之前的事件监听器
      _clearVideoEventListeners();
      
      // 设置视频源
      _setVideoSource(videoUrl, videoDesc, theme);
    } catch (error) {
      console.error('设置视频背景失败:', error);
      _handleVideoError('获取视频资源失败', theme);
    }
  }
  
  /**
   * 设置视频源并绑定事件
   * @private
   * @param {string} videoUrl - 视频URL
   * @param {string} videoDesc - 视频描述
   * @param {string} theme - 当前主题 (light/dark)
   */
  function _setVideoSource(videoUrl, videoDesc, theme) {
    // 获取视频源元素
    const videoSource = elements.bgVideo.querySelector('source');
    if (!videoSource) {
      _handleVideoError('未找到视频源元素', theme);
      return;
    }
    
    // 设置视频源
    videoSource.src = videoUrl;
    videoSource.type = "video/mp4";
    
    // 设置超时处理
    videoLoadTimeout = setTimeout(() => {
      _handleVideoError('视频加载超时', theme);
    }, 20000); // 20秒超时
    
    // 监听加载事件
    elements.bgVideo.addEventListener('loadeddata', function onVideoLoad() {
      // 清除超时计时器
      if (videoLoadTimeout) {
        clearTimeout(videoLoadTimeout);
        videoLoadTimeout = null;
      }
      
      // 视频元数据已加载
      _hideLoadingIndicator();
      
      // 更新缓存状态
      state.videoCache.status[theme] = 'loaded';
      
      // 显示通知
      _showVideoChangeNotification(videoDesc);
      
      // 开始播放
      _playVideo();
      
      // 移除事件监听器
      elements.bgVideo.removeEventListener('loadeddata', onVideoLoad);
    });
    
    // 错误处理
    elements.bgVideo.addEventListener('error', function onVideoError(e) {
      _handleVideoError('视频加载失败', theme, e);
      // 移除事件监听器
      elements.bgVideo.removeEventListener('error', onVideoError);
    });
    
    // 加载视频
    elements.bgVideo.load();
    
    // 确保视频设置
    elements.bgVideo.loop = true;
    elements.bgVideo.muted = true;
    elements.bgVideo.playsInline = true;
  }
  
  /**
   * 处理视频错误
   * @private
   * @param {string} message - 错误消息
   * @param {string} theme - 主题 (light/dark)
   * @param {Error} [error] - 错误对象 (可选)
   */
  function _handleVideoError(message, theme, error) {
    // 清除超时计时器
    if (videoLoadTimeout) {
      clearTimeout(videoLoadTimeout);
      videoLoadTimeout = null;
    }
    
    if (error) {
      console.error(`${message}:`, error);
    } else {
      console.error(message);
    }
    
    _hideLoadingIndicator();
    _showErrorNotification(`${message}，已切换回静态背景`);
    state.videoCache.status[theme] = 'error';
    
    // 自动切回图片背景
    setTimeout(() => {
      if (state.backgroundType === 'video') {
        _deactivateVideoBackground();
        _saveUserPreference();
      }
    }, 1500);
  }
  
  /**
   * 清除视频事件监听器
   * @private
   */
  function _clearVideoEventListeners() {
    // 使用克隆替换的方式移除所有事件监听器
    if (elements.bgVideo) {
      const oldVideo = elements.bgVideo;
      const newVideo = oldVideo.cloneNode(true);
      if (oldVideo.parentNode) {
        oldVideo.parentNode.replaceChild(newVideo, oldVideo);
        elements.bgVideo = newVideo;
      }
    }
  }
  
  /**
   * 显示加载指示器
   * @private
   */
  function _showLoadingIndicator() {
    // 创建加载指示器（如果不存在）
    if (!elements.videoLoader) {
      const loader = document.createElement('div');
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
      
      // 添加到页面
      document.body.appendChild(loader);
      elements.videoLoader = loader;
    }
    
    elements.videoLoader.style.display = 'block';
  }
  
  /**
   * 隐藏加载指示器
   * @private
   */
  function _hideLoadingIndicator() {
    if (elements.videoLoader) {
      elements.videoLoader.style.display = 'none';
    }
  }
  
  /**
   * 显示错误通知
   * @private
   * @param {string} message - 错误消息
   */
  function _showErrorNotification(message) {
    _showVideoChangeNotification(message, true);
  }
  
  /**
   * 播放视频
   * @private
   */
  function _playVideo() {
    try {
      if (elements.bgVideo && elements.bgVideo.paused) {
        // 确保视频静音，避免自动播放策略阻止播放
        elements.bgVideo.muted = true;
        
        const playPromise = elements.bgVideo.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('视频播放失败:', error);
            
            // 确保视频静音并尝试再次播放
            elements.bgVideo.muted = true;
            
            elements.bgVideo.play().catch(e => {
              console.error('尝试静音播放失败:', e);
              _showErrorNotification('视频播放失败，请稍后再试');
            });
          });
        }
      }
    } catch (error) {
      console.error('尝试播放视频时出错:', error);
    }
  }
  
  /**
   * 暂停视频
   * @private
   */
  function _pauseVideo() {
    try {
      if (elements.bgVideo && !elements.bgVideo.paused) {
        elements.bgVideo.pause();
      }
    } catch (error) {
      console.error('尝试暂停视频时出错:', error);
    }
  }
  
  /**
   * 监听主题变化
   * @private
   */
  function _observeThemeChange() {
    // 释放之前的观察者（如果存在）
    if (themeObserver) {
      themeObserver.disconnect();
    }
    
    // 使用MutationObserver监听类名变化
    themeObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // 如果当前是视频背景，则根据新主题更新视频
          if (state.backgroundType === 'video') {
            _setVideoBasedOnTheme();
          }
        }
      });
    });
    
    // 监视根元素的类名变化
    themeObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
  }
  
  /**
   * 显示视频切换通知
   * @private
   * @param {string} description - 消息描述
   * @param {boolean} isError - 是否为错误消息
   */
  function _showVideoChangeNotification(description, isError = false) {
    // 清除之前的计时器（如果存在）
    if (notificationTimers.display) {
      clearTimeout(notificationTimers.display);
      notificationTimers.display = null;
    }
    
    if (notificationTimers.remove) {
      clearTimeout(notificationTimers.remove);
      notificationTimers.remove = null;
    }
    
    // 移除之前可能存在的通知
    const existingNotification = document.querySelector('.video-notification');
    if (existingNotification && existingNotification.parentNode) {
      existingNotification.parentNode.removeChild(existingNotification);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'video-notification';
    if (isError) {
      notification.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + description;
    } else {
      notification.innerHTML = '<i class="fas fa-video"></i> ' + description;
    }
    
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
    notificationTimers.display = setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // 3秒后隐藏
    notificationTimers.remove = setTimeout(() => {
      notification.style.opacity = '0';
      
      // 完全隐藏后移除
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // 返回公共API
  return {
    init: init
  };
})();

// 在页面加载完成后初始化
document。addEventListener('DOMContentLoaded', BackgroundSwitcher.init); 
