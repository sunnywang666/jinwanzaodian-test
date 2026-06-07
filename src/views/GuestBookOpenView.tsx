import { useEffect, useState } from 'react'
import { AssetImage } from '../components/AssetImage'
import { bookAssets, sceneAssets } from '../lib/assets'
import { guests } from '../lib/demoData'

interface GuestBookOpenViewProps {
  page: number
  onBackToHome: () => void
  onPrev: () => void
  onNext: () => void
}

function preloadImage(src?: string) {
  return new Promise<void>((resolve) => {
    if (!src) {
      resolve()
      return
    }

    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src
  })
}

export function GuestBookOpenView({ page, onBackToHome, onPrev, onNext }: GuestBookOpenViewProps) {
  const [displayPage, setDisplayPage] = useState(page)
  const [isVisible, setIsVisible] = useState(false)
  const guest = guests[displayPage]

  useEffect(() => {
    let active = true

    setIsVisible(false)

    void Promise.all([
      preloadImage(bookAssets.guestBookInner.src),
      preloadImage(bookAssets.guestBookInner.fallbackSrc),
      preloadImage(guests[page]?.image.src),
      preloadImage(guests[page]?.image.fallbackSrc),
    ]).then(() => {
      if (!active) {
        return
      }

      setDisplayPage(page)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (active) {
            setIsVisible(true)
          }
        })
      })
    })

    return () => {
      active = false
    }
  }, [page])

  return (
    <section className="absolute inset-0 z-30 h-full overflow-hidden">
      <div className="absolute inset-0 bg-[#d7d3cf]">
        <AssetImage
          src={sceneAssets.mainBackground.src}
          fallbackSrc={sceneAssets.mainBackground.fallbackSrc}
          alt="早点铺主场景"
          variant="scene"
          renderFallbackCard={false}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-[rgba(72,68,67,0.4)] transition-opacity duration-300" />

      <button
        type="button"
        className="font-tianrandai absolute left-4 top-4 z-20 rounded-full bg-ink/20 px-4 py-2 text-base text-paper backdrop-blur-sm transition hover:bg-ink/30"
        onClick={onBackToHome}
      >
        返回铺子
      </button>

      <div className="absolute inset-x-0 top-[10%] z-10 px-2">
        <div
          className={`relative mx-auto aspect-square w-[94%] max-w-[430px] transition-all duration-[220ms] ease-out ${
            isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.94] opacity-0'
          }`}
        >
          <AssetImage
            src={bookAssets.guestBookInner.src}
            fallbackSrc={bookAssets.guestBookInner.fallbackSrc}
            alt="翻开的客人电话本"
            variant="book"
            renderFallbackCard={false}
            className="h-full w-full object-contain drop-shadow-[0_20px_26px_rgba(54,38,26,0.22)]"
          />

          <div
            className="absolute flex items-center justify-center overflow-hidden"
            style={{ left: '17.5%', top: '24.5%', width: '23%', height: '25%' }}
          >
            <AssetImage
              src={guest.image.src}
              fallbackSrc={guest.image.fallbackSrc}
              alt={guest.name}
              variant="character"
              renderFallbackCard={false}
              className="h-full w-full object-contain"
            />
          </div>

          <div
            className="font-tianrandai absolute text-center text-[clamp(17px,2.9vw,23px)] leading-none text-ink"
            style={{ left: '16%', top: '56.2%', width: '25%', whiteSpace: 'nowrap' }}
          >
            {guest.name}
          </div>

          <p
            className="font-tianrandai absolute text-left text-[clamp(11px,1.9vw,14px)] leading-[1.45] text-ink/82"
            style={{ left: '16.8%', top: '66.2%', width: '24.5%' }}
          >
            {guest.description}
          </p>

          <div
            className="font-tianrandai absolute space-y-2 text-left text-[clamp(12px,1.95vw,14px)] leading-[1.42] text-ink/84"
            style={{ left: '54.5%', top: '24.5%', width: '29.5%' }}
          >
            <p>喜欢的早点：{guest.favoriteFood}</p>
            <p>来访次数：{guest.visitCount}</p>
            <p>熟络程度：{guest.familiarity}</p>
            <div className="space-y-1 pt-1">
              <p>小故事</p>
              <p className="line-clamp-3 text-[clamp(11px,1.82vw,13px)] leading-[1.45]">{guest.story}</p>
            </div>
          </div>

          <p className="font-tianrandai absolute left-1/2 top-[88%] -translate-x-1/2 text-[clamp(13px,2vw,16px)] text-brown/80">
            {displayPage + 1} / {guests.length}
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-20 flex items-end justify-between px-5">
        <button
          type="button"
          className="font-tianrandai min-w-[104px] rounded-full bg-ink/20 px-5 py-2.5 text-lg text-paper backdrop-blur-sm transition duration-150 ease-out hover:bg-ink/30"
          onClick={onPrev}
        >
          上一位
        </button>
        <button
          type="button"
          className="font-tianrandai min-w-[104px] rounded-full bg-ink/20 px-5 py-2.5 text-lg text-paper backdrop-blur-sm transition duration-150 ease-out hover:bg-ink/30"
          onClick={onNext}
        >
          下一位
        </button>
      </div>
    </section>
  )
}
