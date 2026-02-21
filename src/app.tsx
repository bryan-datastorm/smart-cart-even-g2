// src/app.tsx
import { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, CardContent, Text, TrashIcon } from '@jappyjan/even-realities-ui';
import {
  waitForEvenAppBridge,
  CreateStartUpPageContainer,
  RebuildPageContainer,
  TextContainerProperty,
  ListContainerProperty,
  ListItemContainerProperty,
  ImageContainerProperty,
  ImageRawDataUpdate,
  OsEventTypeList,
  type EvenAppBridge,
} from '@evenrealities/even_hub_sdk';
import { Reorder, useDragControls, motion } from 'framer-motion';
import type { CartItemData } from './types/cart-item';

const HEADER_ID = 1;
const LIST_ID = 2;
const SPLASH_BG_ID = 99;
const SPLASH_IMG_ID = 100;

/** Standard iOS 6-dot drag handle grip rendered as an inline SVG icon. */
const DragHandleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
  </svg>
);

/** Props accepted by the {@link CartItem} component. */
interface CartItemProps {
  item: CartItemData;
  items: CartItemData[];
  syncData: (newItems: CartItemData[]) => void;
  handleRemove: (id: number) => void;
}

/**
 * Renders a single grocery list entry with swipe-to-delete (left drag reveals red
 * trash background) and a reorder drag handle on the right.
 */
const CartItem = ({ item, items, syncData, handleRemove }: CartItemProps) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={item} 
      id={String(item.id)}
      dragListener={false} 
      dragControls={controls} 
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* BACKGROUND: Red Delete Reveal */}
      <div style={{ 
        position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, 
        backgroundColor: 'var(--color-tc-red, #ef4444)', 
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', 
        paddingRight: '24px', zIndex: 0 
      }}>
        <div style={{ color: '#fff' }}><TrashIcon /></div>
      </div>

      {/* FOREGROUND: The list item */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} 
        dragElastic={{ left: 0.8, right: 0 }} 
        onDragEnd={(_e, info) => {
          if (info.offset.x < -75) handleRemove(item.id);
        }}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '16px', backgroundColor: 'var(--color-bc-1)', 
          borderBottom: '1px solid var(--color-sc-2)', zIndex: 1, position: 'relative'
        }}
      >
        {/* Checkbox and Name */}
        <div 
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
          onClick={() => {
            const newItems = [...items];
            const idx = newItems.findIndex(i => i.id === item.id);
            newItems[idx].done = !newItems[idx].done;
            syncData(newItems);
          }}
        >
          {/* iOS Style Square Checkbox */}
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px', /* Changed to 6px for square look */
            border: `2px solid ${item.done ? 'var(--color-tc-green, #4ade80)' : 'var(--color-tc-2)'}`,
            backgroundColor: item.done ? 'var(--color-tc-green, #4ade80)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}>
            {item.done && <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
          </div>
          
          <Text variant="body-1" style={{ 
            color: item.done ? 'var(--color-tc-2)' : 'var(--color-tc-1)',
            textDecoration: item.done ? 'line-through' : 'none'
          }}>
            {item.name}
          </Text>
        </div>

        {/* Drag Handle */}
        <div 
          onPointerDown={(e) => controls.start(e)} 
          style={{ color: 'var(--color-tc-2)', padding: '12px', cursor: 'grab', touchAction: 'none' }}
        >
          <DragHandleIcon />
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

/**
 * Root application component for Smart Cart.
 *
 * Manages the grocery list state and synchronises it bidirectionally with the
 * Even Realities G2 glasses via the EvenHub bridge:
 * – Phone → Glasses: any list mutation calls `syncData` which pushes a layout
 *   rebuild to the glasses' micro-LED display.
 * – Glasses → Phone: glasses tap events received via `onEvenHubEvent` toggle the
 *   item's `done` state and trigger a re-render + layout sync.
 */
export default function App() {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [deviceStatus, setDeviceStatus] = useState({ connected: false, battery: 0 });
  const [isAppReady, setIsAppReady] = useState(false);

  const bridgeRef = useRef<EvenAppBridge | null>(null);
  const stateRef = useRef({ items });

  useEffect(() => {
    stateRef.current = { items };
  }, [items]);

  // --- 1. Splash Screen Flow ---
  const showSplashScreen = async (bridge: EvenAppBridge) => {
    // A. Build the Splash Layout
    const splashBg = new TextContainerProperty({
      xPosition: 0, yPosition: 0, width: 576, height: 288, 
      borderWidth: 0, paddingLength: 0,
      containerID: SPLASH_BG_ID, containerName: 'splash-bg', 
      content: ' ', isEventCapture: 1, 
    });

    const splashImg = new ImageContainerProperty({
      // Centered on the 576x288 canvas: x=(576-200)/2, y=(288-100)/2
      xPosition: 188, yPosition: 94, width: 200, height: 100,
      containerID: SPLASH_IMG_ID, containerName: 'splash-img'
    });

    // NOTE: We cast to 'any' and completely omit 'listObject' to match the 
    // Snake game pattern and prevent the bridge from silently failing.
    const splashConfig: any = {
      containerTotalNum: 2,
      textObject: [splashBg],
      imageObject: [splashImg]
    };

    await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(splashConfig));

    // B. Fetch and push the raw image bytes (Snake game pattern)
    try {
      const res = await fetch('/smart-cart-ar.png');
      
      // Catch Vite SPA fallback issues
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error("Vite served HTML! Make sure smart-cart-ar.png is in the public/ folder.");
      }

      const buf = await res.arrayBuffer();
      const bytes = Array.from(new Uint8Array(buf));
      
      await bridge.updateImageRawData(new ImageRawDataUpdate({
        containerID: SPLASH_IMG_ID,
        containerName: 'splash-img',
        imageData: bytes
      }));
    } catch (e) {
      console.error("Failed to load or push splash image:", e);
    }
  };

  // --- 2. Main List Layout Builder ---
  const buildPageLayout = (currentItems: CartItemData[]) => {
    const displayItems = currentItems.slice(0, 20); 
    const totalCount = currentItems.length;
    const doneCount = currentItems.filter(i => i.done).length;

    const barLength = 16; 
    const filledBlocks = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * barLength);
    const emptyBlocks = barLength - filledBlocks;
    const headerText = `[${doneCount}/${totalCount}] ${'━'.repeat(filledBlocks)}${'─'.repeat(emptyBlocks)}`;

    const headerContainer = new TextContainerProperty({
      xPosition: 0, yPosition: 0, width: 576, height: 48, 
      borderWidth: 0, borderColor: 5, paddingLength: 10,
      containerID: HEADER_ID, containerName: 'header', content: headerText,
      isEventCapture: 0, 
    });

    if (displayItems.length === 0) {
      const emptyContainer = new TextContainerProperty({
        xPosition: 0, yPosition: 48, width: 576, height: 240,
        containerID: LIST_ID, containerName: 'empty-state',
        content: "Cart is empty.\nAdd items on your phone.",
        isEventCapture: 1, paddingLength: 10,
      });
      // Omit listObject entirely for the empty state
      return { textObject: [headerContainer, emptyContainer], containerTotalNum: 2 } as any;
    }

    const listNames = displayItems.map(item => `${item.done ? "[X]" : "[ ]"} ${item.name}`);
    const listContainer = new ListContainerProperty({
      xPosition: 0, yPosition: 48, width: 576, height: 240,
      borderWidth: 1, borderColor: 5, borderRdaius: 0, paddingLength: 5,
      containerID: LIST_ID, containerName: 'cart-list',
      isEventCapture: 1, 
      itemContainer: new ListItemContainerProperty({
        itemCount: displayItems.length, itemWidth: 0, isItemSelectBorderEn: 1, itemName: listNames,
      }),
    });

    return { textObject: [headerContainer], listObject: [listContainer], containerTotalNum: 2 } as any;
  };

  const syncData = async (newItems: CartItemData[]) => {
    setItems(newItems);
    if (!bridgeRef.current) return;
    await bridgeRef.current.setLocalStorage('cart_items', JSON.stringify(newItems));
    
    const layout = buildPageLayout(newItems);
    await bridgeRef.current.rebuildPageContainer(new RebuildPageContainer(layout));
  };

  useEffect(() => {
    let unsubscribeStatus: (() => void) | null = null;

    const initGlasses = async () => {
      const bridge = await waitForEvenAppBridge();
      bridgeRef.current = bridge;

      // 1. Immediately show Splash Screen (Optimized UX)
      await showSplashScreen(bridge);

      // 2. Fetch initial device status in the background
      try {
        const device = await bridge.getDeviceInfo();
        setDeviceStatus({ connected: device.status.isConnected(), battery: device.status.batteryLevel });
        unsubscribeStatus = bridge.onDeviceStatusChanged((status) => {
          setDeviceStatus({ connected: status.isConnected(), battery: status.batteryLevel });
        });
      } catch (e) { 
        console.warn("Could not fetch device info."); 
      }

      // 3. Keep Splash Screen up for 3 seconds
      setTimeout(async () => {
        let initialItems: CartItemData[] = [];
        try {
          const savedStr = await bridge.getLocalStorage('cart_items');
          if (savedStr) initialItems = JSON.parse(savedStr) as CartItemData[];
        } catch (e) { console.error("No saved data found"); }

        // Transition from Splash to the main Grocery List
        await syncData(initialItems);
        setIsAppReady(true); // Unlock phone UI
      }, 3000); 

      // 4. Handle input events
      bridge.onEvenHubEvent(async (event) => {
        if (!isAppReady) return; // Prevent clicks while splash is active
        const currentItems = [...stateRef.current.items];
        if (currentItems.length === 0) return;

        const listEvent = event.listEvent;
        const eventType = listEvent?.eventType ?? event.sysEvent?.eventType ?? event.textEvent?.eventType;
        
        if (eventType === OsEventTypeList.CLICK_EVENT || eventType === undefined) {
          if (listEvent) {
             let clickedIndex = listEvent.currentSelectItemIndex;
             if (clickedIndex === undefined || clickedIndex === null) {
                clickedIndex = currentItems.slice(0, 20).findIndex(
                  i => `${i.done ? "[X]" : "[ ]"} ${i.name}` === listEvent.currentSelectItemName
                );
                if (clickedIndex === -1) clickedIndex = 0;
             }

             const targetItem = currentItems[clickedIndex];
             if (targetItem) {
               currentItems[clickedIndex].done = !currentItems[clickedIndex].done;
               await syncData(currentItems);
             }
          }
        }
      });
    };
    initGlasses();

    return () => { if (unsubscribeStatus) unsubscribeStatus(); };
  }, [isAppReady]);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    const newItems = [...items, { id: Date.now(), name: newItemName, done: false }];
    setNewItemName("");
    await syncData(newItems);
  };

  const handleRemove = async (id: number) => {
    const newItems = items.filter(i => i.id !== id);
    await syncData(newItems);
  };

  const handleClearCompleted = async () => {
    const newItems = items.filter(i => !i.done);
    await syncData(newItems);
  };

  const handleReorder = async (reorderedItems: CartItemData[]) => {
    await syncData(reorderedItems);
  };

  const hasCompletedItems = items.some(i => i.done);

  return (
    <div style={{ 
      position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', maxWidth: '600px', margin: '0 auto',
      opacity: isAppReady ? 1 : 0.5, pointerEvents: isAppReady ? 'auto' : 'none',
      transition: 'opacity 0.5s ease-in'
    }}>
      
      {/* HEADER & LIST AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <Text variant="title-lg" style={{ marginBottom: '4px' }}>Smart Cart</Text>
            <Text variant="detail" style={{ color: 'var(--color-tc-2)', display: 'block' }}>
              {items.filter(i => i.done).length} / {items.length} items collected
            </Text>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            {/* Real-time Battery Badge */}
            <div style={{ 
              backgroundColor: deviceStatus.connected ? 'var(--color-tc-green, #4ade80)' : 'var(--color-sc-2)', 
              color: deviceStatus.connected ? '#000' : 'var(--color-tc-2)', 
              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              👓 {deviceStatus.connected ? `${deviceStatus.battery}%` : 'Disconnected'}
            </div>

            {/* Clear Completed Button */}
            {hasCompletedItems && (
              <button 
                onClick={handleClearCompleted}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--color-tc-accent, #3b82f6)', 
                  fontSize: '14px', padding: 0, cursor: 'pointer' 
                }}
              >
                Clear checked
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--color-tc-2)' }}>
            <Text variant="body-1">Your cart is empty.</Text>
            <Text variant="body-2">Add items below to sync to your glasses.</Text>
          </div>
        ) : (
          <Card style={{ border: 'none', background: 'transparent' }}>
            <CardContent style={{ padding: 0 }}>
              <Reorder.Group axis="y" values={items} onReorder={handleReorder} style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {items.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    items={items} 
                    syncData={syncData} 
                    handleRemove={handleRemove} 
                  />
                ))}
              </Reorder.Group>
            </CardContent>
          </Card>
        )}
      </div>

      {/* STICKY BOTTOM INPUT BAR with Elevation Shadow */}
      <div style={{ 
        padding: '16px', borderTop: '1px solid var(--color-sc-2)', display: 'flex', gap: '12px',
        alignItems: 'center', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', /* The floating elevation shadow */
        backgroundColor: 'var(--color-bc-1)', zIndex: 10 
      }}>
        <Input 
          value={newItemName} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
          placeholder="Add grocery item..."
          style={{ flexGrow: 1, fontSize: '16px' }}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <Button variant="primary" onClick={handleAdd} style={{ height: '40px' }}>Add</Button>
      </div>
    </div>
  );
}