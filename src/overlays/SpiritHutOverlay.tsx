import type { SpiritForm } from '../lib/storage'
import { spiritAssets } from '../lib/assets'
import { spiritOptions } from '../lib/demoData'
import { AssetImage } from '../components/AssetImage'
import { GameOverlay } from '../components/GameOverlay'

interface SpiritHutOverlayProps {
  spiritName: string
  currentForm: SpiritForm
  onSelectForm: (form: SpiritForm) => void
  onClose: () => void
}

export function SpiritHutOverlay({ spiritName, currentForm, onSelectForm, onClose }: SpiritHutOverlayProps) {
  const currentAsset = spiritAssets[currentForm]

  return (
    <GameOverlay title="精灵小屋" onClose={onClose}>
      <section className="flex h-full flex-col bg-[#f5ead8] px-4 pb-5 pt-[11dvh]">
        <div className="flex flex-col items-center px-4 py-5 text-center">
          <div className="mx-auto flex h-44 w-44 items-center justify-center">
            <AssetImage
              src={currentAsset.src}
              fallbackSrc={currentAsset.fallbackSrc}
              alt={spiritName}
              variant="character"
              className="h-36 drop-shadow-[0_8px_24px_rgba(138,97,74,0.18)]"
            />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink">{spiritName}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/60">它只是一个漂浮的小圆面团，可以隔空揉面，没有手脚。</p>
        </div>

        <div className="mt-2 flex gap-3 overflow-x-auto px-1 pb-3">
          {spiritOptions.map((option) => (
            <button
              key={option.form}
              type="button"
              className={`flex shrink-0 flex-col items-center px-4 py-3 transition-all duration-200 ${
                currentForm === option.form
                  ? 'scale-105 opacity-100 drop-shadow-[0_0_16px_rgba(240,221,179,0.8)]'
                  : 'opacity-55 hover:opacity-75'
              }`}
              onClick={() => onSelectForm(option.form)}
            >
              <AssetImage
                src={option.image.src}
                fallbackSrc={option.image.fallbackSrc}
                alt={option.name}
                variant="character"
                className="h-20"
              />
              <p className={`mt-2 text-sm font-semibold ${currentForm === option.form ? 'text-ink' : 'text-ink/60'}`}>
                {option.name}
              </p>
            </button>
          ))}
        </div>
      </section>
    </GameOverlay>
  )
}
