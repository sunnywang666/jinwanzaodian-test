import { useState } from 'react'
import { bookAssets } from '../lib/assets'
import { dishes } from '../lib/demoData'
import { AssetImage } from '../components/AssetImage'
import { GameOverlay } from '../components/GameOverlay'
import { PageTurnButton } from '../components/PageTurnButton'

interface RecipeBookOverlayProps {
  onClose: () => void
}

function RecipePage({
  dish,
  side,
  pageNumber,
}: {
  dish: (typeof dishes)[number] | undefined
  side: 'left' | 'right'
  pageNumber: number
}) {
  if (!dish) {
    return null
  }

  const left = side === 'left' ? '16%' : '60%'
  const pageLeft = side === 'left' ? '31%' : '70%'

  return (
    <>
      <div className="absolute" style={{ left, top: '25%', width: '22%' }}>
        <AssetImage
          src={dish.image.src}
          fallbackSrc={dish.image.fallbackSrc}
          alt={dish.name}
          variant="item"
          className="h-auto w-full"
        />
      </div>
      <h2 className="absolute text-[clamp(15px,2.5vw,20px)] font-semibold text-ink" style={{ left, top: '48%' }}>
        {dish.name}
      </h2>
      <p className="absolute w-[22%] text-[clamp(10px,1.8vw,13px)] leading-[1.6] text-ink/78" style={{ left, top: '56%' }}>
        {dish.description}
      </p>
      <p className="absolute w-[22%] text-[clamp(10px,1.7vw,12px)] leading-[1.55] text-brown" style={{ left, top: '66%' }}>
        喜欢它的客人：{dish.lovedBy}
      </p>
      <p className="absolute w-[22%] text-[clamp(10px,1.7vw,12px)] leading-[1.55] text-ink/72" style={{ left, top: '74%' }}>
        解锁来源：{dish.origin}
      </p>
      <p className="absolute text-[11px] text-brown/80" style={{ left: pageLeft, top: '88%' }}>
        {pageNumber}
      </p>
    </>
  )
}

export function RecipeBookOverlay({ onClose }: RecipeBookOverlayProps) {
  const [page, setPage] = useState(0)
  const spreadCount = Math.ceil(dishes.length / 2)
  const leftDish = dishes[page * 2]
  const rightDish = dishes[page * 2 + 1]
  const leftPageNumber = page * 2 + 1
  const rightPageNumber = page * 2 + 2

  return (
    <GameOverlay title="菜谱本" onClose={onClose}>
      <section className="relative flex h-full flex-col bg-[#f5ead8]">
        <div className="relative mx-auto mt-[12dvh] w-full max-w-[430px] px-2">
          <div className="relative mx-auto aspect-square w-full">
            <AssetImage
              src={bookAssets.recipeInner.src}
              fallbackSrc={bookAssets.recipeInner.fallbackSrc}
              alt="菜谱本内页"
              variant="book"
              className="h-full w-full object-contain"
            />
            <RecipePage dish={leftDish} side="left" pageNumber={leftPageNumber} />
            <RecipePage dish={rightDish} side="right" pageNumber={rightPageNumber} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between px-5 pb-5 pt-3">
          <PageTurnButton direction="prev" disabled={page === 0} onClick={() => setPage((current) => current - 1)} />
          <span className="text-xs text-ink/50">
            {page + 1} / {spreadCount}
          </span>
          <PageTurnButton
            direction="next"
            disabled={page >= spreadCount - 1}
            onClick={() => setPage((current) => current + 1)}
          />
        </div>
      </section>
    </GameOverlay>
  )
}
