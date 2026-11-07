'use strict';
// Native WeChat Mini Game entry point. No DOM, webview or remote asset dependency.
const {App}=require('./js/app');
const canvas=wx.createCanvas();
const KEY='xiangyang-wechat-battle-v1';
const platform={
  canvas,
  window(){const s=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();const safe=s.safeArea||{top:0,bottom:s.windowHeight};let top=safe.top||0;try{const menu=wx.getMenuButtonBoundingClientRect&&wx.getMenuButtonBoundingClientRect();if(menu&&menu.bottom)top=Math.max(top,menu.bottom+5);}catch(e){}return {width:s.windowWidth,height:s.windowHeight,dpr:s.pixelRatio||1,top,bottom:Math.min(s.windowHeight,safe.bottom||s.windowHeight)};},
  onTouch(fn){wx.onTouchStart(e=>{const t=e.touches&&e.touches[0];if(t)fn(t.clientX===undefined?t.x:t.clientX,t.clientY===undefined?t.y:t.clientY);});},
  onHide(fn){wx.onHide(fn);},onShow(fn){wx.onShow(fn);},onResize(fn){if(wx.onWindowResize)wx.onWindowResize(fn);},
  load(){try{return wx.getStorageSync(KEY)||null;}catch(e){return null;}},
  save(data){try{if(data)wx.setStorageSync(KEY,data);else wx.removeStorageSync(KEY);}catch(e){/* Storage-full does not stop battle. */}},
  raf(fn){return requestAnimationFrame(fn);}
};
new App(platform).start();
