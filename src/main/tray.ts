import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron';
import { join } from 'node:path';

export function createTray(opts: {
  iconPath: string;
  getMainWindow: () => BrowserWindow | null;
  onRefresh: () => void;
  onQuit: () => void;
}): Tray {
  let image = nativeImage.createFromPath(opts.iconPath);
  if (image.isEmpty()) {
    // 1x1 fallback PNG
    image = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAALElEQVQoka3OAQ0AAAjDMMC/52ECvhBI0qRJkyZNmjRp0qRJkyZNmjT5bB4eAAH0WQO7AAAAAElFTkSuQmCC',
    );
  }
  const tray = new Tray(image);
  tray.setToolTip('AI 额度监控');

  const toggle = () => {
    const win = opts.getMainWindow();
    if (!win) return;
    if (win.isVisible()) win.hide();
    else {
      win.show();
      win.focus();
    }
  };

  const menu = Menu.buildFromTemplate([
    { label: '显示 / 隐藏', click: toggle },
    { label: '刷新额度', click: () => opts.onRefresh() },
    { type: 'separator' },
    { label: '退出', click: () => opts.onQuit() },
  ]);
  tray.setContextMenu(menu);
  tray.on('click', toggle);
  return tray;
}
