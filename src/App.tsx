import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { Home } from './pages/Home'
import { Onboarding } from './pages/Onboarding'
import { createDefaultLogEntries, guests } from './lib/demoData'
import {
  clearDemoStorage,
  loadDemoScene,
  loadEveningPrepare,
  loadLogbook,
  loadOnboardingProfile,
  loadSpiritForm,
  loadOnboardingDraft,
  loadTonightClosed,
  saveDemoScene,
  saveEveningPrepare,
  saveLogbook,
  saveOnboardingProfile,
  saveSpiritForm,
  saveTonightClosed,
  type EveningPrepareState,
  type LogEntry,
  type OnboardingProfile,
  type SpiritForm,
} from './lib/storage'
import { RecipeBookOverlay } from './overlays/RecipeBookOverlay'
import { SpiritHutOverlay } from './overlays/SpiritHutOverlay'
import { SpiritChatOverlay } from './overlays/SpiritChatOverlay'
import { GuestBookConfirmView } from './views/GuestBookConfirmView'
import { GuestBookOpenView } from './views/GuestBookOpenView'

type AppView =
  | 'home'
  | 'guestBookConfirm'
  | 'guestBookOpen'
  | 'recipeBookConfirm'
  | 'recipeBookOpen'
  | 'spiritChat'
  | 'spiritHut'

export default function App() {
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(() => loadOnboardingProfile())
  const [spiritForm, setSpiritForm] = useState<SpiritForm>(() => loadSpiritForm())
  const [demoScene, setDemoScene] = useState(() => loadDemoScene())
  const [tonightClosed, setTonightClosed] = useState(() => loadTonightClosed())
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() => loadLogbook(createDefaultLogEntries()))
  const [eveningPrepare, setEveningPrepare] = useState<EveningPrepareState>(() =>
    loadEveningPrepare(loadOnboardingProfile()?.defaultLightsOffTime ?? '23:00'),
  )
  const [view, setView] = useState<AppView>('home')
  const [guestBookPage, setGuestBookPage] = useState(0)
  const [debugHotspots, setDebugHotspots] = useState(false)

  useEffect(() => {
    if (onboardingProfile) {
      saveOnboardingProfile(onboardingProfile)
    }
  }, [onboardingProfile])

  useEffect(() => {
    saveSpiritForm(spiritForm)
  }, [spiritForm])

  useEffect(() => {
    saveDemoScene(demoScene)
  }, [demoScene])

  useEffect(() => {
    saveTonightClosed(tonightClosed)
  }, [tonightClosed])

  useEffect(() => {
    saveEveningPrepare(eveningPrepare)
  }, [eveningPrepare])

  useEffect(() => {
    saveLogbook(logEntries)
  }, [logEntries])

  if (!onboardingProfile) {
    return (
      <Onboarding
        onComplete={(profile) => {
          setOnboardingProfile(profile)
          setSpiritForm(profile.spiritAppearance)
          setEveningPrepare({
            plannedLightsOffTime: profile.defaultLightsOffTime,
            worry: '',
            savedAt: null,
          })
        }}
      />
    )
  }

  return (
    <AppShell
      topChrome={view === 'home' ? (
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-ink/20 px-3 py-1.5 text-xs text-paper backdrop-blur-sm transition hover:bg-ink/30"
            onClick={() => {
              if (!window.confirm('要清空开店流程和本地演示记录吗？')) {
                return
              }

              clearDemoStorage()
              setOnboardingProfile(null)
              setSpiritForm('base')
              setDemoScene('cover')
              setTonightClosed(false)
              setEveningPrepare({ plannedLightsOffTime: '23:00', worry: '', savedAt: null })
              setLogEntries(createDefaultLogEntries())
              setView('home')
              setGuestBookPage(0)
              setDebugHotspots(false)
            }}
          >
            重置
          </button>
        </div>
      ) : null}
    >
      <Home
        scene={demoScene}
        debugHotspots={debugHotspots}
        onToggleDebugHotspots={() => setDebugHotspots((current) => !current)}
        onOpenHotspot={(target) => {
          if (target === 'guestBook') {
            setGuestBookPage(0)
            setView('guestBookConfirm')
            return
          }

          if (target === 'recipeBook') {
            setView('recipeBookOpen')
            return
          }

          if (target === 'radio') {
            setView('spiritChat')
            return
          }

          if (target === 'spiritChat') {
            setView('spiritChat')
            return
          }

          if (target === 'spiritHut') {
            setView('spiritHut')
          }
        }}
        onSceneChange={(scene) => {
          setDemoScene(scene)
          if (scene !== 'lightsOff') {
            setTonightClosed(false)
          }
        }}
      />

      {view === 'recipeBookOpen' ? <RecipeBookOverlay onClose={() => setView('home')} /> : null}
      {view === 'guestBookConfirm' ? (
        <GuestBookConfirmView
          onConfirm={() => setView('guestBookOpen')}
          onCancel={() => setView('home')}
        />
      ) : null}
      {view === 'guestBookOpen' ? (
        <GuestBookOpenView
          page={guestBookPage}
          onBackToHome={() => setView('home')}
          onPrev={() => setGuestBookPage((current) => (current - 1 + guests.length) % guests.length)}
          onNext={() => setGuestBookPage((current) => (current + 1) % guests.length)}
        />
      ) : null}
      {view === 'spiritChat' ? (
        <SpiritChatOverlay
          spiritName={onboardingProfile.spiritName}
          onGoToHut={() => setView('spiritHut')}
          onClose={() => setView('home')}
        />
      ) : null}
      {view === 'spiritHut' ? (
        <SpiritHutOverlay
          spiritName={onboardingProfile.spiritName}
          currentForm={spiritForm}
          onSelectForm={setSpiritForm}
          onClose={() => setView('home')}
        />
      ) : null}
    </AppShell>
  )
}
