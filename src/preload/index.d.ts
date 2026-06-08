import { ElectronAPI } from "@electron-toolkit/preload";

import type { YiApi } from "./index";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: YiApi;
  }
}
