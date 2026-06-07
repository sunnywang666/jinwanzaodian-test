import { demoSceneOptions } from '../lib/demoData'
import type { DemoScene } from '../lib/storage'

interface DemoControlsProps {
  currentScene: DemoScene
  onChange: (scene: DemoScene) => void
}

export function DemoControls({ currentScene, onChange }: DemoControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {demoSceneOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          className={`rounded-3xl px-4 py-3 text-sm transition ${
            currentScene === option.key
              ? 'bg-butter/70 text-ink'
              : 'bg-white/40 text-ink/65'
          }`}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
