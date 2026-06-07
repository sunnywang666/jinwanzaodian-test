import { DemoControls } from '../components/DemoControls'
import { ShopSceneInteractive } from '../components/ShopSceneInteractive'
import { sceneCopy } from '../lib/demoData'
import type { SceneItemTarget } from '../lib/sceneItems'
import type { DemoScene } from '../lib/storage'

interface HomeProps {
  scene: DemoScene
  debugHotspots: boolean
  onToggleDebugHotspots: () => void
  onOpenHotspot: (target: SceneItemTarget) => void
  onSceneChange: (scene: DemoScene) => void
}

export function Home({ scene, debugHotspots, onToggleDebugHotspots, onOpenHotspot, onSceneChange }: HomeProps) {
  const copy = sceneCopy[scene]
  const nowLabel = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

  return (
    <section className="relative h-full w-full">
      <ShopSceneInteractive scene={scene} debug={debugHotspots} onItemOpen={onOpenHotspot} />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f5ead8]/92 via-[#f5ead8]/36 to-transparent" />

      <div className="absolute left-3 top-3 z-20 flex max-w-[72%] flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink/15 px-3 py-1.5 text-xs text-paper backdrop-blur-sm">
            今晚早点
          </span>
          <span className="rounded-full bg-ink/15 px-3 py-1.5 text-xs text-paper backdrop-blur-sm">
            {nowLabel}
          </span>
        </div>
        <p className="rounded-[20px] bg-paper/60 px-3 py-2 text-xs leading-5 text-ink/78 backdrop-blur-sm">
          {copy.body}
        </p>
      </div>

      <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs backdrop-blur-sm transition ${
            debugHotspots ? 'bg-butter/70 text-ink' : 'bg-ink/15 text-paper'
          }`}
          onClick={onToggleDebugHotspots}
        >
          DEBUG
        </button>
      </div>

      {debugHotspots ? (
        <div className="absolute inset-x-3 bottom-3 z-20 rounded-[24px] bg-paper/75 px-3 py-3 backdrop-blur-sm">
          <p className="mb-2 text-xs tracking-[0.08em] text-ink/60">场景调试</p>
          <DemoControls currentScene={scene} onChange={onSceneChange} />
        </div>
      ) : null}
    </section>
  )
}
