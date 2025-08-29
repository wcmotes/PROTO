import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { useGameStore } from '../engine/gameStore';
import { usePKMStore } from '../engine/pkmStore';
import { AtmosphereType } from '../../types/game';
import NotesOverlay from './NotesOverlay';

interface HomeSceneProps {
  onMenuReturn?: () => void;
  onOpenNotes?: () => void;
}

interface Vec { x: number; y: number }

interface AABB { x: number; y: number; w: number; h: number; id?: string; label?: string; interactable?: boolean }

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const overlap = (a: AABB, b: AABB) => (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);

const roomW = 640;
const roomH = 400;

export default function HomeScene({ onMenuReturn, onOpenNotes }: HomeSceneProps) {
  const { atmosphere } = useGameStore();
  const { isNotesOverlayOpen, setNotesOverlayOpen, notes, collectNote } = usePKMStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [player, setPlayer] = useState<AABB>({ x: 320 - 12, y: 200 - 12, w: 24, h: 24, id: 'player' });
  const pressed = useRef<{ [k: string]: boolean }>({});

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setStageSize({ width: w, height: h });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Palette based on atmosphere
  const palette = useMemo(() => {
    const base = {
      cheerful: { bg: '#E6F0FF', wall: '#C8E1FF', floor: '#F7FAFC', accent: '#B4E5FF', text: '#2D3748' },
      neutral: { bg: '#F7FAFC', wall: '#E2E8F0', floor: '#EDF2F7', accent: '#CBD5E0', text: '#2D3748' },
      unsettling: { bg: '#FFF5E6', wall: '#F1D9A6', floor: '#FAEBCB', accent: '#D69E2E', text: '#744210' },
      dark_transition: { bg: '#0F1419', wall: '#1A202C', floor: '#171923', accent: '#4A5568', text: '#E2E8F0' },
      horror: { bg: '#0B0B0C', wall: '#161620', floor: '#0F0F0F', accent: '#2C1810', text: '#E2E8F0' },
    } as const;
    return base[atmosphere as AtmosphereType];
  }, [atmosphere]);

  const roomOrigin = useMemo(() => ({
    x: Math.floor(stageSize.width / 2 - roomW / 2),
    y: Math.floor(stageSize.height / 2 - roomH / 2),
  }), [stageSize]);

  // Obstacles & interactables (simple rectangles)
  const { walls, furniture, interactables } = useMemo(() => {
    const walls: AABB[] = [
      { x: 0, y: 0, w: roomW, h: 12 }, // top
      { x: 0, y: roomH - 12, w: roomW, h: 12 }, // bottom
      { x: 0, y: 0, w: 12, h: roomH }, // left
      { x: roomW - 12, y: 0, w: 12, h: roomH }, // right
    ];
    const furniture: AABB[] = [
      { x: 60, y: 60, w: 120, h: 16, label: 'Bookshelf' },
      { x: 480, y: 60, w: 100, h: 16, label: 'Cabinet' },
      { x: 420, y: 260, w: 160, h: 70, label: 'Bed' },
      { x: 140, y: 250, w: 120, h: 50, label: 'Table' },
    ];
    const interactables: AABB[] = [
      { x: 220, y: 80, w: 120, h: 24, label: 'Desk', id: 'desk', interactable: true },
    ];
    return { walls, furniture, interactables };
  }, []);

  const worldToScreen = useCallback((r: AABB): AABB => ({
    x: roomOrigin.x + r.x,
    y: roomOrigin.y + r.y,
    w: r.w,
    h: r.h,
  }), [roomOrigin]);

  const collides = useCallback((next: AABB) => {
    // Keep player inside room bounds (respect walls)
    const blocks = [...walls, ...furniture];
    return blocks.some(b => overlap(next, b));
  }, [walls, furniture]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { pressed.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { pressed.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    let raf = 0;
    const speed = 3.2;
    const tick = () => {
      let dx = 0, dy = 0;
      if (pressed.current['arrowleft'] || pressed.current['a']) dx -= speed;
      if (pressed.current['arrowright'] || pressed.current['d']) dx += speed;
      if (pressed.current['arrowup'] || pressed.current['w']) dy -= speed;
      if (pressed.current['arrowdown'] || pressed.current['s']) dy += speed;

      if (dx !== 0 || dy !== 0) {
        const next: AABB = { ...player, x: clamp(player.x + dx, 12, roomW - player.w - 12), y: clamp(player.y + dy, 12, roomH - player.h - 12) };
        // Resolve collisions axis by axis for nicer sliding
        let test: AABB = { ...player, x: next.x, y: player.y };
        if (!collides(test)) {
          player.x = test.x;
        }
        test = { ...player, x: player.x, y: next.y };
        if (!collides(test)) {
          player.y = test.y;
        }
        setPlayer({ ...player });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player, collides]);

  // Interaction handling (E/N near desk)
  const nearDesk = useMemo(() => {
    const p = player;
    const desk = interactables.find(i => i.id === 'desk');
    if (!desk) return false;
    const expanded: AABB = { x: desk.x - 24, y: desk.y - 24, w: desk.w + 48, h: desk.h + 48 };
    return overlap(p, expanded);
  }, [player, interactables]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'n' || e.key === 'N') && nearDesk) {
        setNotesOverlayOpen(true);
      }
      if (e.key === 'Escape') {
        if (isNotesOverlayOpen) {
          setNotesOverlayOpen(false);
        } else {
          onMenuReturn?.();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nearDesk, onMenuReturn, isNotesOverlayOpen, setNotesOverlayOpen]);

  const headerText = atmosphere === 'horror' ? 'SANCTUARY (FRAGILE)' : 'Your Home';

  return (
    <>
      <div ref={containerRef} className="w-full h-screen" style={{ background: palette.bg }}>
        <div className="absolute z-10 p-4 flex gap-2">
          <button
            onClick={onMenuReturn}
            className="px-4 py-2 rounded-lg font-medium border-2"
            style={{ backgroundColor: palette.floor, borderColor: palette.accent, color: palette.text }}
          >
            ← Menu
          </button>
          <div className="px-3 py-2 rounded-md text-sm" style={{ background: palette.wall, color: palette.text }}>
            {headerText}
          </div>
        </div>

        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {/* Room background */}
            <Group x={roomOrigin.x} y={roomOrigin.y}>
              <Rect x={0} y={0} width={roomW} height={roomH} fill={palette.floor} cornerRadius={8} shadowColor={palette.accent} shadowBlur={10} />
              {/* Walls */}
              <Rect x={0} y={0} width={roomW} height={12} fill={palette.wall} />
              <Rect x={0} y={roomH - 12} width={roomW} height={12} fill={palette.wall} />
              <Rect x={0} y={0} width={12} height={roomH} fill={palette.wall} />
              <Rect x={roomW - 12} y={0} width={12} height={roomH} fill={palette.wall} />

              {/* Furniture */}
              {furniture.map((f, idx) => (
                <Group key={`f-${idx}`}>
                  <Rect x={f.x} y={f.y} width={f.w} height={f.h} fill={palette.accent} opacity={0.8} cornerRadius={4} />
                  {f.label && <Text x={f.x} y={f.y - 16} text={f.label} fontSize={12} fill={palette.text} />}
                </Group>
              ))}

              {/* Interactable: Desk */}
              {interactables.map((i) => (
                <Group key={i.id}>
                  <Rect x={i.x} y={i.y} width={i.w} height={i.h} fill={atmosphere === 'horror' ? '#8B0000' : '#7FB3FF'} cornerRadius={4} opacity={0.9}
                    onClick={() => setNotesOverlayOpen(true)} onTap={() => setNotesOverlayOpen(true)} />
                  <Text x={i.x + 4} y={i.y + 4} text={i.label || ''} fontSize={12} fill={palette.text} />
                </Group>
              ))}

              {/* Player */}
              <Rect x={player.x} y={player.y} width={player.w} height={player.h}
                fill={atmosphere === 'horror' ? '#F56565' : '#3182CE'} cornerRadius={4}
                shadowBlur={6} shadowColor={atmosphere === 'horror' ? '#8B0000' : '#63B3ED'} />

              {/* Prompt */}
              {nearDesk && (
                <Group>
                  <Rect x={roomW / 2 - 100} y={roomH - 48} width={200} height={28} cornerRadius={6}
                    fill={palette.wall} opacity={0.9} />
                  <Text x={roomW / 2 - 94} y={roomH - 46} text={atmosphere === 'horror' ? 'Press E to confront your thoughts' : 'Press E/N to open Notes'}
                    fontSize={14} fill={palette.text} />
                </Group>
              )}
            </Group>
          </Layer>
        </Stage>
      </div>

      {/* PKM Notes Overlay */}
      {isNotesOverlayOpen && (
        <NotesOverlay onClose={() => setNotesOverlayOpen(false)} />
      )}
    </>
  );
}