// 提供用来监听代码控制的 url 变化的事件
(() => {
    const wrapHistoryMethod = (type) => {
        const orig = history[type];
        return function (...args) {
            const rv = orig.apply(this, args);
            const event = new CustomEvent(type, { detail: args });
            window.dispatchEvent(event);
            return rv;
        };
    };
    history.pushState = wrapHistoryMethod('pushState');
    history.replaceState = wrapHistoryMethod('replaceState');
})();

class Beautifier {
    /**
        * Beautifier 类用于美化页面背景色
        * 
        * 其提供了3个方法：
        * - observe: 开始监听页面变化并美化背景色
        * - disconnect: 停止监听页面变化
        * - undo: 恢复页面背景色到默认状态
        *
        * 可以通过window.beautifier访问实例对象
        * 
     */
    static themeColor = 'rgb(24, 144, 255)';  // 这是默认的主题色
    static lightBgColor = 'rgba(255, 255, 255, 0.8)';
    static darkBgColor = 'rgb(32, 36, 37)';

    static lightSelector = '.hope-ui-light :not(.hope-tooltip):not(.hope-close-button):not(a)';
    static darkSelector = '.hope-ui-dark :not(.hope-tooltip):not(.hope-close-button):not(a)';
    static ignoredColors = [
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.09)'
    ];

    constructor(themeColor = Beautifier.themeColor, lightBgColor = Beautifier.lightBgColor, darkBgColor = Beautifier.darkBgColor) {
        this.themeColor = themeColor;
        this.lightBgColor = lightBgColor;
        this.darkBgColor = darkBgColor;

        this.ignoredColors = [...Beautifier.ignoredColors, this.themeColor];

        this.observer = null;
    }

    /**
     * @param {'light'|'dark'} theme
     */
    #rewriteBgColor(theme) {
        let selector = theme === 'light' ? Beautifier.lightSelector : Beautifier.darkSelector;
        let bgColor = theme === 'light' ? this.lightBgColor : this.darkBgColor;

        document.querySelectorAll(selector).forEach(element => {
            const computedStyle = getComputedStyle(element);

            if (computedStyle.backgroundImage !== 'none') {
                return;
            }

            if (!this.ignoredColors.includes(computedStyle.backgroundColor)) {
                element.style.backgroundColor = bgColor;
                element.setAttribute('data-beautified', 'true');
            }
        });
    }

    #beautify() {
        if (!location.pathname.startsWith('/@manage') && !location.pathname.startsWith('/@login')) {
            this.#rewriteBgColor('light');
            this.#rewriteBgColor('dark');
        }
    }

    observe() {
        this.observer = new MutationObserver(this.#beautify.bind(this));
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.#beautify();
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    undo() {
        this.disconnect();

        document.body.querySelectorAll('[data-beautified]').forEach(element => {
            element.style.backgroundColor = '';
            element.removeAttribute('data-beautified');
        });
    }
}

const beautifier = new Beautifier('rgb(24, 114, 255)'); // 务必在这里填入你设置的主题色，没有设置可以不填
window。beautifier = beautifier;
beautifier。observe();

// 一个愚蠢到有点无敌的修复机制，不过工作良好
(() => {
    function fixLogin(pathname) {
        if (pathname.startsWith('/@login')) {
            beautifier.undo();
        }
        else {
            beautifier.disconnect();
            beautifier.observe();
        }
    }

    ['popstate', 'pushState', 'replaceState'].forEach(eventType => {
        addEventListener(eventType, () => {
            fixLogin(location.pathname);
        });
    });
})();
