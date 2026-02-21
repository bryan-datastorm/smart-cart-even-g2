/**
 * Ambient type declarations for the `@evenrealities/even_hub_sdk` module.
 *
 * The SDK is injected at runtime by the Even Realities G2 glasses' native
 * WebView host – it is not an npm package. These declarations allow TypeScript
 * to type-check all interactions with the bridge without an installed package.
 */

declare module '@evenrealities/even_hub_sdk' {
  /** Live status of the connected G2 glasses. */
  export interface DeviceStatus {
    /** Returns `true` when the glasses are actively paired and connected. */
    isConnected(): boolean;
    /** Battery level reported by the glasses as a percentage (0–100). */
    batteryLevel: number;
  }

  /** Top-level device information returned by `bridge.getDeviceInfo()`. */
  export interface DeviceInfo {
    status: DeviceStatus;
  }

  /** Payload carried by a glasses list-container interaction event. */
  export interface EvenHubListEvent {
    eventType?: number;
    currentSelectItemIndex?: number;
    currentSelectItemName?: string;
  }

  /** Payload carried by a glasses system event. */
  export interface EvenHubSysEvent {
    eventType?: number;
  }

  /** Payload carried by a glasses text-container interaction event. */
  export interface EvenHubTextEvent {
    eventType?: number;
  }

  /** Union event object passed to `bridge.onEvenHubEvent` callbacks. */
  export interface EvenHubEvent {
    listEvent?: EvenHubListEvent;
    sysEvent?: EvenHubSysEvent;
    textEvent?: EvenHubTextEvent;
  }

  /** Layout descriptor for an image container. */
  export class ImageContainerProperty {
    constructor(options: {
      xPosition: number;
      yPosition: number;
      width: number;
      height: number;
      containerID: number;
      containerName: string;
    });
  }

  /** Payload for updating the raw image data of an existing image container. */
  export class ImageRawDataUpdate {
    constructor(options: {
      containerID: number;
      containerName: string;
      imageData: number[] | string | Uint8Array | ArrayBuffer;
    });
  }

  /** Layout descriptor passed to `createStartUpPageContainer` / `rebuildPageContainer`. */
  export interface PageLayout {
    textObject: TextContainerProperty[];
    listObject: ListContainerProperty[];
    imageObject?: ImageContainerProperty[];
    containerTotalNum: number;
  }

  /** Primary bridge interface between the React app and the G2 hardware. */
  export interface EvenAppBridge {
    getDeviceInfo(): Promise<DeviceInfo>;
    onDeviceStatusChanged(callback: (status: DeviceStatus) => void): () => void;
    getLocalStorage(key: string): Promise<string | null>;
    setLocalStorage(key: string, value: string): Promise<void>;
    createStartUpPageContainer(container: CreateStartUpPageContainer): Promise<void>;
    rebuildPageContainer(container: RebuildPageContainer): Promise<void>;
    onEvenHubEvent(callback: (event: EvenHubEvent) => void | Promise<void>): void;
    updateImageRawData(update: ImageRawDataUpdate): Promise<void>;
  }

  /** Waits for the native app bridge to become available in the WebView. */
  export function waitForEvenAppBridge(): Promise<EvenAppBridge>;

  export class CreateStartUpPageContainer {
    constructor(layout: PageLayout);
  }

  export class RebuildPageContainer {
    constructor(layout: PageLayout);
  }

  export class TextContainerProperty {
    constructor(options: {
      xPosition: number;
      yPosition: number;
      width: number;
      height: number;
      borderWidth?: number;
      borderColor?: number;
      paddingLength?: number;
      containerID: number;
      containerName: string;
      content: string;
      isEventCapture?: number;
    });
  }

  export class ListContainerProperty {
    constructor(options: {
      xPosition: number;
      yPosition: number;
      width: number;
      height: number;
      borderWidth?: number;
      borderColor?: number;
      borderRdaius?: number;
      paddingLength?: number;
      containerID: number;
      containerName: string;
      isEventCapture?: number;
      itemContainer: ListItemContainerProperty;
    });
  }

  export class ListItemContainerProperty {
    constructor(options: {
      itemCount: number;
      itemWidth: number;
      isItemSelectBorderEn: number;
      itemName: string[];
    });
  }

  /** Enumeration of OS-level event type identifiers emitted by the glasses. */
  export const OsEventTypeList: {
    CLICK_EVENT: number;
    [key: string]: number;
  };
}
